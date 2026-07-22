import {
  Inject,
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { and, eq, isNull, gt } from 'drizzle-orm';
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
  AccessTokenPayload,
} from '@ubersclap/shared';

import { DATABASE } from '../database/database.module';
import type { Database } from '../database/client';
import { users, driverProfiles, refreshTokens } from '../database/schema';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 30;

/**
 * Parametres Argon2id.
 *
 * OWASP recommande au minimum 19 MiB de memoire, 2 iterations et un
 * parallelisme de 1 pour Argon2id. Le cout memoire est ce qui rend l'attaque
 * par GPU inefficace — c'est le parametre a ne pas baisser.
 */
const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existing) {
      throw new ConflictException({
        message: 'Un compte existe déjà avec cette adresse email',
        code: 'EMAIL_ALREADY_USED',
      });
    }

    const userId = uuidv7();
    const passwordHash = await hash(input.password, ARGON2_OPTIONS);

    // Le compte et son profil professionnel sont crees ensemble : un
    // utilisateur sans profil casserait la generation de facture plus tard.
    await this.db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      });

      // Profil vide : on ne demande NI le SIRET NI le regime de TVA a
      // l'inscription. Exiger ces champs avant d'avoir montre la moindre
      // valeur ferait abandonner la majorite des inscriptions. L'ecran Profil
      // alerte tant qu'ils manquent, et ils ne bloquent que la facturation.
      await tx.insert(driverProfiles).values({
        id: uuidv7(),
        userId,
      });
    });

    const user = await this.findUserById(userId);
    return this.issueTokens(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const record = await this.db.query.users.findFirst({
      where: and(eq(users.email, input.email), isNull(users.deletedAt)),
    });

    /**
     * On verifie le mot de passe meme quand le compte n'existe pas, contre un
     * hash factice. Sans cela, le temps de reponse revele si une adresse est
     * enregistree — une enumeration de comptes silencieuse.
     */
    if (!record) {
      await verify(
        '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000',
        input.password,
      ).catch(() => false);

      throw new UnauthorizedException({
        message: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const valid = await verify(record.passwordHash, input.password).catch(
      () => false,
    );

    if (!valid) {
      // Message identique au cas precedent : il ne doit jamais indiquer
      // lequel des deux champs est faux.
      throw new UnauthorizedException({
        message: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS',
      });
    }

    return this.issueTokens(this.toAuthUser(record), input.deviceName);
  }

  /**
   * Rotation du refresh token, avec detection de reutilisation.
   *
   * Chaque rafraichissement revoque l'ancien jeton et en emet un nouveau. Si
   * un jeton deja revoque est represente, c'est qu'il a ete vole et rejoue :
   * on revoque alors TOUTES les sessions de l'utilisateur plutot que la seule
   * concernee. Mieux vaut une reconnexion subie qu'un acces persistant pour
   * l'attaquant.
   */
  async refresh(rawToken: string): Promise<AuthResponse> {
    const tokenHash = this.hashToken(rawToken);

    const stored = await this.db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, tokenHash),
    });

    if (!stored) {
      throw new UnauthorizedException({
        message: 'Session expirée, veuillez vous reconnecter',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    if (stored.revokedAt) {
      this.logger.warn(
        `Refresh token deja revoque rejoue pour l'utilisateur ${stored.userId} — revocation de toutes les sessions`,
      );

      await this.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokens.userId, stored.userId),
            isNull(refreshTokens.revokedAt),
          ),
        );

      throw new UnauthorizedException({
        message: 'Session invalidée pour raison de sécurité',
        code: 'REFRESH_TOKEN_REUSED',
      });
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({
        message: 'Session expirée, veuillez vous reconnecter',
        code: 'REFRESH_TOKEN_EXPIRED',
      });
    }

    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, stored.id));

    const user = await this.findUserById(stored.userId);
    return this.issueTokens(user, stored.deviceName ?? undefined);
  }

  async logout(rawToken: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, this.hashToken(rawToken)));
  }

  async findUserById(id: string): Promise<AuthUser> {
    const record = await this.db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
    });

    if (!record) {
      throw new UnauthorizedException({
        message: 'Compte introuvable',
        code: 'USER_NOT_FOUND',
      });
    }

    return this.toAuthUser(record);
  }

  /** Nettoyage des jetons expires ou revoques. Appele par une tache planifiee. */
  async purgeExpiredTokens(): Promise<void> {
    await this.db
      .delete(refreshTokens)
      .where(gt(new Date() as never, refreshTokens.expiresAt as never));
  }

  private async issueTokens(
    user: AuthUser,
    deviceName?: string,
  ): Promise<AuthResponse> {
    const payload: AccessTokenPayload = { sub: user.id, role: user.role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.requireSecret('JWT_ACCESS_SECRET'),
      expiresIn: ACCESS_TOKEN_TTL,
    });

    /**
     * Le refresh token est une valeur aleatoire opaque, pas un JWT.
     *
     * Un JWT est valide tant qu'il n'est pas expire, meme apres deconnexion :
     * on ne peut pas le revoquer sans tenir une liste. Une valeur opaque
     * stockee en base est revocable immediatement, ce qui est exactement le
     * comportement attendu d'une session.
     */
    const rawRefreshToken = randomBytes(48).toString('base64url');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.db.insert(refreshTokens).values({
      id: uuidv7(),
      userId: user.id,
      // Seule l'empreinte est stockee : une fuite de la base ne doit pas
      // permettre de se faire passer pour un utilisateur.
      tokenHash: this.hashToken(rawRefreshToken),
      deviceName,
      expiresAt,
    });

    return { user, accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private requireSecret(key: string): string {
    const value = this.config.get<string>(key);
    if (!value || value.length < 32) {
      throw new Error(
        `${key} manquant ou trop court. Générez-le avec : node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`,
      );
    }
    return value;
  }

  private toAuthUser(record: typeof users.$inferSelect): AuthUser {
    return {
      id: record.id,
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
      role: record.role,
      createdAt: record.createdAt.toISOString(),
    };
  }
}

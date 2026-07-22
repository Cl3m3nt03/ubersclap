import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AccessTokenPayload } from '@ubersclap/shared';
import { IS_PUBLIC } from './public.decorator';

declare module 'express' {
  interface Request {
    driver?: AccessTokenPayload;
  }
}

/**
 * Garde d'authentification, appliquee GLOBALEMENT.
 *
 * Le choix est deliberement inverse : toute route est protegee par defaut, et
 * l'ouverture se declare explicitement avec `@Public()`.
 *
 * Une garde qu'on ajoute route par route finit toujours par etre oubliee sur
 * une route, et l'oubli ne se voit pas — la route fonctionne, simplement sans
 * controle. Avec l'inversion, l'oubli casse la route immediatement : il est
 * impossible de laisser une fuite passer en silence.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException({
        message: 'Authentification requise',
        code: 'MISSING_TOKEN',
      });
    }

    try {
      request.driver = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      return true;
    } catch {
      throw new UnauthorizedException({
        message: 'Session expirée',
        code: 'INVALID_TOKEN',
      });
    }
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) return undefined;

    const [scheme, value] = header.split(' ');
    return scheme === 'Bearer' ? value : undefined;
  }
}

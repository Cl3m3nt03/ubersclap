import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@ubersclap/shared';

import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { CurrentDriverId } from './current-driver.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput) {
    return this.auth.register(input);
  }

  /**
   * 5 tentatives par minute — ADR de securite.
   *
   * La limite porte sur l'IP. Elle n'arrete pas une attaque distribuee, mais
   * elle rend le bruteforce depuis une machine unique inoperant, ce qui couvre
   * le cas reel.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body(new ZodValidationPipe(loginSchema)) input: LoginInput) {
    return this.auth.login(input);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body(new ZodValidationPipe(refreshSchema)) input: { refreshToken: string }) {
    return this.auth.refresh(input.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Body(new ZodValidationPipe(refreshSchema)) input: { refreshToken: string }) {
    // Volontairement public et silencieux : une deconnexion ne doit jamais
    // echouer, meme avec un jeton deja invalide. Sinon le client reste bloque
    // avec une session qu'il ne peut pas fermer.
    await this.auth.logout(input.refreshToken);
  }

  /**
   * Profil de l'utilisateur connecte.
   *
   * ADR-010 : `/v1/me` fusionne le compte et le profil professionnel. Deux
   * appels reseau au demarrage pour afficher un seul ecran serait du gaspillage
   * sur une connexion mobile.
   */
  @Get('/me')
  me(@CurrentDriverId() driverId: string) {
    return this.auth.findUserById(driverId);
  }
}

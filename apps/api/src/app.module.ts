import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { CoursesModule } from './courses/courses.module';
import { GeoModule } from './geo/geo.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AuthGuard } from './auth/auth.guard';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite generale. Les routes sensibles la resserrent avec @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    JwtModule.register({}),
    DatabaseModule,
    AuthModule,
    ClientsModule,
    CoursesModule,
    GeoModule,
    InvoicesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    /**
     * Garde d'authentification GLOBALE.
     *
     * Toute route est protegee par defaut ; l'ouverture se declare avec
     * `@Public()`. Une garde ajoutee route par route finit par etre oubliee,
     * et l'oubli est invisible — la route marche, sans controle. Ici l'oubli
     * casse la route tout de suite.
     */
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}

import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDatabase, type Database } from './client';

export const DATABASE = Symbol('DATABASE');

/**
 * Global : la base est injectee partout sans reimporter le module dans chaque
 * module metier. C'est l'un des rares cas ou `@Global` se justifie — une
 * dependance transverse et unique.
 */
@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        const url = config.get<string>('DATABASE_URL');
        if (!url) {
          throw new Error(
            'DATABASE_URL manquant. Copiez .env.example vers .env.',
          );
        }
        return createDatabase(url);
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}

import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnv } from './config/env.validation';

const ENV_PRODUCTION = 'production';

@Module({
  imports: [
    // Config globale, validée au démarrage (refuse de démarrer si invalide).
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    // Anti-bruteforce : limites lues de la config (généreuses en global).
    // La limite stricte du login sera décorée côté change auth.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.getOrThrow<number>('THROTTLER_TTL'),
          limit: config.getOrThrow<number>('THROTTLER_LIMIT'),
        },
      ],
    }),

    // Logs structurés (pino) ; en dev, sortie lisible via pino-pretty.
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.getOrThrow<string>('LOG_LEVEL'),
          transport:
            config.getOrThrow<string>('NODE_ENV') === ENV_PRODUCTION
              ? undefined
              : { target: 'pino-pretty' },
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Throttler appliqué globalement à toutes les routes.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Erreurs au format unique, partout.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Sérialisation de sortie : applique les @Exclude des entités (à venir).
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}

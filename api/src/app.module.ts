import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AvisModule } from './avis/avis.module';
import { CategoriesModule } from './categories/categories.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { optionsBaseDeDonnees } from './config/data-source';
import { validateEnv } from './config/env.validation';
import { IngredientsModule } from './ingredients/ingredients.module';
import { RecettesModule } from './recettes/recettes.module';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';

const ENV_PRODUCTION = 'production';

@Module({
  imports: [
    // Config globale, validée au démarrage (refuse de démarrer si invalide).
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        optionsBaseDeDonnees((cle) => String(config.getOrThrow(cle))),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.getOrThrow<number>('THROTTLER_TTL'),
          limit: config.getOrThrow<number>('THROTTLER_LIMIT'),
        },
      ],
    }),

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

    CategoriesModule,

    IngredientsModule,

    UtilisateursModule,

    RecettesModule,

    AvisModule,

    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}

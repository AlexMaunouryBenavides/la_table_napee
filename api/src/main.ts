import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

const API_PREFIX = 'api';

async function bootstrap() {
  // bufferLogs : on met en tampon les logs du boot le temps de brancher pino.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);

  // Toutes les routes sous /api.
  app.setGlobalPrefix(API_PREFIX);

  // Lecture des cookies entrants (nécessaire à l'auth par cookie à venir).
  app.use(cookieParser());

  // En-têtes de sécurité par défaut.
  app.use(helmet());

  // CORS crédentialisé restreint à l'origine exacte du front (jamais `*`),
  // sinon les cookies httpOnly ne circuleraient pas en cross-origin.
  app.enableCors({
    origin: config.getOrThrow<string>('FRONT_ORIGIN'),
    credentials: true,
  });

  // Frontière de confiance : toute entrée client est validée et nettoyée.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // retire les champs non déclarés dans le DTO
      forbidNonWhitelisted: true, // rejette si un champ en trop est présent
      transform: true, // convertit l'entrée vers les types attendus
    }),
  );

  await app.listen(config.getOrThrow<number>('PORT'));
}

// Un échec de démarrage doit crasher bruyamment, pas disparaître en silence.
bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

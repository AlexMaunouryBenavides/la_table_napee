import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

const API_PREFIX = 'api';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.use(cookieParser());
  app.use(helmet());

  // Origine exacte obligatoire : un `*` empêcherait les cookies httpOnly de circuler.
  app.enableCors({
    origin: config.getOrThrow<string>('FRONT_ORIGIN'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(config.getOrThrow<number>('PORT'));
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

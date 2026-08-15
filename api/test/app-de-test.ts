import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { type App } from 'supertest/types';

import { AppModule } from '../src/app.module';

const PREFIXE = 'api';

// Mêmes réglages que `main.ts`. Sans eux (préfixe, cookies, validation), les tests
// e2e éprouveraient une application différente de celle qui tourne en production.
export async function creerAppDeTest(): Promise<INestApplication<App>> {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication<INestApplication<App>>();
  app.setGlobalPrefix(PREFIXE);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

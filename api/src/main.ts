import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

// Port par défaut si la variable d'environnement PORT n'est pas fournie.
const DEFAULT_PORT = 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? DEFAULT_PORT);
}

// On gère explicitement l'échec de démarrage : crasher bruyamment plutôt que
// laisser une promesse rejetée passer inaperçue (cf. no-floating-promises).
bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

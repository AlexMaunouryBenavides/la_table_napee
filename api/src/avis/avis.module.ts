import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecettesModule } from '../recettes/recettes.module';

import { AvisDeRecetteController } from './avis-de-recette.controller';
import { AvisController } from './avis.controller';
import { AvisService } from './avis.service';
import { Avis } from './entities/avis.entity';

@Module({
  // `RecettesModule` fournit le dépôt des recettes : un avis doit vérifier que sa
  // cible existe avant d'être créé.
  imports: [TypeOrmModule.forFeature([Avis]), RecettesModule],
  controllers: [AvisController, AvisDeRecetteController],
  providers: [AvisService],
  exports: [TypeOrmModule],
})
export class AvisModule {}

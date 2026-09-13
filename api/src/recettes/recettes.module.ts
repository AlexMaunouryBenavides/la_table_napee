import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Avis } from '../avis/entities/avis.entity';

import { Composition } from './entities/composition.entity';
import { Etape } from './entities/etape.entity';
import { Recette } from './entities/recette.entity';
import { RecettesController } from './recettes.controller';
import { RecettesService } from './recettes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recette, Composition, Etape, Avis])],
  exports: [TypeOrmModule],
  providers: [RecettesService],
  controllers: [RecettesController],
})
export class RecettesModule {}

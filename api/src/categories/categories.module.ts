import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CritereSante } from './entities/critere-sante.entity';
import { Nationalite } from './entities/nationalite.entity';
import { Regime } from './entities/regime.entity';
import { TypeAliment } from './entities/type-aliment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Regime, CritereSante, TypeAliment, Nationalite]),
  ],
  exports: [TypeOrmModule],
})
export class CategoriesModule {}

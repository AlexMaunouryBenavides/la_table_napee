import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Avis } from './entities/avis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Avis])],
  exports: [TypeOrmModule],
})
export class AvisModule {}

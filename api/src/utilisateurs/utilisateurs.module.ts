import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Utilisateur } from './entities/utilisateur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Utilisateur])],
  exports: [TypeOrmModule],
})
export class UtilisateursModule {}

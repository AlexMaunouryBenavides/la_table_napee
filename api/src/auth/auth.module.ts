import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JetonRafraichissement } from './entities/jeton-rafraichissement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JetonRafraichissement])],
  exports: [TypeOrmModule],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UtilisateursModule } from '../utilisateurs/utilisateurs.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JetonRafraichissement } from './entities/jeton-rafraichissement.entity';
import { HachageMotDePasse } from './hachage-mot-de-passe.service';
import { JetonsService } from './jetons.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([JetonRafraichissement]),
    UtilisateursModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: `${config.getOrThrow<number>('ACCES_MINUTES')}m`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, HachageMotDePasse, JetonsService],
  exports: [TypeOrmModule],
})
export class AuthModule {}

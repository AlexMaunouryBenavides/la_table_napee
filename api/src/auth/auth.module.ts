import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Utilisateur } from '../utilisateurs/entities/utilisateur.entity';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DepotJetons, DepotJetonsMysql } from './depot-jetons';
import { JetonRafraichissement } from './entities/jeton-rafraichissement.entity';
import { HachageMotDePasse } from './hachage-mot-de-passe.service';
import { JetonsService } from './jetons.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // Ce module déclare lui-même les dépôts dont il a besoin : il ne dépend donc plus
    // de `UtilisateursModule`, qui l'importe désormais (aucun cycle, `nest.r14`).
    TypeOrmModule.forFeature([JetonRafraichissement, Utilisateur]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: `${config.getOrThrow<number>('ACCES_MINUTES')}m`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    HachageMotDePasse,
    JetonsService,
    JwtStrategy,
    // Les services dépendent de l'abstraction ; seul ce câblage connaît MySQL.
    { provide: DepotJetons, useClass: DepotJetonsMysql },
  ],
  exports: [TypeOrmModule, HachageMotDePasse, DepotJetons],
})
export class AuthModule {}

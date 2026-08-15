import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { type Response } from 'express';

import { Utilisateur } from '../utilisateurs/entities/utilisateur.entity';

import { AuthService } from './auth.service';
import { type OptionsCookiesAuth, poserCookiesAuth } from './cookies-auth';
import { ConnexionDto } from './dto/connexion.dto';
import { InscriptionDto } from './dto/inscription.dto';

const ENV_PRODUCTION = 'production';
const FENETRE_ANTI_BRUTEFORCE_MS = 60_000;
const TENTATIVES_PAR_FENETRE = 10;

// Limite bien plus basse que celle du reste de l'API : ces routes sont la porte
// d'entrée d'un attaquant qui essaie des mots de passe en série.
@Throttle({
  default: { ttl: FENETRE_ANTI_BRUTEFORCE_MS, limit: TENTATIVES_PAR_FENETRE },
})
@Controller('auth')
export class AuthController {
  private readonly optionsCookies: OptionsCookiesAuth;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.optionsCookies = {
      accesMinutes: config.getOrThrow<number>('ACCES_MINUTES'),
      rafraichissementJours: config.getOrThrow<number>(
        'RAFRAICHISSEMENT_JOURS',
      ),
      secure: config.getOrThrow<string>('NODE_ENV') === ENV_PRODUCTION,
    };
  }

  // 201 par défaut chez Nest : une ressource a bien été créée.
  @Post('inscription')
  inscrire(@Body() dto: InscriptionDto): Promise<Utilisateur> {
    return this.auth.inscrire(dto);
  }

  // `passthrough` laisse Nest sérialiser la réponse : le controller ne touche qu'aux
  // cookies, le métier ne connaît ni `req` ni `res`.
  @HttpCode(HttpStatus.OK)
  @Post('connexion')
  async connecter(
    @Body() dto: ConnexionDto,
    @Res({ passthrough: true }) reponse: Response,
  ): Promise<Utilisateur> {
    const { utilisateur, jetons } = await this.auth.connecter(dto);
    poserCookiesAuth(reponse, jetons, this.optionsCookies);
    return utilisateur;
  }
}

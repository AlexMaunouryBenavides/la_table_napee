import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { type Request, type Response } from 'express';

import { Utilisateur } from '../utilisateurs/entities/utilisateur.entity';

import { AuthService } from './auth.service';
import {
  COOKIE_RAFRAICHISSEMENT,
  effacerCookiesAuth,
  lireCookie,
  type OptionsCookiesAuth,
  poserCookiesAuth,
} from './cookies-auth';
import { ConnexionDto } from './dto/connexion.dto';
import { InscriptionDto } from './dto/inscription.dto';
import { Public } from './public.decorator';

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
  @Public()
  @Post('inscription')
  inscrire(@Body() dto: InscriptionDto): Promise<Utilisateur> {
    return this.auth.inscrire(dto);
  }

  // `passthrough` laisse Nest sérialiser la réponse : le controller ne touche qu'aux
  // cookies, le métier ne connaît ni `req` ni `res`.
  @Public()
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

  // Publique au sens du jeton d'ACCÈS : cette route ne présente qu'un jeton de
  // rafraîchissement, précisément parce que l'accès est expiré.
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('rafraichissement')
  async rafraichir(
    @Req() requete: Request,
    @Res({ passthrough: true }) reponse: Response,
  ): Promise<Utilisateur> {
    const { utilisateur, jetons } = await this.auth.rafraichir(
      lireCookie(requete, COOKIE_RAFRAICHISSEMENT),
    );
    poserCookiesAuth(reponse, jetons, this.optionsCookies);
    return utilisateur;
  }

  // Les cookies sont effacés quoi qu'il arrive : une session révoquée côté serveur
  // mais toujours présente dans le navigateur serait déroutante.
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('deconnexion')
  async deconnecter(
    @Req() requete: Request,
    @Res({ passthrough: true }) reponse: Response,
  ): Promise<void> {
    await this.auth.deconnecter(lireCookie(requete, COOKIE_RAFRAICHISSEMENT));
    effacerCookiesAuth(reponse, this.optionsCookies.secure);
  }
}

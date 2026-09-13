import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Response } from 'express';

import {
  effacerCookiesAuth,
  type OptionsCookiesAuth,
  optionsCookiesDepuis,
  poserCookiesAuth,
} from '../auth/cookies-auth';
import { type IdentiteRequete } from '../auth/identite-requete';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';

import { ChangerMotDePasseDto } from './dto/changer-mot-de-passe.dto';
import { ModifierProfilDto } from './dto/modifier-profil.dto';
import { Utilisateur } from './entities/utilisateur.entity';
import { UtilisateursService } from './utilisateurs.service';

// `/moi` plutôt que `/utilisateurs/:id` : sans identifiant dans l'URL, il n'y a rien à
// falsifier. C'est une décision de sécurité, pas de style (`design/routes-api.md` § 3.4).
@Controller('utilisateurs/moi')
export class UtilisateursController {
  private readonly optionsCookies: OptionsCookiesAuth;

  constructor(
    private readonly utilisateurs: UtilisateursService,
    config: ConfigService,
  ) {
    this.optionsCookies = optionsCookiesDepuis(config);
  }

  @Get()
  trouver(@UtilisateurCourant() moi: IdentiteRequete): Promise<Utilisateur> {
    return this.utilisateurs.trouver(moi.id);
  }

  @Patch()
  modifier(
    @UtilisateurCourant() moi: IdentiteRequete,
    @Body() dto: ModifierProfilDto,
  ): Promise<Utilisateur> {
    return this.utilisateurs.modifierProfil(moi.id, dto);
  }

  // Route séparée parce que c'est une opération différente : elle exige l'ancien mot
  // de passe et invalide les sessions en cours — puis en rouvre une ICI, dont les
  // cookies partent avec la réponse.
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('mot-de-passe')
  async changerMotDePasse(
    @UtilisateurCourant() moi: IdentiteRequete,
    @Body() dto: ChangerMotDePasseDto,
    @Res({ passthrough: true }) reponse: Response,
  ): Promise<void> {
    const jetons = await this.utilisateurs.changerMotDePasse(moi.id, dto);
    poserCookiesAuth(reponse, jetons, this.optionsCookies);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async supprimer(
    @UtilisateurCourant() moi: IdentiteRequete,
    @Res({ passthrough: true }) reponse: Response,
  ): Promise<void> {
    await this.utilisateurs.supprimer(moi.id);
    // Les jetons de rafraîchissement partent en cascade avec la ligne ; le navigateur,
    // lui, garderait ses cookies sans cet effacement.
    effacerCookiesAuth(reponse, this.optionsCookies.secure);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { type IdentiteRequete } from '../auth/identite-requete';
import { Public } from '../auth/public.decorator';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';

import { AvisService } from './avis.service';
import { CreerAvisDto } from './dto/creer-avis.dto';
import { Avis } from './entities/avis.entity';

// À la création, la recette est le CONTEXTE nécessaire : sans elle, l'avis n'a pas de
// cible. D'où l'imbrication ici, et pas sur la modification.
@Controller('recettes/:recetteId/avis')
export class AvisDeRecetteController {
  constructor(private readonly avis: AvisService) {}

  // Lecture publique, comme la recette qu'elle commente (UC-02).
  @Public()
  @Get()
  lister(@Param('recetteId', ParseIntPipe) recetteId: number): Promise<Avis[]> {
    return this.avis.listerDeLaRecette(recetteId);
  }

  @Post()
  creer(
    @Param('recetteId', ParseIntPipe) recetteId: number,
    @UtilisateurCourant() auteur: IdentiteRequete,
    @Body() dto: CreerAvisDto,
  ): Promise<Avis> {
    return this.avis.creer(recetteId, auteur, dto);
  }
}

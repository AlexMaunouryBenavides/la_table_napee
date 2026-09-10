import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';

import { type IdentiteRequete } from '../auth/identite-requete';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';

import { AvisService } from './avis.service';
import { ModifierAvisDto } from './dto/modifier-avis.dto';
import { Avis } from './entities/avis.entity';

// Une fois créé, un avis a son propre identifiant : il se désigne directement, sans
// répéter la recette dans l'URL (`design/routes-api.md` § 3.3).
//
// Le garde global ne vérifie QUE l'authentification. Le droit d'agir sur CET avis
// dépend de son propriétaire, donc de la donnée : il se juge dans le service.
@Controller('avis')
export class AvisController {
  constructor(private readonly avis: AvisService) {}

  @Patch(':id')
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @UtilisateurCourant() demandeur: IdentiteRequete,
    @Body() dto: ModifierAvisDto,
  ): Promise<Avis> {
    return this.avis.modifier(id, demandeur, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  supprimer(
    @Param('id', ParseIntPipe) id: number,
    @UtilisateurCourant() demandeur: IdentiteRequete,
  ): Promise<void> {
    return this.avis.supprimer(id, demandeur);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { type IdentiteRequete } from '../auth/identite-requete';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';

import { CreerRecetteDto } from './dto/creer-recette.dto';
import { ListerRecettesQueryDto } from './dto/lister-recettes.query.dto';
import { ModifierRecetteDto } from './dto/modifier-recette.dto';
import { Recette } from './entities/recette.entity';
import { RecettesService } from './recettes.service';

// Lecture ouverte à tous (UC-01, UC-02), écriture réservée aux modérateurs
// (UC-11 à UC-13). L'ouverture se déclare route par route : le contrôleur entier
// n'est PAS public, sinon les trois routes d'écriture le deviendraient aussi.
@Controller('recettes')
export class RecettesController {
  constructor(private readonly recettes: RecettesService) {}

  @Public()
  @Get()
  lister(@Query() query: ListerRecettesQueryDto) {
    return this.recettes.lister(query);
  }

  // ParseIntPipe rejette `/recettes/abc` en 400 avant d'atteindre le service.
  @Public()
  @Get(':id')
  trouver(@Param('id', ParseIntPipe) id: number) {
    return this.recettes.trouverParId(id);
  }

  @Roles('moderateur')
  @Post()
  creer(
    @UtilisateurCourant() auteur: IdentiteRequete,
    @Body() dto: CreerRecetteDto,
  ): Promise<Recette> {
    return this.recettes.creer(dto, auteur.id);
  }

  @Roles('moderateur')
  @Patch(':id')
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierRecetteDto,
  ): Promise<Recette> {
    return this.recettes.modifier(id, dto);
  }

  @Roles('moderateur')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  supprimer(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.recettes.supprimer(id);
  }
}

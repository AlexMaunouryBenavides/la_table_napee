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
  type Type,
} from '@nestjs/common';

import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';

import { CategoriesService } from './categories.service';
import { type ConfigCategorie } from './config-categorie';
import { CreerCategorieDto, ModifierCategorieDto } from './dto/categorie.dto';
import { type CategorieBase } from './entities/categorie.base';

// Les quatre ressources de catégories partagent EXACTEMENT le même contrat : même
// verbe, même corps, mêmes codes, mêmes droits. Les recopier quatre fois, ce serait
// quatre endroits où corriger le même bug.
//
// La lecture est ouverte : le visiteur anonyme en a besoin pour construire ses filtres
// (UC-03). Seule l'écriture est réservée à l'admin (UC-15).
export function creerControleurCategorie(
  config: ConfigCategorie,
): Type<unknown> {
  @Controller(config.chemin)
  class ControleurCategorie {
    constructor(protected readonly categories: CategoriesService) {}

    @Public()
    @Get()
    lister(): Promise<CategorieBase[]> {
      return this.categories.lister(config);
    }

    @Roles('admin')
    @Post()
    creer(@Body() dto: CreerCategorieDto): Promise<CategorieBase> {
      return this.categories.creer(config, dto);
    }

    @Roles('admin')
    @Patch(':id')
    modifier(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: ModifierCategorieDto,
    ): Promise<CategorieBase> {
      return this.categories.modifier(config, id, dto);
    }

    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    supprimer(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return this.categories.supprimer(config, id);
    }
  }

  return ControleurCategorie;
}

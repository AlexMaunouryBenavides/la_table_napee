import { Controller, Get, Query } from '@nestjs/common';
import { type Page } from '@recipe/types';

import { Roles } from '../auth/roles.decorator';

import { ListerIngredientsQueryDto } from './dto/lister-ingredients.query.dto';
import { Ingredient } from './entities/ingredient.entity';
import { IngredientsService } from './ingredients.service';

// Une seule route, en lecture : elle sert l'autocomplétion du formulaire de recette,
// donc le même rôle que la création de recette. Pas de `POST` : créer un ingrédient
// passe par « trouver ou créer » à l'enregistrement (`design/routes-api.md` § 3.7).
@Roles('moderateur')
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredients: IngredientsService) {}

  @Get()
  lister(@Query() query: ListerIngredientsQueryDto): Promise<Page<Ingredient>> {
    return this.ingredients.lister(query);
  }
}

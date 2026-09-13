import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Page } from '@recipe/types';
import { Like, Repository } from 'typeorm';

import { ListerIngredientsQueryDto } from './dto/lister-ingredients.query.dto';
import { Ingredient } from './entities/ingredient.entity';

const PREMIERE_PAGE = 1;

@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredients: Repository<Ingredient>,
  ) {}

  // Trié par nom : une autocomplétion qui renvoie ses suggestions dans l'ordre de la
  // base est illisible. La casse est déjà ignorée par la collation MySQL.
  lister(query: ListerIngredientsQueryDto): Promise<Page<Ingredient>> {
    return this.ingredients
      .findAndCount({
        where:
          query.recherche === undefined
            ? {}
            : { nom: Like(`%${query.recherche}%`) },
        order: { nom: 'ASC' },
        skip: (query.page - PREMIERE_PAGE) * query.limite,
        take: query.limite,
      })
      .then(([donnees, total]) => ({
        donnees,
        total,
        page: query.page,
        limite: query.limite,
      }));
  }
}

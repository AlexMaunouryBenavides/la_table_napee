import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';

import { Public } from '../auth/public.decorator';

import { ListerRecettesQueryDto } from './dto/lister-recettes.query.dto';
import { RecettesService } from './recettes.service';

// Lecture publique (UC-01 et UC-02, visiteur anonyme). L'application étant fermée
// par défaut, cette ouverture se déclare explicitement.
@Public()
@Controller('recettes')
export class RecettesController {
  constructor(private readonly recettes: RecettesService) {}

  @Get()
  lister(@Query() query: ListerRecettesQueryDto) {
    return this.recettes.lister(query);
  }

  // ParseIntPipe rejette `/recettes/abc` en 400 avant d'atteindre le service.
  @Get(':id')
  trouver(@Param('id', ParseIntPipe) id: number) {
    return this.recettes.trouverParId(id);
  }
}

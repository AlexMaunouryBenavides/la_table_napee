import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { type Page } from '@recipe/types';

import { type IdentiteRequete } from '../auth/identite-requete';
import { Roles } from '../auth/roles.decorator';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.query.dto';

import { ChangerRoleDto } from './dto/changer-role.dto';
import { Utilisateur } from './entities/utilisateur.entity';
import { UtilisateursService } from './utilisateurs.service';

// UC-16, réservé à l'administrateur. Ce contrôleur est déclaré APRÈS celui de `/moi`
// dans le module : sans cela, `DELETE /utilisateurs/moi` serait capté ici avec
// `moi` pour identifiant.
@Roles('admin')
@Controller('utilisateurs')
export class AdministrationUtilisateursController {
  constructor(private readonly utilisateurs: UtilisateursService) {}

  @Get()
  lister(@Query() query: PaginationQueryDto): Promise<Page<Utilisateur>> {
    return this.utilisateurs.lister(query);
  }

  // Le rôle a sa propre URL plutôt qu'un champ dans le profil : l'opération la plus
  // dangereuse de l'API se garde, se journalise et se teste isolément.
  @Patch(':id/role')
  changerRole(
    @Param('id', ParseUUIDPipe) id: string,
    @UtilisateurCourant() demandeur: IdentiteRequete,
    @Body() dto: ChangerRoleDto,
  ): Promise<Utilisateur> {
    return this.utilisateurs.changerRole(id, dto, demandeur.id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  supprimer(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.utilisateurs.supprimer(id);
  }
}

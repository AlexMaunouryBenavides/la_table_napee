import { PartialType } from '@nestjs/mapped-types';

import { CreerRecetteDto } from './creer-recette.dto';

// PATCH = « modifie ce que j'envoie » : chaque champ devient optionnel en gardant ses
// règles de validation, qui ne peuvent donc pas diverger de la création.
export class ModifierRecetteDto extends PartialType(CreerRecetteDto) {}

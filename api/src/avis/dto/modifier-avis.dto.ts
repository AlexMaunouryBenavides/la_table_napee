import { PartialType } from '@nestjs/mapped-types';

import { CreerAvisDto } from './creer-avis.dto';

// `PartialType` rend chaque champ optionnel en conservant ses règles de validation :
// c'est exactement la sémantique de PATCH (« modifie ce que j'envoie »), et les bornes
// de la note ne peuvent pas diverger entre création et modification.
export class ModifierAvisDto extends PartialType(CreerAvisDto) {}

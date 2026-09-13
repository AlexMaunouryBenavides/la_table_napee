import { SetMetadata } from '@nestjs/common';

export const CLE_PUBLIQUE = 'estPublique';

// L'application est fermée par défaut (`nest-authz.r1`) : c'est l'OUVERTURE qui se
// déclare, jamais la fermeture. Une route qu'on oublie d'annoter reste protégée —
// l'oubli coûte un 401, pas une fuite.
export const Public = () => SetMetadata(CLE_PUBLIQUE, true);

// Données d'EXEMPLE, en volume : de quoi éprouver pagination, filtres et affichage.
// Script séparé du seed de référence, pour ne jamais injecter de fausses recettes en
// voulant simplement poser les données obligatoires.
//
//   npm run seed:exemples          (50 recettes par défaut)
//   npm run seed:exemples -- 200

import sourceDeDonnees from '../config/data-source';

import { semerRecettesExemple } from './recettes-exemple';
import { semerDonneesReference } from './semer';

const NOMBRE_PAR_DEFAUT = 50;

async function semer(): Promise<void> {
  const demande = Number(process.argv[2]);
  const nombre =
    Number.isInteger(demande) && demande > 0 ? demande : NOMBRE_PAR_DEFAUT;

  const source = await sourceDeDonnees.initialize();
  try {
    await semerDonneesReference(source);
    const crees = await semerRecettesExemple(source, nombre);
    console.log(
      `Seed d'exemple terminé : ${String(crees)} recette(s) créée(s) sur ${String(nombre)} demandée(s).`,
    );
  } finally {
    await source.destroy();
  }
}

semer().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});

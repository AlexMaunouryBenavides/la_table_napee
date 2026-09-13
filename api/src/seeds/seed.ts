// Données de RÉFÉRENCE uniquement : de vraies valeurs métier, obligatoires au
// fonctionnement. Les recettes d'exemple, elles, ont leur propre script.
//
//   npm run seed        (depuis api/, après migration:run)

import sourceDeDonnees from '../config/data-source';

import { semerDonneesReference } from './semer';

async function semer(): Promise<void> {
  const source = await sourceDeDonnees.initialize();
  try {
    await semerDonneesReference(source);
    console.log('Seed des données de référence terminé.');
  } finally {
    await source.destroy();
  }
}

semer().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});

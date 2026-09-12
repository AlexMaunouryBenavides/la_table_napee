// Données d'EXEMPLE : de quoi éprouver pagination, filtres et affichage, et TROIS
// COMPTES (un par rôle) sans lesquels le back-office serait inatteignable sur un
// clone frais. Script séparé du seed de référence, pour ne jamais injecter de fausses
// données en voulant simplement poser les valeurs obligatoires.
//
//   npm run seed:exemples          (50 recettes par défaut)
//   npm run seed:exemples -- 200

import sourceDeDonnees from '../config/data-source';

import { semerRecettesExemple } from './recettes-exemple';
import { semerDonneesReference } from './semer';
import {
  COMPTES_EXEMPLE,
  MOT_DE_PASSE_EXEMPLE,
  type RapportComptes,
  semerUtilisateursExemple,
} from './utilisateurs-exemple';

const NOMBRE_PAR_DEFAUT = 50;
const LARGEUR_ROLE = 12;
const LARGEUR_EMAIL = 28;

// Les comptes sont rappelés À CHAQUE exécution, même quand ils existaient déjà :
// c'est ici qu'on vient les chercher, pas dans le code.
function etatDe(email: string, rapport: RapportComptes): string {
  if (rapport.conflits.includes(email)) {
    return 'IGNORÉ — son pseudo appartient déjà à un autre compte';
  }

  return rapport.crees.includes(email) ? 'créé' : 'déjà présent';
}

function rappelerLesComptes(rapport: RapportComptes): void {
  console.log(
    `
Comptes de démonstration (mot de passe : ${MOT_DE_PASSE_EXEMPLE})`,
  );

  for (const compte of COMPTES_EXEMPLE) {
    console.log(
      `  ${compte.role.padEnd(LARGEUR_ROLE)} ${compte.email.padEnd(LARGEUR_EMAIL)} ${etatDe(compte.email, rapport)}`,
    );
  }

  if (rapport.conflits.length > 0) {
    console.log(
      '\n⚠ Les comptes ignorés n’existent PAS : un compte à vous porte déjà leur ' +
        'pseudo. Renommez-le, ou créez ces comptes à la main.',
    );
  }
}

async function semer(): Promise<void> {
  const demande = Number(process.argv[2]);
  const nombre =
    Number.isInteger(demande) && demande > 0 ? demande : NOMBRE_PAR_DEFAUT;

  const source = await sourceDeDonnees.initialize();
  try {
    await semerDonneesReference(source);
    // Les comptes AVANT les recettes : sans administrateur, le back-office qui sert
    // à les gérer est inatteignable.
    const comptes = await semerUtilisateursExemple(source);
    const crees = await semerRecettesExemple(source, nombre);
    console.log(
      `Seed d'exemple terminé : ${String(comptes.crees.length)} compte(s) et ${String(crees)} recette(s) créée(s) sur ${String(nombre)} demandée(s).`,
    );
    rappelerLesComptes(comptes);
  } finally {
    await source.destroy();
  }
}

semer().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});

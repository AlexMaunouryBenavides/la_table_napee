import { deposerAvis, modifierAvis, supprimerAvis } from '../acces-api/avis';
import { ErreurApi } from '../acces-api/erreur-api';

export type EchecAvis = { message: string; details?: string[] };

const NOTE_MINIMALE = 1;

function lireNote(donnees: FormData): number | null {
  const brute = Number(donnees.get('note'));

  return Number.isInteger(brute) && brute >= NOTE_MINIMALE ? brute : null;
}

/**
 * Les trois écritures de la zone d'avis, derrière une seule intention lue du
 * formulaire. Un échec revient comme donnée — l'écran l'affiche sans perdre la saisie
 * — plutôt que comme exception, qui ferait tomber tout le détail de la recette.
 */
export async function executerActionAvis(
  recetteId: number,
  donnees: FormData,
): Promise<EchecAvis | null> {
  const intention = donnees.get('intention');
  // `FormData.get` peut rendre un File : on ne stringifie pas à l'aveugle.
  const saisi = donnees.get('commentaire');
  const commentaireBrut = typeof saisi === 'string' ? saisi.trim() : '';
  const commentaire = commentaireBrut === '' ? null : commentaireBrut;
  const note = lireNote(donnees);

  try {
    if (intention === 'supprimer') {
      await supprimerAvis(Number(donnees.get('avisId')));
    } else if (note === null) {
      return { message: 'Choisissez une note entre 1 et 5 étoiles.' };
    } else if (intention === 'modifier') {
      await modifierAvis(Number(donnees.get('avisId')), { note, commentaire });
    } else {
      await deposerAvis(recetteId, { note, commentaire });
    }

    return null;
  } catch (erreur) {
    if (erreur instanceof ErreurApi) {
      return { message: erreur.message, details: erreur.details };
    }
    throw erreur;
  }
}

import { aAuMoins, type Avis, type Utilisateur } from '@recipe/types';

/**
 * Un avis anonymisé n'appartient plus à personne : le compte supprimé ne le
 * « récupère » pas, et aucun autre ne peut s'en réclamer.
 */
function estAuteur(avis: Avis, session: Utilisateur | null): boolean {
  return (
    session !== null &&
    avis.utilisateur !== null &&
    avis.utilisateur.id === session.id
  );
}

/** Seul l'auteur réécrit ses propres propos — un modérateur, jamais. */
export function peutModifier(avis: Avis, session: Utilisateur | null): boolean {
  return estAuteur(avis, session);
}

/** L'auteur, ou la modération. */
export function peutSupprimer(
  avis: Avis,
  session: Utilisateur | null,
): boolean {
  if (session === null) {
    return false;
  }

  return estAuteur(avis, session) || aAuMoins(session.role, 'moderateur');
}

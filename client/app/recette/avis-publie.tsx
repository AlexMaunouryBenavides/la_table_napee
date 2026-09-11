import type { Avis, Utilisateur } from '@recipe/types';
import type { ReactNode } from 'react';

import { Etoiles } from '../composants/etoiles';

const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

/** Un avis survit à la suppression de son compte : il reste publié, anonyme. */
function nomDeLAuteur(auteur: Utilisateur | null): string {
  if (auteur === null) {
    return 'Compte supprimé';
  }

  // `pseudo` est facultatif en base ; l'e-mail ne le remplace pas, ce serait exposer
  // une donnée personnelle sur une page publique.
  return auteur.pseudo ?? 'Sans pseudo';
}

export function AvisPublie({
  avis,
  session,
  actions,
}: {
  avis: Avis;
  session: Utilisateur | null;
  actions?: ReactNode;
}) {
  const estLeMien = session !== null && avis.utilisateur?.id === session.id;

  return (
    <article
      className={`rounded-md border p-5 ${
        estLeMien ? 'border-acier bg-lavande' : 'border-trait bg-craie'
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base">
            {nomDeLAuteur(avis.utilisateur)}
            {estLeMien && (
              <span className="ml-2 text-sm text-encre-55">(vous)</span>
            )}
          </p>
          <p className="text-sm text-encre-55">
            {FORMAT_DATE.format(new Date(avis.dateCreation))}
          </p>
        </div>

        <Etoiles note={avis.note} />
      </header>

      {/* Une note sans texte est un avis complet : pas de bloc vide. */}
      {avis.commentaire !== null && (
        <blockquote className="mt-3 text-base text-encre-70">
          {avis.commentaire}
        </blockquote>
      )}

      {actions !== undefined && (
        <div className="mt-4 flex gap-3">{actions}</div>
      )}
    </article>
  );
}

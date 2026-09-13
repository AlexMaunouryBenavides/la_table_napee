import type { Avis, Utilisateur } from '@recipe/types';
import type { ReactNode } from 'react';

import { Etoiles } from '../composants/etoiles';

const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

/**
 * Un avis survit à la suppression de son compte : il reste publié, anonyme. Un compte
 * sans pseudo s'affiche de la même façon — l'e-mail ne le remplace pas, ce serait
 * exposer une donnée personnelle sur une page publique.
 */
function pseudoAffichable(auteur: Utilisateur | null): string | null {
  return auteur?.pseudo ?? null;
}

function Pastille({ pseudo }: { pseudo: string | null }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 shrink-0 place-items-center rounded-full font-titre text-sm font-semibold ${
        pseudo === null ? 'bg-trait text-encre-55' : 'bg-lavande text-ardoise'
      }`}
    >
      {pseudo === null ? '?' : pseudo.charAt(0).toUpperCase()}
    </span>
  );
}

function Commentaire({ avis }: { avis: Avis }) {
  // Une note sans texte est un avis complet : on le dit, sans bloc vide.
  if (avis.commentaire === null) {
    return (
      <p className="text-sm text-encre-55 italic">Note sans commentaire.</p>
    );
  }

  return (
    <blockquote className="text-sm leading-relaxed text-encre-70">
      {avis.commentaire}
    </blockquote>
  );
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
  const pseudo = pseudoAffichable(avis.utilisateur);

  return (
    <article
      className={`grid gap-2.5 rounded-md border px-5 py-4.5 ${
        estLeMien ? 'border-acier bg-lavande' : 'border-trait bg-craie'
      }`}
    >
      <header className="flex flex-wrap items-center gap-3">
        <Pastille pseudo={pseudo} />
        <p className="text-sm">
          {pseudo ?? <em className="text-encre-55">Utilisateur anonyme</em>}
          {estLeMien && <span className="ml-2 text-encre-55">(vous)</span>}
        </p>
        <Etoiles note={avis.note} />
        <p className="text-sm text-encre-55">
          {FORMAT_DATE.format(new Date(avis.dateCreation))}
        </p>
        {actions !== undefined && (
          <div className="ml-auto flex gap-1.5">{actions}</div>
        )}
      </header>

      <Commentaire avis={avis} />

      {avis.utilisateur === null && (
        <p className="text-xs text-encre-55">
          Compte supprimé : l’avis est conservé sans lien avec son auteur.
        </p>
      )}
    </article>
  );
}

import { useState } from 'react';

import { LienBouton } from './lien-bouton';
import { PageImpasse } from './page-impasse';

const BASE_36 = 36;
const LONGUEUR_DATE_ISO = 10; // « 2026-09-11 »
const DEBUT_DECIMALES = 2; // saute le « 0. » de Math.random()
const LONGUEUR_SUFFIXE = 6;

function referenceDIncident(): string {
  const jour = new Date().toISOString().slice(0, LONGUEUR_DATE_ISO);
  const suffixe = Math.random()
    .toString(BASE_36)
    .slice(DEBUT_DECIMALES, DEBUT_DECIMALES + LONGUEUR_SUFFIXE)
    .toUpperCase();

  return `ERR-${jour}-${suffixe}`;
}

/**
 * Écran 14. Une référence copiable permet d'en parler, là où une pile d'appels ne
 * dirait rien à l'utilisateur — et révélerait des chemins, des requêtes, parfois un
 * jeton. On ne montre donc AUCUNE trace technique.
 */
export function ErreurInattendue() {
  // Calculée une seule fois : un identifiant qui change à chaque rendu ne référence
  // rien, et le recalculer pendant le rendu serait impur.
  const [reference] = useState(referenceDIncident);

  return (
    <PageImpasse
      code={500}
      titre="Quelque chose s’est mal passé"
      explication="L’incident est de notre côté. Réessayez dans un instant ; si cela persiste, donnez-nous cette référence."
      actions={
        <LienBouton vers="/" variante="primaire">
          Retour à l’accueil
        </LienBouton>
      }
      detail={reference}
    />
  );
}

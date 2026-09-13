import type { FormEvent } from 'react';

/** Ce qu'un écran reçoit pour envoyer son formulaire : les données, rien d'autre. */
export type EnvoiFormulaire = (donnees: FormData) => void;

/**
 * Envoie sans recharger la page. Le formulaire reste monté pendant l'envoi : ses
 * champs gardent leur saisie, et un refus n'oblige rien à retaper.
 */
export function envoyerSansRecharger(surEnvoi: EnvoiFormulaire) {
  return (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    surEnvoi(new FormData(evenement.currentTarget));
  };
}

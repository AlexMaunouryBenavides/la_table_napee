/** Statut porté par une erreur sans réponse HTTP : réseau coupé, API éteinte. */
export const STATUT_SANS_REPONSE = 0;

/**
 * Tout échec d'appel arrive aux écrans sous cette forme — jamais un `undefined`
 * silencieux, jamais une erreur brute de `fetch`. `details` reprend le tableau que
 * l'API renvoie quand sa validation d'entrée refuse une requête : c'est lui qui
 * permet d'afficher les erreurs champ par champ.
 */
export class ErreurApi extends Error {
  readonly statut: number;
  readonly details?: string[];

  constructor(statut: number, message: string, details?: string[]) {
    super(message);
    this.name = 'ErreurApi';
    this.statut = statut;
    this.details = details;
  }
}

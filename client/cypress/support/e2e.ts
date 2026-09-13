import { COMPTES, MOT_DE_PASSE_EXEMPLE, urlApi } from './api';

type Compte = { email: string; pseudo: string; motDePasse: string };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- la forme documentée pour typer des commandes Cypress
  namespace Cypress {
    interface Chainable {
      /** Ouvre une session par l'API : les cookies httpOnly atterrissent dans le
       *  navigateur, comme après une vraie connexion. */
      connecter(email: string, motDePasse?: string): Chainable<void>;
      /** Crée un compte neuf, propre au parcours, sans passer par l'écran. */
      creerCompte(): Chainable<Compte>;
      /** Supprime un compte créé par un parcours : la base de test ne grossit pas. */
      supprimerCompte(email: string): Chainable<void>;
      /** Le champ que désigne un libellé, même masqué pour l'œil (`sr-only`). */
      champ(libelle: string): Chainable<JQuery>;
    }
  }
}

// Cypress injecte ses propres scripts dans le <head> ; React, qui hydrate le document
// ENTIER (`Layout` rend <html>), y voit un écart qu'aucun vrai navigateur ne produit —
// vérifié dans Chrome, aux mêmes adresses et à la même taille. On n'ignore QUE ce
// message : toute autre erreur de l'application fait toujours échouer le parcours.
Cypress.on(
  'uncaught:exception',
  (erreur) => !erreur.message.includes('Hydration failed'),
);

Cypress.Commands.add('connecter', (email: string, motDePasse?: string) => {
  cy.request('POST', urlApi('/auth/connexion'), {
    email,
    motDePasse: motDePasse ?? MOT_DE_PASSE_EXEMPLE,
  });
});

Cypress.Commands.add('creerCompte', () => {
  // L'horodatage sépare les exécutions, le compteur les comptes d'une même exécution.
  const suffixe = `${String(Date.now())}${Cypress._.uniqueId()}`;
  const compte: Compte = {
    email: `cypress-${suffixe}@exemple.test`,
    pseudo: `cypress${suffixe}`,
    motDePasse: 'une-phrase-assez-longue',
  };

  return cy
    .request('POST', urlApi('/auth/inscription'), compte)
    .then(() => compte);
});

Cypress.Commands.add('supprimerCompte', (email: string) => {
  cy.clearCookies();
  cy.connecter(COMPTES.admin);
  cy.request<{ donnees: { id: string; email: string }[] }>(
    urlApi('/utilisateurs?limite=100'),
  ).then(({ body }) => {
    const compte = body.donnees.find((candidat) => candidat.email === email);

    if (compte !== undefined) {
      cy.request('DELETE', urlApi(`/utilisateurs/${compte.id}`));
    }
  });
});

Cypress.Commands.add('champ', (libelle: string) =>
  cy
    .contains('label', libelle)
    .invoke('attr', 'for')
    .then((id) => cy.get(`[id="${String(id)}"]`)),
);

export {};

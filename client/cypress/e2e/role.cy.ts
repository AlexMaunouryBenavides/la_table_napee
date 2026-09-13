import { COMPTES } from '../support/api';

describe('un administrateur change le rôle d’un compte', () => {
  let email = '';

  beforeEach(() => {
    cy.creerCompte().then((compte) => {
      email = compte.email;
    });
    cy.connecter(COMPTES.admin);
  });

  afterEach(() => {
    cy.supprimerCompte(email);
  });

  it('voit la ligne se mettre à jour, et le rôle tenir au rechargement', () => {
    cy.visit('/panneau/utilisateurs');

    cy.contains('tr', email).find('select').select('moderateur');
    cy.contains('tr', email)
      .find('select')
      .should('have.value', 'moderateur')
      .and('be.enabled');

    cy.reload();
    cy.contains('tr', email).find('select').should('have.value', 'moderateur');
  });
});

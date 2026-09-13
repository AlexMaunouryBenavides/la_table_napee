// Un avis de la LISTE : la page de la recette est elle-même un <article>, et le champ
// de saisie garde le commentaire après l'envoi.
const AVIS_PUBLIE = 'section article';

describe('un utilisateur donne son avis sur une recette', () => {
  let email = '';

  beforeEach(() => {
    cy.creerCompte().then((compte) => {
      email = compte.email;
      cy.connecter(compte.email, compte.motDePasse);
    });
  });

  afterEach(() => {
    cy.supprimerCompte(email);
  });

  it('le publie, voit le compteur monter, puis le supprime', () => {
    const commentaire = `Avis laissé par Cypress ${String(Date.now())}`;

    cy.visit('/recettes');
    cy.get('main a[href^="/recettes/"]').first().click();

    cy.contains('h2', 'Avis')
      .invoke('text')
      .then((titre) => {
        const avant = Number(/\d+/.exec(titre)?.[0] ?? '0');

        cy.get('#commentaire').type(commentaire);
        cy.contains('button', 'Publier mon avis').click();
        cy.contains(AVIS_PUBLIE, commentaire).should('be.visible');
        cy.contains('h2', `· ${String(avant + 1)}`);

        cy.contains(AVIS_PUBLIE, commentaire)
          .contains('button', 'Supprimer')
          .click();
        cy.get('[role="dialog"]')
          .contains('button', 'Supprimer l’avis')
          .click();
        cy.contains(AVIS_PUBLIE, commentaire).should('not.exist');
        cy.contains('h2', `· ${String(avant)}`);
      });
  });
});

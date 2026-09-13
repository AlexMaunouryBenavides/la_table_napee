import { COMPTES, urlApi } from '../support/api';

describe('un modérateur crée une recette', () => {
  let recetteId = '';

  afterEach(() => {
    if (recetteId !== '') {
      cy.connecter(COMPTES.moderateur);
      cy.request('DELETE', urlApi(`/recettes/${recetteId}`));
    }
  });

  it('la publie depuis l’éditeur et la retrouve dans le catalogue public', () => {
    const titre = `Recette Cypress ${String(Date.now())}`;

    cy.connecter(COMPTES.moderateur);
    cy.visit('/panneau/recettes/nouvelle');

    cy.get('input[name="titre"]').type(titre);
    cy.get('#description').type('Créée par le parcours Cypress.');
    // Index 1 : l'option 0 est le tiret « aucune », les nationalités suivent.
    cy.get('#nationaliteId').select(1);
    cy.get('input[name="tempsPreparation"]').clear().type('20');
    cy.get('input[name="tempsCuisson"]').clear().type('10');
    cy.get('input[name="image"]').type('https://exemple.test/recette.jpg');
    cy.champ('Ingrédient 1').type('Tomates cerises');
    cy.get('#etape-0').type('Couper, assaisonner, servir.');
    cy.contains('button', 'Enregistrer').click();

    cy.location('pathname')
      .should('match', /^\/panneau\/recettes\/\d+\/modifier$/)
      .then((chemin) => {
        recetteId = /\d+/.exec(chemin)?.[0] ?? '';
      });

    cy.visit(`/recettes?recherche=${encodeURIComponent(titre)}`);
    cy.contains('a', titre).should('be.visible');
  });
});

describe('un visiteur s’inscrit puis se connecte', () => {
  const suffixe = String(Date.now());
  const compte = {
    email: `cypress-inscription-${suffixe}@exemple.test`,
    pseudo: `inscrit${suffixe}`,
    motDePasse: 'une-phrase-assez-longue',
  };

  after(() => {
    cy.supprimerCompte(compte.email);
  });

  it('voit son pseudo dans l’en-tête une fois connecté', () => {
    cy.visit('/inscription');
    cy.get('input[name="email"]').type(compte.email);
    cy.get('input[name="motDePasse"]').type(compte.motDePasse);
    cy.get('input[name="pseudo"]').type(compte.pseudo);
    cy.contains('button', 'Créer mon compte').click();

    cy.location('pathname').should('eq', '/connexion');
    cy.contains('Votre compte est créé');
    cy.get('input[name="email"]').type(compte.email);
    cy.get('input[name="motDePasse"]').type(compte.motDePasse);
    cy.contains('button', 'Se connecter').click();

    cy.location('pathname').should('eq', '/');
    cy.get(`header a[aria-label="Mon compte — ${compte.pseudo}"]`).should(
      'be.visible',
    );
  });
});

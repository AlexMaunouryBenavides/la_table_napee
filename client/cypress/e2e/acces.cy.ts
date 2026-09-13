describe('un visiteur ouvre le panneau d’administration', () => {
  it('voit la demande de connexion, jamais le contenu du panneau', () => {
    cy.visit('/panneau');

    cy.contains('Cette page demande d’être connecté').should('be.visible');
    cy.contains('Tableau de bord').should('not.exist');
  });
});

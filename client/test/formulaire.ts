/**
 * Construit un `FormData` à partir d'un objet — les actions du client en reçoivent
 * un, les tests en fabriquent un. Trois copies de cette boucle, c'est trois occasions
 * de diverger.
 */
export function donneesDeFormulaire(champs: Record<string, string>): FormData {
  const donnees = new FormData();

  for (const [cle, valeur] of Object.entries(champs)) {
    donnees.set(cle, valeur);
  }

  return donnees;
}

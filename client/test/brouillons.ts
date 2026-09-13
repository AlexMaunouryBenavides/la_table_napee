import { afterEach } from 'vitest';

import { useBrouillons } from '../app/panneau/brouillons';

// Les brouillons vivent dans un store de module ET dans `sessionStorage`, comme en
// production : on vide les deux, pour qu'aucun test n'hérite de la saisie d'un autre.
afterEach(() => {
  useBrouillons.setState({ brouillons: {} });
  sessionStorage.clear();
});

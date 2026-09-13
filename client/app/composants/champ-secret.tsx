import { type ComponentProps, useState } from 'react';

import { Champ } from './champ';

type ProprietesChampSecret = Omit<
  ComponentProps<typeof Champ>,
  'type' | 'accessoire'
>;

/**
 * Un mot de passe qu'on peut relire avant d'envoyer : taper douze caractères à
 * l'aveugle sur un téléphone, c'est se tromper une fois sur deux.
 *
 * Le bouton n'a PAS d'`aria-label` : son nom vient de son contenu (« Afficher » + un
 * complément masqué). Un `aria-label` contenant « mot de passe » ferait passer le
 * bouton pour un second champ auprès de toute recherche par libellé.
 */
export function ChampSecret(proprietes: ProprietesChampSecret) {
  const [visible, setVisible] = useState(false);

  return (
    <Champ
      {...proprietes}
      type={visible ? 'text' : 'password'}
      accessoire={
        <button
          // Sans type, un bouton dans un formulaire l'ENVOIE.
          type="button"
          aria-pressed={visible}
          disabled={proprietes.disabled}
          onClick={() => {
            setVisible(!visible);
          }}
          className="text-xs tracking-bouton text-encre-55 uppercase hover:text-ardoise"
        >
          {visible ? 'Masquer' : 'Afficher'}
          {/* L'espace HORS du span : placée dedans, certains calculs de nom
              accessible la perdent et lisent « Afficherle ». */}{' '}
          <span className="sr-only">le mot de passe</span>
        </button>
      }
    />
  );
}

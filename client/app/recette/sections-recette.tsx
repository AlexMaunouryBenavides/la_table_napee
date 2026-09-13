import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { useEcranLarge } from '../composants/use-ecran-large';

type ProprietesSections = {
  ingredients: ReactNode;
  etapes: ReactNode;
  avis: ReactNode;
  nombreAvis: number;
};

type Section = { libelle: string; contenu: ReactNode };

export function TitreDeSection({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-trait pb-3 text-3xl">{children}</h2>
  );
}

function DispositionLarge({ ingredients, etapes, avis }: ProprietesSections) {
  return (
    <div className="mt-12 md:flex md:items-start md:gap-10">
      {/* 330 px = w-82.5 sur l'échelle de 4 px : la colonne du handoff. */}
      <aside className="md:w-82.5 md:shrink-0">
        <TitreDeSection>Ingrédients</TitreDeSection>
        {ingredients}
      </aside>

      <div className="mt-10 md:mt-0 md:flex-1">
        <TitreDeSection>Étapes</TitreDeSection>
        {etapes}
        {avis}
      </div>
    </div>
  );
}

/** Flèches gauche/droite, en boucle : le motif clavier des onglets ARIA. */
function indexVoisin(touche: string, courant: number, total: number) {
  if (touche === 'ArrowRight') {
    return (courant + 1) % total;
  }
  if (touche === 'ArrowLeft') {
    return (courant - 1 + total) % total;
  }
  return null;
}

function ListeOnglets({
  sections,
  prefixe,
  actif,
  surChoix,
}: {
  sections: Section[];
  prefixe: string;
  actif: number;
  surChoix: (index: number) => void;
}) {
  const boutons = useRef<(HTMLButtonElement | null)[]>([]);

  function surTouche(evenement: KeyboardEvent) {
    const voisin = indexVoisin(evenement.key, actif, sections.length);
    if (voisin !== null) {
      surChoix(voisin);
      boutons.current[voisin]?.focus();
    }
  }

  return (
    <div role="tablist" className="mb-4 flex border-b border-trait">
      {sections.map((section, index) => (
        <button
          key={section.libelle}
          ref={(element) => {
            boutons.current[index] = element;
          }}
          type="button"
          role="tab"
          id={`${prefixe}-onglet-${String(index)}`}
          aria-selected={index === actif}
          aria-controls={`${prefixe}-panneau-${String(index)}`}
          tabIndex={index === actif ? 0 : -1}
          onClick={() => {
            surChoix(index);
          }}
          onKeyDown={surTouche}
          className={`-mb-px px-4.5 py-3 text-sm ${
            index === actif
              ? 'border-b-2 border-ardoise text-encre'
              : 'text-encre-55'
          }`}
        >
          {section.libelle}
        </button>
      ))}
    </div>
  );
}

function Onglets({
  ingredients,
  etapes,
  avis,
  nombreAvis,
}: ProprietesSections) {
  const prefixe = useId();
  const [actif, setActif] = useState(0);
  const sections: Section[] = [
    { libelle: 'Ingrédients', contenu: ingredients },
    { libelle: 'Étapes', contenu: etapes },
    { libelle: `Avis · ${String(nombreAvis)}`, contenu: avis },
  ];

  return (
    <div className="mt-8">
      <ListeOnglets
        sections={sections}
        prefixe={prefixe}
        actif={actif}
        surChoix={setActif}
      />

      {/* Les panneaux masqués restent montés : un avis en cours de rédaction survit
          à un aller-retour par les ingrédients. */}
      {sections.map((section, index) => (
        <div
          key={section.libelle}
          role="tabpanel"
          id={`${prefixe}-panneau-${String(index)}`}
          aria-labelledby={`${prefixe}-onglet-${String(index)}`}
          hidden={index !== actif}
        >
          {section.contenu}
        </div>
      ))}
    </div>
  );
}

/**
 * Ingrédients, étapes et avis : deux colonnes sur grand écran, trois onglets sur
 * petit écran, où les empiler ferait défiler longtemps avant les étapes.
 */
export function SectionsRecette(proprietes: ProprietesSections) {
  const large = useEcranLarge();

  return large ? (
    <DispositionLarge {...proprietes} />
  ) : (
    <Onglets {...proprietes} />
  );
}

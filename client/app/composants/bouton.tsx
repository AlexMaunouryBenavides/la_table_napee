import type { ComponentPropsWithRef, ReactNode } from 'react';

type VarianteBouton = 'primaire' | 'fantome' | 'danger' | 'texte';

// React 19 passe `ref` comme une prop ordinaire : pas de forwardRef à écrire.
type ProprietesBouton = ComponentPropsWithRef<'button'> & {
  variante: VarianteBouton;
  taille?: 'md' | 'sm';
  /** Bloque le bouton pendant l'envoi : sans cela, un double clic envoie deux fois. */
  chargement?: boolean;
  children: ReactNode;
};

const VARIANTES: Record<VarianteBouton, string> = {
  primaire: 'bg-ardoise text-nappe hover:bg-ardoise-fonce',
  fantome:
    'border border-ardoise text-ardoise hover:bg-ardoise hover:text-nappe',
  danger: 'bg-erreur text-nappe',
  texte: 'text-ardoise underline',
};

// 44 px : la cible tactile minimale. 32 px seulement en ligne de tableau, où la
// densité prime et où le pointeur est presque toujours une souris.
const TAILLES = { md: 'h-11 px-6', sm: 'h-8 px-4' };

export function Bouton({
  variante,
  taille = 'md',
  chargement = false,
  disabled = false,
  children,
  className = '',
  ...reste
}: ProprietesBouton) {
  return (
    <button
      type="button"
      aria-busy={chargement}
      disabled={disabled || chargement}
      className={`rounded-pilule text-xs tracking-bouton uppercase ${VARIANTES[variante]} ${TAILLES[taille]} ${className}`}
      {...reste}
    >
      {children}
    </button>
  );
}

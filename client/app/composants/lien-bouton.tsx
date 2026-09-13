import type { ReactNode } from 'react';
import { Link } from 'react-router';

const VARIANTES = {
  primaire: 'bg-ardoise text-nappe hover:bg-ardoise-fonce hover:text-nappe',
  fantome:
    'border border-ardoise text-ardoise hover:bg-ardoise hover:text-nappe',
};

const TAILLES = { md: 'h-11 px-6', sm: 'h-8 px-4' };

/**
 * Un LIEN habillé comme `Bouton` : on change de page, la sémantique reste celle d'un
 * lien — un lecteur d'écran l'annonce comme tel, et le clic du milieu ouvre un onglet.
 */
export function LienBouton({
  vers,
  variante,
  taille = 'md',
  children,
}: {
  vers: string;
  variante: keyof typeof VARIANTES;
  taille?: keyof typeof TAILLES;
  children: ReactNode;
}) {
  return (
    <Link
      to={vers}
      className={`inline-flex items-center rounded-pilule text-xs tracking-bouton uppercase hover:no-underline ${VARIANTES[variante]} ${TAILLES[taille]}`}
    >
      {children}
    </Link>
  );
}

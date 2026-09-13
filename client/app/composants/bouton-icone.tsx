import type { ReactNode } from 'react';

/**
 * Un bouton carré à glyphe (▲ ▼ ×). Le glyphe ne dit rien à un lecteur d'écran :
 * `libelle` porte l'action complète (« Retirer l'ingrédient 2 ») et sert d'infobulle.
 */
export function BoutonIcone({
  libelle,
  danger = false,
  disabled = false,
  onClick,
  children,
}: {
  libelle: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={libelle}
      title={libelle}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-10 shrink-0 place-items-center rounded-sm border border-trait bg-nappe text-sm disabled:cursor-not-allowed disabled:text-encre-35 ${
        danger ? 'text-erreur' : 'text-ardoise'
      }`}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

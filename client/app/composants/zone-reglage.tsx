import type { ReactNode } from 'react';

/**
 * Une carte titrée par zone de réglage. La variante dangereuse ne se signale pas par
 * la seule couleur : le titre dit ce qu'elle fait, et l'encadré la sépare du reste.
 *
 * `id` sert d'ancre : le menu latéral de « Mon compte » y mène.
 */
export function ZoneReglage({
  id,
  titre,
  explication,
  danger = false,
  children,
}: {
  id?: string;
  titre: string;
  explication: ReactNode;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`grid scroll-mt-6 gap-4.5 rounded-md border px-7 py-6.5 ${
        danger ? 'border-erreur/30 bg-erreur-fond' : 'border-trait bg-craie'
      }`}
    >
      <h2 className={`text-2xl ${danger ? 'text-erreur' : ''}`}>{titre}</h2>
      <div
        className={`max-w-140 text-sm leading-relaxed ${
          danger ? 'text-erreur' : 'text-encre-55'
        }`}
      >
        {explication}
      </div>
      {children}
    </section>
  );
}

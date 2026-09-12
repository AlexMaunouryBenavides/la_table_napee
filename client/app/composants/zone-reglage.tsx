import type { ReactNode } from 'react';

/**
 * Une carte titrée par zone de réglage. La variante dangereuse ne se signale pas par
 * la seule couleur : le titre dit ce qu'elle fait, et l'encadré la sépare du reste.
 */
export function ZoneReglage({
  titre,
  explication,
  danger = false,
  children,
}: {
  titre: string;
  explication: ReactNode;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-lg border p-6 ${
        danger ? 'border-erreur bg-erreur-fond' : 'border-trait bg-craie'
      }`}
    >
      <h2 className="font-titre text-2xl">{titre}</h2>
      <div className="mt-2 text-base text-encre-70">{explication}</div>
      {children}
    </section>
  );
}

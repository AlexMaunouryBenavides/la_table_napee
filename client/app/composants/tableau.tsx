import type { ReactNode } from 'react';

/**
 * L'enveloppe commune des tableaux de gestion : les en-têtes restent lisibles pendant
 * le chargement, et le défilement horizontal est CONFINÉ ici — jamais sur la page.
 */
export function Tableau({
  colonnes,
  children,
}: {
  colonnes: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-base">
        <thead className="text-xs tracking-etiquette text-encre-70 uppercase">
          <tr>
            {colonnes.map((colonne) => (
              <th key={colonne} scope="col" className="pb-2 pr-4">
                {colonne}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

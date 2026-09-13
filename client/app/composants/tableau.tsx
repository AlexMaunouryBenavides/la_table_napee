import type { ReactNode } from 'react';

/**
 * L'enveloppe commune des tableaux de gestion : les en-têtes restent lisibles pendant
 * le chargement, et le défilement horizontal est CONFINÉ ici — jamais sur la page.
 *
 * `encadre` à `false` quand le tableau vit déjà dans un bloc qui porte son cadre.
 */
export function Tableau({
  colonnes,
  aDroite = [],
  encadre = true,
  children,
}: {
  colonnes: string[];
  /** Les colonnes alignées à droite — les actions, typiquement. */
  aDroite?: string[];
  encadre?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`overflow-x-auto ${
        encadre ? 'rounded-md border border-trait bg-craie' : ''
      }`}
    >
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            {colonnes.map((colonne) => (
              <th
                key={colonne}
                scope="col"
                className={`border-b border-trait-fort px-4 py-3 text-xs font-medium tracking-bouton whitespace-nowrap text-encre-55 uppercase ${
                  aDroite.includes(colonne) ? 'text-right' : ''
                }`}
              >
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

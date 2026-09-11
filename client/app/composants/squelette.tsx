type ProprietesSquelette = {
  lignes?: number;
  /** Hauteur d'une ligne, en pas de 4 px (`hauteur={11}` → 44 px). */
  hauteur?: number;
  rond?: boolean;
  className?: string;
};

const LIGNES_PAR_DEFAUT = 1;
const HAUTEUR_PAR_DEFAUT = 4;

/**
 * Reprend la GÉOMÉTRIE du contenu final, pour qu'aucun décalage ne se produise à
 * l'arrivée des données. Jamais de rond qui tourne au milieu d'un écran vide.
 *
 * L'animation est neutralisée sous `prefers-reduced-motion` par la règle globale
 * d'`app.css`.
 */
export function Squelette({
  lignes = LIGNES_PAR_DEFAUT,
  hauteur = HAUTEUR_PAR_DEFAUT,
  rond = false,
  className = '',
}: ProprietesSquelette) {
  return (
    <div aria-busy="true" className={`flex flex-col gap-2 ${className}`}>
      <span className="sr-only">Chargement…</span>
      {Array.from({ length: lignes }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          style={{ height: `calc(var(--spacing) * ${String(hauteur)})` }}
          className={`animate-pulse bg-lin ${rond ? 'rounded-pilule' : 'rounded-xs'}`}
        />
      ))}
    </div>
  );
}

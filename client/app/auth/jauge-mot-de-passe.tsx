const LONGUEUR_MINIMALE = 12;
const LONGUEUR_CONFORTABLE = 20;
const POURCENT = 100;

/**
 * Purement indicative, et `aria-hidden` : elle informe, elle ne juge pas. La seule
 * exigence réelle est la longueur, et c'est l'API qui la tranche.
 */
export function JaugeMotDePasse({ motDePasse }: { motDePasse: string }) {
  const part = Math.min(
    POURCENT,
    Math.round((motDePasse.length / LONGUEUR_CONFORTABLE) * POURCENT),
  );
  const suffisant = motDePasse.length >= LONGUEUR_MINIMALE;

  return (
    <div aria-hidden="true" data-testid="jauge-mot-de-passe" className="mt-2">
      <div className="h-1 w-full rounded-pilule bg-lin">
        <div
          style={{ width: `${String(part)}%` }}
          className={`h-1 rounded-pilule ${suffisant ? 'bg-succes' : 'bg-alerte'}`}
        />
      </div>
    </div>
  );
}

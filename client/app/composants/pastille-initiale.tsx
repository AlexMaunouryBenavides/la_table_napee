/**
 * L'initiale d'un pseudo dans un rond. Décorative : le nom est écrit juste à côté.
 * Sans pseudo, un « ? » sur fond neutre — jamais l'initiale de l'e-mail, qui
 * exposerait une donnée personnelle.
 */
export function PastilleInitiale({ pseudo }: { pseudo: string | null }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 shrink-0 place-items-center rounded-full font-titre text-sm font-semibold ${
        pseudo === null ? 'bg-trait text-encre-55' : 'bg-lavande text-ardoise'
      }`}
    >
      {pseudo === null ? '?' : pseudo.charAt(0).toUpperCase()}
    </span>
  );
}

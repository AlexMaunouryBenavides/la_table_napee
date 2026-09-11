import type { Etape } from '@recipe/types';

/**
 * Le numéro vient de `etapes[].numero`, jamais de l'index : la base renumérote quand
 * une étape disparaît, et un index se mettrait à mentir.
 */
export function Etapes({ etapes }: { etapes: Etape[] }) {
  return (
    <ol className="flex flex-col gap-6">
      {etapes.map((etape) => (
        <li key={etape.id} className="flex gap-4">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pilule bg-lavande font-titre text-lg text-ardoise"
          >
            {etape.numero}
          </span>
          <p className="pt-2 text-base">{etape.contenu}</p>
        </li>
      ))}
    </ol>
  );
}

/** Le champ est facultatif : sans vidéo, pas de cadre vide. */
export function VideoDeLaRecette({ video }: { video: string | null }) {
  if (video === null) {
    return null;
  }

  return (
    <div className="aspect-video overflow-hidden rounded-md bg-lin">
      <iframe
        src={video}
        title="Vidéo de la recette"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

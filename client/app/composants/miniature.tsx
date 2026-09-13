/**
 * Vignette de ligne de tableau. Décorative : le titre est dans la cellule, juste à
 * côté. L'aplat tient la place tant qu'il n'y a pas d'image.
 */
export function Miniature({ image }: { image: string }) {
  return (
    <span
      aria-hidden="true"
      className="block h-8.5 w-11 shrink-0 overflow-hidden rounded-xs bg-lavande"
    >
      {image !== '' && (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      )}
    </span>
  );
}

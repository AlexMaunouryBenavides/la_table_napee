const NOTE_MAXIMALE = 5;
// Dérivée, jamais recopiée : la note maximale est déclarée une seule fois.
const NOTES = Array.from({ length: NOTE_MAXIMALE }, (_, index) => index + 1);

type ProprietesEtoiles = {
  /** `null` = aucun avis. Ce n'est PAS zéro. */
  note: number | null;
  nombreAvis?: number;
  saisie?: boolean;
  nom?: string;
  surChangement?: (note: number) => void;
};

function enFrancais(note: number): string {
  return note.toFixed(1).replace('.', ',');
}

function libelle(note: number, nombreAvis?: number): string {
  const base = `Noté ${enFrancais(note)} sur ${String(NOTE_MAXIMALE)}`;

  // Sans nombre d'avis, on se tait : annoncer « 0 avis » serait faux, on ne sait
  // simplement pas.
  return nombreAvis === undefined
    ? base
    : `${base}, ${String(nombreAvis)} avis`;
}

function SaisieDeNote({
  nom,
  note,
  surChangement,
}: {
  nom: string;
  note: number | null;
  surChangement?: (note: number) => void;
}) {
  return (
    // Le rôle implicite d'un fieldset est « group » : pour un vrai groupe de radios,
    // il faut le dire.
    <fieldset
      role="radiogroup"
      className="flex items-center gap-1 border-0 p-0"
    >
      <legend className="sr-only">Votre note</legend>
      {NOTES.map((valeur) => (
        <label key={valeur} className="cursor-pointer">
          <input
            type="radio"
            name={nom}
            value={valeur}
            checked={note === valeur}
            onChange={() => surChangement?.(valeur)}
            className="sr-only"
          />
          <span className="sr-only">
            {valeur} étoile{valeur > 1 ? 's' : ''}
          </span>
          <span
            aria-hidden="true"
            className={
              note !== null && valeur <= note ? 'text-ardoise' : 'text-encre-35'
            }
          >
            ★
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function Etoiles({
  note,
  nombreAvis,
  saisie = false,
  nom = 'note',
  surChangement,
}: ProprietesEtoiles) {
  if (saisie) {
    return <SaisieDeNote nom={nom} note={note} surChangement={surChangement} />;
  }

  // Cinq étoiles vides se lisent « très mal notée ». On écrit donc l'absence.
  if (note === null) {
    return (
      <span className="text-sm text-encre-55 italic">Pas encore notée</span>
    );
  }

  return (
    <span
      role="img"
      aria-label={libelle(note, nombreAvis)}
      className="text-ardoise"
    >
      {NOTES.map((valeur) => (
        <span key={valeur} className={valeur <= note ? '' : 'text-encre-35'}>
          ★
        </span>
      ))}
    </span>
  );
}

import type { ComponentPropsWithRef, ReactNode } from 'react';

type ProprietesChamp = ComponentPropsWithRef<'input'> & {
  nom: string;
  /** Toujours visible : un libellé qui disparaît à la saisie est un libellé perdu. */
  libelle: string;
  aide?: string;
  erreur?: string;
  optionnel?: boolean;
  /** Un contrôle logé à droite DANS le champ (« Afficher » d'un mot de passe). */
  accessoire?: ReactNode;
};

function Libelle({
  nom,
  libelle,
  optionnel,
}: {
  nom: string;
  libelle: string;
  optionnel: boolean;
}) {
  return (
    <label
      htmlFor={nom}
      className="block text-xs font-medium tracking-bouton text-encre-70 uppercase"
    >
      {libelle}
      {/* « (optionnel) » appartient au libellé, pas à l'aide : c'est la première
          chose qu'un lecteur d'écran doit entendre. */}
      {optionnel && (
        <span className="font-light tracking-normal text-encre-55 normal-case">
          {' '}
          (optionnel)
        </span>
      )}
    </label>
  );
}

function MessageDErreur({ id, erreur }: { id: string; erreur: string }) {
  return (
    <p id={id} className="mt-1 text-sm text-erreur">
      {/* Décoratif : sans cela, le lecteur d'écran annonce « signe d'avertissement »
          avant le message lui-même. */}
      <span aria-hidden="true">⚠ </span>
      {erreur}
    </p>
  );
}

/** La place réservée à droite évite que la saisie passe SOUS l'accessoire. */
function classeDuControle(avecAccessoire: boolean, enErreur: boolean): string {
  const place = avecAccessoire ? 'pr-28' : '';
  const etat = enErreur ? 'border-erreur bg-erreur-fond' : 'border-trait-fort';

  return `h-12 w-full rounded-sm border bg-craie px-3.5 text-sm ${place} ${etat}`;
}

export function Champ({
  nom,
  libelle,
  aide,
  erreur,
  optionnel = false,
  accessoire,
  className = '',
  ...reste
}: ProprietesChamp) {
  const idAide = `${nom}-aide`;
  const idErreur = `${nom}-erreur`;
  const enErreur = erreur !== undefined;

  // Un seul `aria-describedby` : l'aide ET l'erreur y sont reliées quand les deux
  // existent.
  const descriptions = [
    aide === undefined ? null : idAide,
    enErreur ? idErreur : null,
  ]
    .filter((id) => id !== null)
    .join(' ');

  return (
    <div className={className}>
      <Libelle nom={nom} libelle={libelle} optionnel={optionnel} />

      <div className="relative mt-2">
        <input
          id={nom}
          name={nom}
          aria-invalid={enErreur ? true : undefined}
          aria-describedby={descriptions === '' ? undefined : descriptions}
          className={classeDuControle(accessoire !== undefined, enErreur)}
          {...reste}
        />
        {accessoire !== undefined && (
          <div className="absolute inset-y-0 right-3.5 flex items-center">
            {accessoire}
          </div>
        )}
      </div>

      {aide !== undefined && (
        <p id={idAide} className="mt-2 text-sm text-encre-55">
          {aide}
        </p>
      )}

      {enErreur && <MessageDErreur id={idErreur} erreur={erreur} />}
    </div>
  );
}

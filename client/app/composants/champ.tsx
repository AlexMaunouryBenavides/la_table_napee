import type { ComponentPropsWithRef } from 'react';

type ProprietesChamp = ComponentPropsWithRef<'input'> & {
  nom: string;
  /** Toujours visible : un libellé qui disparaît à la saisie est un libellé perdu. */
  libelle: string;
  aide?: string;
  erreur?: string;
  optionnel?: boolean;
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

export function Champ({
  nom,
  libelle,
  aide,
  erreur,
  optionnel = false,
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

      <input
        id={nom}
        name={nom}
        aria-invalid={enErreur ? true : undefined}
        aria-describedby={descriptions === '' ? undefined : descriptions}
        className={`mt-2 h-12 w-full rounded-sm border bg-craie px-3.5 text-sm ${
          enErreur ? 'border-erreur bg-erreur-fond' : 'border-trait-fort'
        }`}
        {...reste}
      />

      {aide !== undefined && (
        <p id={idAide} className="mt-2 text-sm text-encre-55">
          {aide}
        </p>
      )}

      {enErreur && <MessageDErreur id={idErreur} erreur={erreur} />}
    </div>
  );
}

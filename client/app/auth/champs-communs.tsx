import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { Bouton } from '../composants/bouton';
import { Champ } from '../composants/champ';

import { erreurDeChamp, type EchecAuth } from './ecran-connexion';

/** Identique à la connexion et à l'inscription, jusqu'à l'autocomplétion. */
export function ChampEmail({
  echec,
  envoiEnCours,
  aide,
}: {
  echec: EchecAuth | null;
  envoiEnCours: boolean;
  aide?: string;
}) {
  return (
    <Champ
      nom="email"
      type="email"
      libelle="Adresse e-mail"
      autoComplete="email"
      required
      disabled={envoiEnCours}
      defaultValue={echec?.saisie?.email ?? ''}
      aide={aide}
      erreur={erreurDeChamp(echec, 'email')}
    />
  );
}

/** Le titre, puis — tout de suite — le renvoi vers l'autre écran d'authentification. */
export function EnTeteAuth({
  titre,
  emphase,
  question,
  vers,
  libelleLien,
}: {
  titre: string;
  emphase: string;
  question: string;
  vers: string;
  libelleLien: string;
}) {
  return (
    <header>
      <h1 className="text-4xl leading-tight">
        {titre} <em className="text-ardoise">{emphase}</em>
      </h1>
      <p className="mt-2 text-sm text-encre-55">
        {question}{' '}
        <Link to={vers} className="text-encre-70">
          {libelleLien}
        </Link>
      </p>
    </header>
  );
}

/** Le bouton d'envoi, puis une note sous un filet. */
export function PiedDeFormulaire({
  libelleEnvoi,
  envoiEnCours,
  note,
}: {
  libelleEnvoi: string;
  envoiEnCours: boolean;
  note: ReactNode;
}) {
  return (
    <>
      <div className="mt-5">
        <Bouton
          variante="primaire"
          type="submit"
          chargement={envoiEnCours}
          className="w-full"
        >
          {libelleEnvoi}
        </Bouton>
      </div>

      <p className="mt-6 border-t border-trait pt-5 text-sm leading-relaxed text-encre-55">
        {note}
      </p>
    </>
  );
}

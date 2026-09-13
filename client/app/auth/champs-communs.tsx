import { Link } from 'react-router';

import { Bouton } from '../composants/bouton';
import { Champ } from '../composants/champ';

import { erreurDeChamp, type EchecAuth } from './ecran-connexion';

/** Identique à la connexion et à l'inscription, jusqu'à l'autocomplétion. */
export function ChampEmail({
  echec,
  envoiEnCours,
}: {
  echec: EchecAuth | null;
  envoiEnCours: boolean;
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
      erreur={erreurDeChamp(echec, 'email')}
    />
  );
}

/** Le bouton d'envoi, puis le renvoi vers l'autre écran d'authentification. */
export function PiedDeFormulaire({
  libelleEnvoi,
  question,
  vers,
  libelleLien,
  envoiEnCours,
}: {
  libelleEnvoi: string;
  question: string;
  vers: string;
  libelleLien: string;
  envoiEnCours: boolean;
}) {
  return (
    <>
      <div className="mt-6">
        <Bouton
          variante="primaire"
          type="submit"
          chargement={envoiEnCours}
          className="w-full"
        >
          {libelleEnvoi}
        </Bouton>
      </div>

      <p className="mt-6 text-sm text-encre-55">
        {question}{' '}
        <Link to={vers} className="underline">
          {libelleLien}
        </Link>
      </p>
    </>
  );
}

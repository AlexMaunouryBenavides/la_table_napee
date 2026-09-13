import type { Utilisateur } from '@recipe/types';
import { Form, Link, useSearchParams } from 'react-router';

import { Bandeau } from '../composants/bandeau';
import { ChampSecret } from '../composants/champ-secret';

import { ChampEmail, EnTeteAuth, PiedDeFormulaire } from './champs-communs';

export type EchecAuth = {
  statut: number;
  message: string;
  /** Les erreurs de validation, champ par champ, renvoyées par l'API. */
  details?: string[];
  /** Ce qui était saisi, pour ne pas le faire retaper. Jamais le mot de passe. */
  saisie?: { email?: string; pseudo?: string };
};

const REQUETE_INVALIDE = 400;

/**
 * Les erreurs de FORMAT se rattachent à leur champ ; les autres jamais.
 *
 * Sur un échec d'identifiants, rattacher le message dirait quel champ est faux —
 * donc si le compte existe. L'anti-énumération ne tient que si elle tient aussi pour
 * un lecteur d'écran.
 */
export function erreurDeChamp(
  echec: EchecAuth | null,
  champ: string,
): string | undefined {
  if (echec === null || echec.statut !== REQUETE_INVALIDE) {
    return undefined;
  }

  return echec.details?.find((detail) => detail.startsWith(`${champ} `));
}

/** Le bandeau ne s'affiche que pour ce qui n'appartient à aucun champ. */
export function echecGlobal(echec: EchecAuth | null): EchecAuth | null {
  if (echec === null) {
    return null;
  }

  return echec.statut === REQUETE_INVALIDE ? null : echec;
}

export function DejaConnecte({ session }: { session: Utilisateur }) {
  return (
    <div>
      <h1 className="font-titre text-3xl">Vous êtes déjà connecté</h1>
      <p className="mt-4 text-base text-encre-70">
        Vous naviguez en tant que {session.pseudo ?? session.email}.
      </p>
      {/* Pas de redirection automatique : renvoyer quelqu'un ailleurs sans le lui
          dire, c'est lui faire perdre l'endroit où il voulait aller. */}
      <div className="mt-6 flex gap-4">
        <Link to="/" className="underline">
          Retour à l’accueil
        </Link>
        <Link to="/recettes" className="underline">
          Parcourir le catalogue
        </Link>
      </div>
    </div>
  );
}

function ChampsDeConnexion({
  echec,
  envoiEnCours,
}: {
  echec: EchecAuth | null;
  envoiEnCours: boolean;
}) {
  return (
    <div className="mt-6 flex flex-col gap-5">
      <ChampEmail echec={echec} envoiEnCours={envoiEnCours} />

      <ChampSecret
        nom="motDePasse"
        libelle="Mot de passe"
        autoComplete="current-password"
        required
        disabled={envoiEnCours}
        erreur={erreurDeChamp(echec, 'motDePasse')}
      />
    </div>
  );
}

export function EcranConnexion({
  session,
  echec,
  envoiEnCours,
}: {
  session: Utilisateur | null;
  echec: EchecAuth | null;
  envoiEnCours: boolean;
}) {
  const [parametres] = useSearchParams();

  if (session !== null) {
    return <DejaConnecte session={session} />;
  }

  const global = echecGlobal(echec);
  const compteCree = parametres.get('inscrit') === '1';

  return (
    <Form method="post">
      <EnTeteAuth
        titre="Se"
        emphase="connecter"
        question="Pas encore de compte ?"
        vers="/inscription"
        libelleLien="Créer un compte"
      />

      {compteCree && (
        <div className="mt-6">
          <Bandeau
            ton="succes"
            message="Votre compte est créé. Connectez-vous pour commencer."
          />
        </div>
      )}

      {global !== null && (
        <div className="mt-6">
          <Bandeau ton="erreur" message={global.message} />
        </div>
      )}

      <ChampsDeConnexion echec={echec} envoiEnCours={envoiEnCours} />

      <PiedDeFormulaire
        libelleEnvoi="Se connecter"
        envoiEnCours={envoiEnCours}
        note="Mot de passe oublié ? Contactez l’équipe — la réinitialisation en libre-service n’existe pas encore côté API."
      />
    </Form>
  );
}

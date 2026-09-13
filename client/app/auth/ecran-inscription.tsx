import type { Utilisateur } from '@recipe/types';
import { useState } from 'react';
import { Form } from 'react-router';

import { Bandeau } from '../composants/bandeau';
import { Champ } from '../composants/champ';

import { ChampEmail, EnTeteAuth, PiedDeFormulaire } from './champs-communs';
import {
  DejaConnecte,
  echecGlobal,
  erreurDeChamp,
  type EchecAuth,
} from './ecran-connexion';
import { JaugeMotDePasse } from './jauge-mot-de-passe';

const LONGUEUR_MINIMALE = 12;
const TROP_COURT = `Votre mot de passe doit faire au moins ${String(LONGUEUR_MINIMALE)} caractères.`;

/** L'API dit « Email ou pseudo déjà utilisé » sans dire lequel : impossible de
 *  l'attacher honnêtement à un champ, donc il vit en bandeau. */
function EchecDInscription({ echec }: { echec: EchecAuth | null }) {
  if (echec === null) {
    return null;
  }

  return (
    <div className="mt-6">
      <Bandeau ton="erreur" message={echec.message} />
    </div>
  );
}

function ChampMotDePasse({
  motDePasse,
  surSaisie,
  erreur,
  envoiEnCours,
}: {
  motDePasse: string;
  surSaisie: (valeur: string) => void;
  erreur: string | undefined;
  envoiEnCours: boolean;
}) {
  return (
    <div>
      <Champ
        nom="motDePasse"
        type="password"
        libelle="Mot de passe"
        autoComplete="new-password"
        aide={`${String(LONGUEUR_MINIMALE)} caractères minimum. Une phrase entière vaut mieux qu’un mot compliqué.`}
        required
        disabled={envoiEnCours}
        value={motDePasse}
        onChange={(evenement) => {
          surSaisie(evenement.target.value);
        }}
        erreur={erreur}
      />
      <JaugeMotDePasse motDePasse={motDePasse} />
    </div>
  );
}

function ChampsDInscription({
  echec,
  envoiEnCours,
  motDePasse,
  surMotDePasse,
  erreurMotDePasse,
}: {
  echec: EchecAuth | null;
  envoiEnCours: boolean;
  motDePasse: string;
  surMotDePasse: (valeur: string) => void;
  erreurMotDePasse: string | undefined;
}) {
  return (
    <div className="mt-6 flex flex-col gap-5">
      <ChampEmail
        echec={echec}
        envoiEnCours={envoiEnCours}
        aide="Sert uniquement à la connexion."
      />

      <ChampMotDePasse
        motDePasse={motDePasse}
        surSaisie={surMotDePasse}
        erreur={erreurMotDePasse}
        envoiEnCours={envoiEnCours}
      />

      <Champ
        nom="pseudo"
        libelle="Pseudo"
        optionnel
        aide="Affiché sur vos avis. Sans pseudo, ils apparaissent comme « Utilisateur anonyme »."
        autoComplete="nickname"
        disabled={envoiEnCours}
        defaultValue={echec?.saisie?.pseudo ?? ''}
        erreur={erreurDeChamp(echec, 'pseudo')}
      />
    </div>
  );
}

type ProprietesEcran = {
  session: Utilisateur | null;
  echec: EchecAuth | null;
  envoiEnCours: boolean;
};

export function EcranInscription({
  session,
  echec,
  envoiEnCours,
}: ProprietesEcran) {
  const [motDePasse, setMotDePasse] = useState('');
  const [tropCourt, setTropCourt] = useState(false);

  if (session !== null) {
    return <DejaConnecte session={session} />;
  }

  const global = echecGlobal(echec);

  return (
    <Form
      method="post"
      onSubmit={(evenement) => {
        // La seule règle que le client double : elle est triviale, et elle évite un
        // aller-retour dont la réponse est connue d'avance.
        if (motDePasse.length < LONGUEUR_MINIMALE) {
          evenement.preventDefault();
          setTropCourt(true);
        }
      }}
    >
      <EnTeteAuth
        titre="Créer un"
        emphase="compte"
        question="Déjà inscrit ?"
        vers="/connexion"
        libelleLien="Se connecter"
      />

      <EchecDInscription echec={global} />

      <ChampsDInscription
        echec={echec}
        envoiEnCours={envoiEnCours}
        motDePasse={motDePasse}
        surMotDePasse={(valeur) => {
          setMotDePasse(valeur);
          setTropCourt(false);
        }}
        erreurMotDePasse={
          tropCourt ? TROP_COURT : erreurDeChamp(echec, 'motDePasse')
        }
      />

      <PiedDeFormulaire
        libelleEnvoi="Créer mon compte"
        envoiEnCours={envoiEnCours}
        note="Votre compte est de rôle utilisateur : la publication de recettes est réservée à l’équipe."
      />
    </Form>
  );
}

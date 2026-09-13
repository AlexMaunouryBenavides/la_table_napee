import type { Utilisateur } from '@recipe/types';
import { useState } from 'react';
import { Form, Link, useLocation, useSubmit } from 'react-router';

import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { Champ } from '../composants/champ';
import { EtiquetteRole } from '../composants/etiquette-role';
import { ModaleConfirmation } from '../composants/modale-confirmation';
import { ZoneReglage } from '../composants/zone-reglage';
import { useDeconnexion } from '../session-courante';

import type { ResultatCompte } from './actions-compte';

const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const LONGUEUR_MIN_PSEUDO = 3;
const LONGUEUR_MIN_MOT_DE_PASSE = 12;
const MOT_DE_CONFIRMATION = 'SUPPRIMER';

// Écrit DEUX fois — dans la zone et dans la modale. C'est l'information la plus
// importante de l'écran : elle doit survivre au fait de ne lire que la modale.
const SORT_DES_AVIS =
  'Vos avis restent publiés sur les recettes mais deviennent anonymes : plus aucun lien avec vous, et vous ne pourrez plus les modifier ni les supprimer.';

type RetourDeZone = {
  resultat: ResultatCompte | null;
  envoiEnCours: boolean;
};

/** Un message rattaché à un champ ne s'affiche pas AUSSI en bandeau : le lire deux
 *  fois ne dit pas deux choses. */
function Retour({
  resultat,
  succes,
}: {
  resultat: ResultatCompte | null;
  succes: string;
}) {
  if (resultat === null) {
    return null;
  }

  if (resultat.succes) {
    return <Bandeau ton="succes" message={succes} />;
  }

  return resultat.message === undefined ? null : (
    <Bandeau ton="erreur" message={resultat.message} />
  );
}

function Salutation({ session }: { session: Utilisateur }) {
  const sansPseudo = session.pseudo === null;

  return (
    <header className="mb-7 border-b border-trait pb-4.5">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-medium tracking-bouton text-ardoise uppercase">
            Compte utilisateur
          </p>
          {/* Jamais « Bonjour, null », jamais l'e-mail : une adresse n'est pas un nom
              public, et un titre se lit par-dessus l'épaule. */}
          <h1 className="mt-2 text-4xl leading-none">
            {sansPseudo ? (
              'Bonjour'
            ) : (
              <>
                Bonjour, <em className="text-ardoise">{session.pseudo}</em>
              </>
            )}
          </h1>
        </div>
        <EtiquetteRole role={session.role} />
      </div>

      {sansPseudo && (
        <Bandeau
          ton="info"
          className="mt-4"
          message="Vous n’avez pas de pseudo : vos avis s’affichent comme « Utilisateur anonyme ». Vous pouvez en choisir un ci-dessous."
        />
      )}
    </header>
  );
}

/** Ce qui s'affiche dans les champs : la saisie refusée d'abord, le compte ensuite. */
function valeursDuProfil(
  session: Utilisateur,
  resultat: ResultatCompte | null,
) {
  const saisie = resultat?.saisie;

  return {
    pseudo: saisie?.pseudo ?? session.pseudo ?? '',
    email: saisie?.email ?? session.email,
  };
}

/** Ce que l'utilisateur ne modifie pas ici : lu, jamais saisi. */
function FaitsDuCompte({ session }: { session: Utilisateur }) {
  const faits: [string, string][] = [
    ['Rôle', session.role],
    ['Compte créé le', FORMAT_DATE.format(new Date(session.dateCreation))],
    ['Identifiant', session.id],
  ];

  return (
    <dl className="flex flex-wrap gap-y-3 border-t border-trait pt-4">
      {faits.map(([intitule, valeur]) => (
        <div
          key={intitule}
          className="mr-6.5 grid gap-1 border-r border-trait pr-6.5 last:mr-0 last:border-r-0 last:pr-0"
        >
          <dt className="text-xs tracking-bouton text-encre-55 uppercase">
            {intitule}
          </dt>
          <dd className="text-sm break-all">{valeur}</dd>
        </div>
      ))}
    </dl>
  );
}

function ChampsDuProfil({
  valeurs,
  champs,
  envoiEnCours,
}: {
  valeurs: { pseudo: string; email: string };
  champs?: Record<string, string>;
  envoiEnCours: boolean;
}) {
  return (
    <div className="grid gap-4.5 md:grid-cols-2">
      <Champ
        nom="pseudo"
        libelle="Pseudo"
        optionnel
        minLength={LONGUEUR_MIN_PSEUDO}
        defaultValue={valeurs.pseudo}
        disabled={envoiEnCours}
        erreur={champs?.pseudo}
      />

      <Champ
        nom="email"
        type="email"
        libelle="Adresse e-mail"
        aide="Sert à la connexion."
        required
        defaultValue={valeurs.email}
        disabled={envoiEnCours}
        erreur={champs?.email}
      />
    </div>
  );
}

function ZoneProfil({
  session,
  resultat,
  envoiEnCours,
}: RetourDeZone & { session: Utilisateur }) {
  const valeurs = valeursDuProfil(session, resultat);

  return (
    <ZoneReglage
      id="profil"
      titre="Profil"
      explication="Le pseudo apparaît sur vos avis. Laissé vide, il reste tel quel : l’API permet d’en changer, pas d’en effacer un."
    >
      <Retour
        resultat={resultat}
        succes="Vos informations sont enregistrées."
      />

      <Form method="post" className="grid gap-4.5">
        <input type="hidden" name="intention" value="profil" />

        <ChampsDuProfil
          valeurs={valeurs}
          champs={resultat?.champs}
          envoiEnCours={envoiEnCours}
        />

        <FaitsDuCompte session={session} />

        <div className="flex items-center gap-4">
          <Bouton type="submit" variante="primaire" chargement={envoiEnCours}>
            Enregistrer
          </Bouton>
          {/* Un `reset` natif : il rend aux champs leur valeur de départ. */}
          <button type="reset" className="text-sm text-ardoise underline">
            Annuler
          </button>
        </div>
      </Form>
    </ZoneReglage>
  );
}

function ChampsDeMotDePasse({
  champs,
  envoiEnCours,
}: {
  champs?: Record<string, string>;
  envoiEnCours: boolean;
}) {
  return (
    <>
      <div className="grid gap-4.5 md:grid-cols-2">
        <Champ
          nom="ancienMotDePasse"
          type="password"
          libelle="Mot de passe actuel"
          autoComplete="current-password"
          required
          disabled={envoiEnCours}
          erreur={champs?.ancienMotDePasse}
        />
      </div>

      <div className="grid gap-4.5 md:grid-cols-2">
        <Champ
          nom="nouveauMotDePasse"
          type="password"
          libelle="Nouveau mot de passe"
          aide={`${LONGUEUR_MIN_MOT_DE_PASSE} caractères minimum.`}
          autoComplete="new-password"
          minLength={LONGUEUR_MIN_MOT_DE_PASSE}
          required
          disabled={envoiEnCours}
          erreur={champs?.nouveauMotDePasse}
        />

        <Champ
          nom="confirmation"
          type="password"
          libelle="Confirmation"
          autoComplete="new-password"
          required
          disabled={envoiEnCours}
          erreur={champs?.confirmation}
        />
      </div>
    </>
  );
}

function ZoneMotDePasse({ resultat, envoiEnCours }: RetourDeZone) {
  return (
    <ZoneReglage
      id="mot-de-passe"
      titre="Mot de passe"
      explication="L’ancien mot de passe est exigé, même connecté : sans lui, une session volée suffirait à verrouiller le compte de sa victime."
    >
      <Retour
        resultat={resultat}
        succes="Mot de passe changé. Vos autres appareils sont déconnectés ; vous restez connecté ici."
      />

      <Form method="post" className="grid gap-4.5">
        <input type="hidden" name="intention" value="mot-de-passe" />

        <ChampsDeMotDePasse
          champs={resultat?.champs}
          envoiEnCours={envoiEnCours}
        />

        <div>
          <Bouton type="submit" variante="primaire" chargement={envoiEnCours}>
            Changer le mot de passe
          </Bouton>
        </div>
      </Form>
    </ZoneReglage>
  );
}

function ZoneSuppression({ resultat, envoiEnCours }: RetourDeZone) {
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const envoyer = useSubmit();

  return (
    <ZoneReglage
      id="suppression"
      danger
      titre="Supprimer mon compte"
      explication={`Votre profil, votre e-mail et vos identifiants sont effacés définitivement. ${SORT_DES_AVIS} Cette action est irréversible.`}
    >
      <Retour resultat={resultat} succes="Votre compte a été supprimé." />

      <div>
        <Bouton
          variante="danger"
          disabled={envoiEnCours}
          onClick={() => {
            setModaleOuverte(true);
          }}
        >
          Supprimer mon compte…
        </Bouton>
      </div>

      {modaleOuverte && (
        <ModaleConfirmation
          destructive
          titre="Supprimer votre compte ?"
          corps={`Profil, e-mail et identifiants effacés définitivement. ${SORT_DES_AVIS} Irréversible.`}
          libelleConfirmation="Supprimer mon compte"
          motDeConfirmation={MOT_DE_CONFIRMATION}
          surAnnulation={() => {
            setModaleOuverte(false);
          }}
          surConfirmation={() => {
            void envoyer({ intention: 'suppression' }, { method: 'post' });
          }}
        />
      )}
    </ZoneReglage>
  );
}

function Adieu() {
  return (
    <div>
      <h1 className="font-titre text-3xl">Votre compte a été supprimé</h1>
      <p className="mt-4 text-base text-encre-70">
        {SORT_DES_AVIS} Vous êtes déconnecté.
      </p>
      {/* Pas de redirection : renvoyer quelqu'un ailleurs sans le lui dire, c'est
          l'empêcher de lire ce qui vient d'arriver à son compte. */}
      <Link to="/" className="mt-6 inline-block underline">
        Retour à l’accueil
      </Link>
    </div>
  );
}

function SansSession({ indisponible }: { indisponible: boolean }) {
  return (
    <div>
      <h1 className="font-titre text-3xl">Mon compte</h1>

      {indisponible ? (
        // « Pas connecté faute de mieux » n'est pas « visiteur » : proposer la
        // connexion à quelqu'un qui l'est déjà serait un mensonge.
        <Bandeau
          ton="erreur"
          className="mt-4"
          message="Le service est indisponible : votre compte n’a pas pu être chargé. Réessayez dans un instant."
        />
      ) : (
        <>
          <p className="mt-4 text-base text-encre-70">
            Cette page est celle de votre compte : elle demande une session
            ouverte.
          </p>
          <Link to="/connexion" className="mt-6 inline-block underline">
            Se connecter
          </Link>
        </>
      )}
    </div>
  );
}

const SECTIONS = [
  { ancre: 'profil', libelle: 'Profil' },
  { ancre: 'mot-de-passe', libelle: 'Mot de passe' },
  { ancre: 'suppression', libelle: 'Supprimer mon compte' },
] as const;

/**
 * Des ancres vers les trois zones, pas des pages : les trois formulaires restent
 * visibles ensemble. « Se déconnecter » vit ici — l'en-tête public n'en porte plus.
 */
function MenuCompte() {
  const { hash } = useLocation();
  const seDeconnecterEtRevalider = useDeconnexion();
  const courante = hash === '' ? '#profil' : hash;

  return (
    <nav
      aria-label="Sections du compte"
      className="mb-8 grid gap-0.5 md:sticky md:top-6 md:mb-0 md:w-60 md:shrink-0"
    >
      {SECTIONS.map(({ ancre, libelle }) => {
        const active = courante === `#${ancre}`;

        return (
          <a
            key={ancre}
            href={`#${ancre}`}
            aria-current={active ? 'location' : undefined}
            className={`flex min-h-11 items-center rounded-sm px-3.5 text-sm hover:no-underline ${
              active ? 'bg-lavande text-ardoise-fonce' : 'text-encre-70'
            }`}
          >
            {libelle}
          </a>
        );
      })}

      <span aria-hidden="true" className="my-2.5 h-px bg-trait" />

      <button
        type="button"
        onClick={seDeconnecterEtRevalider}
        className="flex min-h-11 items-center rounded-sm px-3.5 text-left text-sm text-encre-70"
      >
        Se déconnecter
      </button>
    </nav>
  );
}

type ProprietesEcran = RetourDeZone & {
  session: Utilisateur | null;
  sessionIndisponible: boolean;
};

function Contenu({
  session,
  sessionIndisponible,
  resultat,
  envoiEnCours,
}: ProprietesEcran) {
  if (resultat?.zone === 'suppression' && resultat.succes) {
    return <Adieu />;
  }

  if (session === null) {
    return <SansSession indisponible={sessionIndisponible} />;
  }

  // Chaque zone ne voit QUE son propre retour : un échec sur le mot de passe ne
  // doit rien changer à l'affichage du profil.
  const pour = (zone: ResultatCompte['zone']): ResultatCompte | null =>
    resultat?.zone === zone ? resultat : null;

  return (
    <div className="md:flex md:items-start md:gap-10">
      <MenuCompte />

      <div className="md:flex-1">
        <Salutation session={session} />
        <div className="flex flex-col gap-6">
          <ZoneProfil
            session={session}
            resultat={pour('profil')}
            envoiEnCours={envoiEnCours}
          />
          <ZoneMotDePasse
            resultat={pour('mot-de-passe')}
            envoiEnCours={envoiEnCours}
          />
          <ZoneSuppression
            resultat={pour('suppression')}
            envoiEnCours={envoiEnCours}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * La colonne est bornée : des champs qui traversent un écran de 1900 px font perdre
 * le lien entre le libellé et sa saisie. Chaque écran pose sa propre largeur, comme
 * le catalogue et le détail d'une recette.
 */
export function EcranCompte(proprietes: ProprietesEcran) {
  return (
    <div className="mx-auto w-full max-w-300">
      <Contenu {...proprietes} />
    </div>
  );
}

import type { Page, RecetteResume } from '@recipe/types';
import { useState } from 'react';
import { Link, useFetcher, useSearchParams } from 'react-router';

import { avecCritere } from '../acces-api/criteres-url';
import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { EtatVide } from '../composants/etat-vide';
import { Etoiles } from '../composants/etoiles';
import { ModaleConfirmation } from '../composants/modale-confirmation';
import { Pagination } from '../composants/pagination';
import { RechercheDebattue } from '../composants/recherche-debattue';
import { Squelette } from '../composants/squelette';
import { Tableau } from '../composants/tableau';
import { LIBELLES_DIFFICULTE, LIBELLES_TYPE } from '../libelles';

import { CREATION_RECETTE } from './raccourcis';
import type { ResultatSuppression } from './suppression-recette';

const COLONNES = [
  'Recette',
  'Type',
  'Difficulté',
  'Temps',
  'Portions',
  'Note',
  'Actions',
];
const LIGNES_SQUELETTE = 6;
const SANS_FILTRE = '';

function Filtre({
  cle,
  libelle,
  options,
}: {
  cle: string;
  libelle: string;
  /** Les valeurs de l'API, avec leur traduction — jamais `entree` à l'écran. */
  options: Record<string, string>;
}) {
  const [parametres, setParametres] = useSearchParams();

  return (
    <label className="text-xs tracking-etiquette text-encre-70 uppercase">
      {libelle}
      <select
        value={parametres.get(cle) ?? SANS_FILTRE}
        onChange={(evenement) => {
          // `avecCritere` ramène page 1 : rester page 7 après un filtre montrerait
          // un vide qui n'en est pas un.
          setParametres(
            avecCritere(parametres, cle, evenement.target.value || null),
          );
        }}
        className="ml-2 h-9 rounded-sm border border-trait-fort bg-craie px-2 text-base normal-case"
      >
        <option value={SANS_FILTRE}>Tous</option>
        {Object.entries(options).map(([valeur, texte]) => (
          <option key={valeur} value={valeur}>
            {texte}
          </option>
        ))}
      </select>
    </label>
  );
}

function BarreOutils({ total }: { total: number | null }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="min-w-60 flex-1">
        <RechercheDebattue
          libelle="Rechercher une recette à gérer"
          invite="Un titre…"
        />
      </div>

      <Filtre cle="type" libelle="Type" options={LIBELLES_TYPE} />
      <Filtre
        cle="difficulte"
        libelle="Difficulté"
        options={LIBELLES_DIFFICULTE}
      />

      {total !== null && (
        <p className="text-sm text-encre-70">
          {total} recette{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

function ActionsDeLigne({
  recette,
  fetcher,
  surSuppression,
}: {
  recette: RecetteResume;
  fetcher: ReturnType<typeof useFetcher<ResultatSuppression>>;
  surSuppression: () => void;
}) {
  if (fetcher.state !== 'idle') {
    // La ligne ne disparaît PAS avant la réponse : une ligne qui s'en va puis revient
    // est pire qu'une ligne qui attend.
    return <span className="text-sm text-encre-70">Suppression…</span>;
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        to={`/panneau/recettes/${String(recette.id)}/modifier`}
        className="text-sm underline"
      >
        Modifier
      </Link>
      {/* Même graisse et même casse que « Modifier » : les deux actions d'une ligne
          se lisent d'un coup d'œil, l'une n'attire pas l'autre. */}
      <Bouton
        variante="texte"
        taille="sm"
        className="!px-0 !text-sm !tracking-normal !normal-case"
        onClick={surSuppression}
      >
        Supprimer
      </Bouton>
    </div>
  );
}

function CellulesRecette({ recette }: { recette: RecetteResume }) {
  return (
    <>
      <td className="py-3 pr-4">{recette.titre}</td>
      <td className="py-3 pr-4 text-encre-70">
        {LIBELLES_TYPE[recette.typeRecette]}
      </td>
      <td className="py-3 pr-4 text-encre-70">
        {LIBELLES_DIFFICULTE[recette.difficulte]}
      </td>
      <td className="py-3 pr-4 text-encre-70">
        {recette.tempsPreparation + recette.tempsCuisson} min
      </td>
      <td className="py-3 pr-4 text-encre-70">{recette.portions}</td>
      <td className="py-3 pr-4">
        <Etoiles note={recette.noteMoyenne} />
      </td>
    </>
  );
}

/** Le sort des avis est dit ICI aussi : c'est la conséquence non évidente, et elle
 *  doit survivre au fait de ne lire que la modale. */
function ModaleSuppression({
  recette,
  surAnnulation,
  surConfirmation,
}: {
  recette: RecetteResume;
  surAnnulation: () => void;
  surConfirmation: () => void;
}) {
  return (
    <ModaleConfirmation
      destructive
      titre="Supprimer cette recette ?"
      corps={`« ${recette.titre} » sera retirée du catalogue, avec ses ingrédients, ses étapes et ses avis — ceux-ci n’existent pas sans elle. Cette action est irréversible.`}
      libelleConfirmation="Supprimer la recette"
      surAnnulation={surAnnulation}
      surConfirmation={surConfirmation}
    />
  );
}

function LigneRecette({ recette }: { recette: RecetteResume }) {
  const fetcher = useFetcher<ResultatSuppression>();
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const retour = fetcher.data;
  const enEchec = retour !== undefined && !retour.supprime;

  return (
    <>
      <tr
        className={`border-t border-trait ${enEchec ? 'bg-erreur-fond' : ''}`}
      >
        <CellulesRecette recette={recette} />
        <td className="py-3">
          <ActionsDeLigne
            recette={recette}
            fetcher={fetcher}
            surSuppression={() => {
              setModaleOuverte(true);
            }}
          />
        </td>
      </tr>

      {retour?.message !== undefined && (
        <tr className={enEchec ? 'bg-erreur-fond' : ''}>
          <td colSpan={COLONNES.length} className="pb-3">
            <span role="alert" className="text-sm text-erreur">
              {retour.message}
            </span>
          </td>
        </tr>
      )}

      {modaleOuverte && (
        <ModaleSuppression
          recette={recette}
          surAnnulation={() => {
            setModaleOuverte(false);
          }}
          surConfirmation={() => {
            setModaleOuverte(false);
            void fetcher.submit({ id: String(recette.id) }, { method: 'post' });
          }}
        />
      )}
    </>
  );
}

function Vide({ filtre }: { filtre: string | null }) {
  if (filtre === null) {
    return (
      <EtatVide
        glyphe="✎"
        titre="Aucune recette pour l’instant"
        explication="Le catalogue est vide. Créez la première recette : titre, ingrédients et étapes suffisent pour publier."
        action={
          <Link to={CREATION_RECETTE} className="underline">
            Créer une recette
          </Link>
        }
      />
    );
  }

  return (
    <EtatVide
      glyphe="∅"
      titre={`Aucune recette ne contient « ${filtre} »`}
      explication="La recherche porte uniquement sur le titre. Vérifiez l’orthographe, ou créez cette recette."
      action={
        <Link to="/panneau/recettes" className="underline">
          Effacer la recherche
        </Link>
      }
    />
  );
}

function CorpsDuTableau({
  resultats,
  chargement,
}: {
  resultats: Page<RecetteResume> | null;
  chargement: boolean;
}) {
  if (chargement || resultats === null) {
    return (
      <tr>
        <td colSpan={COLONNES.length} className="py-4">
          <Squelette lignes={LIGNES_SQUELETTE} hauteur={9} />
        </td>
      </tr>
    );
  }

  return (
    <>
      {resultats.donnees.map((recette) => (
        <LigneRecette key={recette.id} recette={recette} />
      ))}
    </>
  );
}

function TableauRecettes({
  resultats,
  chargement,
}: {
  resultats: Page<RecetteResume> | null;
  chargement: boolean;
}) {
  return (
    <Tableau colonnes={COLONNES}>
      <CorpsDuTableau resultats={resultats} chargement={chargement} />
    </Tableau>
  );
}

export function EcranListeRecettes({
  resultats,
  echec,
  chargement,
}: {
  resultats: Page<RecetteResume> | null;
  echec: string | null;
  chargement: boolean;
}) {
  const [parametres] = useSearchParams();
  const recherche = parametres.get('recherche');
  const vide =
    !chargement && resultats !== null && resultats.donnees.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-titre text-3xl">Recettes</h1>
        <Link
          to={CREATION_RECETTE}
          className="rounded-pilule bg-ardoise px-6 py-3 text-xs tracking-bouton text-nappe uppercase"
        >
          Nouvelle recette
        </Link>
      </div>

      <BarreOutils total={resultats?.total ?? null} />

      {echec !== null && <Bandeau ton="erreur" message={echec} />}

      {vide ? (
        <Vide filtre={recherche} />
      ) : (
        <>
          <TableauRecettes resultats={resultats} chargement={chargement} />

          {resultats !== null && (
            <Pagination
              total={resultats.total}
              page={resultats.page}
              limite={resultats.limite}
            />
          )}
        </>
      )}
    </div>
  );
}

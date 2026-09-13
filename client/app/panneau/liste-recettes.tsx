import type { Page, RecetteResume } from '@recipe/types';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { avecCritere } from '../acces-api/criteres-url';
import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { EnTetePanneau } from '../composants/en-tete-panneau';
import { EtatVide } from '../composants/etat-vide';
import { Etoiles } from '../composants/etoiles';
import { Miniature } from '../composants/miniature';
import { ModaleConfirmation } from '../composants/modale-confirmation';
import { Pagination } from '../composants/pagination';
import { RechercheDebattue } from '../composants/recherche-debattue';
import { Squelette } from '../composants/squelette';
import { Tableau } from '../composants/tableau';
import { LIBELLES_DIFFICULTE, LIBELLES_TYPE } from '../libelles';

import { LienNouvelleRecette } from './lien-nouvelle-recette';
import { CREATION_RECETTE } from './raccourcis';
import { useSupprimerRecette } from './suppression-recette';

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
const CELLULE = 'px-4 py-3.5';

function Filtre({
  cle,
  libelle,
  tous,
  options,
}: {
  cle: string;
  libelle: string;
  /** Le libellé de l'option « aucun filtre » (« Tous les types »). */
  tous: string;
  /** Les valeurs de l'API, avec leur traduction — jamais `entree` à l'écran. */
  options: Record<string, string>;
}) {
  const [parametres, setParametres] = useSearchParams();

  return (
    <label>
      {/* Le libellé s'entend ; l'option vide (« Toute difficulté ») le dit à l'œil. */}
      <span className="sr-only">{libelle}</span>
      <select
        value={parametres.get(cle) ?? SANS_FILTRE}
        onChange={(evenement) => {
          // `avecCritere` ramène page 1 : rester page 7 après un filtre montrerait
          // un vide qui n'en est pas un.
          setParametres(
            avecCritere(parametres, cle, evenement.target.value || null),
          );
        }}
        className="h-11 min-w-38 rounded-sm border border-trait-fort bg-craie px-3.5 text-sm"
      >
        <option value={SANS_FILTRE}>{tous}</option>
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
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-full sm:w-70">
        <RechercheDebattue
          libelle="Rechercher une recette à gérer"
          invite="Rechercher par titre…"
          className="rounded-sm"
        />
      </div>

      <Filtre
        cle="type"
        libelle="Type"
        tous="Tous les types"
        options={LIBELLES_TYPE}
      />
      <Filtre
        cle="difficulte"
        libelle="Difficulté"
        tous="Toute difficulté"
        options={LIBELLES_DIFFICULTE}
      />

      {total !== null && (
        <p className="ml-auto text-sm text-encre-55">
          {total} recette{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

const LIEN_FANTOME_SM =
  'inline-flex h-8 items-center rounded-pilule border border-ardoise px-4 text-xs tracking-bouton text-ardoise uppercase hover:bg-ardoise hover:text-nappe hover:no-underline';

function ActionsDeLigne({
  recette,
  enCours,
  surSuppression,
}: {
  recette: RecetteResume;
  enCours: boolean;
  surSuppression: () => void;
}) {
  if (enCours) {
    // La ligne ne disparaît PAS avant la réponse : une ligne qui s'en va puis revient
    // est pire qu'une ligne qui attend.
    return <span className="text-sm text-encre-70">Suppression…</span>;
  }

  return (
    // Libellés complets pour l'oreille : « Modifier » seul ne dit pas QUOI.
    <div className="flex items-center justify-end gap-1.5">
      <Link
        to={`/panneau/recettes/${String(recette.id)}/modifier`}
        aria-label={`Modifier ${recette.titre}`}
        className={LIEN_FANTOME_SM}
      >
        Modifier
      </Link>
      <Bouton
        variante="danger"
        taille="sm"
        aria-label={`Supprimer ${recette.titre}`}
        onClick={surSuppression}
      >
        Suppr.
      </Bouton>
    </div>
  );
}

function CellulesRecette({ recette }: { recette: RecetteResume }) {
  return (
    <>
      <td className={CELLULE}>
        <span className="flex items-center gap-2.5">
          <Miniature image={recette.image} />
          {recette.titre}
        </span>
      </td>
      <td className={`${CELLULE} text-encre-70`}>{recette.typeRecette}</td>
      <td className={`${CELLULE} text-encre-70`}>{recette.difficulte}</td>
      <td className={`${CELLULE} whitespace-nowrap text-encre-70`}>
        {recette.tempsPreparation + recette.tempsCuisson} min
      </td>
      <td className={`${CELLULE} text-encre-70`}>{recette.portions}</td>
      <td className={CELLULE}>
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
  const suppression = useSupprimerRecette(recette.id);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const retour = suppression.data;
  const enEchec = retour !== undefined && !retour.supprime;

  return (
    <>
      <tr
        className={`border-t border-trait first:border-t-0 ${
          enEchec ? 'bg-erreur-fond' : ''
        }`}
      >
        <CellulesRecette recette={recette} />
        <td className={CELLULE}>
          <ActionsDeLigne
            recette={recette}
            enCours={suppression.isPending}
            surSuppression={() => {
              setModaleOuverte(true);
            }}
          />
        </td>
      </tr>

      {retour?.message !== undefined && (
        <tr className={enEchec ? 'bg-erreur-fond' : ''}>
          <td colSpan={COLONNES.length} className="px-4 pb-3">
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
            suppression.mutate();
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
        <td colSpan={COLONNES.length} className="px-4 py-4">
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

function TableauEtPagination({
  resultats,
  chargement,
}: {
  resultats: Page<RecetteResume> | null;
  chargement: boolean;
}) {
  return (
    <>
      <Tableau colonnes={COLONNES} aDroite={['Actions']}>
        <CorpsDuTableau resultats={resultats} chargement={chargement} />
      </Tableau>

      {resultats !== null && (
        <Pagination
          total={resultats.total}
          page={resultats.page}
          limite={resultats.limite}
          elements={{ singulier: 'recette', pluriel: 'recettes' }}
        />
      )}
    </>
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
      <EnTetePanneau
        fil="Panneau · Recettes"
        titre="Recettes"
        action={<LienNouvelleRecette />}
      />

      <BarreOutils total={resultats?.total ?? null} />

      {echec !== null && <Bandeau ton="erreur" message={echec} />}

      {vide ? (
        <Vide filtre={recherche} />
      ) : (
        <TableauEtPagination resultats={resultats} chargement={chargement} />
      )}
    </div>
  );
}

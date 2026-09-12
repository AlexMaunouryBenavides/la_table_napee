import type { Categorie } from '@recipe/types';
import { useState } from 'react';
import { Link, NavLink, useFetcher } from 'react-router';

import { Bouton } from '../composants/bouton';
import { EtatVide } from '../composants/etat-vide';
import { ModaleConfirmation } from '../composants/modale-confirmation';
import { Tableau } from '../composants/tableau';

import { CIBLE_CREATION, type ResultatCategorie } from './actions-categories';
import { RESSOURCES, type Ressource } from './ressources-categories';

const COLONNES = ['Nom', 'Actions'];
const LONGUEUR_MIN_NOM = 2;

type Fetcher = ReturnType<typeof useFetcher<ResultatCategorie>>;

function Onglets({ compteurs }: { compteurs: Record<string, number> }) {
  return (
    <nav aria-label="Ressources de catégories">
      <ul className="flex flex-wrap gap-2">
        {RESSOURCES.map((ressource) => (
          <li key={ressource.cle}>
            <NavLink
              to={`/panneau/categories/${ressource.cle}`}
              className={({ isActive }) =>
                `inline-flex min-h-11 items-center rounded-pilule px-4 text-base ${
                  isActive ? 'bg-ardoise text-nappe' : 'border border-trait'
                }`
              }
            >
              {ressource.libelle}
              {/* Le compteur arrive avec les données : jamais un 0 par défaut, qui
                  se lirait « cette ressource est vide ». */}
              {compteurs[ressource.cle] !== undefined &&
                ` · ${String(compteurs[ressource.cle])}`}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Retour({ retour }: { retour: ResultatCategorie }) {
  if (retour.succes || retour.message === undefined) {
    return null;
  }

  return (
    <span role="alert" className="text-sm text-erreur">
      {retour.message}
      {retour.versRecettes !== undefined && (
        <>
          {' '}
          <Link to={retour.versRecettes} className="underline">
            Voir les recettes concernées
          </Link>
        </>
      )}
    </span>
  );
}

/**
 * Le champ s'appelle TOUJOURS `nom` dans la requête — c'est ce que l'action lit —
 * mais son `id` doit rester unique sur la page, une ligne par catégorie. Les deux ne
 * peuvent donc pas être la même valeur, ce que `Champ` suppose.
 */
function ChampNom({
  identifiant,
  valeur,
  erreur,
}: {
  identifiant: string;
  valeur: string;
  erreur?: string;
}) {
  return (
    <div className="min-w-60 flex-1">
      <label
        htmlFor={identifiant}
        className="block text-xs tracking-etiquette text-encre-70 uppercase"
      >
        Nom
      </label>
      <input
        id={identifiant}
        name="nom"
        required
        minLength={LONGUEUR_MIN_NOM}
        defaultValue={valeur}
        aria-invalid={erreur === undefined ? undefined : true}
        className="mt-1 h-11 w-full rounded-sm border border-trait-fort bg-craie px-3"
      />
      {erreur !== undefined && (
        <p className="mt-1 text-sm text-erreur">{erreur}</p>
      )}
    </div>
  );
}

function FormulaireDeNom({
  ressource,
  valeur,
  fetcher,
  intention,
  id,
  libelleEnvoi,
  surAnnulation,
}: {
  ressource: Ressource;
  valeur: string;
  fetcher: Fetcher;
  intention: 'creation' | 'renommage';
  id?: number;
  libelleEnvoi: string;
  surAnnulation?: () => void;
}) {
  const identifiant = `nom-${intention}-${String(id ?? 0)}`;

  return (
    <fetcher.Form method="post" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="intention" value={intention} />
      <input type="hidden" name="ressource" value={ressource.cle} />
      {id !== undefined && <input type="hidden" name="id" value={id} />}

      <ChampNom
        identifiant={identifiant}
        valeur={fetcher.data?.saisie ?? valeur}
        erreur={fetcher.data?.champNom}
      />

      <Bouton
        type="submit"
        variante="primaire"
        taille="sm"
        chargement={fetcher.state !== 'idle'}
      >
        {libelleEnvoi}
      </Bouton>

      {surAnnulation !== undefined && (
        <Bouton variante="fantome" taille="sm" onClick={surAnnulation}>
          Annuler
        </Bouton>
      )}
    </fetcher.Form>
  );
}

function ActionsDeLigne({
  surRenommage,
  surSuppression,
}: {
  surRenommage: () => void;
  surSuppression: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Bouton
        variante="texte"
        taille="sm"
        className="!px-0 !text-sm !tracking-normal !normal-case"
        onClick={surRenommage}
      >
        Renommer
      </Bouton>
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

/** Renommer reste possible quand supprimer ne l'est pas : c'est ce que la modale dit
 *  avant d'agir, plutôt que de le laisser découvrir dans un refus. */
function ModaleSuppression({
  categorie,
  ressource,
  surAnnulation,
  surConfirmation,
}: {
  categorie: Categorie;
  ressource: Ressource;
  surAnnulation: () => void;
  surConfirmation: () => void;
}) {
  return (
    <ModaleConfirmation
      destructive
      titre={`Supprimer « ${categorie.nom} » ?`}
      corps="Cette valeur disparaîtra des filtres du catalogue et de l’éditeur de recette. Une catégorie encore portée par une recette ne peut pas être supprimée — elle peut toujours être renommée."
      libelleConfirmation={`Supprimer ${ressource.leSingulier}`}
      surAnnulation={surAnnulation}
      surConfirmation={surConfirmation}
    />
  );
}

/** Renommer se fait EN PLACE : seule cette ligne passe en édition, les autres restent
 *  lisibles et agissables. */
function CellulesCategorie({
  categorie,
  ressource,
  fetcher,
  enEdition,
  surEdition,
  surSuppression,
}: {
  categorie: Categorie;
  ressource: Ressource;
  fetcher: Fetcher;
  enEdition: boolean;
  surEdition: (enEdition: boolean) => void;
  surSuppression: () => void;
}) {
  return (
    <tr className="border-t border-trait">
      <td className="py-3 pr-4">
        {enEdition ? (
          <FormulaireDeNom
            ressource={ressource}
            valeur={categorie.nom}
            fetcher={fetcher}
            intention="renommage"
            id={categorie.id}
            libelleEnvoi="Enregistrer"
            surAnnulation={() => {
              surEdition(false);
            }}
          />
        ) : (
          categorie.nom
        )}
      </td>
      <td className="py-3">
        {!enEdition && (
          <ActionsDeLigne
            surRenommage={() => {
              surEdition(true);
            }}
            surSuppression={surSuppression}
          />
        )}
      </td>
    </tr>
  );
}

const suppressionDe = (
  categorie: Categorie,
  ressource: Ressource,
): Record<string, string> => ({
  intention: 'suppression',
  ressource: ressource.cle,
  id: String(categorie.id),
});

function LigneCategorie({
  categorie,
  ressource,
}: {
  categorie: Categorie;
  ressource: Ressource;
}) {
  const fetcher = useFetcher<ResultatCategorie>();
  const [enEdition, setEnEdition] = useState(false);
  const [modaleOuverte, setModaleOuverte] = useState(false);

  return (
    <>
      <CellulesCategorie
        categorie={categorie}
        ressource={ressource}
        fetcher={fetcher}
        enEdition={enEdition}
        surEdition={setEnEdition}
        surSuppression={() => {
          setModaleOuverte(true);
        }}
      />

      {fetcher.data !== undefined && (
        <tr>
          <td colSpan={COLONNES.length} className="pb-3">
            <Retour retour={fetcher.data} />
          </td>
        </tr>
      )}

      {modaleOuverte && (
        <ModaleSuppression
          categorie={categorie}
          ressource={ressource}
          surAnnulation={() => {
            setModaleOuverte(false);
          }}
          surConfirmation={() => {
            setModaleOuverte(false);
            void fetcher.submit(suppressionDe(categorie, ressource), {
              method: 'post',
            });
          }}
        />
      )}
    </>
  );
}

function Ajout({ ressource }: { ressource: Ressource }) {
  const fetcher = useFetcher<ResultatCategorie>();

  return (
    <section className="rounded-md border border-trait bg-craie p-6">
      <h2 className="font-titre text-2xl">Ajouter {ressource.unSingulier}</h2>
      <p className="mt-2 text-base text-encre-70">
        Le nom apparaît tel quel dans les filtres du catalogue.
      </p>

      <div className="mt-4">
        <FormulaireDeNom
          ressource={ressource}
          valeur=""
          fetcher={fetcher}
          intention="creation"
          libelleEnvoi="Ajouter"
        />
      </div>

      {fetcher.data !== undefined && fetcher.data.cible === CIBLE_CREATION && (
        <div className="mt-2">
          <Retour retour={fetcher.data} />
        </div>
      )}
    </section>
  );
}

export function EcranCategories({
  ressource,
  valeurs,
  compteurs,
}: {
  ressource: Ressource;
  valeurs: Categorie[];
  compteurs: Record<string, number>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-titre text-3xl">Catégories</h1>

      <Onglets compteurs={compteurs} />

      {valeurs.length === 0 ? (
        <EtatVide
          glyphe="✎"
          titre={ressource.aucun}
          explication="Ajoutez la première valeur : elle apparaîtra aussitôt dans les filtres du catalogue et dans l’éditeur de recette."
        />
      ) : (
        <Tableau colonnes={COLONNES}>
          {valeurs.map((categorie) => (
            <LigneCategorie
              // Le NOM fait partie de la clé : après un renommage réussi la ligne
              // remonte, donc repasse en lecture. Sur un refus le nom n'a pas bougé,
              // la ligne reste en édition avec son message — ce qu'on veut.
              key={`${String(categorie.id)}-${categorie.nom}`}
              categorie={categorie}
              ressource={ressource}
            />
          ))}
        </Tableau>
      )}

      {/* Remonté quand la liste a effectivement gagné (ou perdu) une valeur : le
          champ se vide après une création réussie, mais garde sa saisie refusée
          quand rien n'a changé — un 409 sur un nom déjà pris, par exemple. */}
      <Ajout key={valeurs.length} ressource={ressource} />
    </div>
  );
}

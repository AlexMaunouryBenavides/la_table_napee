import type { Page, RecetteResume, RoleUtilisateur } from '@recipe/types';
import { Link, useRevalidator } from 'react-router';

import { Bouton } from '../composants/bouton';
import { EtatVide } from '../composants/etat-vide';
import { Etoiles } from '../composants/etoiles';

import type { TableauDeBord } from './chargement-tableau-de-bord';
import { CREATION_RECETTE, raccourcisPour } from './raccourcis';

const CATEGORIES = '/panneau/categories/regimes';
const FORMAT_NOMBRE = new Intl.NumberFormat('fr-FR');

function Reessayer() {
  const { revalidate } = useRevalidator();

  return (
    <Bouton
      variante="texte"
      taille="sm"
      className="!px-0"
      onClick={() => {
        void revalidate();
      }}
    >
      Réessayer
    </Bouton>
  );
}

/** Un tiret, pas un zéro : « inconnu » et « aucun » ne se ressemblent pas. */
function TuileStat({
  libelle,
  valeur,
}: {
  libelle: string;
  valeur: number | 'echec';
}) {
  const enEchec = valeur === 'echec';

  return (
    <div
      role="group"
      aria-label={libelle}
      className="rounded-md border border-trait bg-craie p-5"
    >
      <p className="font-titre text-4xl">
        {enEchec ? '—' : FORMAT_NOMBRE.format(valeur)}
      </p>
      <p className="mt-1 text-xs tracking-etiquette text-encre-70 uppercase">
        {libelle}
      </p>
      {enEchec && <Reessayer />}
    </div>
  );
}

function Compteurs({ donnees }: { donnees: TableauDeBord }) {
  const recettes = donnees.recettes;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <TuileStat
        libelle="Recettes publiées"
        valeur={recettes === 'echec' ? 'echec' : recettes.total}
      />
      {/* Pas de tuile du tout pour un modérateur : afficher un échec laisserait
          croire à une panne, alors que c'est un droit qui manque. */}
      {donnees.comptes !== 'non-demande' && (
        <TuileStat libelle="Comptes" valeur={donnees.comptes} />
      )}
    </div>
  );
}

function Raccourcis({ role }: { role: RoleUtilisateur }) {
  return (
    <nav aria-label="Raccourcis">
      <h2 className="font-titre text-2xl">Raccourcis</h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {raccourcisPour(role).map((entree) => (
          <li key={entree.vers}>
            <Link
              to={entree.vers}
              className="flex min-h-11 items-center justify-between rounded-md border border-trait bg-craie px-4"
            >
              {entree.libelle}
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function LigneRecette({ recette }: { recette: RecetteResume }) {
  return (
    <tr className="border-t border-trait">
      <td className="py-3 pr-4">
        {/* Depuis le panneau, un titre mène à SA modification, pas à la page
            publique : on est venu là pour gérer. */}
        <Link to={`/panneau/recettes/${String(recette.id)}/modifier`}>
          {recette.titre}
        </Link>
      </td>
      <td className="py-3 pr-4 text-encre-70">{recette.typeRecette}</td>
      <td className="py-3">
        <Etoiles note={recette.noteMoyenne} />
      </td>
    </tr>
  );
}

/** Une base neuve n'est pas un filtre trop étroit : l'état vide dit par où commencer,
 *  et les catégories viennent AVANT la première recette (une recette les exige). */
function CatalogueNeuf() {
  return (
    <EtatVide
      glyphe="✎"
      titre="Le catalogue est vide"
      explication="Aucune recette n’a encore été créée. Posez d’abord les catégories — régimes, critères santé, types d’aliment, nationalités — puis créez votre première recette."
      action={
        <div className="flex flex-wrap justify-center gap-4">
          <Link to={CATEGORIES} className="underline">
            Commencer par les catégories
          </Link>
          <Link to={CREATION_RECETTE} className="underline">
            Créer une recette
          </Link>
        </div>
      }
    />
  );
}

function DernieresRecettes({ page }: { page: Page<RecetteResume> }) {
  if (page.donnees.length === 0) {
    return <CatalogueNeuf />;
  }

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="font-titre text-2xl">Dernières recettes</h2>
        <Link to="/panneau/recettes" className="text-sm underline">
          Tout gérer
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead className="text-xs tracking-etiquette text-encre-70 uppercase">
            <tr>
              <th scope="col" className="pb-2 pr-4">
                Recette
              </th>
              <th scope="col" className="pb-2 pr-4">
                Type
              </th>
              <th scope="col" className="pb-2">
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {page.donnees.map((recette) => (
              <LigneRecette key={recette.id} recette={recette} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function EcranTableauDeBord({
  donnees,
  role,
}: {
  donnees: TableauDeBord;
  role: RoleUtilisateur;
}) {
  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-titre text-3xl">Tableau de bord</h1>

      <Compteurs donnees={donnees} />

      {donnees.recettes === 'echec' ? (
        <p className="text-base text-encre-70">
          Les dernières recettes n’ont pas pu être chargées. La navigation reste
          utilisable. <Reessayer />
        </p>
      ) : (
        <DernieresRecettes page={donnees.recettes} />
      )}

      <Raccourcis role={role} />
    </div>
  );
}

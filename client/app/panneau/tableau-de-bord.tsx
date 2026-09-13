import type { Page, RecetteResume, RoleUtilisateur } from '@recipe/types';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { EnTetePanneau } from '../composants/en-tete-panneau';
import { EtatVide } from '../composants/etat-vide';
import { Etoiles } from '../composants/etoiles';
import { Miniature } from '../composants/miniature';
import { Tableau } from '../composants/tableau';

import type { TableauDeBord } from './chargement-tableau-de-bord';
import { LienNouvelleRecette } from './lien-nouvelle-recette';
import { CREATION_RECETTE, raccourcisPour } from './raccourcis';

const CATEGORIES = '/panneau/categories/regimes';
const FORMAT_NOMBRE = new Intl.NumberFormat('fr-FR');

function Reessayer({ surReessai }: { surReessai: () => void }) {
  return (
    <Bouton variante="texte" taille="sm" className="!px-0" onClick={surReessai}>
      Réessayer
    </Bouton>
  );
}

/** Un tiret, pas un zéro : « inconnu » et « aucun » ne se ressemblent pas. */
function TuileStat({
  libelle,
  valeur,
  surReessai,
}: {
  libelle: string;
  valeur: number | 'echec';
  surReessai: () => void;
}) {
  const enEchec = valeur === 'echec';

  return (
    <div
      role="group"
      aria-label={libelle}
      className="grid gap-1.5 rounded-md border border-trait bg-craie px-5 py-4.5"
    >
      <p className="font-titre text-3xl leading-none font-medium">
        {enEchec ? '—' : FORMAT_NOMBRE.format(valeur)}
      </p>
      <p className="text-xs tracking-section text-encre-55 uppercase">
        {libelle}
      </p>
      {enEchec && (
        <div>
          <Reessayer surReessai={surReessai} />
        </div>
      )}
    </div>
  );
}

function Compteurs({
  donnees,
  surReessai,
}: {
  donnees: TableauDeBord;
  surReessai: () => void;
}) {
  const recettes = donnees.recettes;

  return (
    <div className="grid grid-cols-2 gap-4.5 md:grid-cols-4">
      <TuileStat
        libelle="Recettes publiées"
        valeur={recettes === 'echec' ? 'echec' : recettes.total}
        surReessai={surReessai}
      />
      {/* Pas de tuile du tout pour un modérateur : afficher un échec laisserait
          croire à une panne, alors que c'est un droit qui manque. */}
      {donnees.comptes !== 'non-demande' && (
        <TuileStat
          libelle="Comptes"
          valeur={donnees.comptes}
          surReessai={surReessai}
        />
      )}
    </div>
  );
}

function Bloc({
  titre,
  lien,
  children,
}: {
  titre: string;
  lien?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-trait bg-craie">
      <header className="flex items-baseline justify-between gap-4 border-b border-trait px-5 py-4">
        <h2 className="text-2xl">{titre}</h2>
        {lien}
      </header>
      {children}
    </section>
  );
}

function Raccourcis({ role }: { role: RoleUtilisateur }) {
  return (
    <nav aria-label="Raccourcis">
      <Bloc titre="Raccourcis">
        <ul className="grid gap-2.5 p-5">
          {raccourcisPour(role).map((entree) => (
            <li key={entree.vers}>
              <Link
                to={entree.vers}
                className="flex min-h-11 items-center gap-3 rounded-sm border border-trait bg-nappe px-3.5 text-sm text-encre hover:border-ardoise hover:text-encre hover:no-underline"
              >
                {entree.libelle}
                <span aria-hidden="true" className="ml-auto text-ardoise">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="px-5 pb-5">
          <Bandeau
            ton="info"
            message={
              role === 'admin'
                ? 'Vous êtes administrateur : vous voyez tous les raccourcis. Un modérateur ne voit que la gestion des recettes.'
                : 'Les comptes et les catégories relèvent des administrateurs : ni leur compteur ni leurs raccourcis ne s’affichent ici.'
            }
          />
        </div>
      </Bloc>
    </nav>
  );
}

function LigneRecette({ recette }: { recette: RecetteResume }) {
  return (
    <tr className="border-t border-trait first:border-t-0">
      <td className="px-4 py-3.5">
        <span className="flex items-center gap-2.5">
          <Miniature image={recette.image} />
          {/* Depuis le panneau, un titre mène à SA modification, pas à la page
              publique : on est venu là pour gérer. */}
          <Link
            to={`/panneau/recettes/${String(recette.id)}/modifier`}
            className="text-encre"
          >
            {recette.titre}
          </Link>
        </span>
      </td>
      <td className="px-4 py-3.5 text-encre-70">{recette.typeRecette}</td>
      <td className="px-4 py-3.5">
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
    <Bloc
      titre="Dernières recettes"
      lien={
        <Link
          to="/panneau/recettes"
          className="text-xs tracking-section uppercase"
        >
          Tout gérer →
        </Link>
      }
    >
      <Tableau colonnes={['Recette', 'Type', 'Note']} encadre={false}>
        {page.donnees.map((recette) => (
          <LigneRecette key={recette.id} recette={recette} />
        ))}
      </Tableau>
    </Bloc>
  );
}

export function EcranTableauDeBord({
  donnees,
  role,
  surReessai,
}: {
  donnees: TableauDeBord;
  role: RoleUtilisateur;
  surReessai: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <EnTetePanneau
        fil="Panneau"
        titre="Tableau de bord"
        action={<LienNouvelleRecette />}
      />

      <Compteurs donnees={donnees} surReessai={surReessai} />

      <div className="grid items-start gap-6 md:grid-cols-5">
        <div className="md:col-span-3">
          {donnees.recettes === 'echec' ? (
            <p className="text-base text-encre-70">
              Les dernières recettes n’ont pas pu être chargées. La navigation
              reste utilisable. <Reessayer surReessai={surReessai} />
            </p>
          ) : (
            <DernieresRecettes page={donnees.recettes} />
          )}
        </div>

        <div className="md:col-span-2">
          <Raccourcis role={role} />
        </div>
      </div>
    </div>
  );
}

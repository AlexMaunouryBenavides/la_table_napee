import { type RecetteResume, TYPES_RECETTE } from '@recipe/types';
import { Fragment } from 'react';
import { Link } from 'react-router';

import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { CarteRecette } from '../composants/carte-recette';
import { EtatVide } from '../composants/etat-vide';

const FORMAT_NOMBRE = new Intl.NumberFormat('fr-FR');

const LIEN_PRIMAIRE =
  'inline-flex h-11 items-center rounded-pilule bg-ardoise px-6 text-xs tracking-bouton text-nappe uppercase hover:bg-ardoise-fonce hover:text-nappe hover:no-underline';

function Assiette({ image }: { image: string | undefined }) {
  return (
    // Décorative : la vraie information est dans les cartes, juste en dessous.
    <div
      aria-hidden="true"
      className="relative size-60 justify-self-center overflow-hidden rounded-full bg-lavande shadow-4 md:size-90"
    >
      {image !== undefined && image !== '' && (
        <img src={image} alt="" className="size-full object-cover" />
      )}
    </div>
  );
}

function Promesse({
  total,
  image,
}: {
  total: number | null;
  image: string | undefined;
}) {
  return (
    <header className="grid items-center gap-12 md:grid-cols-2">
      <div className="flex flex-col items-start">
        <p className="text-xs font-medium tracking-bouton text-ardoise uppercase">
          Cuisine de saison
        </p>

        <h1 className="mt-4 text-4xl leading-none md:text-5xl">
          Des recettes qui{' '}
          <em className="font-light text-ardoise">tiennent la table</em>
        </h1>

        {/* Le compteur vient de l'API : sans réponse, on se tait plutôt que d'inventer
            un nombre qui serait faux le lendemain. */}
        {total !== null && total > 0 && (
          <p className="mt-5 max-w-100 text-base leading-relaxed text-encre-55">
            {FORMAT_NOMBRE.format(total)} recettes rédigées avec des quantités
            justes, des étapes numérotées et rien de superflu. Entrées, plats,
            desserts, glaces, boissons et sauces.
          </p>
        )}

        <Link to="/recettes" className={`mt-7 ${LIEN_PRIMAIRE}`}>
          Parcourir le catalogue
        </Link>
      </div>

      <Assiette image={image} />
    </header>
  );
}

function Familles() {
  return (
    // Pleine largeur : la bande sort de la marge du `main` et rejoint le pied de page.
    <section className="-mx-5 -mb-10 flex flex-wrap items-center justify-between gap-8 bg-lavande px-5 py-11 md:-mx-10 md:px-10">
      <div>
        <h2 className="text-3xl leading-tight">Six familles de recettes</h2>
        {/* Un `div`, pas un `p` : un paragraphe ne peut pas contenir de `nav`. */}
        <div className="mt-2 max-w-130 text-sm leading-relaxed text-ardoise-fonce">
          <nav aria-label="Familles de recettes" className="inline">
            {TYPES_RECETTE.map((type, index) => (
              <Fragment key={type}>
                {index > 0 && ' · '}
                <Link
                  to={`/recettes?type=${type}`}
                  className="text-ardoise-fonce"
                >
                  {type}
                </Link>
              </Fragment>
            ))}
          </nav>{' '}
          — filtrables par régime, critère santé, type d’aliment, nationalité et
          temps total.
        </div>
      </div>

      <Link to="/recettes" className={LIEN_PRIMAIRE}>
        Explorer
      </Link>
    </section>
  );
}

function EchecDeListe({
  message,
  surReessai,
}: {
  message: string;
  surReessai: () => void;
}) {
  return (
    <div>
      <Bandeau
        ton="erreur"
        message={message}
        details={['Le catalogue et la recherche restent accessibles.']}
      />
      <div className="mt-4">
        <Bouton variante="fantome" onClick={surReessai}>
          Réessayer
        </Bouton>
      </div>
    </div>
  );
}

function DernieresRecettes({ recettes }: { recettes: RecetteResume[] }) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5 border-b border-trait pb-4">
        {/* « Les dernières publiées », et pas « les mieux notées » : l'API ne sait
            pas trier par note. On ne promet pas un classement qu'on ne calcule pas. */}
        <h2 className="text-3xl leading-none">Les dernières publiées</h2>
        <Link to="/recettes" className="text-xs tracking-bouton uppercase">
          Tout le catalogue →
        </Link>
      </div>

      <ul className="grid gap-6 md:grid-cols-3">
        {recettes.map((recette) => (
          <CarteRecette key={recette.id} recette={recette} />
        ))}
      </ul>
    </section>
  );
}

function Contenu({
  recettes,
  echec,
  surReessai,
}: {
  recettes: RecetteResume[];
  echec: string | null;
  surReessai: () => void;
}) {
  if (echec !== null) {
    return <EchecDeListe message={echec} surReessai={surReessai} />;
  }

  if (recettes.length === 0) {
    return (
      <EtatVide
        glyphe="∅"
        titre="Le catalogue ouvre bientôt"
        explication="Aucune recette n’est encore publiée. La vitrine reste en place : dès la première publication, les dernières s’affichent ici."
        action={
          <Link to="/recettes" className="underline">
            Parcourir le catalogue
          </Link>
        }
      />
    );
  }

  return <DernieresRecettes recettes={recettes} />;
}

/**
 * La vitrine : une promesse, trois recettes, une seule sortie — le catalogue. Rien à
 * filtrer ici, la densité est l'affaire de l'écran de catalogue.
 *
 * Les données ne portent que la partie centrale : promesse et familles restent
 * lisibles quand l'API ne répond pas.
 */
export function Vitrine({
  recettes,
  total,
  echec,
  surReessai,
}: {
  recettes: RecetteResume[];
  total: number | null;
  echec: string | null;
  surReessai: () => void;
}) {
  return (
    <>
      <div className="mx-auto flex max-w-300 flex-col gap-14 pb-14">
        <Promesse total={total} image={recettes[0]?.image} />
        <Contenu recettes={recettes} echec={echec} surReessai={surReessai} />
      </div>
      <Familles />
    </>
  );
}

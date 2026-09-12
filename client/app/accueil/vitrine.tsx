import { type RecetteResume, TYPES_RECETTE } from '@recipe/types';
import { Link, useRevalidator } from 'react-router';

import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { CarteRecette } from '../composants/carte-recette';
import { EtatVide } from '../composants/etat-vide';
import { LIBELLES_TYPE } from '../libelles';

const FORMAT_NOMBRE = new Intl.NumberFormat('fr-FR');

function Promesse({ total }: { total: number | null }) {
  return (
    <header className="flex flex-col items-start gap-6">
      <p className="text-xs tracking-etiquette text-encre-55 uppercase">
        Cuisine de saison
      </p>

      <h1 className="font-titre text-5xl md:text-6xl">
        Des recettes qui <em className="text-ardoise">tiennent la table</em>.
      </h1>

      {/* Le compteur vient de l'API : sans réponse, on se tait plutôt que d'inventer
          un nombre qui serait faux le lendemain. */}
      {total !== null && total > 0 && (
        <p className="max-w-160 text-lg text-encre-70">
          {FORMAT_NOMBRE.format(total)} recettes rédigées avec des quantités
          justes, des étapes numérotées et rien de superflu.
        </p>
      )}

      <Link
        to="/recettes"
        className="rounded-pilule bg-ardoise px-8 py-4 text-xs tracking-bouton text-nappe uppercase"
      >
        Parcourir le catalogue
      </Link>
    </header>
  );
}

function Familles() {
  return (
    <section>
      <h2 className="font-titre text-2xl">Six familles de recettes</h2>
      <p className="mt-2 text-base text-encre-70">
        Filtrables par régime, critère santé, type d’aliment, nationalité et
        temps total.
      </p>

      <nav aria-label="Familles de recettes" className="mt-4">
        <ul className="flex flex-wrap gap-3">
          {TYPES_RECETTE.map((type) => (
            <li key={type}>
              <Link
                to={`/recettes?type=${type}`}
                className="inline-flex min-h-11 items-center rounded-pilule border border-trait-fort px-5 text-base"
              >
                {LIBELLES_TYPE[type]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

function EchecDeListe({ message }: { message: string }) {
  const { revalidate } = useRevalidator();

  return (
    <div>
      <Bandeau
        ton="erreur"
        message={message}
        details={['Le catalogue et la recherche restent accessibles.']}
      />
      <div className="mt-4">
        <Bouton
          variante="fantome"
          onClick={() => {
            void revalidate();
          }}
        >
          Réessayer
        </Bouton>
      </div>
    </div>
  );
}

function DernieresRecettes({ recettes }: { recettes: RecetteResume[] }) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        {/* « Les dernières publiées », et pas « les mieux notées » : l'API ne sait
            pas trier par note. On ne promet pas un classement qu'on ne calcule pas. */}
        <h2 className="font-titre text-3xl">Les dernières publiées</h2>
        <Link to="/recettes" className="underline">
          Tout le catalogue
        </Link>
      </div>

      <ul className="mt-6 grid gap-6 md:grid-cols-3">
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
}: {
  recettes: RecetteResume[];
  echec: string | null;
}) {
  if (echec !== null) {
    return <EchecDeListe message={echec} />;
  }

  if (recettes.length === 0) {
    return (
      <EtatVide
        glyphe="✦"
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
}: {
  recettes: RecetteResume[];
  total: number | null;
  echec: string | null;
}) {
  return (
    <div className="mx-auto flex max-w-250 flex-col gap-16">
      <Promesse total={total} />
      <Contenu recettes={recettes} echec={echec} />
      <Familles />
    </div>
  );
}

import type { Avis, Utilisateur } from '@recipe/types';
import { useState } from 'react';
import { Form, Link, useNavigation } from 'react-router';

import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { Etoiles } from '../composants/etoiles';

import type { EchecAvis } from './action-avis';
import { AvisPublie } from './avis-publie';
import { peutModifier, peutSupprimer } from './droits-avis';

const NOTE_PAR_DEFAUT = 5;

type ProprietesFormulaire = {
  monAvis: Avis | undefined;
  echec: EchecAvis | null;
};

function ChampsDAvis({
  note,
  commentaire,
  surNote,
  surCommentaire,
}: {
  note: number;
  commentaire: string;
  surNote: (note: number) => void;
  surCommentaire: (commentaire: string) => void;
}) {
  return (
    <>
      <div className="text-2xl">
        <Etoiles note={note} saisie nom="note" surChangement={surNote} />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="commentaire"
          className="text-xs font-medium tracking-bouton text-encre-70 uppercase"
        >
          Commentaire{' '}
          <span className="tracking-normal text-encre-55 normal-case">
            (optionnel)
          </span>
        </label>
        <textarea
          id="commentaire"
          name="commentaire"
          rows={3}
          value={commentaire}
          onChange={(evenement) => {
            surCommentaire(evenement.target.value);
          }}
          placeholder="Ce que vous avez changé, ce qui a marché…"
          className="w-full rounded-sm border border-trait-fort bg-craie p-3.5 text-sm"
        />
      </div>
    </>
  );
}

function FormulaireAvis({ monAvis, echec }: ProprietesFormulaire) {
  const modification = monAvis !== undefined;
  const [note, setNote] = useState(monAvis?.note ?? NOTE_PAR_DEFAUT);
  const [commentaire, setCommentaire] = useState(monAvis?.commentaire ?? '');
  const navigation = useNavigation();
  const envoiEnCours = navigation.state === 'submitting';

  return (
    <Form
      method="post"
      className="grid gap-3.5 rounded-md bg-lavande px-6 py-5.5"
    >
      <input
        type="hidden"
        name="intention"
        value={modification ? 'modifier' : 'deposer'}
      />
      {modification && <input type="hidden" name="avisId" value={monAvis.id} />}
      <h3 className="text-2xl">Votre avis</h3>

      <ChampsDAvis
        note={note}
        commentaire={commentaire}
        surNote={setNote}
        surCommentaire={setCommentaire}
      />

      {echec !== null && (
        <Bandeau ton="erreur" message={echec.message} details={echec.details} />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Bouton variante="primaire" type="submit" chargement={envoiEnCours}>
          {/* Le libellé dit ce qui va se passer : redéposer un avis déjà donné
              vaudrait un 409. */}
          {modification ? 'Modifier mon avis' : 'Publier mon avis'}
        </Bouton>
        {!modification && (
          <p className="text-sm text-ardoise-fonce">
            Un seul avis par recette — vous pourrez le modifier ensuite.
          </p>
        )}
      </div>
    </Form>
  );
}

function ActionsSurAvis({
  avis,
  session,
  surModification,
}: {
  avis: Avis;
  session: Utilisateur | null;
  surModification: () => void;
}) {
  // On ne montre que ce que l'API acceptera : un bouton qui déclenche un 403 est un
  // mensonge de l'interface.
  return (
    <>
      {peutModifier(avis, session) && (
        <Bouton variante="texte" taille="sm" onClick={surModification}>
          Modifier
        </Bouton>
      )}
      {peutSupprimer(avis, session) && (
        <Form method="post">
          <input type="hidden" name="intention" value="supprimer" />
          <input type="hidden" name="avisId" value={avis.id} />
          <Bouton variante="texte" taille="sm" type="submit">
            Supprimer
          </Bouton>
        </Form>
      )}
    </>
  );
}

function ListeDesAvis({
  avis,
  session,
  surModification,
}: {
  avis: Avis[];
  session: Utilisateur | null;
  surModification: () => void;
}) {
  if (avis.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      {avis.map((publie) => (
        <AvisPublie
          key={publie.id}
          avis={publie}
          session={session}
          actions={
            <ActionsSurAvis
              avis={publie}
              session={session}
              surModification={surModification}
            />
          }
        />
      ))}
    </div>
  );
}

type ProprietesZone = {
  recetteId: number;
  avis: Avis[];
  session: Utilisateur | null;
  echec?: EchecAvis | null;
};

export function ZoneAvis({
  recetteId,
  avis,
  session,
  echec = null,
}: ProprietesZone) {
  const monAvis =
    session === null
      ? undefined
      : avis.find((publie) => publie.utilisateur?.id === session.id);

  // « Modifier » n'ouvre pas un second formulaire : il ramène à celui du haut, déjà
  // prérempli avec l'avis existant.
  function remonterAuFormulaire() {
    document.getElementById('commentaire')?.focus();
  }

  return (
    <section aria-labelledby={`avis-${String(recetteId)}`} className="mt-12">
      <h2
        id={`avis-${String(recetteId)}`}
        className="mb-4 border-b border-trait pb-3 text-3xl"
      >
        Avis <span className="text-sm text-encre-55">· {avis.length}</span>
      </h2>

      <div>
        {session === null ? (
          <p className="rounded-md bg-lavande px-6 py-5.5 text-base">
            <Link to="/connexion" className="underline">
              Connectez-vous
            </Link>{' '}
            pour donner votre avis.
          </p>
        ) : (
          <FormulaireAvis monAvis={monAvis} echec={echec} />
        )}
      </div>

      <ListeDesAvis
        avis={avis}
        session={session}
        surModification={remonterAuFormulaire}
      />
    </section>
  );
}

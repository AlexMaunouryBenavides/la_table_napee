import {
  type Page,
  ROLES_UTILISATEUR,
  type RoleUtilisateur,
  type Utilisateur,
} from '@recipe/types';
import { useState } from 'react';
import { useFetcher } from 'react-router';

import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { EtatVide } from '../composants/etat-vide';
import { ModaleConfirmation } from '../composants/modale-confirmation';
import { Pagination } from '../composants/pagination';
import { Tableau } from '../composants/tableau';

import type { ResultatAdministration } from './administration-utilisateurs';

const COLONNES = ['Compte', 'E-mail', 'Rôle', 'Inscription', 'Actions'];
const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const MOT_DE_CONFIRMATION = 'SUPPRIMER';

const LIBELLES_ROLE: Record<RoleUtilisateur, string> = {
  admin: 'Administrateur',
  moderateur: 'Modérateur',
  utilisateur: 'Utilisateur',
};

/** Un compte sans pseudo se nomme quand même : « null » n'est pas un nom, et l'e-mail
 *  a déjà sa colonne. */
const nomDe = (compte: Utilisateur): string => compte.pseudo ?? 'Sans pseudo';

type Fetcher = ReturnType<typeof useFetcher<ResultatAdministration>>;

function SelecteurRole({
  compte,
  estMoi,
  fetcher,
}: {
  compte: Utilisateur;
  estMoi: boolean;
  fetcher: Fetcher;
}) {
  const enCours = fetcher.state !== 'idle';
  const refus =
    fetcher.data?.succes === false ? fetcher.data.roleRetabli : undefined;

  return (
    <label>
      <span className="sr-only">Rôle de {nomDe(compte)}</span>
      <select
        // Prévention plutôt que réaction : l'API refuse l'auto-rétrogradation, ne
        // pas l'offrir évite une fausse manœuvre quotidienne.
        disabled={estMoi || enCours}
        value={refus ?? fetcher.data?.utilisateur?.role ?? compte.role}
        onChange={(evenement) => {
          void fetcher.submit(
            {
              intention: 'role',
              id: compte.id,
              role: evenement.target.value,
              roleActuel: compte.role,
            },
            { method: 'post' },
          );
        }}
        className="h-9 rounded-sm border border-trait-fort bg-craie px-2"
      >
        {ROLES_UTILISATEUR.map((role) => (
          <option key={role} value={role}>
            {LIBELLES_ROLE[role]}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Le sort des avis est l'information non évidente : elle est dite ici, au moment de
 *  décider. */
function ModaleSuppressionCompte({
  compte,
  surAnnulation,
  surConfirmation,
}: {
  compte: Utilisateur;
  surAnnulation: () => void;
  surConfirmation: () => void;
}) {
  return (
    <ModaleConfirmation
      destructive
      titre={`Supprimer le compte de ${nomDe(compte)} ?`}
      corps={`${compte.email}, rôle ${LIBELLES_ROLE[compte.role].toLowerCase()}. Le compte et ses identifiants sont effacés définitivement. Ses avis restent publiés sur les recettes mais deviennent anonymes.`}
      libelleConfirmation="Supprimer le compte"
      motDeConfirmation={MOT_DE_CONFIRMATION}
      surAnnulation={surAnnulation}
      surConfirmation={surConfirmation}
    />
  );
}

function ActionsDeCompte({
  compte,
  estMoi,
  fetcher,
}: {
  compte: Utilisateur;
  estMoi: boolean;
  fetcher: Fetcher;
}) {
  const [modaleOuverte, setModaleOuverte] = useState(false);

  if (estMoi) {
    return (
      <span className="text-sm text-encre-55">
        Votre compte : rôle et suppression verrouillés ici.
      </span>
    );
  }

  return (
    <>
      <Bouton
        variante="texte"
        taille="sm"
        className="!px-0 !text-sm !tracking-normal !normal-case"
        disabled={fetcher.state !== 'idle'}
        onClick={() => {
          setModaleOuverte(true);
        }}
      >
        Supprimer
      </Bouton>

      {modaleOuverte && (
        <ModaleSuppressionCompte
          compte={compte}
          surAnnulation={() => {
            setModaleOuverte(false);
          }}
          surConfirmation={() => {
            setModaleOuverte(false);
            void fetcher.submit(
              { intention: 'suppression', id: compte.id },
              { method: 'post' },
            );
          }}
        />
      )}
    </>
  );
}

function LigneCompte({
  compte,
  estMoi,
}: {
  compte: Utilisateur;
  estMoi: boolean;
}) {
  const fetcher = useFetcher<ResultatAdministration>();
  const retour = fetcher.data;

  return (
    <>
      <tr className={`border-t border-trait ${estMoi ? 'bg-lavande' : ''}`}>
        <td className="py-3 pr-4">{nomDe(compte)}</td>
        <td className="py-3 pr-4 text-encre-70">{compte.email}</td>
        <td className="py-3 pr-4">
          <SelecteurRole compte={compte} estMoi={estMoi} fetcher={fetcher} />
        </td>
        <td className="py-3 pr-4 text-encre-70">
          {FORMAT_DATE.format(new Date(compte.dateCreation))}
        </td>
        <td className="py-3">
          <ActionsDeCompte compte={compte} estMoi={estMoi} fetcher={fetcher} />
        </td>
      </tr>

      {/* Le refus s'affiche à l'endroit de l'action, jamais dans une alerte lointaine
          où l'on ne saurait plus de quelle ligne il parle. */}
      {retour?.message !== undefined && (
        <tr className={retour.succes ? '' : 'bg-erreur-fond'}>
          <td colSpan={COLONNES.length} className="pb-3">
            <span
              role="alert"
              className={`text-sm ${retour.succes ? 'text-encre-70' : 'text-erreur'}`}
            >
              {retour.message}
            </span>
          </td>
        </tr>
      )}
    </>
  );
}

function TableauComptes({
  comptes,
  session,
}: {
  comptes: Utilisateur[];
  session: Utilisateur;
}) {
  return (
    <Tableau colonnes={COLONNES}>
      {comptes.map((compte) => (
        <LigneCompte
          key={compte.id}
          compte={compte}
          estMoi={compte.id === session.id}
        />
      ))}
    </Tableau>
  );
}

export function EcranListeUtilisateurs({
  resultats,
  echec,
  session,
}: {
  resultats: Page<Utilisateur> | null;
  echec: string | null;
  session: Utilisateur;
}) {
  if (echec !== null) {
    return <Bandeau ton="erreur" message={echec} />;
  }

  if (resultats === null || resultats.donnees.length === 0) {
    return (
      <EtatVide
        glyphe="☾"
        titre="Aucun compte à afficher"
        explication="Aucun compte ne peut être créé depuis le back-office : l’inscription se fait côté public."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-titre text-3xl">Utilisateurs</h1>
        <p className="text-sm text-encre-70">
          {resultats.total} compte{resultats.total > 1 ? 's' : ''}
        </p>
      </div>

      <TableauComptes comptes={resultats.donnees} session={session} />

      <Pagination
        total={resultats.total}
        page={resultats.page}
        limite={resultats.limite}
      />
    </div>
  );
}

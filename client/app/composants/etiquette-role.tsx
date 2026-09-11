import type { RoleUtilisateur } from '@recipe/types';

// Le mot est TOUJOURS écrit : la couleur n'est jamais le seul porteur d'information.
// « visiteur » n'a pas d'étiquette — ce rôle n'existe pas en base.
const LIBELLES: Record<RoleUtilisateur, string> = {
  admin: 'Administrateur',
  moderateur: 'Modérateur',
  utilisateur: 'Utilisateur',
};

const FONDS: Record<RoleUtilisateur, string> = {
  admin: 'bg-ardoise text-nappe',
  moderateur: 'bg-lavande text-ardoise-fonce border border-acier',
  utilisateur: 'bg-lin text-encre-70',
};

export function EtiquetteRole({ role }: { role: RoleUtilisateur }) {
  return (
    <span
      className={`rounded-pilule px-3 py-1 text-xs tracking-etiquette uppercase ${FONDS[role]}`}
    >
      {LIBELLES[role]}
    </span>
  );
}

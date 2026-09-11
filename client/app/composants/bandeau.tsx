export type TonBandeau = 'erreur' | 'alerte' | 'succes' | 'info';

type ProprietesBandeau = {
  ton: TonBandeau;
  message: string;
  titre?: string;
  /** Les erreurs champ par champ renvoyées par la validation de l'API. */
  details?: string[];
  className?: string;
};

const FONDS: Record<TonBandeau, string> = {
  erreur: 'border-erreur bg-erreur-fond text-erreur',
  alerte: 'border-alerte bg-alerte-fond text-alerte',
  succes: 'border-succes bg-succes-fond text-succes',
  info: 'border-acier bg-lavande text-ardoise-fonce',
};

// Une erreur interrompt la lecture en cours ; un succès attend la fin de la phrase.
// Interrompre pour annoncer une réussite est une faute d'usage.
function roleAria(ton: TonBandeau): 'alert' | 'status' {
  return ton === 'erreur' || ton === 'alerte' ? 'alert' : 'status';
}

export function Bandeau({
  ton,
  message,
  titre,
  details,
  className = '',
}: ProprietesBandeau) {
  return (
    <div
      role={roleAria(ton)}
      // Focalisable par programme : après un échec de soumission, l'écran lui donne
      // le focus pour que le message soit lu tout de suite.
      tabIndex={-1}
      className={`rounded-sm border-l-4 px-4 py-3 ${FONDS[ton]} ${className}`}
    >
      {titre !== undefined && <p className="font-medium">{titre}</p>}
      <p className="text-base">{message}</p>

      {details !== undefined && details.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-sm">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

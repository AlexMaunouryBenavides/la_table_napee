import type { RecetteResume } from '@recipe/types';

import { PageIntrouvable } from '../introuvable/page-introuvable';
import { chargerSuggestions } from '../introuvable/suggestions';

import type { Route } from './+types/introuvable';

/** Les mots de l'adresse demandée servent de recherche ; sans mot utile, rien. */
export async function clientLoader({
  request,
}: Route.ClientLoaderArgs): Promise<RecetteResume[]> {
  return chargerSuggestions(new URL(request.url).pathname);
}

// Écran 12 — toute URL inconnue.
export default function Introuvable({ loaderData }: Route.ComponentProps) {
  return <PageIntrouvable suggestions={loaderData} />;
}

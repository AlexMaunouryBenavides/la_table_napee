import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** Clique « Supprimer » sur la ligne qui porte ce texte, puis confirme la modale. */
export async function supprimerEtConfirmer(
  texteDeLaLigne: string,
  confirmation: RegExp,
) {
  const ligne = screen.getByText(texteDeLaLigne).closest('tr');
  if (ligne === null) {
    throw new Error(`Aucune ligne pour ${texteDeLaLigne}`);
  }

  await userEvent.click(
    within(ligne).getByRole('button', { name: /supprimer/i }),
  );
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: confirmation,
    }),
  );
}

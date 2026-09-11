import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Etoiles } from './etoiles';

describe('Etoiles — lecture', () => {
  it('dit « pas encore notée » et ne rend AUCUNE étoile quand la note est absente', () => {
    // Cinq étoiles vides se lisent « très mal notée » : c'est un contresens.
    render(<Etoiles note={null} />);

    expect(screen.getByText(/pas encore notée/i)).toBeInTheDocument();
    expect(screen.queryAllByText('★')).toHaveLength(0);
  });

  it('écrit la note et le nombre d’avis dans son libellé accessible', () => {
    render(<Etoiles note={3.4} nombreAvis={27} />);

    expect(
      screen.getByRole('img', { name: 'Noté 3,4 sur 5, 27 avis' }),
    ).toBeInTheDocument();
  });

  it('ne mentionne pas d’avis quand on ne lui en donne pas', () => {
    // Annoncer « 0 avis » serait faux : on ne sait simplement pas.
    render(<Etoiles note={5} />);

    expect(
      screen.getByRole('img', { name: 'Noté 5,0 sur 5' }),
    ).toBeInTheDocument();
  });
});

describe('Etoiles — saisie', () => {
  it('offre un vrai groupe de cinq radios, pas des boutons', () => {
    render(<Etoiles note={null} saisie nom="note" />);

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('remonte la note choisie', async () => {
    const surChangement = vi.fn();
    render(
      <Etoiles note={null} saisie nom="note" surChangement={surChangement} />,
    );

    await userEvent.click(screen.getByRole('radio', { name: /4 étoiles/i }));

    expect(surChangement).toHaveBeenCalledWith(4);
  });
});

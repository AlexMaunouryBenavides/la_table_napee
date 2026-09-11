import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SondeUrl } from '../../test/sonde-url';

import { GroupeFiltre } from './groupe-filtre';

const REGIMES = [
  { valeur: '1', libelle: 'Végan' },
  { valeur: '2', libelle: 'Sans gluten' },
];

function rendreGroupe(url: string, journal: string[] = []) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <GroupeFiltre legende="Régimes" cle="regime" options={REGIMES} />
      <SondeUrl journal={journal} />
    </MemoryRouter>,
  );

  return journal;
}

describe('GroupeFiltre', () => {
  it('marque comme cochées les valeurs présentes dans l’URL', () => {
    rendreGroupe('/recettes?regime=1');

    expect(screen.getByRole('checkbox', { name: 'Végan' })).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Sans gluten' }),
    ).not.toBeChecked();
  });

  it('retire de l’URL une valeur qu’on décoche', async () => {
    const journal = rendreGroupe('/recettes?regime=1&regime=2&page=3');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Végan' }));

    const derniere = journal[journal.length - 1] ?? '';
    expect(derniere).not.toContain('regime=1');
    expect(derniere).toContain('regime=2');
    expect(derniere).toContain('page=1');
  });

  it('regroupe ses options sous un intitulé, pour qu’on sache de quoi il s’agit', () => {
    rendreGroupe('/recettes');

    expect(screen.getByRole('group', { name: 'Régimes' })).toBeInTheDocument();
  });
});

describe('GroupeFiltre à choix unique', () => {
  const DIFFICULTES = [
    { valeur: 'facile', libelle: 'Facile' },
    { valeur: 'moyen', libelle: 'Moyen' },
  ];

  function rendreChoixUnique(url: string) {
    const journal: string[] = [];

    render(
      <MemoryRouter initialEntries={[url]}>
        <GroupeFiltre
          legende="Difficulté"
          cle="difficulte"
          options={DIFFICULTES}
          choixUnique
        />
        <SondeUrl journal={journal} />
      </MemoryRouter>,
    );

    return journal;
  }

  it('offre des radios, pas des cases : l’API n’accepte qu’une valeur', () => {
    rendreChoixUnique('/recettes?difficulte=facile');

    expect(screen.getByRole('radio', { name: 'Facile' })).toBeChecked();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('REMPLACE la valeur au lieu de l’ajouter', async () => {
    // Deux difficultés dans l'URL, et l'API répond 400 : l'interface ne doit pas
    // laisser construire une requête qu'elle sait invalide.
    const journal = rendreChoixUnique('/recettes?difficulte=facile');

    await userEvent.click(screen.getByRole('radio', { name: 'Moyen' }));

    const derniere = journal[journal.length - 1] ?? '';
    expect(derniere).toContain('difficulte=moyen');
    expect(derniere).not.toContain('difficulte=facile');
  });

  it('laisse revenir à « peu importe »', async () => {
    const journal = rendreChoixUnique('/recettes?difficulte=facile');

    await userEvent.click(screen.getByRole('radio', { name: /peu importe/i }));

    expect(journal[journal.length - 1] ?? '').not.toContain('difficulte');
  });
});

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecettesModule } from '../recettes/recettes.module';

import { CategoriesService } from './categories.service';
import { creerControleurCategorie } from './creer-controleur-categorie';
import { CritereSante } from './entities/critere-sante.entity';
import { Nationalite } from './entities/nationalite.entity';
import { Regime } from './entities/regime.entity';
import { TypeAliment } from './entities/type-aliment.entity';

// Une ligne par ressource : le contrat est le même, seule l'entité et l'URL changent.
const CONTROLEURS = [
  creerControleurCategorie({
    entite: Regime,
    chemin: 'regimes',
    relationRecette: 'regimes',
  }),
  creerControleurCategorie({
    entite: CritereSante,
    chemin: 'criteres-sante',
    relationRecette: 'criteresSante',
  }),
  creerControleurCategorie({
    entite: TypeAliment,
    chemin: 'types-aliment',
    relationRecette: 'typesAliment',
  }),
  creerControleurCategorie({
    entite: Nationalite,
    chemin: 'nationalites',
    relationRecette: 'nationalite',
  }),
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Regime, CritereSante, TypeAliment, Nationalite]),
    RecettesModule,
  ],
  controllers: CONTROLEURS,
  providers: [CategoriesService],
  exports: [TypeOrmModule],
})
export class CategoriesModule {}

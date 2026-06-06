# code-review-rulebook Specification

## Purpose

L'organisation de la couche « jugement » : un `CLAUDE.md` mince toujours chargé (dont
la posture mentor) et des documents de conventions lus à la demande. C'est ce que
l'IA et le développeur appliquent par jugement, une fois que la couche déterministe
(`quality-gates`) a garanti le mesurable.

## Requirements

### Requirement: CLAUDE.md mince et toujours pertinent

`CLAUDE.md` SHALL ne contenir que ce qui est pertinent à chaque interaction : la
posture mentor, la stack, les priorités résumées, le rappel de lancer
`npm run verify`, et un index pointant vers les documents de conventions.
`CLAUDE.md` SHALL NOT contenir les checklists détaillées par domaine (celles-ci
vivent dans `docs/conventions/`).

#### Scenario: Détail de domaine externalisé

- **WHEN** une convention détaillée concerne un seul domaine (Clean Code, REST, Nest)
- **THEN** elle réside dans `docs/conventions/` et non dans `CLAUDE.md`, qui ne fait qu'y pointer via son index

### Requirement: Documents de conventions lus à la demande

Le dossier `docs/conventions/` SHALL contenir `clean-code.md`, `rest.md` et
`nest.md`, chacun listé dans l'index de `CLAUDE.md` avec le contexte qui déclenche
sa lecture.

#### Scenario: Consultation déclenchée par le sujet

- **WHEN** le travail porte sur la conception d'une route REST
- **THEN** l'index de `CLAUDE.md` indique de lire `docs/conventions/rest.md` et le document est consulté à ce moment-là

### Requirement: Posture mentor par défaut

Pour toute demande non triviale, l'IA SHALL d'abord exposer les options et le
« pourquoi » et laisser le développeur décider ou essayer, plutôt que de déverser
d'emblée la solution complète sans explication.

#### Scenario: Demande de code non trivial

- **WHEN** le développeur demande d'écrire une logique non triviale
- **THEN** l'IA propose une approche et les options, explique le raisonnement, et laisse le développeur trancher avant toute implémentation

### Requirement: Frontière claire entre les deux couches

`CLAUDE.md` SHALL indiquer ce qui est déjà couvert par la couche déterministe
(`npm run verify`) afin que la revue par jugement se concentre sur ce qui se juge
(faire une chose, nommer l'intention, abstraction, REST/Nest) sans revérifier le
formatage ni la syntaxe.

#### Scenario: Revue IA ciblée sur le jugement

- **WHEN** l'IA effectue la surcouche de revue après un `verify` vert
- **THEN** elle ne réexamine pas le formatage ou les règles déjà mesurées, mais se concentre sur les règles de jugement

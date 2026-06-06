# Guide — L'outillage qualité du projet

> À lire **avant** la mise en place. Ce guide explique le _pourquoi_ et le
> _comment_ de chaque outil. Les règles, elles, vivent dans `docs/conventions/`.
> Ici on apprend ; là-bas on applique.

L'idée centrale du projet : **la qualité ne doit pas reposer sur ta seule
vigilance.** Un humain fatigué oublie une virgule, un `await`, un import mort.
Des outils, non. On délègue donc tout ce qui est _mesurable_ à des machines, et
on garde ton cerveau (et celui de l'IA) pour ce qui demande du _jugement_.

---

## 1. Le modèle à deux couches : ce qui se MESURE vs ce qui se JUGE

Toute règle de qualité tombe dans l'une de deux catégories. Les confondre est un
anti-pattern classique.

### Couche 1 — Déterministe (les machines)

Des règles avec une réponse **binaire** : c'est conforme, ou ça ne l'est pas.
Pas de débat possible.

- « L'indentation fait-elle 2 espaces ? » → oui/non
- « Cet `await` manque-t-il ? » → oui/non
- « Cet export est-il utilisé quelque part ? » → oui/non

Ces règles sont vérifiées **gratuitement et instantanément** par des outils
(`prettier`, `eslint`, `tsc`, `knip`, `jscpd`). Verdict immédiat, zéro token IA,
zéro fatigue. C'est la commande `npm run verify`.

### Couche 2 — Jugement (toi + l'IA)

Des règles qui demandent de **comprendre l'intention** :

- « Ce nom décrit-il vraiment ce que fait la fonction ? »
- « Cette fonction fait-elle UNE seule chose ? »
- « Cette route REST est-elle bien pensée ? »
- « Ces deux blocs sont-ils le même _concept_ dupliqué (et pas juste du texte
  qui se ressemble) ? »

Aucune machine ne tranche ça de façon fiable. C'est le rôle de la revue par
jugement, guidée par les documents de `docs/conventions/`.

> **Pourquoi séparer ?** Demander à un linter si un nom est « bien choisi », ou à
> l'IA de vérifier l'indentation, c'est gâcher les deux. Chaque règle à sa
> couche : la machine fait le travail ingrat et fiable, l'humain fait le travail
> qui a du sens.

---

## 2. Les trois lignes de défense

La **même** commande de vérification (`verify`) est rejouée à trois moments
différents. Plus on avance, plus l'erreur est attrapée tard… mais de plus en
plus fermement.

```
   Tu écris du code
        │
        ▼
┌──────────────────────┐  1. ÉDITEUR (VS Code)
│  format à la sauve-  │     Le plus tôt, le plus doux.
│  garde + ESLint live │     Tu vois l'erreur en tapant. Aucune friction.
└──────────────────────┘
        │  git commit
        ▼
┌──────────────────────┐  2. PRE-COMMIT (husky + lint-staged)
│  vérifie les fichiers│     Attrape ce qui a échappé à l'éditeur.
│  que tu commits      │     ⚠ CONTOURNABLE avec `--no-verify`.
└──────────────────────┘     → ce n'est PAS la vraie barrière, juste un confort.
        │  git push / pull request
        ▼
┌──────────────────────┐  3. CI (GitHub Actions)
│  rejoue verify + les │     LA vraie barrière. Personne ne merge sans elle.
│  tests sur la PR     │     Impossible à contourner.
└──────────────────────┘
```

**Pourquoi rejouer la même commande partout ?** Pour éliminer le « ça passe chez
moi mais casse en CI ». Une seule source de vérité (`verify`), trois endroits où
elle s'exécute à l'identique.

**Pourquoi le pre-commit n'est qu'un confort ?** Parce qu'on peut le sauter avec
`git commit --no-verify`. La CI, elle, tourne sur le serveur : tu ne peux pas la
sauter. C'est donc la CI qui _garantit_ la qualité, le hook qui te _fait gagner
du temps_ en te prévenant tôt.

---

## 3. Ce que fait CHAQUE outil, et POURQUOI

`npm run verify` enchaîne cinq outils, dans cet ordre. Chacun couvre un angle
mort des autres.

### Prettier — le formatage

**Ce qu'il fait :** réécrit ton code dans un style unique (indentation, guillemets,
points-virgules, retours à la ligne). Il ne juge pas la logique, juste l'apparence.

**Pourquoi :** met fin aux débats stériles sur le style et aux diffs pollués par
du reformatage. Tu n'y penses plus jamais : la machine décide, toujours pareil.

Dans `verify` on lance `prettier --check` (il _signale_ le non-conforme sans
modifier). En local, l'éditeur lance `prettier --write` (il _corrige_).

### ESLint (type-aware) — la chasse aux bugs et aux mauvaises pratiques

**Ce qu'il fait :** analyse le code pour repérer des **erreurs de logique** et des
**mauvaises habitudes**, là où Prettier ne regarde que la forme. « Type-aware »
signifie qu'il lit aussi les **types** TypeScript, ce qui lui permet de détecter
des bugs subtils.

**Exemple phare — `no-floating-promises` :**

```ts
// ❌ Bug silencieux : la promesse n'est jamais attendue.
//    Les erreurs disparaissent, l'ordre d'exécution est faux.
maFonctionAsync();

// ✅ ESLint type-aware le repère et exige :
await maFonctionAsync();
```

On y ajoute des règles **Clean Code mécanisables** : trop de paramètres
(`max-params`), fonction trop complexe (`complexity`), fonction trop longue
(`max-lines-per-function`), nombres magiques (`no-magic-numbers`). Ce sont des
seuils chiffrés → donc mesurables → donc couche 1.

**Pourquoi type-aware et pas un linter rapide « bête » ?** Parce que lire les
types débloque toute une famille de bugs (promesses oubliées, comparaisons
impossibles…). C'est plus lent, mais c'est le standard professionnel — et en
local on ne lint que les fichiers modifiés, donc ça reste rapide.

### tsc (`--noEmit`) — le contrat des types

**Ce qu'il fait :** vérifie que les types sont cohérents dans tout le projet, sans
produire de fichiers (`--noEmit` = « contrôle seulement »).

**Pourquoi en plus d'ESLint ?** ESLint regarde fichier par fichier ; `tsc` voit
l'ensemble et fait respecter le contrat global. C'est lui qui attrape « tu passes
un `string` là où on attend un `number` » à travers tout le monorepo.

On l'a réglé en mode **strict + flags pro** :

- `strict` : la base de la rigueur TypeScript.
- `noUncheckedIndexedAccess` : `tableau[i]` est considéré _possiblement_ `undefined`
  → t'oblige à gérer le cas « l'élément n'existe pas » (source n°1 de crashs).
- `noUnusedLocals` / `noUnusedParameters` : refuse les variables/paramètres morts.

> **Cas NestJS / TypeORM :** ces frameworks déclarent des propriétés sans les
> initialiser (`titre: string;`) car ils les remplissent « par magie ». En mode
> strict, `tsc` proteste. La convention est d'écrire `titre!: string;` (le `!`
> dit « je garantis que ce sera rempli »), **plutôt que** de désactiver le
> contrôle pour tout le monde. On garde la rigueur partout.

### knip — le code mort à l'échelle du repo

**Ce qu'il fait :** détecte les **exports, fichiers et dépendances que personne
n'utilise** dans tout le monorepo.

**Pourquoi en plus d'ESLint ?** ESLint ne voit le code mort que _dans un même
fichier_. Un export utilisé nulle part dans tout le projet, lui, lui échappe.
knip raisonne à l'échelle du repo entier : c'est lui qui tient la promesse
« zéro code mort ».

### jscpd — la duplication littérale (copier-coller)

**Ce qu'il fait :** repère les **blocs de code copiés-collés** (duplication de
texte).

**Pourquoi :** le copier-coller est la dette technique la plus courante. Corriger
un bug dans un seul des cinq exemplaires = quatre bugs qui restent.

**Sa limite (importante) :** jscpd ne voit que la duplication _de texte_. La
duplication _de concept_ (deux fonctions différentes qui font la même chose
autrement) lui échappe → ça, c'est de la couche 2, du jugement.

> jscpd est calibré avec un **seuil permissif** (« anti-abus ») : on ne traque que
> les gros copier-coller. Règle d'or : _quand l'outil parle, ce doit toujours être
> un vrai problème._ S'il crie pour rien, on monte le seuil.

---

## 4. En pratique : lancer, lire, corriger

### Lancer

```bash
npm run verify
```

Cette commande enchaîne les cinq outils. **Elle s'arrête au premier qui échoue**
et renvoie un code d'erreur (non nul). Si tout passe, elle est silencieuse et
renvoie 0 : tu es au vert.

Tu peux aussi lancer chaque maillon seul pour cibler :

```bash
npm run format:check   # Prettier seul
npm run lint           # ESLint seul
npm run knip           # code mort seul
npm run jscpd          # duplication seule
```

### Lire une erreur

Chaque outil pointe **le fichier, la ligne, et la règle violée**. Exemple ESLint :

```
api/src/recettes/recettes.service.ts
  42:5  error  Promises must be awaited  @typescript-eslint/no-floating-promises
```

Décodage : fichier `recettes.service.ts`, **ligne 42**, la règle
`no-floating-promises` est violée → il manque un `await`.

### Corriger

1. **Le format ?** Souvent automatique : `npm run format` (Prettier réécrit) ou la
   sauvegarde dans VS Code. Beaucoup de règles ESLint se corrigent aussi seules
   avec `npm run lint -- --fix`.
2. **Un vrai problème de logique/type ?** Là, pas de magie : lis le message, va à
   la ligne, comprends _pourquoi_ l'outil proteste, corrige. C'est exactement le
   moment où tu apprends quelque chose.

> Réflexe à acquérir : un outil qui râle n'est pas un ennemi qui te ralentit,
> c'est un relecteur senior gratuit qui t'évite un bug en production.

---

## 5. Où va quoi (carte mentale)

| Question                                                                     | Couche       | Outil / lieu                                   |
| ---------------------------------------------------------------------------- | ------------ | ---------------------------------------------- |
| Le code est-il bien formaté ?                                                | 1 (mesure)   | Prettier                                       |
| Y a-t-il une promesse oubliée, un nombre magique, une fonction trop longue ? | 1            | ESLint                                         |
| Les types sont-ils cohérents partout ?                                       | 1            | tsc                                            |
| Reste-t-il du code mort dans le repo ?                                       | 1            | knip                                           |
| Y a-t-il du copier-coller ?                                                  | 1            | jscpd                                          |
| Le nom dit-il l'intention ? La fonction fait-elle une chose ?                | 2 (jugement) | toi + IA, via `docs/conventions/clean-code.md` |
| La route REST est-elle bien conçue ?                                         | 2            | `docs/conventions/rest.md`                     |
| Le code respecte-t-il la façon de faire de Nest / React Router ?             | 2            | `docs/conventions/nest.md`, `client.md`        |

**La règle à retenir :** une fois `verify` au vert, la revue de jugement n'a plus
à se soucier du format ni de la syntaxe — tout ça est déjà garanti. Elle se
concentre uniquement sur ce qui se _juge_.

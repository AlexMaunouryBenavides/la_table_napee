# Convention — Clean Code (couche jugement)

> Ce document liste ce qu'une **machine ne peut pas trancher** : le sens, l'intention,
> la juste abstraction. Tout ce qui se mesure (format, longueur, complexité chiffrée,
> code mort, copier-collé) est déjà garanti par `npm run verify` — on ne le réexamine
> pas ici. Voir `docs/guides/outillage-qualite.md`.

## 1. Faire UNE chose

Une fonction/classe a **une seule raison de changer**. Si tu décris ce qu'elle fait
et que tu dois dire « … ET … », c'est probablement deux fonctions.

- Indice : tu n'arrives pas à la nommer sans « et » ou un nom vague (`gererDonnees`).
- Indice : un commentaire interne sépare visuellement « étape 1 / étape 2 » → deux
  fonctions qui s'appellent.

## 2. Nommer l'INTENTION

Le nom dit le _pourquoi_ et le _quoi métier_, pas le _comment_.

- ✅ `calculerMontantTTC`, `estEligibleRemise`, `recettesPubliees`
- ❌ `calc`, `data`, `flag`, `temp`, `handle`, `process`
- Booléens : préfixe d'état (`est…`, `a…`, `doit…`). `estIntrouvable`, pas `notFound`.
- Pas d'abréviation maison : `utilisateur`, pas `usr`. Le code se lit plus qu'il
  ne s'écrit.
- Cohérence de langue : le métier est en **français** dans ce projet — un seul
  vocabulaire, pas de franglais (`recette`, pas `recipe`, sauf API tierce imposée).

## 3. La bonne abstraction (ni trop tôt, ni trop tard)

- N'abstrais pas avant d'avoir **deux ou trois** cas réels : une abstraction
  prématurée coûte plus cher qu'une duplication temporaire.
- Une fonction ne doit mélanger qu'**un seul niveau de détail** : soit elle orchestre
  (appelle des étapes nommées), soit elle fait le détail — pas les deux.

## 4. DRY conceptuel (≠ DRY textuel)

`jscpd` attrape le copier-collé _littéral_. Le vrai piège est la duplication de
**concept** : deux fonctions écrites différemment qui encodent la même règle métier.

- Quand une règle métier change, combien d'endroits dois-je toucher ? Si > 1 → la
  règle est dupliquée, même si le texte diffère. Centralise-la.
- Le contre-pied : ne « factorise » pas deux choses qui se _ressemblent_ par hasard
  mais qui évolueront séparément. Même forme ≠ même concept.

## 5. KISS — la solution la plus simple qui marche

- Préfère l'évident au malin. Le code « intelligent » se relit mal et cache des bugs.
- Pas de généricité, d'option de config, ni de couche d'indirection « au cas où ».
  On code le besoin d'aujourd'hui (YAGNI).
- Sortie anticipée (`guard clauses`) plutôt que des `if` imbriqués profonds.

## 6. Commentaires : le POURQUOI, jamais le QUOI

- ✅ « On recalcule la moyenne au lieu de la stocker, pour éviter l'incohérence. »
- ❌ `// incrémente i` (paraphrase du code).
- Un commentaire qui décrit _ce que fait_ le code est le signe que le code devrait
  être renommé/découpé pour se passer du commentaire.

## Checklist de revue rapide

- [ ] Chaque fonction fait une chose et porte un nom qui le prouve.
- [ ] Aucun nom vague ou abrégé ; vocabulaire métier cohérent.
- [ ] Un seul niveau d'abstraction par fonction.
- [ ] Aucune règle métier dupliquée conceptuellement.
- [ ] La solution est la plus simple possible (pas de « au cas où »).
- [ ] Les commentaires expliquent des décisions, pas le code.

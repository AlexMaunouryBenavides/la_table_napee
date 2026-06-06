# Convention — API REST (couche jugement)

> Comment concevoir des routes cohérentes, prévisibles et sûres. Une API REST bien
> pensée se _devine_ : un autre développeur anticipe l'URL et le code de retour sans
> lire la doc.

## 1. Nommer les ressources (pas les actions)

- Les chemins désignent des **ressources au pluriel**, en noms, jamais en verbes.
  - ✅ `GET /recettes`, `POST /recettes`, `GET /recettes/:id`
  - ❌ `GET /getRecettes`, `POST /creerRecette`
- La hiérarchie exprime l'appartenance : `GET /recettes/:id/avis` (les avis d'une
  recette). Ne dépasse pas ~2 niveaux d'imbrication.
- Le verbe HTTP porte l'action ; l'URL porte la ressource.

## 2. Le bon verbe et le bon code de statut

| Action           | Verbe  | Succès                  |
| ---------------- | ------ | ----------------------- |
| Lister           | GET    | 200                     |
| Lire un élément  | GET    | 200 (ou 404 si absent)  |
| Créer            | POST   | 201 (+ ressource créée) |
| Remplacer        | PUT    | 200                     |
| Modifier partiel | PATCH  | 200                     |
| Supprimer        | DELETE | 204 (corps vide)        |

Erreurs courantes : `400` (entrée invalide), `401` (non authentifié), `403`
(authentifié mais interdit), `404` (ressource absente), `409` (conflit),
`422` (validation métier). Ne JAMAIS répondre `200` avec un message d'erreur dans le
corps : le code de statut EST l'information.

## 3. Idempotence et sécurité des verbes

- `GET`, `PUT`, `DELETE` sont **idempotents** (rejouer = même état final). `POST` ne
  l'est pas (recrée). En tenir compte pour les reprises/retries.
- `GET` ne modifie **jamais** l'état (pas d'effet de bord).

## 4. Listes : pagination, filtres, tri

- Pagination par défaut (ne jamais renvoyer « toute la table ») :
  `GET /recettes?page=2&limite=20`.
- Filtres et tri en query string, pas dans le chemin :
  `GET /recettes?difficulte=facile&tri=-dateCreation`.
- Réponse de liste : enveloppe avec les métadonnées de pagination
  (`donnees`, `total`, `page`, `limite`).

## 5. Gestion des erreurs — uniforme

- Une forme d'erreur **constante** sur toute l'API (code, message, détails). Avec
  Nest, on s'appuie sur les exceptions HTTP (`NotFoundException`, etc.) + un filtre
  d'exception global plutôt que des `try/catch` éparpillés.
- Ne jamais fuiter de détail interne (stack, requête SQL) dans la réponse.

## 6. Validation = à la frontière, toujours

- Toute entrée client est validée **avant** d'atteindre la logique métier, via DTO +
  `class-validator` et le `ValidationPipe` global (voir `nest.md`).
- Le typage TypeScript ne protège PAS au runtime : un body JSON peut mentir. La
  validation, si.

## Checklist de revue rapide

- [ ] URL = ressource au pluriel, en nom ; action portée par le verbe HTTP.
- [ ] Code de statut juste (201 à la création, 204 à la suppression, 4xx adaptés).
- [ ] `GET` sans effet de bord ; idempotence respectée.
- [ ] Listes paginées, filtres/tri en query string.
- [ ] Forme d'erreur uniforme, aucun détail interne fuité.
- [ ] Entrées validées à la frontière (DTO + class-validator).

# Convention — NestJS, à LA manière de Nest (couche jugement)

> Nest a une structure pensée et cohérente. On code _avec_ elle, pas contre. Référence
> officielle : https://docs.nestjs.com. On part des conventions du framework et on
> n'ajoute que nos règles transverses.

## 1. Découper par fonctionnalité (feature modules)

- Un **module par domaine métier** : `recettes`, `utilisateurs`, `avis`… chacun avec
  son dossier (`recettes.module.ts`, `recettes.controller.ts`, `recettes.service.ts`,
  `dto/`, `entities/`).
- Le module déclare ses `controllers` et ses `providers`, et `exports` ce que les
  autres modules consomment. On devine le périmètre d'un module à son dossier.
- **Scaffolder avec le CLI**, pas à la main : `nest g module recettes`,
  `nest g controller recettes`, `nest g service recettes`. On obtient la structure
  idiomatique gratuitement.

## 2. Controller ≠ Service (la règle d'or)

- **Controller** = porte d'entrée HTTP : reçoit la requête, délègue, renvoie. Mince.
- **Service** = logique métier. Il ne connaît **jamais** `req`/`res`, ni le HTTP.
- Conséquence : la logique métier est testable sans serveur, et réutilisable hors du
  web. Si un service importe quelque chose d'Express, c'est un signal d'alarme.

```ts
@Controller('recettes')
export class RecettesController {
  constructor(private readonly recettes: RecettesService) {}

  @Get(':id')
  trouver(@Param('id') id: string) {
    return this.recettes.trouverParId(id); // délègue, ne calcule pas
  }
}
```

## 3. Injection de dépendances (ne pas instancier soi-même)

- Les dépendances arrivent par le **constructeur** ; Nest les fournit. On n'écrit
  jamais `new MonService()` à la main.
- Un provider est `@Injectable()` et déclaré dans son module. Cela rend le code
  testable (on injecte un faux service en test).

## 4. Validation : DTO + `ValidationPipe` global

- Chaque entrée a un **DTO** avec des décorateurs `class-validator`
  (`@IsString()`, `@IsInt()`, `@Min()`…).
- Activer le `ValidationPipe` **globalement** dans `main.ts`, avec
  `whitelist: true` (retire les champs non déclarés) et `forbidNonWhitelisted: true`.
- Les propriétés de DTO/entités déclarées sans initialisation utilisent la convention
  `nom!: string` (cf. `docs/guides/outillage-qualite.md`), pas la désactivation du
  strict.

## 5. Mécanismes transverses : guards, pipes, interceptors

- **Guard** : décide si la requête passe (authentification, rôles). Ne mets pas la
  logique d'autorisation dans le controller.
- **Pipe** : transforme/valide une entrée (la validation en est un).
- **Interceptor** : enveloppe la réponse / mesure / journalise, de façon transversale.
- **Exception filter** : forme uniforme des erreurs (voir `rest.md`), plutôt que des
  `try/catch` partout.

## 6. Configuration et secrets

- Aucune URL ni secret en dur. On passe par `@nestjs/config` et des variables
  d'environnement (objectif 12-factor / dockerisable plus tard sans réécriture).

## Checklist de revue rapide

- [ ] Un module par fonctionnalité, scaffoldé via `nest g`.
- [ ] Controller mince ; aucune logique métier ni `req`/`res` dans le service.
- [ ] Dépendances injectées par constructeur (jamais de `new`).
- [ ] Entrées validées par DTO + `ValidationPipe` global (`whitelist`).
- [ ] Auth/rôles dans des guards ; erreurs via exceptions + filtre.
- [ ] Aucune config/secret en dur.

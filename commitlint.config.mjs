// Valide les messages de commit selon la convention Conventional Commits
// (type(scope): sujet). Rejette les messages flous type « wip » ou « fix bug ».
// Débloque plus tard le changelog/versioning automatique.
export default {
  extends: ['@commitlint/config-conventional'],
};

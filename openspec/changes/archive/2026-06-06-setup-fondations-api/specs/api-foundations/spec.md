## ADDED Requirements

### Requirement: Validation globale des entrées

L'API SHALL appliquer un `ValidationPipe` global qui retire les champs non déclarés,
rejette les champs non autorisés et transforme les entrées selon leurs types, de
sorte qu'aucune donnée client non validée n'atteigne la logique métier.

#### Scenario: Champ inconnu rejeté

- **WHEN** une requête envoie un champ absent du DTO
- **THEN** la requête est rejetée (le champ ne traverse pas)

#### Scenario: Type transformé

- **WHEN** un paramètre numérique arrive sous forme de chaîne valide
- **THEN** il est transformé dans le type attendu avant la couche métier

### Requirement: CORS crédentialisé restreint

L'API SHALL n'autoriser les requêtes cross-origin crédentialisées que depuis
l'origine du front configurée par l'environnement, jamais via un joker.

#### Scenario: Origine autorisée avec cookies

- **WHEN** le front configuré envoie une requête avec ses cookies
- **THEN** l'API accepte la requête crédentialisée

#### Scenario: Origine inconnue refusée

- **WHEN** une origine non configurée tente une requête crédentialisée
- **THEN** l'API ne l'autorise pas

### Requirement: Forme d'erreur cohérente

L'API SHALL renvoyer les erreurs via un filtre d'exception global produisant une
structure uniforme (statut, message, horodatage, chemin).

#### Scenario: Erreur uniforme

- **WHEN** une requête échoue (validation, autorisation, erreur serveur)
- **THEN** la réponse suit la même structure d'erreur, quel que soit l'endpoint

### Requirement: Sérialisation de sortie sans fuite

L'API SHALL sérialiser les réponses de façon à n'exposer aucun champ sensible ou
interne (`password_hash`, jetons, identifiants techniques non destinés au client).

#### Scenario: Réponse utilisateur sans secret

- **WHEN** un endpoint renvoie un utilisateur
- **THEN** la réponse ne contient ni `password_hash` ni champ interne sensible

### Requirement: Durcissement et anti-bruteforce

L'API SHALL appliquer des en-têtes de sécurité (helmet) et une limitation de débit,
avec une limite stricte sur l'authentification.

#### Scenario: Login limité

- **WHEN** un client dépasse le seuil de tentatives de connexion
- **THEN** l'API rejette temporairement les tentatives suivantes (429)

### Requirement: Configuration validée au démarrage

L'API SHALL lire ses paramètres transverses (origine front, throttler, logs) depuis
l'environnement et SHALL refuser de démarrer si une variable requise manque.

#### Scenario: Démarrage sans variable requise

- **WHEN** une variable d'environnement transverse requise est absente
- **THEN** l'application refuse de démarrer avec une erreur explicite

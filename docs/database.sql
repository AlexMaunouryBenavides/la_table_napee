-- Schéma cible du site de recettes — MySQL 8 (InnoDB, utf8mb4).
--
-- Issu de la modélisation Looping, corrigé pour : (1) MySQL natif (Looping
-- exporte le type Access `COUNTER`), (2) fidélité aux décisions de
-- design/use-cases-recettes.md, (3) support de l'authentification.
-- Sert de source à la migration n°1 (modèle bootstrap → code-first).
--
-- Ordre des CREATE = ordre des dépendances de clés étrangères.

-- ── Entités de référence (partagées : jamais supprimées en cascade) ──────────

CREATE TABLE ingredient (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE nationality (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE regime (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE health_criteria (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE food_type (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Utilisateurs & authentification ─────────────────────────────────────────

CREATE TABLE users (
  id            CHAR(36) PRIMARY KEY,            -- UUID : anti-énumération (design l.88)
  nickname      VARCHAR(255),
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,           -- hash Argon2 (jamais le mot de passe en clair)
  role          VARCHAR(20)  NOT NULL DEFAULT 'user',   -- énum applicative : user/moderator/admin
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (nickname),
  UNIQUE (email)
  -- pas de UNIQUE(password_hash) : Argon2 produit déjà des hash uniques (sel),
  -- et contraindre l'égalité des mots de passe n'aurait aucun sens.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE refresh_token (
  id         CHAR(36) PRIMARY KEY,               -- UUID
  user_id    CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,              -- le refresh est stocké HASHÉ (comme un mot de passe)
  family_id  CHAR(36) NOT NULL,                  -- lignée de rotation → détection de vol
  state      VARCHAR(10) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE / USED / REVOKED
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (token_hash),
  INDEX idx_refresh_family (family_id),          -- révoquer toute une famille d'un coup
  -- les sessions meurent avec le compte
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Recettes ────────────────────────────────────────────────────────────────

CREATE TABLE recipe (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  description      TEXT NOT NULL,
  image            VARCHAR(512) NOT NULL,         -- URL de l'image
  video            VARCHAR(512),                  -- URL de la vidéo (optionnelle)
  difficulty       VARCHAR(20) NOT NULL,          -- énum applicative figée (design l.90)
  recipe_type      VARCHAR(20) NOT NULL,          -- énum applicative figée
  preparation_time INT NOT NULL,                  -- minutes
  cooking_time     INT NOT NULL,                  -- minutes
  portion          INT NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  author_id        CHAR(36),                      -- NULL = auteur anonymisé
  nationality_id   INT NOT NULL,
  UNIQUE (title),
  -- anonymisation : la recette survit à la suppression de son auteur
  FOREIGN KEY (author_id)      REFERENCES users(id)       ON DELETE SET NULL,
  -- nationalité = entité partagée : on ne peut pas la supprimer si utilisée
  FOREIGN KEY (nationality_id) REFERENCES nationality(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Composition : jonction ENRICHIE recette⇄ingrédient (porte quantité + unité).
-- C'est une entité à part entière → en TypeORM, deux @ManyToOne, PAS @ManyToMany.
CREATE TABLE composition (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id     INT NOT NULL,
  ingredient_id INT NOT NULL,
  quantity      DECIMAL(6,2),                     -- NULL = « à volonté »
  unit          VARCHAR(20) NOT NULL,             -- énum applicative : G, ML, PIECE, TBSP…
  UNIQUE (recipe_id, ingredient_id),              -- un ingrédient au plus une fois par recette
  -- composition = possédée par la recette → cascade
  FOREIGN KEY (recipe_id)     REFERENCES recipe(id)     ON DELETE CASCADE,
  -- ingrédient = entité partagée → protégé
  FOREIGN KEY (ingredient_id) REFERENCES ingredient(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Étapes de préparation (possédées par la recette)
CREATE TABLE steps (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  number    INT NOT NULL,
  content   TEXT NOT NULL,
  recipe_id INT NOT NULL,
  UNIQUE (recipe_id, number),                     -- pas deux fois l'étape n°2 (confort, à confirmer)
  FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Avis : 1 seul par (utilisateur, recette) ; anonymisé si le compte part
CREATE TABLE review (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  grade      INT NOT NULL,
  comment    VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id    CHAR(36),                            -- NULL = avis anonymisé (UC-09b)
  recipe_id  INT NOT NULL,
  UNIQUE (user_id, recipe_id),                    -- 1 avis par (user, recette) (UC-06)
  CHECK (grade BETWEEN 1 AND 5),                  -- note 1–5 (UC-06)
  FOREIGN KEY (user_id)   REFERENCES users(id)  ON DELETE SET NULL,  -- anonymisation
  FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE    -- possédé
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Jonctions NUES (aucune donnée portée → @ManyToMany, PK composite) ────────
-- côté recette : CASCADE (le lien meurt avec la recette)
-- côté catégorie : RESTRICT (entité partagée, survit)

CREATE TABLE regime_recipe (
  recipe_id INT NOT NULL,
  regime_id INT NOT NULL,
  PRIMARY KEY (recipe_id, regime_id),
  FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE,
  FOREIGN KEY (regime_id) REFERENCES regime(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipe_health_criteria (
  recipe_id          INT NOT NULL,
  health_criteria_id INT NOT NULL,
  PRIMARY KEY (recipe_id, health_criteria_id),
  FOREIGN KEY (recipe_id)          REFERENCES recipe(id)          ON DELETE CASCADE,
  FOREIGN KEY (health_criteria_id) REFERENCES health_criteria(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipe_food_type (
  recipe_id    INT NOT NULL,
  food_type_id INT NOT NULL,
  PRIMARY KEY (recipe_id, food_type_id),
  FOREIGN KEY (recipe_id)    REFERENCES recipe(id)    ON DELETE CASCADE,
  FOREIGN KEY (food_type_id) REFERENCES food_type(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

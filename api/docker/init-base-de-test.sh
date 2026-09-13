#!/bin/sh
# Exécuté par MySQL au tout premier démarrage du conteneur (volume vierge).
# Crée la base dédiée aux tests e2e et donne les droits à l'utilisateur applicatif :
# les tests vident des tables, ils ne doivent jamais toucher la base de développement.
#
# En script shell plutôt qu'en .sql, pour reprendre les noms depuis l'environnement
# au lieu de les figer en dur.
set -e

mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}_test\` CHARACTER SET utf8mb4;
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}_test\`.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL

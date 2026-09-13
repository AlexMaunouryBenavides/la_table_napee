import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaInitial1786718528873 implements MigrationInterface {
  name = 'SchemaInitial1786718528873';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`nickname\` varchar(255) NULL, \`email\` varchar(255) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`role\` varchar(20) NOT NULL DEFAULT 'utilisateur', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_ad02a1be8707004cb805a4b502\` (\`nickname\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`refresh_token\` (\`id\` varchar(36) NOT NULL, \`token_hash\` varchar(255) NOT NULL, \`family_id\` char(36) NOT NULL, \`state\` varchar(10) NOT NULL DEFAULT 'ACTIVE', \`expires_at\` datetime NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` char(36) NOT NULL, INDEX \`idx_refresh_family\` (\`family_id\`), UNIQUE INDEX \`IDX_f0812282fad2e352cdaf83ef0a\` (\`token_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`health_criteria\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_04761c85c2042ec8b618cf9bc3\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`nationality\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_4a1e28419a719fdf8b861232e7\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`regime\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_7fdc12c15172b3466b60dcb8a4\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`food_type\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_dde03feabfea81314d7c2ce178\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ingredient\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_b6802ac7fbd37aa71d856a95d8\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`composition\` (\`id\` int NOT NULL AUTO_INCREMENT, \`quantity\` decimal(6,2) NULL, \`unit\` varchar(20) NOT NULL, \`recipe_id\` int NOT NULL, \`ingredient_id\` int NOT NULL, UNIQUE INDEX \`IDX_803154088081126d357b2d7baa\` (\`recipe_id\`, \`ingredient_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`steps\` (\`id\` int NOT NULL AUTO_INCREMENT, \`number\` int NOT NULL, \`content\` text NOT NULL, \`recipe_id\` int NOT NULL, UNIQUE INDEX \`IDX_16726781fdfdc247455d855d94\` (\`recipe_id\`, \`number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`recipe\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`image\` varchar(512) NOT NULL, \`video\` varchar(512) NULL, \`difficulty\` varchar(20) NOT NULL, \`recipe_type\` varchar(20) NOT NULL, \`preparation_time\` int NOT NULL, \`cooking_time\` int NOT NULL, \`portion\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`author_id\` char(36) NULL, \`nationality_id\` int NOT NULL, UNIQUE INDEX \`IDX_52f467a1124f1861bdaf15d14e\` (\`title\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`review\` (\`id\` int NOT NULL AUTO_INCREMENT, \`grade\` int NOT NULL, \`comment\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` char(36) NULL, \`recipe_id\` int NOT NULL, UNIQUE INDEX \`IDX_afa2703cf8d8b4bd04699e1cd5\` (\`user_id\`, \`recipe_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`regime_recipe\` (\`recipe_id\` int NOT NULL, \`regime_id\` int NOT NULL, INDEX \`IDX_ed2a8b8445deb9986430aa9a8c\` (\`recipe_id\`), INDEX \`IDX_169d647d48dd20cf9895229fca\` (\`regime_id\`), PRIMARY KEY (\`recipe_id\`, \`regime_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`recipe_health_criteria\` (\`recipe_id\` int NOT NULL, \`health_criteria_id\` int NOT NULL, INDEX \`IDX_8b454c06b8981f34df2b56bd8f\` (\`recipe_id\`), INDEX \`IDX_0b94a71b8146261dcf13997fad\` (\`health_criteria_id\`), PRIMARY KEY (\`recipe_id\`, \`health_criteria_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`recipe_food_type\` (\`recipe_id\` int NOT NULL, \`food_type_id\` int NOT NULL, INDEX \`IDX_0c57a410a4cea5fe745f9f0651\` (\`recipe_id\`), INDEX \`IDX_6d7d01c324fd7fb413407735de\` (\`food_type_id\`), PRIMARY KEY (\`recipe_id\`, \`food_type_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` ADD CONSTRAINT \`FK_6bbe63d2fe75e7f0ba1710351d4\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`composition\` ADD CONSTRAINT \`FK_db5dcd212dc6cb203ec369ca1c6\` FOREIGN KEY (\`recipe_id\`) REFERENCES \`recipe\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`composition\` ADD CONSTRAINT \`FK_94b1d94545c958f78bde9e85c14\` FOREIGN KEY (\`ingredient_id\`) REFERENCES \`ingredient\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`steps\` ADD CONSTRAINT \`FK_e43a042b5e8f92fe17c60c4d599\` FOREIGN KEY (\`recipe_id\`) REFERENCES \`recipe\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe\` ADD CONSTRAINT \`FK_437687ce0688299298ae79b5818\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe\` ADD CONSTRAINT \`FK_5d0cc18bd259d8e499d42c834ec\` FOREIGN KEY (\`nationality_id\`) REFERENCES \`nationality\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` ADD CONSTRAINT \`FK_81446f2ee100305f42645d4d6c2\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` ADD CONSTRAINT \`FK_18ae36b989f9f259d4e3d34f1ca\` FOREIGN KEY (\`recipe_id\`) REFERENCES \`recipe\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`regime_recipe\` ADD CONSTRAINT \`FK_ed2a8b8445deb9986430aa9a8c7\` FOREIGN KEY (\`recipe_id\`) REFERENCES \`recipe\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`regime_recipe\` ADD CONSTRAINT \`FK_169d647d48dd20cf9895229fcaa\` FOREIGN KEY (\`regime_id\`) REFERENCES \`regime\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe_health_criteria\` ADD CONSTRAINT \`FK_8b454c06b8981f34df2b56bd8f8\` FOREIGN KEY (\`recipe_id\`) REFERENCES \`recipe\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe_health_criteria\` ADD CONSTRAINT \`FK_0b94a71b8146261dcf13997fadc\` FOREIGN KEY (\`health_criteria_id\`) REFERENCES \`health_criteria\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe_food_type\` ADD CONSTRAINT \`FK_0c57a410a4cea5fe745f9f0651f\` FOREIGN KEY (\`recipe_id\`) REFERENCES \`recipe\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe_food_type\` ADD CONSTRAINT \`FK_6d7d01c324fd7fb413407735de9\` FOREIGN KEY (\`food_type_id\`) REFERENCES \`food_type\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    // Ajouté à la main : TypeORM ignore @Check sur MySQL, donc il ne le crée pas
    // — et ne cherchera jamais à le supprimer non plus.
    await queryRunner.query(
      `ALTER TABLE \`review\` ADD CONSTRAINT \`review_note_bornes\` CHECK (\`grade\` BETWEEN 1 AND 5)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`review\` DROP CHECK \`review_note_bornes\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe_food_type\` DROP FOREIGN KEY \`FK_6d7d01c324fd7fb413407735de9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe_food_type\` DROP FOREIGN KEY \`FK_0c57a410a4cea5fe745f9f0651f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe_health_criteria\` DROP FOREIGN KEY \`FK_0b94a71b8146261dcf13997fadc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe_health_criteria\` DROP FOREIGN KEY \`FK_8b454c06b8981f34df2b56bd8f8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`regime_recipe\` DROP FOREIGN KEY \`FK_169d647d48dd20cf9895229fcaa\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`regime_recipe\` DROP FOREIGN KEY \`FK_ed2a8b8445deb9986430aa9a8c7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_18ae36b989f9f259d4e3d34f1ca\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_81446f2ee100305f42645d4d6c2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe\` DROP FOREIGN KEY \`FK_5d0cc18bd259d8e499d42c834ec\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe\` DROP FOREIGN KEY \`FK_437687ce0688299298ae79b5818\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`steps\` DROP FOREIGN KEY \`FK_e43a042b5e8f92fe17c60c4d599\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`composition\` DROP FOREIGN KEY \`FK_94b1d94545c958f78bde9e85c14\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`composition\` DROP FOREIGN KEY \`FK_db5dcd212dc6cb203ec369ca1c6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` DROP FOREIGN KEY \`FK_6bbe63d2fe75e7f0ba1710351d4\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6d7d01c324fd7fb413407735de\` ON \`recipe_food_type\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0c57a410a4cea5fe745f9f0651\` ON \`recipe_food_type\``,
    );
    await queryRunner.query(`DROP TABLE \`recipe_food_type\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_0b94a71b8146261dcf13997fad\` ON \`recipe_health_criteria\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_8b454c06b8981f34df2b56bd8f\` ON \`recipe_health_criteria\``,
    );
    await queryRunner.query(`DROP TABLE \`recipe_health_criteria\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_169d647d48dd20cf9895229fca\` ON \`regime_recipe\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_ed2a8b8445deb9986430aa9a8c\` ON \`regime_recipe\``,
    );
    await queryRunner.query(`DROP TABLE \`regime_recipe\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_afa2703cf8d8b4bd04699e1cd5\` ON \`review\``,
    );
    await queryRunner.query(`DROP TABLE \`review\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_52f467a1124f1861bdaf15d14e\` ON \`recipe\``,
    );
    await queryRunner.query(`DROP TABLE \`recipe\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_16726781fdfdc247455d855d94\` ON \`steps\``,
    );
    await queryRunner.query(`DROP TABLE \`steps\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_803154088081126d357b2d7baa\` ON \`composition\``,
    );
    await queryRunner.query(`DROP TABLE \`composition\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_b6802ac7fbd37aa71d856a95d8\` ON \`ingredient\``,
    );
    await queryRunner.query(`DROP TABLE \`ingredient\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_dde03feabfea81314d7c2ce178\` ON \`food_type\``,
    );
    await queryRunner.query(`DROP TABLE \`food_type\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_7fdc12c15172b3466b60dcb8a4\` ON \`regime\``,
    );
    await queryRunner.query(`DROP TABLE \`regime\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_4a1e28419a719fdf8b861232e7\` ON \`nationality\``,
    );
    await queryRunner.query(`DROP TABLE \`nationality\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_04761c85c2042ec8b618cf9bc3\` ON \`health_criteria\``,
    );
    await queryRunner.query(`DROP TABLE \`health_criteria\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f0812282fad2e352cdaf83ef0a\` ON \`refresh_token\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_refresh_family\` ON \`refresh_token\``,
    );
    await queryRunner.query(`DROP TABLE \`refresh_token\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_ad02a1be8707004cb805a4b502\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}

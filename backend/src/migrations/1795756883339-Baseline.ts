import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The whole schema as of the switch to committed migrations.
 *
 * - New instance (empty database): creates every table.
 * - Existing instance (it had its own, uncommitted migrations): does nothing.
 *   Run `just migration check` there once: it shows what, if anything, still
 *   differs from the code, and `just migration sync` applies it.
 *
 * Later schema changes are new migrations in this folder
 * (`just migration create <name>`), reviewed in their PR.
 */
export class Baseline1795756883339 implements MigrationInterface {
  name = 'Baseline1795756883339';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('user')) {
      console.log('Baseline: existing schema found, nothing to create.');
      return;
    }
    await queryRunner.query(
      `CREATE TABLE \`snapshot\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`hash\` varchar(255) NOT NULL, \`creator\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`projectId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`project\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(100) NOT NULL, \`description\` varchar(255) NULL, \`thumbnailUrl\` longtext NULL, \`ownerId\` int NOT NULL, \`userWorkspace\` json NULL, \`metadata\` json NULL, \`lockedByUserId\` int NULL, \`lockedAt\` timestamp NULL, \`noteTemplate\` json NULL, \`tags\` json NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`link_group_project\` (\`id\` int NOT NULL AUTO_INCREMENT, \`rights\` enum ('admin', 'reader', 'editor') NOT NULL, \`project\` int NULL, \`user_group\` int NULL, UNIQUE INDEX \`constraint_right_project_userGroup\` (\`rights\`, \`project\`, \`user_group\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`media\` (\`id\` int NOT NULL AUTO_INCREMENT, \`url\` varchar(255) NULL, \`path\` varchar(255) NULL, \`thumbnailUrl\` longtext NULL, \`hash\` varchar(255) NULL, \`title\` varchar(255) NOT NULL, \`metadata\` json NULL, \`origin\` enum ('upload', 'link') NOT NULL, \`mediaTypes\` enum ('video', 'image', 'audio', 'other') NOT NULL, \`description\` varchar(255) NOT NULL, \`idCreator\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`link_media_group\` (\`id\` int NOT NULL AUTO_INCREMENT, \`rights\` enum ('admin', 'reader', 'editor') NOT NULL, \`media\` int NULL, \`user_group\` int NULL, UNIQUE INDEX \`constraint_right_media_userGroup\` (\`rights\`, \`media\`, \`user_group\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`manifest\` (\`id\` int NOT NULL AUTO_INCREMENT, \`thumbnailUrl\` longtext NULL, \`origin\` enum ('upload', 'link', 'create') NOT NULL, \`path\` varchar(255) NULL, \`hash\` varchar(255) NULL, \`title\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`metadata\` json NULL, \`idCreator\` int NOT NULL, \`url\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`link_manifest_group\` (\`id\` int NOT NULL AUTO_INCREMENT, \`rights\` enum ('admin', 'reader', 'editor') NOT NULL, \`manifest\` int NULL, \`user_group\` int NULL, UNIQUE INDEX \`constraint_right_manifest_userGroup\` (\`rights\`, \`manifest\`, \`user_group\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`metadata\` (\`id\` int NOT NULL AUTO_INCREMENT, \`objectType\` enum ('media', 'manifest', 'group', 'project') NOT NULL, \`objectId\` int NOT NULL, \`metadata\` json NULL, \`metadataFormatId\` int NULL, UNIQUE INDEX \`IDX_4d56d92e9d7d2c62432ebdeeec\` (\`objectType\`, \`objectId\`, \`metadataFormatId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`metadata_format\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`creatorId\` int NOT NULL, \`metadata\` json NOT NULL, UNIQUE INDEX \`IDX_1d067d349b8c6357f153321ed5\` (\`creatorId\`, \`title\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`link_metadata_format_group\` (\`id\` int NOT NULL AUTO_INCREMENT, \`metadataFormatId\` int NULL, \`userGroupId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_group\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`ownerId\` int NOT NULL, \`thumbnailUrl\` longtext NULL, \`description\` varchar(255) NULL, \`type\` enum ('personal', 'multi-user') NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`link_user_group\` (\`id\` int NOT NULL AUTO_INCREMENT, \`rights\` enum ('admin', 'reader', 'editor') NOT NULL, \`user_id\` int NULL, \`user_group\` int NULL, UNIQUE INDEX \`constrain_right_user_userGroup\` (\`rights\`, \`user_id\`, \`user_group\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`mail\` varchar(300) NOT NULL, \`name\` varchar(300) NOT NULL, \`resetToken\` text NULL, \`password\` varchar(300) NOT NULL, \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(), \`_isAdmin\` tinyint NOT NULL DEFAULT 0, \`isEmailConfirmed\` tinyint NOT NULL DEFAULT 0, \`preferredLanguage\` enum ('en', 'fr') NULL, \`lastConnectedAt\` datetime NULL, \`loginCounter\` int NOT NULL DEFAULT '0', \`termsValidatedAt\` datetime NULL, UNIQUE INDEX \`IDX_7395ecde6cda2e7fe90253ec59\` (\`mail\`), UNIQUE INDEX \`IDX_065d4d8f3b5adb4a08841eae3c\` (\`name\`), INDEX \`IDX_fc4e2400c1740f58b41ff4f5ec\` (\`resetToken\`), INDEX \`IDX_638bac731294171648258260ff\` (\`password\`), INDEX \`IDX_e11e649824a45d8ed01d597fd9\` (\`createdAt\`), INDEX \`IDX_f60c3f0a771f6e2983cb971aa4\` (\`_isAdmin\`), INDEX \`IDX_d662d92952dbfbae5b23e7b76e\` (\`preferredLanguage\`), INDEX \`IDX_5cea01cff5794fe68335f0e02d\` (\`lastConnectedAt\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`impersonations\` (\`id\` uuid NOT NULL, \`token\` varchar(255) NOT NULL, \`exchangeBefore\` datetime NOT NULL, \`used\` tinyint NOT NULL DEFAULT 0, \`user_id\` int NULL, \`admin_user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`setting\` (\`id\` int NOT NULL AUTO_INCREMENT, \`key\` varchar(255) NOT NULL, \`value\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_1c4c95d773004250c157a744d6\` (\`key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`annotation_page\` (\`id\` int NOT NULL AUTO_INCREMENT, \`projectId\` int NOT NULL, \`annotationPageId\` varchar(255) NOT NULL, \`content\` json NOT NULL, \`migratedToRows\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_1587f9461ce288d92dfbd8818f\` (\`annotationPageId\`, \`projectId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`annotation_batch\` (\`id\` int NOT NULL AUTO_INCREMENT, \`projectId\` int NOT NULL, \`createdById\` int NOT NULL, \`kind\` varchar(32) NOT NULL, \`scope\` json NULL, \`model\` varchar(100) NOT NULL, \`instructions\` text NULL, \`status\` enum ('running', 'done', 'cancelled', 'reverted') NOT NULL DEFAULT 'running', \`proposedCount\` int NOT NULL DEFAULT '0', \`inputTokens\` int NOT NULL DEFAULT '0', \`outputTokens\` int NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_54002335d7f215d139991d5698\` (\`projectId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`annotation\` (\`id\` int NOT NULL AUTO_INCREMENT, \`annotationId\` varchar(512) NOT NULL, \`projectId\` int NOT NULL, \`annotationPageId\` varchar(512) NOT NULL, \`content\` json NOT NULL, \`status\` enum ('draft', 'published') NOT NULL DEFAULT 'published', \`origin\` enum ('human', 'ai') NOT NULL DEFAULT 'human', \`batchId\` int NULL, \`createdById\` int NULL, \`acceptedById\` int NULL, \`version\` int NOT NULL DEFAULT '1', \`editedByHuman\` tinyint NOT NULL DEFAULT 0, \`model\` varchar(100) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_19973a0a36d43c0c264734e562\` (\`projectId\`, \`status\`), INDEX \`IDX_76ed946618f5b2a165d8646160\` (\`projectId\`, \`annotationPageId\`), UNIQUE INDEX \`IDX_ef8556ca4a16dfee8df15f6357\` (\`projectId\`, \`annotationId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`snapshot\` ADD CONSTRAINT \`FK_3693411d12bdf2afa0aa0546cf3\` FOREIGN KEY (\`projectId\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link_group_project\` ADD CONSTRAINT \`FK_3a08332f6d6eb92214be20ed0c0\` FOREIGN KEY (\`project\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link_group_project\` ADD CONSTRAINT \`FK_a0a84359b618748c8cd5ecdf3fa\` FOREIGN KEY (\`user_group\`) REFERENCES \`user_group\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link_media_group\` ADD CONSTRAINT \`FK_6c4fdbfa910baae4cf3928c2381\` FOREIGN KEY (\`media\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link_media_group\` ADD CONSTRAINT \`FK_0ff50b1712b3ba56fdf8123632f\` FOREIGN KEY (\`user_group\`) REFERENCES \`user_group\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link_manifest_group\` ADD CONSTRAINT \`FK_d95bcef2cae6308211ef2201aab\` FOREIGN KEY (\`manifest\`) REFERENCES \`manifest\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link_manifest_group\` ADD CONSTRAINT \`FK_a1339a296db17f920b256d099f1\` FOREIGN KEY (\`user_group\`) REFERENCES \`user_group\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`metadata\` ADD CONSTRAINT \`FK_890461d8c8955efe8e9f8a8b6a3\` FOREIGN KEY (\`metadataFormatId\`) REFERENCES \`metadata_format\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link_metadata_format_group\` ADD CONSTRAINT \`FK_b05fd7ea0dc7f173018a4ed5b72\` FOREIGN KEY (\`metadataFormatId\`) REFERENCES \`metadata_format\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link_metadata_format_group\` ADD CONSTRAINT \`FK_8a9dceeb9e7f211278a85420fb3\` FOREIGN KEY (\`userGroupId\`) REFERENCES \`user_group\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link_user_group\` ADD CONSTRAINT \`FK_4ae32911e8b5606c9c1427d27dd\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link_user_group\` ADD CONSTRAINT \`FK_a6c6dbc6784b234798475109b8a\` FOREIGN KEY (\`user_group\`) REFERENCES \`user_group\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`impersonations\` ADD CONSTRAINT \`FK_7bb39f43038290f441b7bd557ad\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`impersonations\` ADD CONSTRAINT \`FK_4f2279f572bda9afd47e6508cf6\` FOREIGN KEY (\`admin_user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`annotation\` ADD CONSTRAINT \`FK_1096d146a62bdedd6fa4ea808d5\` FOREIGN KEY (\`batchId\`) REFERENCES \`annotation_batch\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(): Promise<void> {
    // Reverting the baseline would drop every table, with all the data.
    throw new Error('The baseline migration cannot be reverted.');
  }
}

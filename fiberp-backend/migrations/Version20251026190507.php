<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251026190507 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE comanda (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, estat VARCHAR(255) NOT NULL, total NUMERIC(10, 2) NOT NULL, albara VARCHAR(255) NOT NULL)');
        $this->addSql('CREATE TABLE fitxatge (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, usuari_id INTEGER NOT NULL, hora_inici DATETIME NOT NULL, hora_fi DATETIME DEFAULT NULL, CONSTRAINT FK_F39FA3E75F263030 FOREIGN KEY (usuari_id) REFERENCES user (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_F39FA3E75F263030 ON fitxatge (usuari_id)');
        $this->addSql('CREATE TABLE item_comanda (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, producte_id INTEGER NOT NULL, comanda_id INTEGER NOT NULL, quantitat INTEGER NOT NULL, total NUMERIC(10, 2) NOT NULL, CONSTRAINT FK_4E98280019F889EA FOREIGN KEY (producte_id) REFERENCES producte (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_4E982800787958A8 FOREIGN KEY (comanda_id) REFERENCES comanda (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_4E98280019F889EA ON item_comanda (producte_id)');
        $this->addSql('CREATE INDEX IDX_4E982800787958A8 ON item_comanda (comanda_id)');
        $this->addSql('CREATE TABLE producte (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, preu NUMERIC(10, 2) NOT NULL, descripcio VARCHAR(255) NOT NULL, quantitat INTEGER NOT NULL)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE comanda');
        $this->addSql('DROP TABLE fitxatge');
        $this->addSql('DROP TABLE item_comanda');
        $this->addSql('DROP TABLE producte');
    }
}

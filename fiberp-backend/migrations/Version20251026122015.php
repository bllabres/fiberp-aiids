<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251026122015 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE registre_sou (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, data DATE NOT NULL, salari_base_aplicat NUMERIC(10, 2) NOT NULL, complements_aplicats NUMERIC(10, 2) NOT NULL, hores_extres NUMERIC(10, 2) NOT NULL, irpf_aplicat NUMERIC(5, 2) NOT NULL, seguretat_social_aplicada NUMERIC(10, 2) NOT NULL, sou_net NUMERIC(10, 2) NOT NULL, data_pagament DATE NOT NULL)');
        $this->addSql('CREATE TABLE sou (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, treballador_id INTEGER NOT NULL, salari_base NUMERIC(10, 2) NOT NULL, complements NUMERIC(10, 2) NOT NULL, irpf_actual NUMERIC(5, 2) NOT NULL, seguretat_social_actual NUMERIC(10, 2) NOT NULL, CONSTRAINT FK_6BFCFDC0BE5F8E09 FOREIGN KEY (treballador_id) REFERENCES user (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6BFCFDC0BE5F8E09 ON sou (treballador_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE registre_sou');
        $this->addSql('DROP TABLE sou');
    }
}

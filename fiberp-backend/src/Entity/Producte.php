<?php

namespace App\Entity;

use App\Repository\ProducteRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ProducteRepository::class)]
class Producte
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $nom = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $preu = null;

    #[ORM\Column(length: 255)]
    private ?string $descripcio = null;

    #[ORM\Column]
    private ?int $quantitat = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;

        return $this;
    }

    public function getPreu(): ?string
    {
        return $this->preu;
    }

    public function setPreu(string $preu): static
    {
        $this->preu = $preu;

        return $this;
    }

    public function getDescripcio(): ?string
    {
        return $this->descripcio;
    }

    public function setDescripcio(string $descripcio): static
    {
        $this->descripcio = $descripcio;

        return $this;
    }

    public function getQuantitat(): ?int
    {
        return $this->quantitat;
    }

    public function setQuantitat(int $quantitat): static
    {
        $this->quantitat = $quantitat;

        return $this;
    }
}

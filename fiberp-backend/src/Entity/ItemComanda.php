<?php

namespace App\Entity;

use App\Repository\ItemComandaRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ItemComandaRepository::class)]
class ItemComanda
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Producte $producte = null;

    #[ORM\Column]
    private ?int $quantitat = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $total = null;

    #[ORM\ManyToOne(inversedBy: 'items')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Comanda $comanda = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getProducte(): ?Producte
    {
        return $this->producte;
    }

    public function setProducte(?Producte $producte): static
    {
        $this->producte = $producte;

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

    public function getTotal(): ?string
    {
        return $this->total;
    }

    public function setTotal(string $total): static
    {
        $this->total = $total;

        return $this;
    }

    public function getComanda(): ?Comanda
    {
        return $this->comanda;
    }

    public function setComanda(?Comanda $comanda): static
    {
        $this->comanda = $comanda;

        return $this;
    }
}

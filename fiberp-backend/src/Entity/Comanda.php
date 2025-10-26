<?php

namespace App\Entity;

use App\Repository\ComandaRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ComandaRepository::class)]
class Comanda
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $estat = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $total = null;

    #[ORM\Column(length: 255)]
    private ?string $albara = null;

    /**
     * @var Collection<int, ItemComanda>
     */
    #[ORM\OneToMany(targetEntity: ItemComanda::class, mappedBy: 'comanda', orphanRemoval: true)]
    private Collection $items;

    public function __construct()
    {
        $this->items = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEstat(): ?string
    {
        return $this->estat;
    }

    public function setEstat(string $estat): static
    {
        $this->estat = $estat;

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

    public function getAlbara(): ?string
    {
        return $this->albara;
    }

    public function setAlbara(string $albara): static
    {
        $this->albara = $albara;

        return $this;
    }

    /**
     * @return Collection<int, ItemComanda>
     */
    public function getItems(): Collection
    {
        return $this->items;
    }

    public function addItem(ItemComanda $item): static
    {
        if (!$this->items->contains($item)) {
            $this->items->add($item);
            $item->setComanda($this);
        }

        return $this;
    }

    public function removeItem(ItemComanda $item): static
    {
        if ($this->items->removeElement($item)) {
            // set the owning side to null (unless already changed)
            if ($item->getComanda() === $this) {
                $item->setComanda(null);
            }
        }

        return $this;
    }
}

<?php

namespace App\Entity;

use App\Repository\SouRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SouRepository::class)]
class Sou
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $salari_base = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $complements = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 5, scale: 2)]
    private ?string $irpf_actual = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $seguretat_social_actual = null;

    #[ORM\OneToOne(inversedBy: 'sou', cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $treballador = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSalariBase(): ?string
    {
        return $this->salari_base;
    }

    public function setSalariBase(string $salari_base): static
    {
        $this->salari_base = $salari_base;

        return $this;
    }

    public function getComplements(): ?string
    {
        return $this->complements;
    }

    public function setComplements(string $complements): static
    {
        $this->complements = $complements;

        return $this;
    }

    public function getIrpfActual(): ?string
    {
        return $this->irpf_actual;
    }

    public function setIrpfActual(string $irpf_actual): static
    {
        $this->irpf_actual = $irpf_actual;

        return $this;
    }

    public function getSeguretatSocialActual(): ?string
    {
        return $this->seguretat_social_actual;
    }

    public function setSeguretatSocialActual(string $seguretat_social_actual): static
    {
        $this->seguretat_social_actual = $seguretat_social_actual;

        return $this;
    }

    public function getTreballador(): ?User
    {
        return $this->treballador;
    }

    public function setTreballador(User $treballador): static
    {
        $this->treballador = $treballador;

        return $this;
    }
}

<?php

namespace App\Entity;

use App\Repository\FitxatgeRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FitxatgeRepository::class)]
class Fitxatge
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?\DateTime $hora_inici = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTime $hora_fi = null;

    #[ORM\ManyToOne(inversedBy: 'fitxatges')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $usuari = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getHoraInici(): ?\DateTime
    {
        return $this->hora_inici;
    }

    public function setHoraInici(\DateTime $hora_inici): static
    {
        $this->hora_inici = $hora_inici;

        return $this;
    }

    public function getHoraFi(): ?\DateTime
    {
        return $this->hora_fi;
    }

    public function setHoraFi(?\DateTime $hora_fi): static
    {
        $this->hora_fi = $hora_fi;

        return $this;
    }

    public function getUsuari(): ?User
    {
        return $this->usuari;
    }

    public function setUsuari(?User $usuari): static
    {
        $this->usuari = $usuari;

        return $this;
    }
}

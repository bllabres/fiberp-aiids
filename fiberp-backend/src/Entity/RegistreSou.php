<?php

namespace App\Entity;

use App\Repository\RegistreSouRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RegistreSouRepository::class)]
class RegistreSou
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTime $data = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $salari_base_aplicat = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $complements_aplicats = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $hores_extres = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 5, scale: 2)]
    private ?string $irpf_aplicat = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $seguretat_social_aplicada = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $sou_net = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTime $data_pagament = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getData(): ?\DateTime
    {
        return $this->data;
    }

    public function setData(\DateTime $data): static
    {
        $this->data = $data;

        return $this;
    }

    public function getSalariBaseAplicat(): ?string
    {
        return $this->salari_base_aplicat;
    }

    public function setSalariBaseAplicat(string $salari_base_aplicat): static
    {
        $this->salari_base_aplicat = $salari_base_aplicat;

        return $this;
    }

    public function getComplementsAplicats(): ?string
    {
        return $this->complements_aplicats;
    }

    public function setComplementsAplicats(string $complements_aplicats): static
    {
        $this->complements_aplicats = $complements_aplicats;

        return $this;
    }

    public function getHoresExtres(): ?string
    {
        return $this->hores_extres;
    }

    public function setHoresExtres(string $hores_extres): static
    {
        $this->hores_extres = $hores_extres;

        return $this;
    }

    public function getIrpfAplicat(): ?string
    {
        return $this->irpf_aplicat;
    }

    public function setIrpfAplicat(string $irpf_aplicat): static
    {
        $this->irpf_aplicat = $irpf_aplicat;

        return $this;
    }

    public function getSeguretatSocialAplicada(): ?string
    {
        return $this->seguretat_social_aplicada;
    }

    public function setSeguretatSocialAplicada(string $seguretat_social_aplicada): static
    {
        $this->seguretat_social_aplicada = $seguretat_social_aplicada;

        return $this;
    }

    public function getSouNet(): ?string
    {
        return $this->sou_net;
    }

    public function setSouNet(string $sou_net): static
    {
        $this->sou_net = $sou_net;

        return $this;
    }

    public function getDataPagament(): ?\DateTime
    {
        return $this->data_pagament;
    }

    public function setDataPagament(\DateTime $data_pagament): static
    {
        $this->data_pagament = $data_pagament;

        return $this;
    }
}

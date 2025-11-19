<?php

namespace App\Repository;

use App\Entity\Fitxatge;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\AbstractQuery;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Fitxatge>
 */
class FitxatgeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Fitxatge::class);
    }

    public function hasOneActive(User $user): bool
    {
        $entityManager = $this->getEntityManager();
        $rep_fitxatge = $entityManager->getRepository(Fitxatge::class);
        $dataInici = (new \DateTime('today'))->setTime(0, 0, 0);
        $dataFi = (new \DateTime('today'))->setTime(23, 59, 59);

        $q = $rep_fitxatge->createQueryBuilder('f')
            ->where('f.usuari = :user')
            ->andWhere('f.hora_inici BETWEEN :inicio AND :fin')
            ->setParameter('user', $user)
            ->setParameter('inicio', $dataInici)
            ->setParameter('fin', $dataFi)
            ->getQuery();
        $res = $q->getResult();
        return count($res) > 0;
    }

    public function getFitxaActual(User $user): bool|Fitxatge {
        $entityManager = $this->getEntityManager();
        $rep_fitxatge = $entityManager->getRepository(Fitxatge::class);
        $dataInici = (new \DateTime('today'))->setTime(0, 0, 0);
        $dataFi = (new \DateTime('today'))->setTime(23, 59, 59);

        $q = $rep_fitxatge->createQueryBuilder('f')
            ->where('f.usuari = :user')
            ->andWhere('f.hora_inici BETWEEN :inicio AND :fin')
            ->setParameter('user', $user)
            ->setParameter('inicio', $dataInici)
            ->setParameter('fin', $dataFi)
            ->getQuery();
        $res = $q->getOneOrNullResult(AbstractQuery::HYDRATE_OBJECT);
        return $res ?? false;
    }

    //    /**
    //     * @return Fitxatge[] Returns an array of Fitxatge objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('f')
    //            ->andWhere('f.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('f.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Fitxatge
    //    {
    //        return $this->createQueryBuilder('f')
    //            ->andWhere('f.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}

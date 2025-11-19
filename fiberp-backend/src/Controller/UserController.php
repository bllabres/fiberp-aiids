<?php

namespace App\Controller;

use App\Entity\Fitxatge;
use App\Entity\User;
use App\Entity\Sou;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use DateTime;

final class UserController extends AbstractController
{
    private LoggerInterface $logger;

    public function __construct(
        #[Autowire(service: 'monolog.logger.user')]LoggerInterface $logger
    ) {
        $this->logger = $logger;
    }

    #[Route('/user', name: 'app_user')]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getUserData(): JsonResponse
    {
        $user = $this->getUser();
        $this->logger->info('Fetched current user data', ['actor_id' => $user?->getId()]);
        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'telefon' => $user->getTelefon(),
            'roles' => $user->getRoles(),
            'createdAt' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/user', name: 'app_user_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateUser(Request $request, EntityManagerInterface $em, UserPasswordHasherInterface $passwordHasher): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user) {
            $this->logger->warning('Unauthorized user update attempt');
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $data = json_decode($request->getContent(), true);
        if ($data === null) {
            $this->logger->warning('Invalid JSON body on self update', ['actor_id' => $user?->getId()]);
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        $changed = false;
        $updatedFields = [];

        if (isset($data['email'])) {
            $user->setEmail($data['email']);
            $changed = true;
            $updatedFields[] = 'email';
        }
        if (isset($data['name'])) {
            $user->setName($data['name']);
            $changed = true;
            $updatedFields[] = 'name';
        }
        if (isset($data['telefon'])) {
            $user->setTelefon($data['telefon']);
            $changed = true;
            $updatedFields[] = 'telefon';
        }
        if (isset($data['password'])) {
            $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashedPassword);
            $changed = true;
            $updatedFields[] = 'password';
        }

        if (!$changed) {
            $this->logger->notice('Self update called with no fields', ['actor_id' => $user?->getId()]);
            return $this->json(['error' => 'No fields to update'], 400);
        }

        $user->setUpdatedAt(new DateTime('now'));

        try {
            $em->flush();
        } catch (UniqueConstraintViolationException $e) {
            $this->logger->error('Email uniqueness violation on self update', ['actor_id' => $user?->getId(), 'email' => $data['email'] ?? null]);
            return $this->json(['error' => 'Email already in use'], 409);
        }
        $this->logger->info('User updated own profile', ['actor_id' => $user?->getId(), 'updated_fields' => $updatedFields]);

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'telefon' => $user->getTelefon(),
            'roles' => $user->getRoles(),
            'createdAt' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/user/fitxa', name: 'app_user_post_fitxa', methods: ['POST'])]
    public function iniciarFitxatge(EntityManagerInterface $em): JsonResponse {
        $user = $this->getUser();
        $rep_fitxatge = $em->getRepository(Fitxatge::class);
        if ($rep_fitxatge->hasOneActive($user)) {
            return $this->json(['error' => 'Fitxa activa'], 400);
        }

        $fitxa = new Fitxatge();
        $fitxa->setUsuari($user);
        $fitxa->setHoraInici(new DateTime('now'));
        $em->persist($fitxa);
        $em->flush();
        return $this->json([['status' => 'succcess']]);
    }

    #[Route('/user/fitxa', name: 'app_user_delete_fitxa', methods: ['DELETE'])]
    public function acabarFitxa(EntityManagerInterface $em): JsonResponse {
        $user = $this->getUser();
        $rep_fitxatge = $em->getRepository(Fitxatge::class);
        $fitxa = $rep_fitxatge->getFitxaActual($user);
        if (!$fitxa) {
            return $this->json(['error' => 'Cap fitxa activa'], 400);
        }

        $fitxa->setHoraFi(new DateTime('now'));
        $em->persist($fitxa);
        $em->flush();
        return $this->json([['status' => 'succcess']]);
    }

    #[Route('/user/fitxa', name: 'app_user_get_fitxa', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getFitxaActual(EntityManagerInterface $em): JsonResponse {
        $user = $this->getUser();
        $rep_fitxatge = $em->getRepository(Fitxatge::class);
        $fitxa = $rep_fitxatge->getFitxaActual($user);
        return $this->json([
            'active' => (bool) $fitxa->getHoraFi() === null,
        ]);
    }

    #[Route('/user/sou', name: 'app_user_sou')]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getUserSou(): JsonResponse
    {
        $user = $this->getUser();
        $sou = $user->getSou();

        if (!$sou) {
            return $this->json(['error' => 'No salary data found'], 404);
        }

        return $this->json([
            'salari_base' => $sou->getSalariBase(),
            'complements' => $sou->getComplements(),
            'irpf_actual' => $sou->getIrpfActual(),
            'seguretat_social_actual' => $sou->getSeguretatSocialActual(),
        ]);
    }

    #[Route('/user/{id}', name: 'app_user_update_by_id', methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function updateUserById(int $id, Request $request, EntityManagerInterface $em, UserPasswordHasherInterface $passwordHasher): JsonResponse
    {
        $user = $em->getRepository(User::class)->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if ($data === null) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        $changed = false;

        if (isset($data['email'])) {
            $user->setEmail($data['email']);
            $changed = true;
        }
        if (isset($data['name'])) {
            $user->setName($data['name']);
            $changed = true;
        }
        if (isset($data['telefon'])) {
            $user->setTelefon($data['telefon']);
            $changed = true;
        }
        if (isset($data['password'])) {
            $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashedPassword);
            $changed = true;
        }
        if (isset($data['roles']) && is_array($data['roles'])) {
            $user->setRoles($data['roles']);
            $changed = true;
        }

        if (!$changed) {
            return $this->json(['error' => 'No fields to update'], 400);
        }

        $user->setUpdatedAt(new DateTime('now'));

        try {
            $em->flush();
        } catch (UniqueConstraintViolationException $e) {
            return $this->json(['error' => 'Email already in use'], 409);
        }

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'telefon' => $user->getTelefon(),
            'roles' => $user->getRoles(),
            'createdAt' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/user/{id}', name: 'app_user_by_id', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getUserDataById(int $id, EntityManagerInterface $em): JsonResponse
    {
        $admin = $this->getUser();
        $user = $em->getRepository(User::class)->find($id);

        if (!$user) {
            $this->logger->warning('User not found when fetching by id', ['target_id' => $id, 'actor_id' => $admin?->getId()]);
            return $this->json(['error' => 'User not found'], 404);
        }

        $this->logger->info('Fetched user data by id', ['target_id' => $id, 'actor_id' => $admin?->getId()]);
        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'telefon' => $user->getTelefon(),
            'roles' => $user->getRoles(),
            'createdAt' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/user/{id}/sou', name: 'app_user_sou_update_by_id', methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function updateUserSouById(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $em->getRepository(User::class)->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if ($data === null) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        $sou = $user->getSou();
        $isNewSou = false;
        if (!$sou) {
            $sou = new Sou();
            // Link both sides of relation
            $user->setSou($sou);
            $isNewSou = true;
        }

        $changed = false;

        if (isset($data['salari_base'])) {
            if (!is_numeric($data['salari_base'])) {
                return $this->json(['error' => 'Invalid value for salari_base'], 400);
            }
            $sou->setSalariBase((string)$data['salari_base']);
            $changed = true;
        }
        if (isset($data['complements'])) {
            if (!is_numeric($data['complements'])) {
                return $this->json(['error' => 'Invalid value for complements'], 400);
            }
            $sou->setComplements((string)$data['complements']);
            $changed = true;
        }
        if (isset($data['irpf_actual'])) {
            if (!is_numeric($data['irpf_actual'])) {
                return $this->json(['error' => 'Invalid value for irpf_actual'], 400);
            }
            $sou->setIrpfActual((string)$data['irpf_actual']);
            $changed = true;
        }
        if (isset($data['seguretat_social_actual'])) {
            if (!is_numeric($data['seguretat_social_actual'])) {
                return $this->json(['error' => 'Invalid value for seguretat_social_actual'], 400);
            }
            $sou->setSeguretatSocialActual((string)$data['seguretat_social_actual']);
            $changed = true;
        }

        if (!$changed) {
            return $this->json(['error' => 'No fields to update'], 400);
        }

        if ($isNewSou) {
            $em->persist($sou);
        }
        $em->flush();

        return $this->json([
            'salari_base' => $sou->getSalariBase(),
            'complements' => $sou->getComplements(),
            'irpf_actual' => $sou->getIrpfActual(),
            'seguretat_social_actual' => $sou->getSeguretatSocialActual(),
            'data_inici' => method_exists($sou, 'getDataInici') && $sou->getDataInici() ? $sou->getDataInici()->format('Y-m-d') : null,
            'data_fi' => method_exists($sou, 'getDataFi') && $sou->getDataFi() ? $sou->getDataFi()->format('Y-m-d') : null,
        ]);
    }
    #[Route('/user/{id}', name: 'app_user_delete_by_id', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteUserById(int $id, EntityManagerInterface $em): JsonResponse
    {
        $user = $em->getRepository(User::class)->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        // Remove related salary record first to avoid foreign key constraint issues
        $sou = $user->getSou();
        if ($sou) {
            $em->remove($sou);
            // Flush now to ensure child entity is removed before deleting the user (FK safety)
            $em->flush();
        }

        $em->remove($user);
        $em->flush();

        return $this->json([
            'status' => 'User deleted',
            'id' => $id,
        ]);
    }
}

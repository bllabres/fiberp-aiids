<?php

namespace App\Controller;

use App\Entity\Producte;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class ProductController extends AbstractController
{
    private LoggerInterface $logger;

    public function __construct(
        #[Autowire(service: 'monolog.logger.product')]LoggerInterface $logger
    ) {
        $this->logger = $logger;
    }

    #[Route('/product', name: 'app_product_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $products = $em->getRepository(Producte::class)->findAll();

        $this->logger->info('Fetched product list', [
            'count' => count($products),
            'actor_id' => $this->getUser()?->getId(),
        ]);

        $data = array_map(static function (Producte $p) {
            return [
                'id' => $p->getId(),
                'nom' => $p->getNom(),
                'preu' => $p->getPreu(),
                'descripcio' => $p->getDescripcio(),
                'quantitat' => $p->getQuantitat(),
            ];
        }, $products);

        return $this->json($data);
    }

    #[Route('/product/{id}', name: 'app_product_get', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getOne(int $id, EntityManagerInterface $em): JsonResponse
    {
        $product = $em->getRepository(Producte::class)->find($id);
        if (!$product) {
            $this->logger->warning('Product not found when fetching by id', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'Product not found'], 404);
        }

        $this->logger->info('Fetched product data by id', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
        return $this->json([
            'id' => $product->getId(),
            'nom' => $product->getNom(),
            'preu' => $product->getPreu(),
            'descripcio' => $product->getDescripcio(),
            'quantitat' => $product->getQuantitat(),
        ]);
    }

    #[Route('/product', name: 'app_product_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if ($data === null) {
            $this->logger->warning('Invalid JSON body on product create', ['actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        foreach (['nom', 'preu', 'descripcio', 'quantitat'] as $field) {
            if (!array_key_exists($field, $data)) {
                $this->logger->warning('Missing field on product create', ['field' => $field, 'actor_id' => $this->getUser()?->getId()]);
                return $this->json(['error' => "Missing field: $field"], 400);
            }
        }

        $product = new Producte();
        $product->setNom($data['nom']);
        $product->setPreu((string)$data['preu']);
        $product->setDescripcio($data['descripcio']);
        $product->setQuantitat((int)$data['quantitat']);

        $em->persist($product);
        $em->flush();

        $this->logger->info('Product created', [
            'id' => $product->getId(),
            'actor_id' => $this->getUser()?->getId(),
        ]);

        return $this->json([
            'status' => 'Product created',
            'id' => $product->getId(),
            'nom' => $product->getNom(),
            'preu' => $product->getPreu(),
            'descripcio' => $product->getDescripcio(),
            'quantitat' => $product->getQuantitat(),
        ], 201);
    }

    #[Route('/product/{id}', name: 'app_product_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function update(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $product = $em->getRepository(Producte::class)->find($id);
        if (!$product) {
            $this->logger->warning('Product not found on update', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'Product not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if ($data === null) {
            $this->logger->warning('Invalid JSON body on product update', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        $updatedFields = [];

        if (array_key_exists('nom', $data)) {
            $product->setNom($data['nom']);
            $updatedFields[] = 'nom';
        }
        if (array_key_exists('preu', $data)) {
            $product->setPreu((string)$data['preu']);
            $updatedFields[] = 'preu';
        }
        if (array_key_exists('descripcio', $data)) {
            $product->setDescripcio($data['descripcio']);
            $updatedFields[] = 'descripcio';
        }
        if (array_key_exists('quantitat', $data)) {
            $product->setQuantitat((int)$data['quantitat']);
            $updatedFields[] = 'quantitat';
        }

        if (empty($updatedFields)) {
            $this->logger->notice('Product update called with no fields', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'No fields to update'], 400);
        }

        $em->flush();

        $this->logger->info('Product updated', [
            'id' => $product->getId(),
            'actor_id' => $this->getUser()?->getId(),
            'updated_fields' => $updatedFields,
        ]);

        return $this->json([
            'status' => 'Product updated',
            'id' => $product->getId(),
            'nom' => $product->getNom(),
            'preu' => $product->getPreu(),
            'descripcio' => $product->getDescripcio(),
            'quantitat' => $product->getQuantitat(),
        ]);
    }

    #[Route('/product/{id}', name: 'app_product_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(int $id, EntityManagerInterface $em): JsonResponse
    {
        $product = $em->getRepository(Producte::class)->find($id);
        if (!$product) {
            $this->logger->warning('Product not found on delete', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'Product not found'], 404);
        }

        $em->remove($product);
        $em->flush();

        $this->logger->info('Product deleted', ['id' => $id, 'actor_id' => $this->getUser()?->getId()]);

        return $this->json(null, 204);
    }
}

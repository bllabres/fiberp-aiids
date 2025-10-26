<?php

namespace App\Controller;

use App\Entity\Producte;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class ProductController extends AbstractController
{
    #[Route('/product', name: 'app_product_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $products = $em->getRepository(Producte::class)->findAll();

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
            return $this->json(['error' => 'Product not found'], 404);
        }

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
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        foreach (['nom', 'preu', 'descripcio', 'quantitat'] as $field) {
            if (!array_key_exists($field, $data)) {
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
            return $this->json(['error' => 'Product not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if ($data === null) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        if (array_key_exists('nom', $data)) {
            $product->setNom($data['nom']);
        }
        if (array_key_exists('preu', $data)) {
            $product->setPreu((string)$data['preu']);
        }
        if (array_key_exists('descripcio', $data)) {
            $product->setDescripcio($data['descripcio']);
        }
        if (array_key_exists('quantitat', $data)) {
            $product->setQuantitat((int)$data['quantitat']);
        }

        $em->flush();

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
            return $this->json(['error' => 'Product not found'], 404);
        }

        $em->remove($product);
        $em->flush();

        return $this->json(null, 204);
    }
}

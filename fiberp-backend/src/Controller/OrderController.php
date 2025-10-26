<?php

namespace App\Controller;

use App\Entity\Comanda;
use App\Entity\ItemComanda;
use App\Entity\Producte;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class OrderController extends AbstractController
{
    #[Route('/order', name: 'app_order_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $orders = $em->getRepository(Comanda::class)->findAll();

        $data = array_map(static function (Comanda $o) {
            $numProducts = 0;
            foreach ($o->getItems() as $it) {
                $numProducts += (int) $it->getQuantitat();
            }
            return [
                'id' => $o->getId(),
                'estat' => $o->getEstat(),
                'total' => $o->getTotal(),
                'albara' => $o->getAlbara(),
                'num_products' => $numProducts,
            ];
        }, $orders);

        return $this->json($data);
    }

    #[Route('/order/{id}', name: 'app_order_get', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getOne(int $id, EntityManagerInterface $em): JsonResponse
    {
        $order = $em->getRepository(Comanda::class)->find($id);
        if (!$order) {
            return $this->json(['error' => 'Order not found'], 404);
        }

        $items = [];
        $numProducts = 0;
        foreach ($order->getItems() as $it) {
            $items[] = [
                'id' => $it->getId(),
                'producte' => [
                    'id' => $it->getProducte()?->getId(),
                    'nom' => $it->getProducte()?->getNom(),
                    'preu' => $it->getProducte()?->getPreu(),
                ],
                'quantitat' => $it->getQuantitat(),
                'total' => $it->getTotal(),
            ];
            $numProducts += (int) $it->getQuantitat();
        }

        return $this->json([
            'id' => $order->getId(),
            'estat' => $order->getEstat(),
            'total' => $order->getTotal(),
            'albara' => $order->getAlbara(),
            'num_products' => $numProducts,
            'items' => $items,
        ]);
    }

    #[Route('/order', name: 'app_order_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if ($data === null) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        // estat and albara are required; items is required to compute totals and quantities
        foreach (['estat', 'albara', 'items'] as $field) {
            if (!array_key_exists($field, $data)) {
                return $this->json(['error' => "Missing field: $field"], 400);
            }
        }
        if (!is_array($data['items'])) {
            return $this->json(['error' => 'items must be an array'], 400);
        }

        $order = new Comanda();
        $order->setEstat($data['estat']);
        $order->setAlbara($data['albara']);

        $em->persist($order);

        $orderTotal = '0.00';
        foreach ($data['items'] as $idx => $itemData) {
            if (!isset($itemData['producteId'], $itemData['quantitat'])) {
                return $this->json(['error' => "Each item must have producteId and quantitat (at index $idx)"], 400);
            }
            $quantitat = (int) $itemData['quantitat'];
            if ($quantitat <= 0) {
                return $this->json(['error' => "Invalid quantitat for item at index $idx"], 400);
            }
            $product = $em->getRepository(Producte::class)->find((int) $itemData['producteId']);
            if (!$product) {
                return $this->json(['error' => "Product not found for item at index $idx"], 400);
            }
            $item = new ItemComanda();
            $item->setProducte($product);
            $item->setQuantitat($quantitat);

            // compute totals as decimals using strings
            $unitPrice = $product->getPreu(); // string decimal
            $lineTotal = number_format(((float)$unitPrice) * $quantitat, 2, '.', '');
            $item->setTotal($lineTotal);
            $item->setComanda($order);

            $em->persist($item);

            $orderTotal = number_format(((float)$orderTotal) + (float)$lineTotal, 2, '.', '');
        }

        $order->setTotal($orderTotal);
        $em->flush();

        return $this->json([
            'status' => 'Order created',
            'id' => $order->getId(),
            'estat' => $order->getEstat(),
            'total' => $order->getTotal(),
            'albara' => $order->getAlbara(),
        ], 201);
    }

    #[Route('/order/{id}', name: 'app_order_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function update(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $order = $em->getRepository(Comanda::class)->find($id);
        if (!$order) {
            return $this->json(['error' => 'Order not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if ($data === null) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        if (array_key_exists('estat', $data)) {
            $order->setEstat($data['estat']);
        }
        if (array_key_exists('albara', $data)) {
            $order->setAlbara($data['albara']);
        }

        $recomputeTotal = false;
        if (array_key_exists('items', $data)) {
            if (!is_array($data['items'])) {
                return $this->json(['error' => 'items must be an array'], 400);
            }
            // Remove existing items (orphanRemoval will delete them)
            foreach ($order->getItems()->toArray() as $existing) {
                $em->remove($existing);
            }
            // Add new items
            foreach ($data['items'] as $idx => $itemData) {
                if (!isset($itemData['producteId'], $itemData['quantitat'])) {
                    return $this->json(['error' => "Each item must have producteId and quantitat (at index $idx)"], 400);
                }
                $quantitat = (int) $itemData['quantitat'];
                if ($quantitat <= 0) {
                    return $this->json(['error' => "Invalid quantitat for item at index $idx"], 400);
                }
                $product = $em->getRepository(Producte::class)->find((int) $itemData['producteId']);
                if (!$product) {
                    return $this->json(['error' => "Product not found for item at index $idx"], 400);
                }
                $item = new ItemComanda();
                $item->setProducte($product);
                $item->setQuantitat($quantitat);
                $unitPrice = $product->getPreu();
                $lineTotal = number_format(((float)$unitPrice) * $quantitat, 2, '.', '');
                $item->setTotal($lineTotal);
                $item->setComanda($order);
                $em->persist($item);
            }
            $recomputeTotal = true;
        }

        if ($recomputeTotal) {
            $newTotal = '0.00';
            foreach ($order->getItems() as $it) {
                $newTotal = number_format(((float)$newTotal) + (float)$it->getTotal(), 2, '.', '');
            }
            $order->setTotal($newTotal);
        }

        $em->flush();

        return $this->json([
            'status' => 'Order updated',
            'id' => $order->getId(),
            'estat' => $order->getEstat(),
            'total' => $order->getTotal(),
            'albara' => $order->getAlbara(),
        ]);
    }

    #[Route('/order/{id}', name: 'app_order_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(int $id, EntityManagerInterface $em): JsonResponse
    {
        $order = $em->getRepository(Comanda::class)->find($id);
        if (!$order) {
            return $this->json(['error' => 'Order not found'], 404);
        }

        $em->remove($order);
        $em->flush();

        return $this->json(null, 204);
    }
}

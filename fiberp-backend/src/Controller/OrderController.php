<?php

namespace App\Controller;

use App\Entity\Comanda;
use App\Entity\ItemComanda;
use App\Entity\Producte;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class OrderController extends AbstractController
{
    private LoggerInterface $logger;
    private LoggerInterface $fileLogger;

    public function __construct(
        #[Autowire(service: 'monolog.logger.order')]LoggerInterface $logger,
        #[Autowire(service: 'monolog.logger.file_upload')]LoggerInterface $file_logger
    ) {
        $this->logger = $logger;
        $this->fileLogger = $file_logger;
    }

    #[Route('/order', name: 'app_order_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $orders = $em->getRepository(Comanda::class)->findAll();

        $this->logger->info('Fetched order list', [
            'count' => count($orders),
            'actor_id' => $this->getUser()?->getId(),
        ]);

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
            $this->logger->warning('Order not found when fetching by id', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
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

        $this->logger->info('Fetched order data by id', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId(), 'num_products' => $numProducts]);

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
            $this->logger->warning('Invalid JSON body on order create', ['actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        // estat and albara are required; items is required to compute totals and quantities
        foreach (['estat', 'albara', 'items'] as $field) {
            if (!array_key_exists($field, $data)) {
                $this->logger->warning('Missing field on order create', ['field' => $field, 'actor_id' => $this->getUser()?->getId()]);
                return $this->json(['error' => "Missing field: $field"], 400);
            }
        }
        if (!is_array($data['items'])) {
            $this->logger->warning('Invalid items type on order create', ['actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'items must be an array'], 400);
        }

        $order = new Comanda();
        $order->setEstat($data['estat']);
        $order->setAlbara($data['albara']);

        $em->persist($order);

        $orderTotal = '0.00';
        $numProducts = 0;
        foreach ($data['items'] as $idx => $itemData) {
            if (!isset($itemData['producteId'], $itemData['quantitat'])) {
                $this->logger->warning('Item missing fields on order create', ['index' => $idx, 'actor_id' => $this->getUser()?->getId()]);
                return $this->json(['error' => "Each item must have producteId and quantitat (at index $idx)"], 400);
            }
            $quantitat = (int) $itemData['quantitat'];
            if ($quantitat <= 0) {
                $this->logger->warning('Invalid quantitat on order create', ['index' => $idx, 'quantitat' => $quantitat, 'actor_id' => $this->getUser()?->getId()]);
                return $this->json(['error' => "Invalid quantitat for item at index $idx"], 400);
            }
            $product = $em->getRepository(Producte::class)->find((int) $itemData['producteId']);
            if (!$product) {
                $this->logger->warning('Product not found for item on order create', ['index' => $idx, 'producteId' => (int)$itemData['producteId'], 'actor_id' => $this->getUser()?->getId()]);
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
            $numProducts += $quantitat;
        }

        $order->setTotal($orderTotal);
        $em->flush();

        $this->logger->info('Order created', [
            'id' => $order->getId(),
            'total' => $orderTotal,
            'albara' => $order->getAlbara(),
            'num_items' => count($data['items']),
            'num_products' => $numProducts,
            'actor_id' => $this->getUser()?->getId(),
        ]);

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
            $this->logger->warning('Order not found on update', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'Order not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if ($data === null) {
            $this->logger->warning('Invalid JSON body on order update', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        $updatedFields = [];

        if (array_key_exists('estat', $data)) {
            $order->setEstat($data['estat']);
            $updatedFields[] = 'estat';
        }
        if (array_key_exists('albara', $data)) {
            $order->setAlbara($data['albara']);
            $updatedFields[] = 'albara';
        }

        $recomputeTotal = false;
        if (array_key_exists('items', $data)) {
            if (!is_array($data['items'])) {
                $this->logger->warning('Invalid items type on order update', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
                return $this->json(['error' => 'items must be an array'], 400);
            }
            // Remove existing items (orphanRemoval will delete them)
            foreach ($order->getItems()->toArray() as $existing) {
                $em->remove($existing);
            }
            // Add new items
            foreach ($data['items'] as $idx => $itemData) {
                if (!isset($itemData['producteId'], $itemData['quantitat'])) {
                    $this->logger->warning('Item missing fields on order update', ['target_id' => $id, 'index' => $idx, 'actor_id' => $this->getUser()?->getId()]);
                    return $this->json(['error' => "Each item must have producteId and quantitat (at index $idx)"], 400);
                }
                $quantitat = (int) $itemData['quantitat'];
                if ($quantitat <= 0) {
                    $this->logger->warning('Invalid quantitat on order update', ['target_id' => $id, 'index' => $idx, 'quantitat' => $quantitat, 'actor_id' => $this->getUser()?->getId()]);
                    return $this->json(['error' => "Invalid quantitat for item at index $idx"], 400);
                }
                $product = $em->getRepository(Producte::class)->find((int) $itemData['producteId']);
                if (!$product) {
                    $this->logger->warning('Product not found for item on order update', ['target_id' => $id, 'index' => $idx, 'producteId' => (int)$itemData['producteId'], 'actor_id' => $this->getUser()?->getId()]);
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
            $updatedFields[] = 'items';
        }

        if (empty($updatedFields)) {
            $this->logger->notice('Order update called with no fields', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'No fields to update'], 400);
        }

        if ($recomputeTotal) {
            $newTotal = '0.00';
            foreach ($order->getItems() as $it) {
                $newTotal = number_format(((float)$newTotal) + (float)$it->getTotal(), 2, '.', '');
            }
            $order->setTotal($newTotal);
        }

        $em->flush();

        $this->logger->info('Order updated', [
            'id' => $order->getId(),
            'actor_id' => $this->getUser()?->getId(),
            'updated_fields' => $updatedFields,
            'total' => $order->getTotal(),
        ]);

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
            $this->logger->warning('Order not found on delete', ['target_id' => $id, 'actor_id' => $this->getUser()?->getId()]);
            return $this->json(['error' => 'Order not found'], 404);
        }

        $itemsCount = count($order->getItems());
        $total = $order->getTotal();

        $em->remove($order);
        $em->flush();

        $this->logger->info('Order deleted', [
            'id' => $id,
            'total' => $total,
            'items_count' => $itemsCount,
            'actor_id' => $this->getUser()?->getId(),
        ]);

        return $this->json(null, 204);
    }
}

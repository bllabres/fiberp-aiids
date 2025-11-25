<?php

namespace App\Tests\Controller;

use App\Tests\BaseApiTestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class OrderControllerTest extends BaseApiTestCase
{
    public function testOrderCrudFlowJson(): void
    {
        $user = $this->createUser(['ROLE_USER'], 'order_' . bin2hex(random_bytes(3)) . '@test.local', 'password');
        $token = $this->getJwtToken($user->getEmail(), 'password');
        $product = $this->createProduct('Paper A4', '3.20', 'Pack 500', 50);

        // Create
        $this->authJsonRequest('POST', '/order', $token, [
            'estat' => 'pending',
            'items' => [
                ['producteId' => $product->getId(), 'quantitat' => 2],
            ],
        ]);
        $resp = $this->client->getResponse();
        $this->assertSame(201, $resp->getStatusCode(), $resp->getContent());
        $created = json_decode($resp->getContent(), true);
        $oid = $created['id'] ?? null;
        $this->assertNotEmpty($oid);

        // List
        $this->authGet('/order', $token);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $list = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($list);
        $this->assertNotEmpty($list);

        // Get one
        $this->authGet('/order/' . $oid, $token);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $one = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('pending', $one['estat'] ?? null);
        $this->assertSame(1, count($one['items'] ?? []));

        // Update (change items)
        $this->authJsonRequest('PATCH', '/order/' . $oid, $token, [
            'items' => [
                ['producteId' => $product->getId(), 'quantitat' => 3],
            ],
        ]);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $upd = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Order updated', $upd['status'] ?? null);

        // Delete
        $this->authDelete('/order/' . $oid, $token);
        $this->assertSame(204, $this->client->getResponse()->getStatusCode());

        // Deleted fetch
        $this->authGet('/order/' . $oid, $token);
        $this->assertSame(404, $this->client->getResponse()->getStatusCode());
    }

    public function testCreateOrderWithPdfUpload(): void
    {
        $user = $this->createUser(['ROLE_USER'], 'orderf_' . bin2hex(random_bytes(3)) . '@test.local', 'password');
        $token = $this->getJwtToken($user->getEmail(), 'password');
        $product = $this->createProduct('Bolígraf', '0.80', 'Blau', 200);

        // First create order via JSON (without albarà)
        $this->authJsonRequest('POST', '/order', $token, [
            'estat' => 'with-file',
            'items' => [
                ['producteId' => $product->getId(), 'quantitat' => 1],
            ],
        ]);
        $respCreate = $this->client->getResponse();
        $this->assertSame(201, $respCreate->getStatusCode(), $respCreate->getContent());
        $created = json_decode($respCreate->getContent(), true);
        $oid = $created['id'] ?? null;
        $this->assertNotEmpty($oid);

        // Create a temporary "PDF" file
        $tmp = tempnam(sys_get_temp_dir(), 'pdf_');
        file_put_contents($tmp, "%PDF-1.4\n% test\n");
        $uploaded = new UploadedFile($tmp, 'albara.pdf', 'application/pdf', null, true);

        $this->authMultipartRequest(
            'POST',
            '/order/' . $oid . '/albara',
            $token,
            [],
            ['albara_file' => $uploaded]
        );

        $resp = $this->client->getResponse();
        $this->assertSame(200, $resp->getStatusCode(), $resp->getContent());
        $data = json_decode($resp->getContent(), true);
        $this->assertSame('Albara uploaded', $data['status'] ?? null);
        $this->assertNotEmpty($data['albara'] ?? null);
    }
}

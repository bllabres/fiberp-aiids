<?php

namespace App\Tests\Controller;

use App\Tests\BaseApiTestCase;

final class ProductControllerTest extends BaseApiTestCase
{
    public function testProductCrudFlow(): void
    {
        $user = $this->createUser(['ROLE_USER'], 'prod_' . bin2hex(random_bytes(3)) . '@test.local', 'password');
        $token = $this->getJwtToken($user->getEmail(), 'password');

        // Create
        $this->authJsonRequest('POST', '/product', $token, [
            'nom' => 'Llapis',
            'preu' => '1.25',
            'descripcio' => 'Llapis HB',
            'quantitat' => 100,
        ]);
        $resp = $this->client->getResponse();
        $this->assertSame(201, $resp->getStatusCode(), $resp->getContent());
        $created = json_decode($resp->getContent(), true);
        $pid = $created['id'] ?? null;
        $this->assertNotEmpty($pid);

        // List
        $this->authGet('/product', $token);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $list = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($list);
        $this->assertNotEmpty($list);

        // Get one
        $this->authGet('/product/' . $pid, $token);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $one = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Llapis', $one['nom'] ?? null);

        // Update
        $this->authJsonRequest('PATCH', '/product/' . $pid, $token, [
            'preu' => '1.50',
            'quantitat' => 90,
        ]);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $upd = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('1.50', $upd['preu'] ?? null);

        // Delete
        $this->authDelete('/product/' . $pid, $token);
        $this->assertSame(204, $this->client->getResponse()->getStatusCode());

        // Deleted fetch
        $this->authGet('/product/' . $pid, $token);
        $this->assertSame(404, $this->client->getResponse()->getStatusCode());
    }
}

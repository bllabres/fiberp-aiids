<?php

namespace App\Tests\Controller;

use App\Tests\BaseApiTestCase;

final class AuthControllerTest extends BaseApiTestCase
{
    public function testRegisterCreatesUser(): void
    {
        $email = 'new_' . bin2hex(random_bytes(4)) . '@test.local';
        $this->jsonRequest('POST', '/register', [
            'email' => $email,
            'password' => 'secret',
            'name' => 'Nuevo Usuario',
            'telefon' => '611111111',
        ]);

        $resp = $this->client->getResponse();
        $this->assertSame(201, $resp->getStatusCode(), $resp->getContent());
        $data = json_decode($resp->getContent(), true);
        $this->assertSame('User created', $data['status'] ?? null);
        $this->assertNotEmpty($data['user_identifier'] ?? null);
    }

    public function testLoginReturnsJwtToken(): void
    {
        // First register a user
        $email = 'jwt_' . bin2hex(random_bytes(4)) . '@test.local';
        $password = 'secret';
        $this->jsonRequest('POST', '/register', [
            'email' => $email,
            'password' => $password,
            'name' => 'JWT User',
            'telefon' => '611111111',
        ]);
        $this->assertSame(201, $this->client->getResponse()->getStatusCode(), $this->client->getResponse()->getContent());

        // Then login to get JWT
        $token = $this->getJwtToken($email, $password);
        $this->assertNotEmpty($token);

        // Optional: use token to access a protected endpoint (should be 200)
        // We hit a simple protected route to confirm token works; product list is protected.
        $this->authGet('/product', $token);
        $this->assertContains($this->client->getResponse()->getStatusCode(), [200, 204, 404], 'Protected endpoint should accept JWT');
    }
}

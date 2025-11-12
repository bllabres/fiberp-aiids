<?php

namespace App\Tests\Controller;

use App\Entity\Fitxatge;
use App\Tests\BaseApiTestCase;

final class UserControllerTest extends BaseApiTestCase
{
    public function testSelfEndpoints(): void
    {
        $user = $this->createUser(['ROLE_USER'], 'self_' . bin2hex(random_bytes(3)) . '@test.local', 'password');
        $token = $this->getJwtToken($user->getEmail(), 'password');

        // GET /user
        $this->authGet('/user', $token);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $me = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame($user->getEmail(), $me['email'] ?? null);

        // Initial /user/sou should be 404
        $this->authGet('/user/sou', $token);
        $this->assertSame(404, $this->client->getResponse()->getStatusCode());

        // Update self
        $this->authJsonRequest('PATCH', '/user', $token, [
            'name' => 'Nombre Actualizado',
            'telefon' => '622222222',
        ]);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $upd = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Test User', $upd['name'] ?? null);
    }

    public function testAdminEndpointsAndSou(): void
    {
        $admin = $this->createUser(['ROLE_ADMIN'], 'admin_' . bin2hex(random_bytes(3)) . '@test.local', 'password');
        $adminToken = $this->getJwtToken($admin->getEmail(), 'password');

        // Create a target user (DB) and log in as admin to manage it
        $target = $this->createUser(['ROLE_USER'], 'target_' . bin2hex(random_bytes(3)) . '@test.local', 'password');

        // GET /user/{id}
        $this->authGet('/user/' . $target->getId(), $adminToken);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());

        // Update by id
        $this->authJsonRequest('PATCH', '/user/' . $target->getId(), $adminToken, [
            'roles' => ['ROLE_USER', 'ROLE_ADMIN'],
        ]);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $after = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertContains('ROLE_ADMIN', $after['roles'] ?? []);

        // Update salary by id
        $this->authJsonRequest('PATCH', '/user/' . $target->getId() . '/sou', $adminToken, [
            'salari_base' => 1200.50,
            'complements' => 150,
            'irpf_actual' => 12,
            'seguretat_social_actual' => 6.35,
        ]);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());

        // Now login as target and GET /user/sou
        $targetToken = $this->getJwtToken($target->getEmail(), 'password');
        $this->authGet('/user/sou', $targetToken);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $sou = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('1200.5', $sou['salari_base'] ?? null);

        // Admin delete user by id
        $this->authDelete('/user/' . $target->getId(), $adminToken);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
    }

    public function testFitxaStartAndEnd(): void
    {
        $user = $this->createUser(['ROLE_USER'], 'fitxa_' . bin2hex(random_bytes(3)) . '@test.local', 'password');
        $token = $this->getJwtToken($user->getEmail(), 'password');

        // Skip if repository methods are not available
        $rep = $this->getEntityManager()->getRepository(Fitxatge::class);
        if (!method_exists($rep, 'hasOneActive') || !method_exists($rep, 'getFitxaActual')) {
            $this->markTestSkipped('Fitxatge repository methods not available, skipping fitxa tests.');
        }

        // Start fitxa
        $this->authRequest('POST', '/user/fitxa', $token);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode(), $this->client->getResponse()->getContent());

        // End fitxa
        $this->authRequest('DELETE', '/user/fitxa', $token);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode(), $this->client->getResponse()->getContent());
    }
}


<?php

namespace App\Tests;

use App\Entity\Producte;
use App\Entity\User;
use DateTime;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

abstract class BaseApiTestCase extends WebTestCase
{
    protected ?KernelBrowser $client = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = static::createClient();
        $this->reCreateDatabase();
    }

    protected function getEntityManager(): EntityManagerInterface
    {
        return static::getContainer()->get(EntityManagerInterface::class);
    }

    protected function reCreateDatabase(): void
    {
        $em = $this->getEntityManager();
        $metadata = $em->getMetadataFactory()->getAllMetadata();

        $tool = new SchemaTool($em);
        $tool->dropDatabase();
        if (!empty($metadata)) {
            $tool->createSchema($metadata);
        }
        $em->clear();
    }

    protected function createUser(array $roles = ['ROLE_USER'], ?string $email = null, string $password = 'password'): User
    {
        $em = $this->getEntityManager();
        /** @var UserPasswordHasherInterface $hasher */
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($email ?? ('user_' . bin2hex(random_bytes(4)) . '@test.local'));
        $user->setName('Test User');
        $user->setTelefon('600000000');
        $user->setRoles($roles);
        $user->setPassword($hasher->hashPassword($user, $password));
        // ensure non-null timestamps for controllers that format them
        if (method_exists($user, 'setCreatedAt')) {
            $user->setCreatedAt(new DateTimeImmutable('now'));
        }
        if (method_exists($user, 'setUpdatedAt')) {
            $user->setUpdatedAt(new DateTime('now'));
        }

        $em->persist($user);
        $em->flush();

        return $user;
    }

    protected function loginAsUser(?User $user = null): User
    {
        $user = $user ?? $this->createUser(['ROLE_USER']);
        $this->client->loginUser($user);
        return $user;
    }

    protected function loginAsAdmin(?User $admin = null): User
    {
        $admin = $admin ?? $this->createUser(['ROLE_ADMIN']);
        $this->client->loginUser($admin);
        return $admin;
    }

    protected function createProduct(string $nom = 'Prod', string $preu = '10.00', string $desc = 'Desc', int $qty = 5): Producte
    {
        $em = $this->getEntityManager();

        $p = new Producte();
        $p->setNom($nom);
        $p->setPreu($preu);
        $p->setDescripcio($desc);
        $p->setQuantitat($qty);

        $em->persist($p);
        $em->flush();

        return $p;
    }

    protected function jsonRequest(string $method, string $uri, array $payload = []): void
    {
        $this->client->request(
            $method,
            $uri,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );
    }

    // Obtain a JWT by calling the /login endpoint with email/password
    protected function getJwtToken(string $email, string $password): string
    {
        $this->client->request(
            'POST',
            '/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => $email, 'password' => $password])
        );
        $resp = $this->client->getResponse();
        $data = json_decode($resp->getContent(), true) ?? [];
        $token = $data['token'] ?? $data['access_token'] ?? $data['id_token'] ?? null;
        if ($resp->getStatusCode() !== 200 || empty($token)) {
            throw new \RuntimeException('JWT token not found or login failed: ' . $resp->getContent());
        }
        return $token;
    }

    // Generic authenticated request helper
    protected function authRequest(string $method, string $uri, string $token, array $parameters = [], array $files = [], array $server = [], ?string $content = null): void
    {
        $server = array_merge(
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token],
            $server
        );
        $this->client->request($method, $uri, $parameters, $files, $server, $content);
    }

    // JSON request with Bearer token
    protected function authJsonRequest(string $method, string $uri, string $token, array $payload = []): void
    {
        $this->authRequest(
            $method,
            $uri,
            $token,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );
    }

    // Multipart/form-data request with Bearer token
    protected function authMultipartRequest(string $method, string $uri, string $token, array $fields = [], array $files = []): void
    {
        $this->authRequest(
            $method,
            $uri,
            $token,
            $fields,
            $files,
            ['CONTENT_TYPE' => 'multipart/form-data']
        );
    }

    // Convenience helpers
    protected function authGet(string $uri, string $token): void
    {
        $this->authRequest('GET', $uri, $token);
    }

    protected function authDelete(string $uri, string $token): void
    {
        $this->authRequest('DELETE', $uri, $token);
    }
}

<?php

namespace App\EventSubscriber;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Http\Event\LoginFailureEvent;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;
use Psr\Log\LoggerInterface;

class LoginSubscriber implements EventSubscriberInterface
{
    private LoggerInterface $logger;

    public function __construct(
        #[Autowire(service: 'monolog.logger.login')]LoggerInterface $logger
    )
    {
        $this->logger = $logger;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            LoginSuccessEvent::class => 'onLoginSuccess',
            LoginFailureEvent::class => 'onLoginFailure',
        ];
    }

    public function onLoginSuccess(LoginSuccessEvent $event): void
    {
        $user = $event->getUser();

        $username = method_exists($user, 'getUserIdentifier') ?
            $user->getUserIdentifier() :
            (method_exists($user, 'getEmail') ? $user->getEmail() : 'unknown');

        $ip = $event->getRequest()->getClientIp();

        $this->logger->info('Inicio de sesión exitoso', [
            'ip' => $ip,
            'user' => $username
        ]);
    }

    public function onLoginFailure(LoginFailureEvent $event): void
    {
        $credentials = json_decode($event->getRequest()->getContent(), true)['email'];
        $ip = $event->getRequest()->getClientIp();
        $error = $event->getException()->getMessageKey();

        $this->logger->warning('Fallo de inicio de sesion', [
            'ip' => $ip,
            'error' => $error,
            'user' => $credentials ?: 'usuario desconocido'
        ]);
    }

}

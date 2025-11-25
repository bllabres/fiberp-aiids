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

        $hora_actual = (new \DateTime('now', new \DateTimeZone('Europe/Madrid')))->format('H:i:s');
        $hora_inici = $user->getIniciJornada()->format('H:i:s');
        $hora_fi = $user->getFiJornada()->format('H:i:s');
        $is_admin = in_array('ROLE_ADMIN', $user->getRoles());

        $this->logger->info('Successful login', [
            'ip' => $ip,
            'user' => $username
        ]);

        // Si la hora actual NO está dentro del rango
        if (!$is_admin && ($hora_actual < $hora_inici || $hora_actual > $hora_fi)) {
            $this->logger->warning('Login out of working hours', [
                'ip' => $ip,
                'hora_actual' => $hora_actual,
                'user' => $user,
            ]);
        }
    }

    public function onLoginFailure(LoginFailureEvent $event): void
    {
        $credentials = json_decode($event->getRequest()->getContent(), true)['email'];
        $ip = $event->getRequest()->getClientIp();
        $error = $event->getException()->getMessageKey();

        $this->logger->warning('Login failure', [
            'ip' => $ip,
            'error' => $error,
            'user' => $credentials ?: 'unknown',
        ]);
    }

}

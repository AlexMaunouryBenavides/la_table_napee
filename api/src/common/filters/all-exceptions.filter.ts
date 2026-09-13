import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

interface ReponseErreur {
  statusCode: number;
  message: string;
  details?: string[];
  timestamp: string;
  path: string;
}

const MESSAGE_INTERNE = 'Erreur interne du serveur';

// Élargis en `number` : `HttpException.getStatus()` renvoie un nombre, pas un membre
// de l'énumération — les comparer directement serait une comparaison d'énums bancale.
const PREMIERE_ERREUR_SERVEUR: number = HttpStatus.INTERNAL_SERVER_ERROR;
const REFUS: number[] = [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN];
const MESSAGE_ENTREE_INVALIDE = 'Requête invalide';

// Le ValidationPipe range ses erreurs dans un TABLEAU à l'intérieur de la réponse de
// l'exception. `exception.message` retomberait alors sur « Bad Request Exception » et
// le client ne saurait pas QUEL champ est en cause : on lit donc getResponse().
function decrire(exception: HttpException): {
  message: string;
  details?: string[];
} {
  const reponse: unknown = exception.getResponse();

  if (typeof reponse === 'string') {
    return { message: reponse };
  }

  const { message } = reponse as { message?: unknown };

  if (Array.isArray(message)) {
    return { message: MESSAGE_ENTREE_INVALIDE, details: message as string[] };
  }

  return { message: typeof message === 'string' ? message : exception.message };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly journal = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  // Ce que le client reçoit et ce que le serveur retient sont deux choses distinctes :
  // le client a un message générique, nous gardons la cause. Les fautes d'entrée (400,
  // 404, 409) ne sont PAS journalisées : elles sont normales et noieraient le reste.
  private journaliser(exception: unknown, statusCode: number, chemin: string) {
    if (statusCode >= PREMIERE_ERREUR_SERVEUR) {
      this.journal.error(
        `${String(statusCode)} ${chemin}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      return;
    }

    // Refus d'authentification ou d'autorisation : trace obligatoire, c'est le
    // signal qui révèle une tentative d'accès illégitime.
    if (REFUS.includes(statusCode)) {
      this.journal.warn(`Accès refusé — ${String(statusCode)} ${chemin}`);
    }
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const estHttp = exception instanceof HttpException;

    // On n'expose jamais le détail interne d'une erreur imprévue au client.
    const statusCode = estHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const { message, details } = estHttp
      ? decrire(exception)
      : { message: MESSAGE_INTERNE, details: undefined };

    const chemin = String(httpAdapter.getRequestUrl(ctx.getRequest<unknown>()));

    this.journaliser(exception, statusCode, chemin);

    const corps: ReponseErreur = {
      statusCode,
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: chemin,
    };

    httpAdapter.reply(ctx.getResponse<unknown>(), corps, statusCode);
  }
}

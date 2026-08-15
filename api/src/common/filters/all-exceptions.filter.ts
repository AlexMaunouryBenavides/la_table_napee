import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
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
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

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

    const corps: ReponseErreur = {
      statusCode,
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: String(httpAdapter.getRequestUrl(ctx.getRequest<unknown>())),
    };

    httpAdapter.reply(ctx.getResponse<unknown>(), corps, statusCode);
  }
}

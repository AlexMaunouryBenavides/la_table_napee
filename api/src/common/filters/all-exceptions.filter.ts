import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

// Forme unique de toutes les erreurs renvoyées par l'API (cf. docs/conventions/rest.md).
interface ReponseErreur {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
}

// @Catch() sans argument = attrape TOUT (HttpException et erreurs imprévues).
// On passe par l'adaptateur HTTP (et pas Express directement) pour rester
// indépendant de la plateforme.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const requete = ctx.getRequest<unknown>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // On n'expose jamais le détail interne d'une erreur imprévue au client.
    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Erreur interne du serveur';

    const corps: ReponseErreur = {
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      // getRequestUrl renvoie `any` (signature Nest) : on fige le type en chaîne.
      path: String(httpAdapter.getRequestUrl(requete)),
    };

    httpAdapter.reply(ctx.getResponse<unknown>(), corps, statusCode);
  }
}

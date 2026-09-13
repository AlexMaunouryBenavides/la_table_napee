import {
  type ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { type HttpAdapterHost } from '@nestjs/core';

import { AllExceptionsFilter } from './all-exceptions.filter';

// `error-handling.r8` + `security.r9` : une erreur serveur doit laisser une trace
// côté serveur, et le client ne doit rien apprendre de plus qu'un message générique.

const CHEMIN = '/api/peu-importe';
const SECRET_INTERNE = 'SELECT * FROM users WHERE motDePasseHash';

interface ReponseEnvoyee {
  corps: unknown;
  code: number;
}

let envoyee: ReponseEnvoyee;

const adaptateur = {
  httpAdapter: {
    getRequestUrl: () => CHEMIN,
    reply: (_reponse: unknown, corps: unknown, code: number) => {
      envoyee = { corps, code };
    },
  },
} as unknown as HttpAdapterHost;

const hote = {
  switchToHttp: () => ({ getRequest: () => ({}), getResponse: () => ({}) }),
} as unknown as ArgumentsHost;

const filtre = new AllExceptionsFilter(adaptateur);

const corpsEnvoye = () => envoyee.corps as { message: string };

describe('AllExceptionsFilter', () => {
  let erreurs: jest.SpyInstance;
  let avertissements: jest.SpyInstance;

  beforeEach(() => {
    erreurs = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    avertissements = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('journalise une erreur imprévue sans rien en dire au client', () => {
    filtre.catch(new Error(SECRET_INTERNE), hote);

    expect(erreurs).toHaveBeenCalledTimes(1);
    expect(String(erreurs.mock.calls[0])).toContain(SECRET_INTERNE);

    expect(corpsEnvoye().message).toBe('Erreur interne du serveur');
    expect(JSON.stringify(envoyee.corps)).not.toContain(SECRET_INTERNE);
  });

  it('ne journalise pas une erreur d’entrée du client (400)', () => {
    filtre.catch(new BadRequestException('champ manquant'), hote);

    expect(erreurs).not.toHaveBeenCalled();
    expect(avertissements).not.toHaveBeenCalled();
  });

  it('journalise un refus d’autorisation (403) en avertissement', () => {
    filtre.catch(new ForbiddenException("Cet avis n'est pas le vôtre"), hote);

    expect(avertissements).toHaveBeenCalledTimes(1);
    expect(String(avertissements.mock.calls[0])).toContain(CHEMIN);
    expect(erreurs).not.toHaveBeenCalled();
  });
});

import { type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type RoleUtilisateur } from '@recipe/types';

import { type IdentiteRequete } from './identite-requete';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

// Vraies routes décorées et vrai Reflector : on éprouve la chaîne complète
// (@Roles pose la métadonnée → le guard la relit), pas un mock de nos suppositions.
class RoutesDeTest {
  @Roles('moderateur')
  moderation(): boolean {
    return true;
  }

  @Roles('admin')
  administration(): boolean {
    return true;
  }

  publique(): boolean {
    return true;
  }
}

type Route = keyof RoutesDeTest;

const guard = new RolesGuard(new Reflector());

function contexte(route: Route, role?: RoleUtilisateur): ExecutionContext {
  const user: IdentiteRequete | undefined =
    role === undefined ? undefined : { id: 'peu-importe', role };

  return {
    getHandler: () => RoutesDeTest.prototype[route],
    getClass: () => RoutesDeTest,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('laisse passer un rôle supérieur à celui exigé (admin ⊃ modérateur)', () => {
    expect(guard.canActivate(contexte('moderation', 'admin'))).toBe(true);
  });

  it('laisse passer le rôle exactement exigé', () => {
    expect(guard.canActivate(contexte('moderation', 'moderateur'))).toBe(true);
  });

  it('refuse un rôle inférieur', () => {
    expect(guard.canActivate(contexte('administration', 'moderateur'))).toBe(
      false,
    );
  });

  it("refuse quand personne n'est authentifié", () => {
    expect(guard.canActivate(contexte('moderation'))).toBe(false);
  });

  it("ne dit rien quand la route n'exige aucun rôle", () => {
    expect(guard.canActivate(contexte('publique', 'utilisateur'))).toBe(true);
  });
});

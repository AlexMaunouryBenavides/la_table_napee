import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Répond à UNE question : « es-tu authentifié ? » → 401 sinon. Le droit d'agir, lui,
// se juge ailleurs (RolesGuard pour le rôle, le service pour la propriété).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

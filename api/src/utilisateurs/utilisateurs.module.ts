import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';

import { AdministrationUtilisateursController } from './administration-utilisateurs.controller';
import { Utilisateur } from './entities/utilisateur.entity';
import { UtilisateursController } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';

@Module({
  // `AuthModule` fournit le hachage et le dépôt de jetons : changer son mot de passe
  // touche à l'un et à l'autre.
  imports: [TypeOrmModule.forFeature([Utilisateur]), AuthModule],
  // L'ORDRE COMPTE : `utilisateurs/moi` doit être déclaré avant `utilisateurs/:id`,
  // sinon `DELETE /utilisateurs/moi` part vers la route d'administration.
  controllers: [UtilisateursController, AdministrationUtilisateursController],
  providers: [UtilisateursService],
  exports: [TypeOrmModule],
})
export class UtilisateursModule {}

import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

// Hash d'un mot de passe qui n'existe pas. Sert à faire travailler Argon2 même quand
// l'email est inconnu : sans lui, la connexion répondrait plus vite pour un compte
// inexistant, ce qui permettrait d'énumérer les emails au chronomètre.
const HASH_FACTICE =
  '$argon2id$v=19$m=65536,p=4,t=3$t/IOY/j3jmXZAHN4uAFQ+w$6y2lwLcW7aBUSesv0Qg+cVVee7Y8N5yBEAOK+BGiRhk';

@Injectable()
export class HachageMotDePasse {
  // Argon2id par défaut, sel aléatoire inclus dans la chaîne produite : aucune
  // colonne `salt` à gérer, et deux mots de passe identiques donnent deux hash.
  hacher(motDePasse: string): Promise<string> {
    return argon2.hash(motDePasse);
  }

  // `verify` relit les paramètres depuis le hash lui-même : augmenter le coût plus
  // tard n'invalidera pas les hash existants.
  verifier(hash: string | undefined, motDePasse: string): Promise<boolean> {
    return argon2.verify(hash ?? HASH_FACTICE, motDePasse);
  }
}

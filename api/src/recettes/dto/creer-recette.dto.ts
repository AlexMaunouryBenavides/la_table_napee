import {
  DIFFICULTES,
  type Difficulte,
  TYPES_RECETTE,
  type TypeRecette,
  UNITES,
  type Unite,
} from '@recipe/types';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const LONGUEUR_TEXTE_COURT = 255;
const LONGUEUR_URL = 512;
const DECIMALES_QUANTITE = 2;

// Un ingrédient se saisit par son NOM, pas par son identifiant : le modérateur tape
// « tomate » sans savoir si la ligne existe déjà. Le service tranche (trouver ou créer).
export class IngredientSaisiDto {
  @IsString()
  @MaxLength(LONGUEUR_TEXTE_COURT)
  nom!: string;

  // Absente = « à volonté » (sel, poivre) : ce n'est pas zéro.
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: DECIMALES_QUANTITE })
  @IsPositive()
  quantite?: number;

  @IsIn(UNITES)
  unite!: Unite;
}

export class CreerRecetteDto {
  @IsString()
  @MaxLength(LONGUEUR_TEXTE_COURT)
  titre!: string;

  @IsString()
  description!: string;

  @IsUrl()
  @MaxLength(LONGUEUR_URL)
  image!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(LONGUEUR_URL)
  video?: string;

  @IsIn(DIFFICULTES)
  difficulte!: Difficulte;

  @IsIn(TYPES_RECETTE)
  typeRecette!: TypeRecette;

  @IsInt()
  @Min(0)
  tempsPreparation!: number;

  @IsInt()
  @Min(0)
  tempsCuisson!: number;

  @IsInt()
  @IsPositive()
  portions!: number;

  @IsInt()
  nationaliteId!: number;

  // `@ValidateNested` sans `@Type` ne valide RIEN, en silence : les deux vont ensemble.
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => IngredientSaisiDto)
  ingredients!: IngredientSaisiDto[];

  // Les étapes n'ont pas de vie propre : un tableau ordonné suffit, leur numéro se
  // déduit de leur position. Pas de sous-ressource (`design/routes-api.md` § 5).
  @ArrayNotEmpty()
  @IsString({ each: true })
  etapes!: string[];

  @IsOptional()
  @IsInt({ each: true })
  regimes?: number[];

  @IsOptional()
  @IsInt({ each: true })
  criteresSante?: number[];

  @IsOptional()
  @IsInt({ each: true })
  typesAliment?: number[];
}

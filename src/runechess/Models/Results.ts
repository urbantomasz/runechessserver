export interface CastNotValidResult {}

export interface MoveUnitResult {
  selectedUnit: GameObjectID;
  tile: GameObjectID;
  isPeasantPromoted: boolean;
}

export interface CaptureUnitResult {
  selectedUnit: string;
  selectedUnitNewTile: string;
  capturedUnit: string;
  isPeasantPromoted: boolean;
}

export interface EnPassantResult {
  peasant: string;
  capturedPeasant: string;
  enPassantTile: string;
}

export interface CastSpellResult {
  castingUnit: string;
  targetingObject: string;
}

export interface KnightCastSpellResult extends CastSpellResult {
  unitTileMap: string;
}

export interface PrincessCastSpellResult extends CastSpellResult {
  castingUnitNewTile: string;
  targetingUnit: string;
  targetingUnitNewTile: string;
}

// Assuming Mage, Priest, and King are the same as Princess and Rogue
interface RogueCastSpellResult extends PrincessCastSpellResult {}
interface MageCastSpellResult extends PrincessCastSpellResult {}
interface PriestCastSpellResult extends PrincessCastSpellResult {}
interface KingCastSpellResult extends PrincessCastSpellResult {}
// selectedUnit: data.selectedUnit,
// selectedUnitNewTile: Tile.CreateTileId(
//   selectedUnit.row,
//   selectedUnit.column
// ),
// capturedUnit: data.capturingUnit,

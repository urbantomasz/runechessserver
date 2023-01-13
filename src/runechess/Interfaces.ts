import { Color } from "./Enums";
import { Move } from "./Move";
import { AvailableCasts } from "./SpellManager";
import { Tile } from "./Tile";
import { Unit } from "./Unit";
import { AvailableMoves } from "./Validator";

export interface IGame{
    Units: Unit[];
    Tiles: Tile[][];
    UnitsAvailableMoves: Map<Unit, AvailableMoves>
    UnitsAvailableCasts: Map<Unit, AvailableCasts>
    Moves: Move[];
    GetPlayerTurnColor: () => Color;
    TryMoveUnit: (selectedUnitId: string, tileId: string) => boolean;
    TryCaptureUnit: (selectedUnitId: string, capturingUnitId: string) => boolean;
    TryCastingSpell: (castingUnitId: string, targetUnitId: string) => boolean;
}
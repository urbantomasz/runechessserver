import { BotMove } from "./Bot";
import { Color } from "./Enums";
import { GameObject } from "./GameObject";
import { Move } from "./Move";
import { ISpell } from "./Spell";
import { AvailableCasts } from "./SpellManager";
import { MoveUnitResult } from "./StateManager";
import { Tile } from "./Tile";
import { Unit } from "./Unit";
import { AvailableMoves } from "./Validator";
import { ICommand} from "./Commands"

export interface IGame{
    Units: Unit[];
    Tiles: Tile[][];
    UnitsAvailableMoves: Map<Unit, AvailableMoves>
    UnitsAvailableCasts: Map<Unit, AvailableCasts>
    Spells: Map<Unit, ISpell>
    Moves: Move[];
    IsMate(): boolean;
    IsCheck(): boolean;
    GetPlayerTurnColor: () => Color;
    GetGameObjectById: (objectId: string) => GameObject;
    GetAllPossibleCommands(): ICommand[];
    GetBestMove(depth: number): BotMove;
    TryMoveUnit: (selectedUnitId: string, tileId: string) => MoveUnitResult;
    TryCaptureUnit: (selectedUnitId: string, capturingUnitId: string) => boolean;
    TryCastingSpell: (castingUnitId: string, targetUnitId: string) => boolean;
}
import { BotMove } from "./Bot";
import { GameObject } from "./GameObject";

import {
  CaptureUnitResult,
  CastNotValidResult,
  CastSpellResult,
  EnPassantResult,
  MoveUnitResult,
} from "./StateManager";
import { GameStateDTO } from "./DTOs";
import { Unit } from "./Unit";
import { ISpell } from "./Spell";

export interface IGame {
  State: GameStateDTO;
  GetBestMove(depth: number): BotMove;
  TryMoveUnit: (selectedUnitId: UnitID, tileId: TileID) => MoveUnitResult;
  TryCaptureUnit: (
    selectedUnitId: UnitID,
    capturingUnitId: UnitID
  ) => CaptureUnitResult;
  TryEnPassantUnit: (
    peasantId: UnitID,
    capturingPeasantId: UnitID
  ) => EnPassantResult;
  TryCastingSpell: (
    castingUnitId: UnitID,
    targetUnitId: GameObjectID
  ) => CastSpellResult | CastNotValidResult;
}

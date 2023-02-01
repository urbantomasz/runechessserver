import { number } from "@colyseus/schema/lib/encoding/decode";
import { Color, TargetColor } from "./Enums";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { SpellManager } from "./SpellManager";
import { Tile } from "./Tile";
import { Unit } from "./Unit";

export interface ISpell {  
    // A method to return an array of valid targets for the spell.
    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): GameObject[];
    // The function to be executed when the spell is cast.
    Cast: (castingUnit: Unit, target: GameObject, spellManager: SpellManager) => void;
    // A method that undo Cast
    Undo: () => void;
  }

export class Castle implements ISpell{
    _castingUnit: Unit;
    _targetUnit: GameObject;
    _castingUnitStartingRow: number;
    _castingUnitStartingColumn: number;
    _targetUnitStartingRow: number;
    _targetUnitStartingColumn: number;

    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): GameObject[] {
        return spellManager.GetSwapCastables(castingUnit);
    }

    Cast(castingUnit: Unit, targetUnit: GameObject, spellManager: SpellManager){
        this._castingUnit = castingUnit;
        this._targetUnit = targetUnit;
        this._castingUnitStartingRow = castingUnit.row;
        this._castingUnitStartingColumn = castingUnit.column;
        this._targetUnitStartingRow = targetUnit.row;
        this._targetUnitStartingColumn = targetUnit.column;

        spellManager.CastSwapCastables(castingUnit, targetUnit as Unit);
    }

    Undo(){
    this._castingUnit.row = this._castingUnitStartingRow;
    this._castingUnit.column = this._castingUnitStartingColumn;
    this._targetUnit.row = this._targetUnitStartingRow
    this._targetUnit.column = this._targetUnitStartingColumn;
    }
}

export class Sacrifice implements ISpell{
    _castingUnit: Unit;
    _targetUnit: Unit;
    _castingUnitStartingRow: number;
    _castingUnitStartingColumn: number;
    _targetUnitStartingRow: number;
    _targetUnitStartingColumn: number;

    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Unit[] {
        return spellManager.GetSacrificeCastables(castingUnit);
    }

    Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
        this._castingUnit = castingUnit;
        this._targetUnit = target as Unit;
        this._castingUnitStartingRow = castingUnit.row;
        this._castingUnitStartingColumn = castingUnit.column;
        this._targetUnitStartingRow = target.row;
        this._targetUnitStartingColumn = target.column;
        spellManager.CastSacrifice(castingUnit, target as Unit);
    }

    Undo(){
        this._castingUnit.isCaptured = false;
        this._castingUnit.row = this._castingUnitStartingRow;
        this._castingUnit.column = this._castingUnitStartingColumn;
        this._targetUnit.row = this._targetUnitStartingRow
        this._targetUnit.column = this._targetUnitStartingColumn;
    }
}

export class Shadowstep implements ISpell{
    _adjacentsTiles: Map<Unit,Tile> = new Map<Unit, Tile>();
    _castingUnit: Unit;
    _targetUnit: Unit;
    _castingUnitStartingRow: number;
    _castingUnitStartingColumn: number;

    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Unit[] {
        let shadowstepCastables = spellManager.GetShadowstepCastables(castingUnit);
        this._adjacentsTiles = shadowstepCastables.AdjacentTiles;
        return shadowstepCastables.Targets;
    }

    Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
        this._castingUnit = castingUnit;
        this._targetUnit = target as Unit;
        this._castingUnitStartingRow = castingUnit.row 
        this._castingUnitStartingColumn = castingUnit.column;

        spellManager.CastShadowstep(castingUnit, target as Unit, this._adjacentsTiles);
    }

    Undo(){
        this._castingUnit.row = this._castingUnitStartingRow;
        this._castingUnit.column = this._castingUnitStartingColumn;
        this._targetUnit.isCaptured = false;
    }
}

export class Ressurection implements ISpell{
    _targetUnit: Unit;
    _targetUnitColor: Color;

    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Unit[] {
        return spellManager.GetResurrectionCastables(castingUnit);
    }

    Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
        this._targetUnit = target as Unit;
        this._targetUnitColor = this._targetUnit.color;

        spellManager.CastRessurection(castingUnit, target as Unit);
    }

    Undo(){
        this._targetUnit.isCaptured = true;
        this._targetUnit.color = this._targetUnitColor;
    }
}

export class DestroyTile implements ISpell{
    _targetingTile: Tile;
    _targeTileLastCapturedUnit: Unit;

    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Tile[] {
        return spellManager.GetUnoccupiedTiles();
    }

    Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
        this._targetingTile = target as Tile;
        this._targeTileLastCapturedUnit = this._targetingTile.lastCapturedUnit;
        spellManager.CastDestroyTile(target as Tile);
    }

    Undo(){
        this._targetingTile.isDestroyed = false;
        this._targetingTile.lastCapturedUnit = this._targeTileLastCapturedUnit;
    }
}

// export class SpawnTile implements ISpell{
//     GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Tile[] {
//         return spellManager.GetDestroyedTiles();
//     }
//     Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
//         spellManager.CastSpawnTile(target as Tile);
//     }
// }

export class PowerStomp implements ISpell{
    _tilesBehindMap: Map<Tile,Map<Unit,Tile>> = new Map<Tile,Map<Unit,Tile>>();
    _castingUnit: Unit; 
    _castingUnitStartingRow: number;
    _castingUnitStartingColumn: number;
    _affectedUnitPositions: Map<Unit, {startingRow: number, startingColumn: number}>;

    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Tile[] {
         const powerStompCastables = spellManager.GetPowerStompCastables(castingUnit);
         this._tilesBehindMap = powerStompCastables.TileToUnitToTileBehindMap;
         return powerStompCastables.Targets;
    }

    Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
        this._castingUnit = castingUnit;
        this._castingUnitStartingRow = castingUnit.row;
        this._castingUnitStartingColumn = castingUnit.column;
        this._affectedUnitPositions = new Map<Unit, {startingRow: number, startingColumn: number}>();
        this._tilesBehindMap.get(target as Tile).forEach((tile: Tile, unit: Unit) =>{
            this._affectedUnitPositions.set(unit, {startingRow: unit.row, startingColumn: unit.column});
        })
        spellManager.CastPowerStomp(castingUnit, target as Tile, this._tilesBehindMap.get(target as Tile));
    }

    Undo(){
        this._castingUnit.row = this._castingUnitStartingRow;
        this._castingUnit.column = this._castingUnitStartingColumn;
        this._affectedUnitPositions.forEach((position,unit) =>{
            unit.row = position.startingRow;
            unit.column = position.startingColumn;
            unit.isCaptured = false;
        })
    }
}
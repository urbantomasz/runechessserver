import { Color, Spell } from "./Enums";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { ISpell } from "./Spell";
import { SpellManager } from "./SpellManager";
import { Tile } from "./Tile";
import { King, Peasant, Unit } from "./Unit";

interface ICommand {
    Execute(): void;
    Undo(): void;
}

class PromotePeasantCommand implements ICommand{
    private _units: Unit[];
    private _isPeasantPromoted: any;
    private _unit: Unit;
    private _tile: Tile;

    constructor(unit: Unit, tile: Tile, units: Unit[]) {
        this._unit = unit;
        this._tile = tile;
        this._units = units;
        this._isPeasantPromoted = false;
    }

    Execute(): void {
        if(this._unit instanceof Peasant && this._unit.color === Color.Blue && this._tile.row === Game.BOARD_ROWS-1 ||
        this._unit instanceof Peasant && this._unit.color === Color.Red && this._tile.row === 0){
                let unitIndex = this._units.findIndex(u => u === this._unit);
                let king = new King(this._unit.color, new Tile(this._tile.row, this._tile.column))
                king.id = this._unit.id;
                this._units[unitIndex] = king;
                this._isPeasantPromoted = true;
        }
    }
    Undo(): void {
        if(this._isPeasantPromoted){
            let kingIndex = this._units.findIndex(u => u === this._unit);
            this._units[kingIndex] = this._unit;
        }
    }
}

export class MoveCommand implements ICommand{
    private _unit: Unit;
    private _unitStartRow: number;
    private _unitStartColumn: number;
    private _unitIsMoved: boolean;
    private _tile: Tile;
    private _promotePeasantCommand: PromotePeasantCommand

    constructor(unit: Unit, tile: Tile, units: Unit[]) {
        this._unit = unit;
        this._tile = tile;
        this._unitIsMoved = unit.isMoved;
        this._unitStartRow = unit.row;
        this._unitStartColumn = unit.column;
        this._promotePeasantCommand = new PromotePeasantCommand(unit, tile, units);
    }
    Execute(): void {
        this._unit.column = this._tile.column;
        this._unit.row = this._tile.row;
        this._unit.isMoved = true;
        this._promotePeasantCommand.Execute();
    }
    Undo(): void {
        this._unit.column = this._unitStartColumn;
        this._unit.row = this._unitStartRow;
        this._unit.isMoved = this._unitIsMoved;
        this._promotePeasantCommand.Undo();
    }
    
}

export class CaptureCommand implements ICommand{
    private _moveCommnad: MoveCommand;
    private _capturingUnit: Unit;
    private _capturingUnitTile: Tile;
    private _capturingUnitTileLCU: Unit;
    constructor(unit: Unit, capturingUnit: Unit, units: Unit[], tiles: Tile[][]) {
        this._capturingUnit = capturingUnit;
        this._capturingUnitTile = tiles[this._capturingUnit.row][this._capturingUnit.column];
        this._moveCommnad = new MoveCommand(unit, this._capturingUnitTile, units);
        this._capturingUnitTileLCU = this._capturingUnitTile.lastCapturedUnit;
    }
    Execute(): void {
        this._capturingUnit.isCaptured = true;
        this._capturingUnitTile.lastCapturedUnit = this._capturingUnit;
        this._moveCommnad.Execute();
    }
    Undo(): void {
        this._capturingUnit.isCaptured = false;
        this._capturingUnitTile.lastCapturedUnit = this._capturingUnitTileLCU;
        this._moveCommnad.Undo();
    }
}

export class SpellCommand implements ICommand{
    private _unitSpell: ISpell;
    private _targetObject: GameObject;
    private _castingUnit: Unit;
    private _tiles: Tile[][];
    private _spellManager: SpellManager;

    constructor(castingUnit: Unit, targetObject: GameObject, spells: Map<Unit, ISpell>, tiles: Tile[][], spellManager: SpellManager) {
        this._castingUnit = castingUnit;
        this._targetObject = targetObject;
        this._tiles = tiles;
        this._unitSpell = spells.get(castingUnit)
        this._spellManager = spellManager;
    }
    
    Execute(): void {
        this._unitSpell.Cast(this._castingUnit, this._targetObject, this._spellManager);
        
        if(this._tiles[this._castingUnit.row][this._castingUnit.column].isDestroyed){
            this._castingUnit.isCaptured = true;
        }

        if(this._targetObject instanceof Unit && this._tiles[this._targetObject.row][this._targetObject.column].isDestroyed){
            this._targetObject.isCaptured = true;
        }

        this._castingUnit.usedSpell = true;
    }
    Undo(): void {
        if(!this._tiles[this._castingUnit.row][this._castingUnit.column].isDestroyed){
            this._castingUnit.isCaptured = false;
        }

        if(this._targetObject instanceof Unit && !this._tiles[this._targetObject.row][this._targetObject.column].isDestroyed){
            this._targetObject.isCaptured = false;
        }

        this._unitSpell.Undo();

        this._castingUnit.usedSpell = false;
    }
}

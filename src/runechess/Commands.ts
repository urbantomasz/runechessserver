import { Color } from "./Enums";
import { Game } from "./Game";
import { Tile } from "./Tile";
import { King, Peasant, Unit } from "./Unit";

interface ICommand {
    Execute(): void;
    Undo(): void;
}

function promoteToKing(unit: Unit, units: Unit[]){

}

functio undoKingPromote()

class MoveCommand implements ICommand{
    private _unit: Unit;
    private _unitStartRow: number;
    private _unitStartColumn: number;
    private _unitIsMoved: boolean;
    private _units: Unit[];
    private _tile: Tile;
    private _isPawnPromoted: boolean;

    constructor(unit: Unit, tile: Tile) {
        this._unit = unit;
        this._tile = tile;
        this._unitIsMoved = unit.isMoved;
        this._unitStartRow = unit.row;
        this._unitStartColumn = unit.column;
    }
    Execute(): void {
        if(this._unit instanceof Peasant && this._unit.color === Color.Blue && this._tile.row === Game.BOARD_ROWS-1 ||
            this._unit instanceof Peasant && this._unit.color === Color.Red && this._tile.row === 0){
            let unitIndex = this._units.findIndex(u => u === this._unit);
            let king = new King(this._unit.color, new Tile(this._tile.row, this._tile.column))
            king.id = this._unit.id;
            this._units[unitIndex] = king;
            return;
        }
        this._unit.column = this._tile.column;
        this._unit.row = this._tile.row;
        this._unit.isMoved = true;
    }
    Undo(): void {
        if(this._isPawnPromoted){
            let kingIndex = this._units.findIndex(u => u === this._unit);
            this._units[kingIndex] = this._unit;
        }
        this._unit.column = this._unitStartColumn;
        this._unit.row = this._unitStartRow;
        this._unit.isMoved = this._unitIsMoved;
    }
    
}

class CaptureCommand implements ICommand{
    private _unit: Unit;
    private _unitStartRow: number;
    private _unitStartColumn: number;
    private _unitIsMoved: boolean;
    private _units: Unit[];
    private _tile: Tile;
    private _isPawnPromoted: boolean;

    constructor(unit: Unit, tile: Tile) {
        this._unit = unit;
        this._tile = tile;
        this._unitIsMoved = unit.isMoved;
        this._unitStartRow = unit.row;
        this._unitStartColumn = unit.column;
    }
    Execute(): void {
        if(this._unit instanceof Peasant && this._unit.color === Color.Blue && this._tile.row === Game.BOARD_ROWS-1 ||
            this._unit instanceof Peasant && this._unit.color === Color.Red && this._tile.row === 0){
            let unitIndex = this._units.findIndex(u => u === this._unit);
            let king = new King(this._unit.color, new Tile(this._tile.row, this._tile.column))
            king.id = this._unit.id;
            this._units[unitIndex] = king;
            return;
        }
        this._unit.column = this._tile.column;
        this._unit.row = this._tile.row;
        this._unit.isMoved = true;
    }
    Undo(): void {
        if(this._isPawnPromoted){
            let kingIndex = this._units.findIndex(u => u === this._unit);
            this._units[kingIndex] = this._unit;
        }
        this._unit.column = this._unitStartColumn;
        this._unit.row = this._unitStartRow;
        this._unit.isMoved = this._unitIsMoved;
    }

}

let capturingUnitTile = this._tiles[capturingUnit.row][capturingUnit.column];
capturingUnit.isCaptured = true;
capturingUnitTile.lastCapturedUnit = capturingUnit;
this.MoveUnit(selectedUnit, capturingUnitTile);
this._moves.push(new Move(selectedUnit, capturingUnit, true))
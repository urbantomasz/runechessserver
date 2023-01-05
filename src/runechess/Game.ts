import { Player } from "./Player";
import { Tile } from "./Tile";
import { EventEmitter } from "@billjs/event-emitter";
import { Unit } from "./Unit";
import { AvailableMoves, Validator } from "./Validator";
import { StateManager } from "./StateManager";
import { AvailableCasts, SpellManager } from "./SpellManager";
import { Color } from "./Enums";
import { GameObject } from "./GameObject";
//todo move some subclasses to game maybe as interfaces or abstract classes 
export class Game {
    public static BOARD_ROWS = 8;
    public static BOARD_COLUMNS = 9;
    private readonly _players: Player[];
    private readonly _validator: Validator;
    private readonly _stateManager: StateManager;
    private readonly _spellManager: SpellManager;
 
    constructor() {
        this._players = [new Player(Color.Blue), new Player(Color.Red)];
        let tiles = this.initializeTiles();
        let units = this.initializeUnits();
        this._validator = new Validator(units, tiles);
        this._spellManager = new SpellManager(units, tiles, this._validator);
        this._stateManager = new StateManager(units, tiles, this._validator, this._spellManager);
    };

    // public TryCaptureUnit(selectedUnit: Unit, capturingUnit: Unit): void{
    //     this._stateManager.TakeUnit(selectedUnit, capturingUnit);
    // }

    // public TryMoveUnit(selectedUnit: Unit, tile: Tile): void{
    //     this._stateManager.MoveUnit(selectedUnit, tile);
    // }

    public GetPlayerTurnColor(): Color{
        return this._stateManager.PlayerTurnColor;
    }

    public TryMoveUnit(selectedUnitId: string, tileId: string): boolean{
        return this._stateManager.TryMoveUnit(
            this.getGameObjectById(selectedUnitId) as Unit,
            this.getGameObjectById(tileId) as Tile
        );
    }

    public TryCaptureUnit(selectedUnitId: string, capturingUnitId: string): boolean{
        return this._stateManager.TryTakeUnit(
            this.getGameObjectById(selectedUnitId) as Unit,
            this.getGameObjectById(capturingUnitId) as Unit
        );
    }

    public TryCastingSpell(castingUnitId: string, targetUnitId: string): boolean{
        return this._stateManager.TryCastingSpell(
            this.getGameObjectById(castingUnitId) as Unit,
            this.getGameObjectById(targetUnitId) as Unit,
            );
    }

    private initializeUnits(): Unit[]{
        return this._players[0].GetStartingUnits().concat(this._players[1].GetStartingUnits());
    }

    private initializeTiles(): Tile[][] {
        let tiles: Tile[][] = [];
        for (let i = 0; i < Game.BOARD_ROWS; i++) {
            tiles[i] = [];
            for (let j = 0; j < Game.BOARD_COLUMNS; j++) {
                tiles[i][j] = new Tile(i, j);
            }
        }
        return tiles;
    }

    public get Tiles(): Tile[][]{
        return this._stateManager.Tiles;
    }

    public get Units(): Unit[]{
        return this._stateManager.Units;
    }

    public get UnitsAvailableMoves(): Map<Unit, AvailableMoves>{
        return this._validator.UnitsAvailableMoves;
    }

    public get UnitsAvailableCasts(): Map<Unit, AvailableCasts>{
        return this._spellManager.UnitsAvailableCasts;
    }

    private getGameObjectById(id: string): GameObject{
        if(id.includes("unit")){
            return this._stateManager.GetUnitById(id);
        }
    
        if(id.includes("tile")){
            return this._stateManager.GetTileById(id);
        }
            

        return null;
    }

   
}
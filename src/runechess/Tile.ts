import { GameObject } from "./GameObject";
import { Unit } from "./Unit";


export class Tile extends GameObject{
    row: number
    column: number
    isDestroyed: boolean
    lastCapturedUnit: Unit | null;
    constructor(row: number, column: number){
        super();
        this.row = row;
        this.column = column;
        this.id = this.getTileId();
        this.isDestroyed = false;
        this.lastCapturedUnit = null;
    }
    
    private getTileId(): string {
        return "tile_".concat(this.row.toString(), this.column.toString());
    }
}
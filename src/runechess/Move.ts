import { Tile } from "./Tile";
import { Unit } from "./Unit";

export class Move {
    startAt: Tile;
    endAt: Tile;
    unit: Unit;
    capturedUnit: Unit | null;
    isComplete: boolean;


    completeMove(tile: Tile, capturedUnit: Unit): Move {
        this.isComplete = true;
        this.capturedUnit = capturedUnit;
        this.endAt = tile;
        return this;
    }

    constructor(tile: Tile, unit: Unit) {
        this.isComplete = false;
        this.capturedUnit = null;
        this.unit = unit;
        this.startAt = tile;
    }

}
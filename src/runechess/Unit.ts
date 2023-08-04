import { Color } from "./Enums";
import { GameObject } from "./GameObject";
import { rotateMatrix90 } from "./Helpers";
import { Tile } from "./Tile";

export abstract class Unit extends GameObject{
    color: Color;
    name: string;
    protected  _movePattern: number[][];
    public get movePattern(): number[][] {
        return this._movePattern;
    }
    public set movePattern(value: number[][]) {
        this._movePattern = value;
    }
    isCaptured: boolean;
    isMoved: boolean;
    usedSpell: boolean;

    constructor(color: Color, startAt: Tile, movePattern: number[][]) {
        super()
        this.color = color;  
        this.movePattern = rotateMatrix90(movePattern);
        super.id = 'unit_'.concat(startAt.row.toString(), startAt.column.toString());
        this.row = startAt.row
        this.column = startAt.column
        this.isMoved = false;
        this.isCaptured = false;
        this.usedSpell = false;
    }

    public toNotationString(): string{
        return this.constructor.name[0].toUpperCase();
    }
}

export class Princess extends Unit {
    constructor(unitColor: Color, startAt: Tile) {
        let movePattern  = [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
        ]

        super(unitColor, startAt, movePattern);
    }
}

export class Peasant extends Unit {
    

    constructor(unitColor: Color, startAt: Tile) {
        let movePattern  = [
            [0, 0, 3, 0, 0],
            [0, 2, 3, 2, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ]

        super(unitColor, startAt, movePattern);
        this.usedSpell = true;
    }

    public override get movePattern(): number[][]{
        if(this.isMoved){
            return [
                [0, 0, 2],
                [0, 0, 3],
                [0, 0, 2],
            ]
        }
        return this._movePattern;
    }

    public override set movePattern(value: number[][]) {
        this._movePattern = value;
    }
}

export class Dragon extends Unit {
    constructor(unitColor: Color, startAt: Tile) {
    let movePattern = [
        [Infinity,  0,  Infinity, 0,    Infinity],
        [0,         0,  0,        0,    0       ],
        [Infinity,  0,  0,        0,    Infinity],
        [0,         0,  0,        0,    0       ],
        [Infinity,  0,  Infinity, 0,    Infinity]
    ]

        super(unitColor, startAt, movePattern);
    }
}

export class King extends Unit {
    constructor(unitColor: Color, startAt: Tile) {
        let movePattern = [
            [Infinity,         Infinity,          Infinity],
            [Infinity,  0,                        Infinity],
            [Infinity,         Infinity,          Infinity],
        ]

        super(unitColor, startAt, movePattern);
    }
}

export class Mage extends Unit {
    constructor(unitColor: Color, startAt: Tile) {
        let movePattern = [
            [0,         Infinity,          0],
            [Infinity,  0,          Infinity],
            [0,         Infinity,          0],
        ]

        super(unitColor, startAt, movePattern);
    }
}

export class Priest extends Unit {
    constructor(unitColor: Color, startAt: Tile) {
        let movePattern = [
            [0, 1, 0],
            [1, 0, 1],
            [0, 1, 0],
        ]
    
        super(unitColor, startAt, movePattern);
    }
}

export class Druid extends Unit {
    constructor(unitColor: Color, startAt: Tile) {
        let movePattern = [
            [0, 1, 0],
            [1, 0, 1],
            [0, 1, 0],
        ]

        super(unitColor, startAt, movePattern);
    }
}

export class Knight extends Unit {
    constructor(unitColor: Color, startAt: Tile) {
        let movePattern = [
            [0,  1,  0,    1,    0],
            [1,  0,  0,    0,    1],
            [0,  0,  0,    0,    0],
            [1,  0,  0,    0,    1],
            [0,  1,  0,    1,    0]
        ]
        super(unitColor, startAt, movePattern);
    }
}

export class Rogue extends Unit {
    constructor(unitColor: Color, startAt: Tile) {
        let movePattern = [
            [Infinity, 0, Infinity],
            [0, 0, 0],
            [Infinity, 0, Infinity]
        ]
        
        super(unitColor, startAt, movePattern);
    }
}

export class DarkKnight extends King{
}

export class Wolf extends Unit {
    constructor(unitColor: Color, startAt: Tile) {
        let movePattern = [
            [1, 1, 1],
            [0, 0, 0],
            [0, 1, 0]
        ]
        super(unitColor, startAt, movePattern);
    }
}
export class TileDTO {
    id: string;
    row: number;
    column: number;
    lastCapturedUnit: string;
    isDestroyed: boolean;
}
  
export class UnitDTO {
    id: string;
    column: number;
    row: number;
    isMoved: boolean;
    usedSpell: boolean;
    isCaptured: boolean;
    color: number;
    type: number
}

export class AvailableMovesDTO{
    Tiles: string[];
    Units: string[];
}

export class AvailableCastsDTO{
    Targets: string[];
}
  
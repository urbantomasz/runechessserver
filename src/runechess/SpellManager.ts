import { StateManager } from "./StateManager";
import { Tile } from "./Tile";
import { King, Knight, Mage, Priest, Princess, Rogue, Unit } from "./Unit";
import {
  Castle,
  DestroyTile,
  ISpell,
  PowerStomp,
  Ressurection,
  Sacrifice,
  Shadowstep,
} from "./Spell";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { Validator } from "./Validator";
import { Color } from "./Enums";

export interface AvailableCasts {
  Targets: GameObject[];
}

export class SpellManager {
  private readonly _units: Unit[];
  private readonly _tiles: Tile[][];
  private readonly _validator: Validator;
  private _spells: Map<Unit, ISpell>;
  private _isSpellCheck: boolean;
  private _isSpellMate: boolean;
  private _unitsAvailableCasts: Map<Unit, AvailableCasts>;
  public get UnitsAvailableCasts(): Map<Unit, AvailableCasts> {
    return this._unitsAvailableCasts;
  }

  public GetUnitsAvailableCastsByPlayerColor(
    playerColor: Color
  ): Map<Unit, AvailableCasts> {
    return new Map(
      [...this.UnitsAvailableCasts].filter(([k, v]) => k.color === playerColor)
    );
  }

  public set UnitsAvailableCasts(
    unitsAvailableCasts: Map<Unit, AvailableCasts>
  ) {
    this._unitsAvailableCasts = unitsAvailableCasts;
  }

  public get Spells(): Map<Unit, ISpell> {
    return this._spells;
  }

  public get IsSpellMate(): boolean {
    return this._isSpellMate;
  }

  public set IsSpellMate(isSpellMate: boolean) {
    this._isSpellMate = isSpellMate;
  }

  public get IsSpellCheck(): boolean {
    return this._isSpellCheck;
  }

  public set IsSpellCheck(isSpellCheck: boolean) {
    this._isSpellCheck = isSpellCheck;
  }

  constructor(units: Unit[], tiles: Tile[][], validator: Validator) {
    this._units = units;
    this._tiles = tiles;
    this._validator = validator;
    this._isSpellCheck = false;
    this._isSpellMate = false;
    this.initializeSpellsDictionary();
    this.UpdateUnitsAvailableCasts();
  }

  private initializeSpellsDictionary() {
    this._spells = new Map<Unit, ISpell>();
    this._units.forEach((unit) => {
      if (unit instanceof Princess) {
        this._spells.set(unit, new Castle());
      } else if (unit instanceof King) {
        this._spells.set(unit, new Sacrifice());
      } else if (unit instanceof Rogue) {
        this._spells.set(unit, new Shadowstep());
      } else if (unit instanceof Priest) {
        this._spells.set(unit, new Ressurection());
      } else if (unit instanceof Mage) {
        this._spells.set(unit, new DestroyTile());
      } else if (unit instanceof Knight) {
        this._spells.set(unit, new PowerStomp());
      }
    });
  }

  private getUnits2DArray(): Unit[][] {
    let units2DArray = Array(Game.BOARD_ROWS).fill(null);

    for (let i = 0; i < Game.BOARD_ROWS; i++) {
      units2DArray[i] = Array(Game.BOARD_COLUMNS).fill(null);
    }

    this._units.forEach((u) => {
      if (!u.isCaptured) {
        units2DArray[u.row][u.column] = u;
      }
    });

    return units2DArray;
  }

  public UpdateUnitsAvailableCasts(omitCheck: boolean = false): void {
    //console.time("updateUnitsAvailableCasts");
    this._unitsAvailableCasts = new Map<Unit, AvailableCasts>();
    this._units.forEach((unit) => {
      if (unit.usedSpell || unit.isCaptured || !this._spells.has(unit)) {
        this._unitsAvailableCasts.set(unit, { Targets: [] });
      } else {
        //console.time("spell: " + unit.constructor.name);
        let unitValidTargets = {
          Targets: this._spells.get(unit).GetValidTargets(unit, this),
        };
        if (!omitCheck) {
          this.FilterUnitCastsThatWouldResultInCheck(unit, unitValidTargets);
        }
        this._unitsAvailableCasts.set(unit, unitValidTargets);
        //console.timeEnd("spell: " + unit.constructor.name);
      }
    });
    //console.timeEnd("updateUnitsAvailableCasts");
    this.checkIfSpellCheck();
    this.checkIfSpellMate();
    //console.log("Is Spell Check? " + this._isSpellCheck);
    //console.log("Is Spell Mate? " + this._isSpellMate);
  }

  private checkIfSpellMate(): void {
    let bluePlayerMoves = 0;
    let redPlayersMoves = 0;
    for (const [unit, cast] of this._unitsAvailableCasts) {
      if (unit.color === Color.Blue && cast.Targets.length > 0) {
        bluePlayerMoves++;
      }
      if (unit.color === Color.Red && cast.Targets.length > 0) {
        redPlayersMoves++;
      }
    }
    this._isSpellMate = bluePlayerMoves === 0 || redPlayersMoves === 0;
  }

  private checkIfSpellCheck(): void {
    let isSpellCheck = false;
    for (let [unit, availableCasts] of this.UnitsAvailableCasts) {
      if (availableCasts.Targets.length === 0) continue;
      const unitSpell = this._spells.get(unit);
      if (
        unitSpell instanceof Shadowstep &&
        availableCasts.Targets.find((u) => u instanceof Princess)
      ) {
        console.log(unit.id + " is checking princess by Shadowstep");
        isSpellCheck = true;
      }
      if (unitSpell instanceof PowerStomp) {
        for (let [_, unitTileMap] of unitSpell._tilesBehindMap) {
          let unitTile = [...unitTileMap][0];
          if (unitTile[0] instanceof Princess && unitTile[1].isDestroyed) {
            console.log(unit.id + " is checking princess by PowerStomp");
            isSpellCheck = true;
          }
        }
      }
    }
    this._isSpellCheck = isSpellCheck;
  }

  FilterUnitCastsThatWouldResultInCheck(
    castingUnit: Unit,
    unitsAvailableCasts: AvailableCasts
  ): void {
    let targetsToRemove = [] as GameObject[];
    let princess = this._units.find(
      (u) => u instanceof Princess && u.color === castingUnit.color
    );

    unitsAvailableCasts.Targets.forEach((targetObject) => {
      let unitSpell = this._spells.get(castingUnit);
      unitSpell.Cast(castingUnit, targetObject, this);

      let availableMovesAfterCast = this._validator.GetUnitsAvailableMoves(
        this._units,
        this._tiles,
        true
      );

      //todo optymalizacja maga i kinga
      // w przypadku maga wystarczy policzyc tylko raz na strone zamiast x4

      for (const [unit, moves] of availableMovesAfterCast) {
        if (unit.color === princess.color) continue;
        if (moves.Units.includes(princess) || princess.isCaptured) {
          targetsToRemove.push(targetObject);
          break;
        }
      }

      unitSpell.Undo();
    });

    unitsAvailableCasts.Targets = unitsAvailableCasts.Targets.filter(
      (t) => !targetsToRemove.includes(t)
    );
  }

  public CastSpell(castingUnit: Unit, targetObject: GameObject) {
    //console.log("cast spell test")
    this._spells.get(castingUnit).Cast(castingUnit, targetObject, this);
  }

  CastSwapCastables(castingUnit: Unit, targetingUnit: Unit) {
    if (castingUnit.column === targetingUnit.column) {
      let tilesDifferences = castingUnit.row - targetingUnit.row;

      if (Math.abs(tilesDifferences) === 1) {
        this.SwapUnits(castingUnit, targetingUnit);
      } else {
        castingUnit.row = targetingUnit.row;
        targetingUnit.row = targetingUnit.row + 1 * Math.sign(tilesDifferences);
      }
    }

    if (castingUnit.row === targetingUnit.row) {
      let tilesDifferences = castingUnit.column - targetingUnit.column;

      if (Math.abs(tilesDifferences) === 1) {
        this.SwapUnits(castingUnit, targetingUnit);
      } else {
        castingUnit.column = targetingUnit.column;
        targetingUnit.column =
          targetingUnit.column + 1 * Math.sign(tilesDifferences);
      }
    }

    targetingUnit.isMoved = true;
  }

  SwapUnits(unit: Unit, unit2: Unit): void {
    const unitRowTemp = unit.row;
    const unitColumnTemp = unit.column;
    unit.row = unit2.row;
    unit.column = unit2.column;
    unit2.row = unitRowTemp;
    unit2.column = unitColumnTemp;
  }

  GetPowerStompCastables(castingUnit: Unit): {
    Targets: Tile[];
    TileToUnitToTileBehindMap: Map<Tile, Map<Unit, Tile>>;
  } {
    let targetTiles = [] as Tile[];
    let tileToUnitToTileBehindMap = new Map<Tile, Map<Unit, Tile>>();
    let movePatternTiles =
      this._validator.UnitsAvailableMoves.get(castingUnit).Tiles;
    movePatternTiles.forEach((movePatternTile) => {
      let behindTilesMap = new Map<Unit, Tile>();

      let units2DArray = this.getUnits2DArray();
      units2DArray[castingUnit.row][castingUnit.column] = null;
      units2DArray[movePatternTile.row][movePatternTile.column] = castingUnit;

      let enemyUnitsAround = this.getEnemyUnitsAroundTile(
        castingUnit.color,
        movePatternTile
      );

      enemyUnitsAround.forEach((enemyUnit) => {
        let emptyTileBehindUnit = this.getUnitEmptyTileBehind(
          movePatternTile,
          enemyUnit,
          units2DArray
        );
        if (emptyTileBehindUnit !== null) {
          behindTilesMap.set(enemyUnit, emptyTileBehindUnit);
          if (!targetTiles.includes(movePatternTile)) {
            targetTiles.push(movePatternTile);
          }
        }
      });

      if (behindTilesMap.size > 0) {
        tileToUnitToTileBehindMap.set(movePatternTile, behindTilesMap);
      }
    });
    return {
      Targets: targetTiles,
      TileToUnitToTileBehindMap: tileToUnitToTileBehindMap,
    };
  }

  getEnemyUnitsAroundTile(color: Color, targetingTile: Tile): Unit[] {
    let uncapturedUnits = this._units.filter((u) => !u.isCaptured);
    let enemyUnitsAround = uncapturedUnits.filter((unit) => {
      return (
        Math.abs(targetingTile.row - unit.row) <= 1 &&
        Math.abs(targetingTile.column - unit.column) <= 1 &&
        color !== unit.color
      );
    });
    return enemyUnitsAround;
  }

  public CastPowerStomp(
    castingUnit: Unit,
    targetingTile: Tile,
    tilesBehindMap: Map<Unit, Tile>
  ) {
    this.MoveUnit(castingUnit, targetingTile);
    for (const [unit, emptyTileBehind] of tilesBehindMap) {
      this.MoveUnit(unit, emptyTileBehind);
    }
  }

  public MoveUnit(unit: Unit, tile: Tile) {
    unit.column = tile.column;
    unit.row = tile.row;
    unit.isMoved = true;
    if (this._tiles[unit.row][unit.column].isDestroyed) {
      unit.isCaptured = true;
    }
  }

  public isBetween = (num1: number, num2: number, value: number) =>
    value >= num1 && value <= num2;

  getUnitEmptyTileBehind(
    targetingTile: Tile,
    targetingUnit: Unit,
    units2DArray: Unit[][]
  ) {
    var tileBehindUnit: Tile = null;
    if (targetingTile.column === targetingUnit.column) {
      let isTargetUnitAbove =
        Math.sign(targetingUnit.row - targetingTile.row) * 1;
      if (
        this.isBetween(
          0,
          Game.BOARD_ROWS - 1,
          targetingUnit.row + isTargetUnitAbove
        ) &&
        units2DArray[targetingUnit.row + isTargetUnitAbove][
          targetingUnit.column
        ] === null
      ) {
        tileBehindUnit =
          this._tiles[targetingUnit.row + isTargetUnitAbove][
            targetingUnit.column
          ];
      }
    } else if (targetingTile.row === targetingUnit.row) {
      let isTargetUnitOnRight =
        Math.sign(targetingUnit.column - targetingTile.column) * 1;
      // console.log("between")
      // console.log(this.isBetween(0, Game.BOARD_COLUMNS-1, targetingUnit.column + targetUnitHigher))
      // console.log("units2darray")
      // console.log(units2DArray[targetingUnit.row][targetingUnit.column + targetUnitHigher])
      if (
        this.isBetween(
          0,
          Game.BOARD_COLUMNS - 1,
          targetingUnit.column + isTargetUnitOnRight
        ) &&
        units2DArray[targetingUnit.row][
          targetingUnit.column + isTargetUnitOnRight
        ] === null
      ) {
        tileBehindUnit =
          this._tiles[targetingUnit.row][
            targetingUnit.column + isTargetUnitOnRight
          ];
      }
    }

    return tileBehindUnit;
  }

  GetSwapCastables(castingUnit: Unit): Unit[] {
    let unitsNotCaptured = this._units.filter((u) => !u.isCaptured);
    // let unitsAlly = unitsNotCaptured.filter(
    //   (u) => u.color == castingUnit.color
    // );
    let unitsToConsiderRow = unitsNotCaptured.filter(
      (u) => u.row == castingUnit.row
    );
    let unitsToConsiderColumn = unitsNotCaptured.filter(
      (unit) => unit.column == castingUnit.column
    );

    let firstUnitOnRight = unitsToConsiderRow
      .sort((unit1, unit2) => unit1.column - unit2.column)
      .find((unit) => unit.column > castingUnit.column);
    let firstUnitOnLeft = unitsToConsiderRow
      .sort((unit1, unit2) => unit2.column - unit1.column)
      .find((unit) => unit.column < castingUnit.column);
    let firstUnitUp = unitsToConsiderColumn
      .sort((unit1, unit2) => unit1.row - unit2.row)
      .find((unit) => unit.row > castingUnit.row);
    let firstUnitDown = unitsToConsiderColumn
      .sort((unit1, unit2) => unit2.row - unit1.row)
      .find((unit) => unit.row < castingUnit.row);

    return [
      firstUnitOnRight?.color === castingUnit.color ? firstUnitOnRight : null,
      firstUnitOnLeft?.color === castingUnit.color ? firstUnitOnLeft : null,
      firstUnitUp?.color === castingUnit.color ? firstUnitUp : null,
      firstUnitDown?.color === castingUnit.color ? firstUnitDown : null,
    ].filter((x) => x);
  }

  GetSacrificeCastables(castingUnit: Unit): Unit[] {
    return this._units.filter(
      (unit) =>
        !unit.isCaptured &&
        unit.color === castingUnit.color &&
        unit != castingUnit
    );
  }

  CastSacrifice(sacrificingUnit: Unit, allyUnit: Unit) {
    this.SwapUnits(sacrificingUnit, allyUnit);
    sacrificingUnit.isCaptured = true;
  }

  public GetShadowstepCastables(castingUnit: Unit): {
    Targets: Unit[];
    AdjacentTiles: Map<Unit, Tile>;
  } {
    let rogueAdjacentTilesMap = new Map<Unit, Tile>();
    let rogueAdjacentsTiles = [] as Unit[];
    let unitsNotCaptured = this._units.filter((u) => !u.isCaptured);
    let unitsToConsiderRow = unitsNotCaptured.filter(
      (unit) => unit.row == castingUnit.row
    );
    let unitsToConsiderColumn = unitsNotCaptured.filter(
      (unit) => unit.column == castingUnit.column
    );

    let firstUnitOnRight = unitsToConsiderRow
      .sort((unit1, unit2) => unit1.column - unit2.column)
      .find(
        (unit) =>
          unit.column > castingUnit.column &&
          unit.column < Game.BOARD_COLUMNS - 1
      );
    let adjacentTileRight: Tile = null;
    if (firstUnitOnRight) {
      adjacentTileRight =
        this._tiles[firstUnitOnRight.row][firstUnitOnRight.column + 1];
      //console.log(adjacentTileRight)
      if (
        !unitsNotCaptured.find(
          (u) =>
            u.row == adjacentTileRight.row &&
            u.column == adjacentTileRight.column
        )
      ) {
        rogueAdjacentTilesMap.set(firstUnitOnRight, adjacentTileRight);
        rogueAdjacentsTiles.push(firstUnitOnRight);
      }
    }

    let firstUnitOnLeft = unitsToConsiderRow
      .sort((unit1, unit2) => unit2.column - unit1.column)
      .find((unit) => unit.column < castingUnit.column && unit.column > 0);
    let adjacentTileLeft: Tile = null;
    if (firstUnitOnLeft) {
      adjacentTileLeft =
        this._tiles[firstUnitOnLeft.row][firstUnitOnLeft.column - 1];
      if (
        !unitsNotCaptured.find(
          (u) =>
            u.row == adjacentTileLeft.row && u.column == adjacentTileLeft.column
        )
      ) {
        rogueAdjacentTilesMap.set(firstUnitOnLeft, adjacentTileLeft);
        rogueAdjacentsTiles.push(firstUnitOnLeft);
      }
    }

    let firstUnitUp = unitsToConsiderColumn
      .sort((unit1, unit2) => unit1.row - unit2.row)
      .find(
        (unit) => unit.row > castingUnit.row && unit.row < Game.BOARD_ROWS - 1
      );
    let adjacentTileUp: Tile = null;
    if (firstUnitUp) {
      adjacentTileUp = this._tiles[firstUnitUp.row + 1][firstUnitUp.column];
      if (
        !unitsNotCaptured.find(
          (u) =>
            u.row == adjacentTileUp.row && u.column == adjacentTileUp.column
        )
      ) {
        rogueAdjacentTilesMap.set(firstUnitUp, adjacentTileUp);
        rogueAdjacentsTiles.push(firstUnitUp);
      }
    }

    let firstUnitDown = unitsToConsiderColumn
      .sort((unit1, unit2) => unit2.row - unit1.row)
      .find((unit) => unit.row < castingUnit.row && unit.row > 0);
    let adjacentTileDown: Tile = null;
    if (firstUnitDown) {
      adjacentTileDown =
        this._tiles[firstUnitDown.row - 1][firstUnitDown.column];
      if (
        !unitsNotCaptured.find(
          (u) =>
            u.row == adjacentTileDown.row && u.column == adjacentTileDown.column
        )
      ) {
        rogueAdjacentTilesMap.set(firstUnitDown, adjacentTileDown);
        rogueAdjacentsTiles.push(firstUnitDown);
      }
    }

    // Remove enemy princess from targets if found
    if (
      rogueAdjacentsTiles.some(
        (x) => x instanceof Princess && x.color !== castingUnit.color
      )
    ) {
      let princessUnit = rogueAdjacentsTiles.find(
        (x) => x instanceof Princess && x.color !== castingUnit.color
      );

      // Remove princessUnit from rogueAdjacentsTiles
      rogueAdjacentsTiles = rogueAdjacentsTiles.filter(
        (x) => x !== princessUnit
      );

      // Remove princessUnit from rogueAdjacentTilesMap
      rogueAdjacentTilesMap.delete(princessUnit);
    }

    return {
      Targets: rogueAdjacentsTiles,
      AdjacentTiles: rogueAdjacentTilesMap,
    };
  }

  public GetUnoccupiedTiles(): Tile[] {
    let occupiedTiles = this._units
      .filter((u) => !u.isCaptured)
      .map((u) => this._tiles[u.row][u.column]);
    let undestroyedTiles = []
      .concat(...this._tiles)
      .filter((t) => !t.isDestroyed) as Tile[];
    return undestroyedTiles.filter((t) => !occupiedTiles.includes(t));
  }

  public GetDestroyedTiles(): Tile[] {
    return [].concat(...this._tiles).filter((t) => t.isDestroyed);
  }

  public CastDestroyTile(targetingTile: Tile) {
    targetingTile.isDestroyed = true;
    targetingTile.lastCapturedUnit = null;
  }

  public CastSpawnTile(targetingTile: Tile) {
    targetingTile.isDestroyed = false;
  }

  public CastShadowstep(
    castingUnit: Unit,
    targetingUnit: Unit,
    adjacentTiles: Map<Unit, Tile>
  ): ShadowstepReturnable {
    let shadowstepReturnable = null;
    let adjacentTile = adjacentTiles.get(targetingUnit);
    this.MoveUnit(castingUnit, adjacentTile);

    if (
      targetingUnit.color !== castingUnit.color &&
      !(targetingUnit instanceof Princess)
    ) {
      shadowstepReturnable = {
        targetUnitTile: this._tiles[targetingUnit.row][targetingUnit.column],
        targetUnitTileLCU:
          this._tiles[targetingUnit.row][targetingUnit.column].lastCapturedUnit,
      };
      targetingUnit.isCaptured = true;
      this._tiles[targetingUnit.row][targetingUnit.column].lastCapturedUnit =
        targetingUnit;
    }

    return shadowstepReturnable;
  }

  public GetResurrectionCastables(castingUnit: Unit): Unit[] {
    let lastCapturedUnits = this._tiles
      .flat()
      .filter((x) => x.lastCapturedUnit)
      .map((x) => x.lastCapturedUnit);

    let ressurectableUnits = lastCapturedUnits.filter((capturedUnit) => {
      return (
        Math.abs(castingUnit.row - capturedUnit.row) <= 1 &&
        Math.abs(castingUnit.column - capturedUnit.column) <= 1 &&
        this._units.find(
          (u) =>
            u.row === capturedUnit.row &&
            u.column === capturedUnit.column &&
            !u.isCaptured
        ) === undefined
      );
    });

    return ressurectableUnits;
  }

  public CastRessurection(castingUnit: Unit, targetUnit: Unit): Tile {
    targetUnit.isCaptured = false;
    targetUnit.color = castingUnit.color;
    this._tiles[targetUnit.row][targetUnit.column].lastCapturedUnit = null;
    return this._tiles[targetUnit.row][targetUnit.column];
  }
}

export interface ShadowstepReturnable {
  targetUnitTile: Tile;
  targetUnitTileLCU: Unit;
}

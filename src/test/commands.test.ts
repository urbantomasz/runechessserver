import { assert, expect, test } from 'vitest'
import { GameTestAdapter } from '../runechess/GameTestAdapter';
import { CaptureCommand, MoveCommand } from '../runechess/Commands';

test("CaptureCommandTest", ()=>{
    var game = new GameTestAdapter();

    var unit = game.Units[0];
    var unitStartingRow = unit.row;
    var unitStartingColumn = unit.column;

    var capturingUnit = game.Units[20];
    var capturingUnitRow = capturingUnit.row;
    var capturingUnitColumn = capturingUnit.column;

    var capturingUnitTile = game.Tiles[capturingUnit.row][capturingUnit.column];
    var captureCommand = new CaptureCommand(unit, capturingUnit, game.Units, game.Tiles);

    assert.equal(capturingUnit.isCaptured, false);
    assert.equal(unit.isMoved, false);
    assert.equal(capturingUnitTile.lastCapturedUnit, null)
    assert.equal(unit.row, unitStartingRow)
    assert.equal(unit.column, unitStartingColumn)

    captureCommand.Execute();

    assert.equal(unit.isMoved, true);
    assert.equal(capturingUnit.isCaptured, true);
    assert.equal(capturingUnitTile.lastCapturedUnit, capturingUnit)
    assert.equal(unit.row, capturingUnitRow)
    assert.equal(unit.column, capturingUnitColumn)

    captureCommand.Undo();
    
    assert.equal(capturingUnit.isCaptured, false);
    assert.equal(unit.isMoved, false);
    assert.equal(capturingUnitTile.lastCapturedUnit, null)
    assert.equal(unit.row, unitStartingRow)
    assert.equal(unit.column, unitStartingColumn)  
})

test("MoveCommandTest", ()=>{
    var game = new GameTestAdapter();

    var unit = game.Units[0];
    var unitStartingRow = unit.row;
    var unitStartingColumn = unit.column;

    var newTile = game.Tiles[5][5];
    var moveCommand = new MoveCommand(unit, newTile, game.Units);

    assert.equal(unit.isCaptured, false);
    assert.equal(unit.isMoved, false);
    assert.equal(newTile.lastCapturedUnit, null)
    assert.equal(unit.row, unitStartingRow)
    assert.equal(unit.column, unitStartingColumn)

    moveCommand.Execute();

    assert.equal(unit.isMoved, true);
    assert.equal(unit.isCaptured, false);
    assert.equal(newTile.lastCapturedUnit, null)
    assert.equal(unit.row, newTile.row)
    assert.equal(unit.column, newTile.column)

    moveCommand.Undo();
    
    assert.equal(unit.isCaptured, false);
    assert.equal(unit.isMoved, false);
    assert.equal(newTile.lastCapturedUnit, null)
    assert.equal(unit.row, unitStartingRow)
    assert.equal(unit.column, unitStartingColumn)
})


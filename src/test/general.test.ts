import { assert, expect, test } from "vitest";
import { Game } from "../runechess/Game";
import { ICommand, SpellCommand } from "../runechess/Commands";
import { DestroyTile } from "../runechess/Spell";
import { random } from "lodash";

    
test("RandomCommandsTest", ()=>{
    var game = new Game();
    var gameJSON = JSON.stringify(game);

    for(let i=0; i<10; i++){
        var allPossibleCommands = game.GetAllPossibleCommands()
        var randomCommand = allPossibleCommands[Math.floor(Math.random() * (allPossibleCommands.length-1))]
        randomCommand.Execute();
        randomCommand.Undo();
        assert.deepEqual(gameJSON, JSON.stringify(game))
    }
    
})


test("RandomCommandsTest2", ()=>{
    var game = new Game();
    var gameJSON = JSON.stringify(game);


    assert.equal(game.Tiles.flat().filter(x => x.isDestroyed).length, 0)

    for(let j=1; j<=10; j++){

        var commandsExecuted = new Array<ICommand>()

        for(let i=0; i<j; i++){
            var allPossibleCommands = game.GetAllPossibleCommands()
            var randomCommand = allPossibleCommands.pop()
            if(randomCommand !== undefined){
                randomCommand.Execute()
                commandsExecuted.push(randomCommand)
            }
        }
    
        while(commandsExecuted.length > 0){
            commandsExecuted.pop().Undo();
        }

        console.log("j =: " + j)
        assert.equal(commandsExecuted.length, 0)
        assert.equal(game.Tiles.flat().filter(x => x.isDestroyed).length, 0)
        assert.equal(gameJSON, JSON.stringify(game))

    }
   
   // assert.deepEqual(gameJSON, JSON.stringify(game))
})

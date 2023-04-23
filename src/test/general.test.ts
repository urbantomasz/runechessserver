import { assert, expect, test } from "vitest";
import { Game } from "../runechess/Game";
import { ICommand } from "../runechess/Commands";

    
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
    var commandsExecuted = new Array<ICommand>();

    for(let j=1; j<=10; j++){
        for(let i=0; i<j; i++){
            var allPossibleCommands = game.GetAllPossibleCommands()
            var randomCommand = allPossibleCommands[Math.floor(Math.random() * (allPossibleCommands.length-1))]
            randomCommand.Execute();
            commandsExecuted.push(randomCommand);
        }
    
        var lastCommandName = commandsExecuted[j-1].constructor.name

        for(let i=0; i<j; i++){
            commandsExecuted.pop().Undo();
        }

        assert.equal(gameJSON, JSON.stringify(game), "last command type: " + lastCommandName)

    }
   
   // assert.deepEqual(gameJSON, JSON.stringify(game))
})

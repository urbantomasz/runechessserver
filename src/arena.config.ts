import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { RelayRoom } from "colyseus";
import { LobbyRoom } from "./rooms/LobbyRoom";

/**
 * Import your Room files
 */
import { GameRoom } from "./rooms/GameRoom";
import { Request, Response } from "express";
export default Arena({
  getId: () => "Your Colyseus App",

  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    gameServer.define("GameRoom", GameRoom);
    gameServer.define("LobbyRoom", LobbyRoom);
  },

  initializeExpress: (app) => {
    /**
     * Bind your custom express routes here:
     */
    app.get("/", (req: Request, res: Response) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    /**
     * Bind @colyseus/monitor
     * It is recommended to protect this route with a password.
     * Read more: https://docs.colyseus.io/tools/monitor/
     */
    app.use("/colyseus", monitor());
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});

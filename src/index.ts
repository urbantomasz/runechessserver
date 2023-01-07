/**
 * IMPORTANT: 
 * ---------
 * Do not manually edit this file if you'd like to use Colyseus Arena
 * 
 * If you're self-hosting (without Arena), you can manually instantiate a
 * Colyseus Server as documented here: 👉 https://docs.colyseus.io/server/api/#constructor-options 
 */
// import { listen } from "@colyseus/arena";

// // Import arena config
// import arenaConfig from "./arena.config";

// // Create and listen on 2567 (or PORT environment variable.)
// listen(arenaConfig);

import { createServer } from "http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport"
import express from "express";
import { GameRoom } from "./rooms/GameRoom";
import { LobbyRoom } from "./rooms/GameLobbyRoom";
import { monitor } from "@colyseus/monitor";

const server = createServer(); // create the http server manually
const app = express()
const port = 8080;

app.use('/colyseus', monitor())
app.get('/', function (req, res) {
  res.send('200 OK - Dino Fun Land')
})

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: createServer(app),
  })
});

gameServer.define('GameRoom', GameRoom);
gameServer.define("LobbyRoom", LobbyRoom);
gameServer.listen(port)


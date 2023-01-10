if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

import { createServer } from "http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport"
import express from "express";
import { GameRoom } from "./rooms/GameRoom";
import { LobbyRoom } from "./rooms/GameLobbyRoom";
import { monitor } from "@colyseus/monitor";


const server = createServer(); // create the http server manually
const app = express()
const PORT = parseInt(process.env.PORT) || 2537;

// var con = createConnection({
//   host: "runechess.database.windows.net",
//   user: "yourusername",
//   password: "yourpassword"
// });

// con.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
// });

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
gameServer.listen(PORT)
console.log("port test: " + PORT)
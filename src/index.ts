if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
var sql = require("mssql");
import { createServer } from "http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport"
import express from "express";
import { GameRoom } from "./rooms/GameRoom";
import { LobbyRoom } from "./rooms/GameLobbyRoom";
import { monitor } from "@colyseus/monitor";
import { createConnection } from "mysql";

//const server = createServer(); // create the http server manually
const app = express()
const PORT = parseInt(process.env.PORT) || 2537;

// var con = createConnection({
//   host: "runechess.database.windows.net",
//   user: "CloudSA88725cbe",
//   password: "123qweasdZXC!",
//   debug: true
// });

var config = {
  server: "runechess.database.windows.net", // Use your SQL server name
  database: "Runechess", // Database to connect to
  user: "CloudSA88725cbe", // Use your username
  password: "123qweasdZXC!", // Use your password
  port: 1433,
  // Since we're on Windows Azure, we need to set the following options
  options: {
        encrypt: true
    }
 };

 const mssql = require('mssql');
 class DBConnection {
   async getConnection() {
      try {
        return await mssql.connect({config});
     }
     catch(error) {
       console.log(error);
     }
   }
 }
 module.exports = new DBConnection();

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
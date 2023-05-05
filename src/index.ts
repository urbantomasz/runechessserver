if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
var sql = require("mssql");
import { createServer } from "http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import { GameRoom } from "./rooms/GameRoom";
import { LobbyRoom } from "./rooms/GameLobbyRoom";
import { monitor } from "@colyseus/monitor";
import { createConnection } from "mysql";

//const server = createServer(); // create the http server manually
const app = express();
const PORT = parseInt(process.env.PORT) || 2537;

// var con = createConnection({
//   host: "runechess.database.windows.net",
//   user: "CloudSA88725cbe",
//   password: "123qweasdZXC!",
//   debug: true
// });

var config = {
  server: "runechess.database.windows.net", // Use your SQL server name
  database: "RunechessDB", // Database to connect to
  user: "CloudSAf2659ced", // Use your username
  password: "123qweasdZXC!", // Use your password
  port: 1433,
  // Since we're on Windows Azure, we need to set the following options
  options: {
    encrypt: true,
  },
};

const mssql = require("mssql");
const NodeCache = require("node-cache");
const matchesCache = new NodeCache({ stdTTL: 60 });

class DBConnection {
  async getConnection() {
    try {
      return await mssql.connect(config);
    } catch (error) {
      console.log(error);
    }
  }

  async getMatches() {
    try {
      const cachedMatches = matchesCache.get("matches");

      if (cachedMatches) {
        console.log("Returning cached matches");
        return cachedMatches;
      }

      const connection = await this.getConnection();
      const request = new mssql.Request(connection);
      const result = await request.query("SELECT * FROM Matches;");

      // Cache the results
      matchesCache.set("matches", result.recordset);
      console.log("Matches fetched from the database and cached");
      return result.recordset;
    } catch (error) {
      console.log(error);
    }
  }

  async insertPlayerIfNotFound(
    playerId: number,
    nickname: string,
    name: string
  ) {
    try {
      const connection = await this.getConnection();
      const request = new mssql.Request(connection);

      request.input("PlayerId", mssql.Int, playerId);
      request.input("Nickname", mssql.VarChar, nickname);
      request.input("Name", mssql.VarChar, name);

      const query = `
        IF NOT EXISTS (SELECT 1 FROM Players WHERE Id = @PlayerId)
        BEGIN
          INSERT INTO Players (Id, Nickname, Name)
          VALUES (@PlayerId, @Nickname, @Name);
        END
      `;

      await request.query(query);
      console.log("Player record inserted if not found");
    } catch (error) {
      console.log(error);
    }
  }

  async insertMatch(
    date: Date,
    bluePlayerId: number,
    redPlayerId: number,
    result: boolean
  ) {
    try {
      const connection = await this.getConnection();
      const request = new mssql.Request(connection);
      request.input("date", mssql.Date, date);
      request.input("bluePlayerId", mssql.Int, bluePlayerId);
      request.input("redPlayerId", mssql.Int, redPlayerId);
      request.input("result", mssql.Bit, result);

      const query = `
        INSERT INTO Matches (date, blueplayerid, redplayerid, result)
        VALUES (@date, @bluePlayerId, @redPlayerId, @result);
      `;

      await request.query(query);
      console.log("Record inserted successfully");
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new DBConnection();
const dbConnection = new DBConnection();

app.use("/colyseus", monitor());
app.get("/", function (req, res) {
  res.send("200 OK - Dino Fun Land");
});

app.get("/api/matches", async (req, res) => {
  try {
    const matches = await dbConnection.getMatches();
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: createServer(app),
  }),
});

gameServer.define("GameRoom", GameRoom);
gameServer.define("LobbyRoom", LobbyRoom);
gameServer.listen(PORT);
console.log("port test: " + PORT);

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

import { createServer } from "http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import { GameRoom } from "./rooms/GameRoom";
import { LobbyRoom } from "./rooms/GameLobbyRoom";
import { monitor } from "@colyseus/monitor";

const app = express();
const cors = require("cors");
const PORT = parseInt(process.env.PORT) || 2537;
const dbConnection = require("./dbConnection");

app.use("/colyseus", monitor());
app.use(
  cors({
    origin: "http://localhost:4200",
  })
);
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

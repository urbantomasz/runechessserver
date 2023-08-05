if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://brave-meadow-0fbc22b03.3.azurestaticapps.net"
    : "http://localhost:4200";

import { createServer } from "http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import { GameRoom } from "./rooms/GameRoom";
import { LobbyRoom } from "./rooms/LobbyRoom";
import { monitor } from "@colyseus/monitor";

const app = express();
const cors = require("cors");
const PORT = parseInt(process.env.PORT) || 2537;
const dbConnection = require("./dbConnection");

app.use("/colyseus", monitor());
app.use(
  cors({
    origin: ORIGIN,
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

app.get("/api/ranking", async (req, res) => {
  try {
    const ranking = await dbConnection.getRanking();
    res.json(ranking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch ranking" });
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

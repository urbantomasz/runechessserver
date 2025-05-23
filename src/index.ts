if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const ORIGIN =
  process.env.NODE_ENV === "production"
    ? [
        "https://runechess.com",
        "https://www.runechess.com",
        "https://brave-meadow-0fbc22b03.3.azurestaticapps.net",
      ]
    : "http://localhost:4200";

console.log("Environment:", process.env.NODE_ENV);
console.log("CORS Origin:", ORIGIN);

import { createServer } from "http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import { GameRoom } from "./rooms/GameRoom";
import { LobbyRoom } from "./rooms/LobbyRoom";
import { monitor } from "@colyseus/monitor";
import { Request, Response } from "express";
import { BotRoom } from "./rooms/BotRoom";

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
app.get("/", function (req: Request, res: Response) {
  res.send("200 OK - Dino Fun Land");
});

app.get("/api/matches", async (req: Request, res: Response) => {
  try {
    const matches = await dbConnection.getMatches();
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

app.get("/api/ranking", async (req: Request, res: Response) => {
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
gameServer.define("BotRoom", BotRoom);
gameServer.listen(PORT);
console.log("port test: " + PORT);

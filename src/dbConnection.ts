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
    playerId: string,
    nickname: string,
    name: string
  ) {
    try {
      const connection = await this.getConnection();
      const request = new mssql.Request(connection);

      request.input("GoogleId", mssql.VarChar, playerId);
      request.input("Nickname", mssql.VarChar, nickname);
      request.input("Name", mssql.VarChar, name);

      const query = `
          IF NOT EXISTS (SELECT 1 FROM Players WHERE GoogleId = @GoogleId)
          BEGIN
            INSERT INTO Players (GoogleId, Nickname, Name)
            VALUES (@GoogleId, @Nickname, @Name);
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

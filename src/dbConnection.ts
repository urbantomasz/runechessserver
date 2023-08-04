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
      const result = await request.query("SELECT * FROM MatchesView;");

      // Cache the results
      matchesCache.set("matches", result.recordset);
      console.log("Matches fetched from the database and cached");
      return result.recordset;
    } catch (error) {
      console.log(error);
    }
  }

  async getRanking() {
    try {
      const cachedRanking = matchesCache.get("ranking");

      if (cachedRanking) {
        console.log("Returning cached matches");
        return cachedRanking;
      }

      const connection = await this.getConnection();
      const request = new mssql.Request(connection);
      const result = await request.query("SELECT * FROM RankingView;");

      // Cache the results
      matchesCache.set("ranking", result.recordset);
      console.log("Ranking fetched from the database and cached");
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

      let query = `
      MERGE Players AS target 
      USING (SELECT @GoogleId, @Nickname, @Name) AS source (GoogleId, Nickname, Name) 
      ON (target.GoogleId = source.GoogleId) 
      WHEN MATCHED THEN 
        UPDATE SET Nickname = source.Nickname, Name = source.Name 
      WHEN NOT MATCHED THEN 
        INSERT (GoogleId, Nickname, Name) 
        VALUES (source.GoogleId, source.Nickname, source.Name)
      OUTPUT inserted.Id;
      `;

      const result = await request.query(query);
      const id = result.recordset[0].Id;

      // If the player was inserted, update the nickname and name
      if (id) {
        request.input("Id", mssql.Int, id);
        request.input("UpdatedNickname", mssql.VarChar, "RunechessPlayer" + id);
        request.input("UpdatedName", mssql.VarChar, "RunechessPlayer" + id);

        query = `
          UPDATE Players 
          SET Nickname = @UpdatedNickname, Name = @UpdatedName 
          WHERE Id = @Id;
        `;

        await request.query(query);
      }

      return id;
    } catch (error) {
      console.log(error);
      return null;
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

      // Now insert into Matches
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

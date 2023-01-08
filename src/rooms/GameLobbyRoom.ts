import {Client, matchMaker, Room} from 'colyseus';
import { LobbyRoomSchema, PlayerSchema } from "./schema/LobbyRoomSchema";

export class LobbyRoom extends Room<LobbyRoomSchema> {
  evaluateGroupsInterval = 2000;
  constructor() {
    super();
    this.setState(new LobbyRoomSchema())
}
  onCreate(options: any) {

    this.onMessage("JoinQueue", async (client, data) =>{

      
      if(this.state.playersSearchingIds.includes(client.id)){
        this.IfExistsRemoveClientFromQueue(client);
      } else{
        this.state.playersSearchingIds.push(client.id);
      }

    this.setSimulationInterval(() => this.redistributeGroups(), this.evaluateGroupsInterval);
    })
  };

   redistributeGroups() {

    if(this.state.playersSearchingIds.length >= 2){
      while(this.state.playersSearchingIds.length >= 2){
        let clientBlueId = this.state.playersSearchingIds.pop();
        let clientRedId = this.state.playersSearchingIds.pop();
        let clientBlue = this.clients.find(client => client.id === clientBlueId); 
        let clientRed = this.clients.find(client => client.id === clientRedId); 
        clientBlue.send("JoinGame", 0);
        clientRed.send("JoinGame", 1);
        // let gameRoom = await matchMaker.createRoom("GameRoom", {isPlayground: false})
        // await matchMaker.reserveSeatFor(gameRoom, clientBlueId)
        // await matchMaker.reserveSeatFor(gameRoom, clientRedId)
        // clientBlue.send("SeatReserved", gameRoom);
        // clientRed.send("SeatReserved", gameRoom);
      }
    }
  }
  

  requestJoin (options: any) {
    return this.clients.filter(c => c.id === options.clientId).length === 0;
  }

  onJoin(client: Client) {
    this.state.players.set(client.id,  new PlayerSchema(client.id, client.id));
    console.log("joined to lobby room")
  }

  onLeave(client: Client, consented: boolean) {
    this.IfExistsRemoveClientFromQueue(client);
    this.state.players.delete(client.id);
  }

  onDispose() {
    console.log('Disposing the room');
  }

  IfExistsRemoveClientFromQueue(client: Client){
    let queueIndex = this.state.playersSearchingIds.indexOf(client.id);
    if(queueIndex > -1){
      this.state.playersSearchingIds.splice(queueIndex, 1);
    }
  }
}

import {Room, Client} from "colyseus";
import {Schema, type, MapSchema} from "@colyseus/schema";

export class Player extends Schema {
    @type("number")
    speed = 0;

    @type("number")
    pX = Math.floor(Math.random() * 50) - 25;
    @type("number")
    pY = 0;
    @type("number")
    pZ = Math.floor(Math.random() * 50) - 25;

    @type("number")
    vX = 0;
    @type("number")
    vY = 0;
    @type("number")
    vZ = 0;
}

export class State extends Schema {
    @type({map: Player})
    players = new MapSchema<Player>();

    something = "This attribute won't be sent to the client-side";

    createPlayer(sessionId: string, data: any) {
        const player =  new Player();
        player.speed = data.speed;

        this.players.set(sessionId, player);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    movePlayer(sessionId: string, position: any) {
        this.players.get(sessionId).pX = position.pX;
        this.players.get(sessionId).pY = position.pY;
        this.players.get(sessionId).pZ = position.pZ;

        this.players.get(sessionId).vX = position.vX;
        this.players.get(sessionId).vY = position.vY;
        this.players.get(sessionId).vZ = position.vZ;
    }
}

export class StateHandlerRoom extends Room<State> {
    maxClients = 4;

    onCreate(options) {
        console.log("StateHandlerRoom created!", options);

        this.setState(new State());

        this.onMessage("move", (client, data) => {
            console.log("StateHandlerRoom received message from", client.sessionId, ":", data);
            this.state.movePlayer(client.sessionId, data);
        });
    }

    onAuth(client, options, req) {
        return true;
    }

    onJoin(client: Client, data : any) {
        this.state.createPlayer(client.sessionId, data);
    }

    onLeave(client) {
        this.state.removePlayer(client.sessionId);
    }

    onDispose() {
        console.log("Dispose StateHandlerRoom");
    }

}

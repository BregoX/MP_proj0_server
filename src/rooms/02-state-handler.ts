import {Client, Room} from "colyseus";
import {MapSchema, Schema, type} from "@colyseus/schema";

export class Player extends Schema {
    @type("number")

    speed = 0;
    @type("int8")
    mHP = 10;
    @type("int8")
    cHP = 10;

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

    @type("number")
    rX = 0;
    @type("number")
    rY = 0;

    @type("boolean")
    sit = false;

}

export class State extends Schema {
    @type({map: Player})
    players = new MapSchema<Player>();

    something = "This attribute won't be sent to the client-side";

    createPlayer(sessionId: string, data: any) {
        const player = new Player();
        player.speed = data.speed;
        player.mHP = player.cHP = data.mHP;

        this.players.set(sessionId, player);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    movePlayer(sessionId: string, info: any) {
        const player = this.players.get(sessionId);

        player.pX = info.pX;
        player.pY = info.pY;
        player.pZ = info.pZ;

        player.vX = info.vX;
        player.vY = info.vY;
        player.vZ = info.vZ;

        player.rX = info.rX;
        player.rY = info.rY;

        player.sit = info.sit;
    }

    applyDamage(sessionId: string, damage: number) {
        const player = this.players.get(sessionId);
        player.cHP -= damage > player.cHP ? player.cHP : damage;
    }
}

export class StateHandlerRoom extends Room<State> {
    maxClients = 4;

    onCreate(options) {
        console.log("StateHandlerRoom created!", options);

        this.setState(new State());

        this.onMessage("move", (client, data) => {
            this.state.movePlayer(client.sessionId, data);
        });

        this.onMessage("shoot", (client, data) => {
            this.broadcast("SHOOT", data, {except: client});
        });
        this.onMessage("damage", (client, data) => {
            this.state.applyDamage(data.enemySessionId, data.value);
        });
    }

    onAuth(client, options, req) {
        return true;
    }

    onJoin(client: Client, data: any) {
        this.state.createPlayer(client.sessionId, data);
    }

    onLeave(client) {
        this.state.removePlayer(client.sessionId);
    }

    onDispose() {
        console.log("Dispose StateHandlerRoom");
    }

}

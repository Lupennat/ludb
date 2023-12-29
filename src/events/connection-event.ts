import { ConnectionSessionI } from '../types/connection/connection';

abstract class ConnectionEvent {
    /**
     * The name of the connection.
     */
    public connectionName: string;

    /**
     * Create a new event instance.
     */
    constructor(public connection: ConnectionSessionI) {
        this.connectionName = connection.getName();
    }
}

export default ConnectionEvent;

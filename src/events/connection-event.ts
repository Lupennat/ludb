import { ConnectionSessionI } from '../types/connection';

abstract class ConnectionEvent {
    /**
     * The name of the connection.
     */
    public connectionName: string;

    /**
     * The reference id
     */
    public referenceId: string;

    /**
     * Create a new event instance.
     */
    constructor(public connection: ConnectionSessionI) {
        this.connectionName = connection.getName();
        this.referenceId = connection.getReference();
    }
}

export default ConnectionEvent;

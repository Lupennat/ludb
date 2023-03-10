import { PdoStatementI } from 'lupdo';
import { ConnectionSessionI } from '../types/connection';
import ConnectionEvent from './connection-event';

class StatementPrepared extends ConnectionEvent {
    static eventName = 'ludb/events/statement-prepared';

    /**
     * Create a new event instance.
     */
    public constructor(connection: ConnectionSessionI, public statement: PdoStatementI) {
        super(connection);
    }
}

export default StatementPrepared;

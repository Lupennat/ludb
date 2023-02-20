import { ConnectionSessionI } from '../types/connection';
import { Binding } from '../types/query/builder';
import ConnectionEvent from './connection-event';

class QueryExecuted extends ConnectionEvent {
    static eventName = 'ludb/events/query-executed';

    /**
     * Create a new event instance.
     */
    constructor(
        connection: ConnectionSessionI,
        public sql: string,
        public bindings: Binding[],
        public time: number | null,
        public inTransaction: boolean
    ) {
        super(connection);
    }
}

export default QueryExecuted;

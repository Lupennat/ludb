import { ConnectionSessionI } from '../types/connection';
import { Binding, BindingObject } from '../types/generics';
import ConnectionEvent from './connection-event';

class QueryExecuted extends ConnectionEvent {
    static eventName = 'ludb/events/query-executed';

    /**
     * Create a new event instance.
     */
    constructor(
        connection: ConnectionSessionI,
        public sql: string,
        public bindings: Binding[] | BindingObject,
        public time: number,
        public sessionTime: number,
        public inTransaction: boolean
    ) {
        super(connection);
    }
}

export default QueryExecuted;

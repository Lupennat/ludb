import { Binding } from '../types/query/builder';

class QueryExecuted {
    static eventName = 'ludb/events/query-executed';

    /**
     * Create a new event instance.
     */
    constructor(
        public connectionName: string,
        public sql: string,
        public bindings: Binding[],
        public time: number | null,
        public inTransaction: boolean
    ) {}
}

export default QueryExecuted;

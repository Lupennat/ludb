import ConnectionEvent from './connection-event';

class TransactionCommitted extends ConnectionEvent {
    static eventName = 'ludb/events/transaction-committed';
}

export default TransactionCommitted;

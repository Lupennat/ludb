import ConnectionEvent from './connection-event';

class TransactionCommitting extends ConnectionEvent {
    static eventName = 'ludb/events/transaction-committing';
}

export default TransactionCommitting;

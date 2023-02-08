import ConnectionEvent from './connection-event';

class TransactionBeginning extends ConnectionEvent {
    static eventName = 'ludb/events/transaction-beginning';
}

export default TransactionBeginning;

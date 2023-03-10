import ConnectionEvent from './connection-event';

class TransactionRolledBack extends ConnectionEvent {
    static eventName = 'ludb/events/transaction-rolledback';
}

export default TransactionRolledBack;

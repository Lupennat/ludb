import Expression from './query/expression';
import ExpressionContract from './query/expression-contract';
import GrammarI from './types/query/grammar';

export function stringifyReplacer(grammar: GrammarI): (key: string, value: any) => any {
    return (_key: string, value: any): any => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        if (typeof value === 'object' && value instanceof ExpressionContract) {
            return value.getValue(grammar);
        }
        return value;
    };
}

function getMessagesFromError(error: any): string[] {
    let messages = [error.message];
    if (error.cause) {
        messages = messages.concat(getMessagesFromError(error));
    }
    if (error.errors && Array.isArray(error.errors)) {
        for (const err in error.errors) {
            messages = messages.concat(err);
        }
    }

    return messages;
}

/**
 * Determine if the given exception was caused by a lost connection.
 */
export function causedByLostConnection(error: any): boolean {
    const errorMsgs = getMessagesFromError(error);
    const messages = [
        'server has gone away',
        'no connection to the server',
        'Lost connection',
        'is dead or not enabled',
        'Error while sending',
        'decryption failed or bad record mac',
        'server closed the connection unexpectedly',
        'SSL connection has been closed unexpectedly',
        'Error writing data to the connection',
        'Resource deadlock avoided',
        'Transaction() on null',
        'child connection forced to terminate due to client_idle_limit',
        'query_wait_timeout',
        'reset by peer',
        'Physical connection is not usable',
        'TCP Provider: Error code 0x68',
        'ORA-03114',
        'Packets out of order. Expected',
        'Adaptive Server connection failed',
        'Communication link failure',
        'connection is no longer usable',
        'Login timeout expired',
        'SQLSTATE[HY000] [2002] Connection refused',
        'running with the --read-only option so it cannot execute this statement',
        'The connection is broken and recovery is not possible. The connection is marked by the client driver as unrecoverable. No attempt was made to restore the connection.',
        'SQLSTATE[HY000] [2002] php_network_getaddresses: getaddrinfo failed: Try again',
        'SQLSTATE[HY000] [2002] php_network_getaddresses: getaddrinfo failed: Name or service not known',
        'SQLSTATE[HY000] [2002] php_network_getaddresses: getaddrinfo for',
        'SQLSTATE[HY000]: General error: 7 SSL SYSCALL error: EOF detected',
        'SQLSTATE[HY000] [2002] Connection timed out',
        'SSL: Connection timed out',
        'SQLSTATE[HY000]: General error: 1105 The last transaction was aborted due to Seamless Scaling. Please retry.',
        'Temporary failure in name resolution',
        'SSL: Broken pipe',
        'SQLSTATE[08S01]: Communication link failure',
        'SQLSTATE[08006] [7] could not connect to server: Connection refused Is the server running on host',
        'SQLSTATE[HY000]: General error: 7 SSL SYSCALL error: No route to host',
        'The client was disconnected by the server because of inactivity. See wait_timeout and interactive_timeout for configuring this behavior.',
        'SQLSTATE[08006] [7] could not translate host name',
        'TCP Provider: Error code 0x274C',
        'SQLSTATE[HY000] [2002] No such file or directory',
        'SSL: Operation timed out',
        'Reason: Server is in script upgrade mode. Only administrator can connect at this time.'
    ];

    for (const message of messages) {
        for (const errorMsg of errorMsgs) {
            if (message.toLowerCase().includes(errorMsg.toLowerCase())) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Determine if the given exception was caused by a concurrency error such as a deadlock or serialization failure.
 */
export function causedByConcurrencyError(error: any): boolean {
    const errorMsgs = getMessagesFromError(error);
    const messages = [
        'Deadlock found when trying to get lock',
        'deadlock detected',
        'The database file is locked',
        'database is locked',
        'database table is locked',
        'A table in the database is locked',
        'has been chosen as the deadlock victim',
        'Lock wait timeout exceeded; try restarting transaction',
        'WSREP detected deadlock/conflict and aborted the transaction. Try restarting the transaction'
    ];

    for (const message of messages) {
        for (const errorMsg of errorMsgs) {
            if (message.toLowerCase().includes(errorMsg.toLowerCase())) {
                return true;
            }
        }
    }

    return false;
}

export function raw(value: string | bigint | number): ExpressionContract {
    return new Expression(value);
}

export function trimChar(value: string, character: string): string {
    const trimStartRegex = new RegExp(`^[${character}]+`, 'g');
    const trimEndRegex = new RegExp(`[${character}]+$`, 'g');
    return value.replace(trimStartRegex, '').replace(trimEndRegex, '');
}

import deepmerge from 'deepmerge';
import { isPlainObject } from 'is-plain-object';
import { TypedBinding } from 'lupdo';
import { Grammar } from './query';
import Expression from './query/expression';
import ExpressionContract from './query/expression-contract';
import { Stringable } from './types/generics';
import { Arrayable, Objectable } from './types/query/grammar-builder';

export function stringifyReplacer(grammar: Grammar): (key: string, value: any) => any {
    return (_key: string, value: any): any => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        if (typeof value === 'object' && value instanceof ExpressionContract) {
            value = value.getValue(grammar);
            return typeof value === 'bigint' ? value.toString() : value;
        }
        return value;
    };
}

function getErrorMessages(error: any, depth: number, current = 1): string[] {
    let messages = [error.message];
    if (error.cause) {
        messages = messages.concat(
            depth > current ? getErrorMessages(error.cause, depth, current + 1) : error.cause.message
        );
    }
    if (error.errors && Array.isArray(error.errors)) {
        for (const err of error.errors) {
            messages = messages.concat(depth > current ? getErrorMessages(err, depth, current + 1) : err.message);
        }
    }

    return messages;
}

export function getMessagesFromError(error: any, depth = 1): string[] {
    return getErrorMessages(error, depth).filter((value, index, array) => array.indexOf(value) === index);
}

/**
 * Determine if the given error was caused by a lost connection.
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
        'Reason: Server is in script upgrade mode. Only administrator can connect at this time.',
        'SSL: Handshake timed out',
        'SQLSTATE[08006] [7] SSL error: sslv3 alert unexpected message',
        'SQLSTATE[08006] [7] unrecognized SSL error code:',
        'SQLSTATE[HY000] [2002] No connection could be made because the target machine actively refused it',
        'SQLSTATE[HY000] [2002] A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond',
        'SQLSTATE[HY000] [2002] Network is unreachable',
        'SQLSTATE[HY000] [2002] The requested address is not valid in its context',
        'SQLSTATE[HY000] [2002] A socket operation was attempted to an unreachable network',
        'SQLSTATE[HY000]: General error: 3989'
    ];

    for (const message of messages) {
        for (const errorMsg of errorMsgs) {
            if (errorMsg.includes(message)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Determine if the given error was caused by a concurrency error such as a deadlock or serialization failure.
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
            if (errorMsg.includes(message)) {
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
    character = '\\' + character.split('').join('\\');
    const trimStartRegex = new RegExp(`^[${character}]+`, 'g');
    const trimEndRegex = new RegExp(`[${character}]+$`, 'g');
    return value.replace(trimStartRegex, '').replace(trimEndRegex, '');
}

/**
 * Parameter is a Valid Binding
 */
export function isValidBinding(value: any): boolean {
    return (
        value === null ||
        Buffer.isBuffer(value) ||
        ['number', 'boolean', 'bigint', 'string'].includes(typeof value) ||
        isValidObjectBinding(value)
    );
}

/**
 * Parameter is a Valid Object Binding
 */
export function isValidObjectBinding(value: any): boolean {
    return (
        typeof value === 'object' &&
        (value instanceof TypedBinding || value instanceof ExpressionContract || value instanceof Date)
    );
}

/**
 * Determine if the value is Arrayable.
 */
export function isArrayable<T>(value: any): value is Arrayable<T> {
    return typeof value === 'object' && 'toArray' in value && typeof value.toArray === 'function';
}

/**
 * Determine if the value is Objectable.
 */
export function isObjectable<T>(value: any): value is Objectable<T> {
    return typeof value === 'object' && 'toObject' in value && typeof value.toObject === 'function';
}

/**
 * Determine if the value is Stringable
 */
export function isStringable(value: any): value is Stringable {
    return typeof value === 'string' || isExpression(value);
}

/**
 * Determine if the value is Expression
 */
export function isExpression(value: any): value is ExpressionContract {
    return typeof value === 'object' && value instanceof ExpressionContract;
}

/**
 * Determine if the value is TypedBinding
 */
export function isTypedBinding(value: any): value is TypedBinding {
    return typeof value === 'object' && value instanceof TypedBinding;
}

/**
 * Get the portion of a string before the last occurrence of a given value.
 */
export function beforeLast(subject: string, search: string): string {
    if (search === '') {
        return subject;
    }

    const pos = subject.lastIndexOf(search);

    if (pos === -1) {
        return subject;
    }

    return subject.slice(0, pos);
}

export function afterLast(subject: string, search: string): string {
    if (search === '') {
        return subject;
    }

    const pos = subject.lastIndexOf(search);

    if (pos === -1) {
        return subject;
    }

    return subject.slice(pos + search.length);
}

export function addslashes(str: string): string {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

/**
 * Escape quote for sql
 */
export function escapeQuoteForSql(string: string): string {
    return string.replace(/'/g, "''");
}

/**
 * Parse the Postgres "search_path" configuration value into an array.
 */
export function parseSearchPath(searchPath: string | string[]): string[] {
    if (typeof searchPath === 'string') {
        const regex = new RegExp(/[^\s,"\']+/, 'g');
        return [...searchPath.matchAll(regex)].map(match => {
            return trimChar(match[0], '\'"');
        });
    } else {
        return searchPath.map(schema => trimChar(schema, '\'"'));
    }
}
/**
 * merge objects
 */
export function merge<T>(x: Partial<T>, y: Partial<T>): T;
export function merge<T1, T2>(x: Partial<T1>, y: Partial<T2>): T1 & T2 {
    return deepmerge(x, y, {
        isMergeableObject: value => {
            return Array.isArray(value) || isPlainObject(value);
        }
    });
}

export function hasInvalidUTF8Characters(str: string): boolean {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Encode the string as UTF-8 bytes
    const utf8Bytes = encoder.encode(str);

    // Decode the UTF-8 bytes back to a string
    const decodedString = decoder.decode(utf8Bytes);

    // Compare the decoded string with the original string
    return str !== decodedString;
}

export function hasNullBytesCharacters(str: string): boolean {
    return str.includes('\0');
}

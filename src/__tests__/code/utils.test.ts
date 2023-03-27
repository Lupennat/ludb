import Expression from '../../query/expression';
import Grammar from '../../query/grammars/grammar';
import {
    addslashes,
    afterLast,
    beforeLast,
    causedByConcurrencyError,
    causedByLostConnection,
    getMessagesFromError,
    raw,
    stringifyReplacer,
    trimChar
} from '../../utils';

describe('Utils', () => {
    it('Works Trim Char', () => {
        expect(trimChar('$char$', '$')).toBe('char');
        expect(trimChar('??char??', '?')).toBe('char');
        expect(trimChar('.....char....', '.')).toBe('char');
        expect(trimChar('^^^^char^^^^', '^')).toBe('char');
        expect(trimChar('""\'\'char\'""\'', '\'"')).toBe('char');
        expect(trimChar('^^??$$char$$^^??', '^$?')).toBe('char');
    });

    it('Works Raw Return Expression', () => {
        expect(raw('Test')).toBeInstanceOf(Expression);
        expect(raw('Test').getValue(new Grammar())).toBe('Test');
    });

    it('Works Stringify Replacer', () => {
        expect(JSON.stringify({ a: BigInt('10') }, stringifyReplacer(new Grammar()))).toBe('{"a":"10"}');
        expect(JSON.stringify({ a: raw('Test') }, stringifyReplacer(new Grammar()))).toBe('{"a":"Test"}');
        expect(JSON.stringify({ a: raw(BigInt('100')) }, stringifyReplacer(new Grammar()))).toBe('{"a":"100"}');
    });

    it('Works Get Messages From Error', () => {
        const firstError = new Error('first error');
        expect(getMessagesFromError(firstError)).toEqual(['first error']);
        const secondError = new Error('second error');
        // @ts-expect-error simulate new error.cause
        secondError.cause = firstError;
        expect(getMessagesFromError(secondError)).toEqual(['second error', 'first error']);
        const thirdError = new Error('third error');
        // @ts-expect-error simulate aggregate error
        thirdError.errors = [secondError, firstError];
        expect(getMessagesFromError(thirdError)).toEqual(['third error', 'second error', 'first error']);
        const fourthError = new Error('fourth error');
        // @ts-expect-error simulate new error.cause
        fourthError.cause = thirdError;
        // @ts-expect-error simulate aggregate error
        fourthError.errors = [secondError, firstError];
        expect(getMessagesFromError(fourthError)).toEqual([
            'fourth error',
            'third error',
            'second error',
            'first error'
        ]);
        expect(getMessagesFromError(fourthError, 2)).toEqual([
            'fourth error',
            'third error',
            'second error',
            'first error'
        ]);
    });

    it('Works Caused By Lost Connection', () => {
        expect(causedByLostConnection(new Error('first error'))).toBeFalsy();
        expect(causedByLostConnection(new Error('noway server has gone away otherwise'))).toBeTruthy();
        const error = new Error('not a lost connection');
        // @ts-expect-error simulate new error.cause
        error.cause = new Error('noway server has gone away otherwise');
        expect(causedByLostConnection(error)).toBeTruthy();
    });

    it('Works Caused By Concurrency Error', () => {
        expect(causedByConcurrencyError(new Error('first error'))).toBeFalsy();
        expect(causedByConcurrencyError(new Error('here deadlock detected go'))).toBeTruthy();
        const error = new Error('not a deadlock');
        // @ts-expect-error simulate aggregate error
        error.errors = [new Error('here deadlock detected go')];
        expect(causedByConcurrencyError(error)).toBeTruthy();
    });

    it('Works Before Last', () => {
        expect(beforeLast('test', 'nope')).toBe('test');
        expect(beforeLast('test', '')).toBe('test');
        expect(beforeLast('testBeforeSearch', 'Search')).toBe('testBefore');
        expect(beforeLast('testBeforeLastSearchTerminateHereSearch', 'Search')).toBe(
            'testBeforeLastSearchTerminateHere'
        );
    });

    it('Works After Last', () => {
        expect(afterLast('test', 'nope')).toBe('test');
        expect(afterLast('test', '')).toBe('test');
        expect(afterLast('afterSearchTest', 'Search')).toBe('Test');
        expect(afterLast('afterLastSearchShouldBeSkippedSearchNotThis', 'Search')).toBe('NotThis');
    });

    it('Works Add Slashes', () => {
        expect(addslashes("kevin's birthday")).toBe("kevin\\'s birthday");
        expect(addslashes('"quoted"')).toBe('\\"quoted\\"');
        expect(addslashes('this\\backslash')).toBe('this\\\\backslash');
        expect(addslashes('\0')).toBe('\\0');
        expect(addslashes('\u0000')).toBe('\\0');
        expect(addslashes('\x00')).toBe('\\0');
    });
});

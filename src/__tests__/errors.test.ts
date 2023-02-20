import DeadlockError from '../errors/deadlock-error';
import QueryError from '../errors/query-error';
import { getConnection } from './fixtures/mocked';

describe('Errors', () => {
    it('Works Deadlock Error', () => {
        expect(new DeadlockError()).toBeInstanceOf(DeadlockError);
    });

    it('Works Query Error', () => {
        const error = new QueryError(
            getConnection().session(),
            'select * from test where name = ? and available = ?',
            ['Claudio', null],
            new Error('Original Error')
        );
        expect(error.message).toBe(
            'Original Error (Connection: fake, SQL: select * from test where name = "Claudio" and available = null)'
        );
        expect(error.getSql()).toBe('select * from test where name = ? and available = ?');
        expect(error.getConnectionName()).toBe('fake');
        expect(error.getBindings()).toEqual(['Claudio', null]);
    });
});

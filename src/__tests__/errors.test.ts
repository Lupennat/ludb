import DeadlockError from '../errors/deadlock-error';
import QueryError from '../errors/query-error';

describe('Errors', () => {
    it('Works Deadlock Error', () => {
        expect(new DeadlockError()).toBeInstanceOf(DeadlockError);
    });

    it('Works Query Error', () => {
        const error = new QueryError(
            'name',
            'select * from test where name = ? and available = ?',
            ['Claudio', null],
            new Error('Original Error')
        );
        expect(error.message).toBe(
            'Original Error (Connection: name, SQL: select * from test where name = Claudio and available = null)'
        );
        expect(error.getSql()).toBe('select * from test where name = ? and available = ?');
        expect(error.getConnectionName()).toBe('name');
        expect(error.getBindings()).toEqual(['Claudio', null]);
    });
});

import { bindTo } from '../../bindings';
import DeadlockError from '../../errors/deadlock-error';
import QueryError from '../../errors/query-error';
import { getConnection } from './fixtures/mocked';

describe('Errors', () => {
    it('Works Deadlock Error', () => {
        expect(new DeadlockError()).toBeInstanceOf(DeadlockError);
    });

    it('Works Query Error', () => {
        const buffer = Buffer.from('text');
        const error = new QueryError(
            getConnection().session(),
            'select * from test where name = ? and available = ? and created_at < ? and buffer = ? and id = ? and counter = ? and role = ?',
            [
                'Claudio',
                null,
                bindTo.dateTime('2023-03-01 15:27:00'),
                buffer,
                BigInt('100000'),
                true,
                10,
                bindTo.string(null)
            ],
            new Error('Original Error')
        );
        expect(error.message).toBe(
            "Original Error (Connection: fake, SQL: select * from test where name = 'Claudio' and available = null and created_at < '2023-03-01 15:27:00' and buffer = <Buffer[4]> and id = 100000 and counter = true and role = 10)"
        );
        expect(error.getSql()).toBe(
            'select * from test where name = ? and available = ? and created_at < ? and buffer = ? and id = ? and counter = ? and role = ?'
        );
        expect(error.getConnectionName()).toBe('fake');
        expect(error.getBindings()).toEqual([
            'Claudio',
            null,
            bindTo.dateTime('2023-03-01 15:27:00'),
            buffer,
            BigInt('100000'),
            true,
            10,
            bindTo.string(null)
        ]);
    });

    it('Works Query Error With Named Parameters', () => {
        const error = new QueryError(
            getConnection().session(),
            'select * from test where name = :name and available = :available and created_at < :created_at and role = :role',
            {
                name: 'Claudio',
                available: null,
                created_at: bindTo.dateTime('2023-03-01 15:27:00'),
                role: bindTo.string(null)
            },
            new Error('Original Error')
        );
        expect(error.message).toBe(
            "Original Error (Connection: fake, SQL: select * from test where name = 'Claudio' and available = null and created_at < '2023-03-01 15:27:00' and role = null)"
        );
        expect(error.getSql()).toBe(
            'select * from test where name = :name and available = :available and created_at < :created_at and role = :role'
        );
        expect(error.getConnectionName()).toBe('fake');
        expect(error.getBindings()).toEqual({
            name: 'Claudio',
            available: null,
            created_at: bindTo.dateTime('2023-03-01 15:27:00'),
            role: bindTo.string(null)
        });
    });
});

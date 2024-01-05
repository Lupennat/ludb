import { EventEmitter } from 'stream';
import { QueryExecuted } from '../../events';
import { getConnection } from './fixtures/mocked';

describe('Events', () => {
    const connection = getConnection();
    connection.setEventDispatcher(new EventEmitter());

    afterAll(async () => {
        await connection.disconnect();
    });

    it('Works Reference', async () => {
        let counter = 0;
        const callback = jest.fn((event: QueryExecuted) => {
            if (counter === 0) {
                expect(event.referenceId).toBe('');
            }
            if (counter === 1) {
                expect(event.referenceId).toBe('id');
            }
            if (counter === 2) {
                expect(event.referenceId).toBe('');
            }
            if (counter === 3) {
                expect(event.referenceId).toBe('newId');
            }
            counter++;
        });
        connection.listen(callback);
        await connection.select('select 1');
        await connection.reference('id').select('select 1');
        await connection.select('select 1');
        await connection.reference('newId').select('select 1');
        expect(callback).toHaveBeenCalledTimes(4);
    });
});

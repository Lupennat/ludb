import { TypedBinding } from 'lupdo';
import SqliteConnection from '../../connections/sqlite-connection';
import DatabaseManager from '../../database-manager';
import Expression from '../../query/expression';

describe('Database Manager', () => {
    it('Works Connections Return Connections', () => {
        const db = new DatabaseManager({
            sqlite: { driver: 'sqlite', database: ':memory:' },
            sqlite_read_write: { driver: 'sqlite', read: { database: ':memory:' }, write: { database: ':memory:' } }
        });
        expect(db.connections.sqlite).toBeInstanceOf(SqliteConnection);
        expect(db.connections.sqlite_read_write).toBeInstanceOf(SqliteConnection);
    });

    it('Works Raw Return Expression', () => {
        const db = new DatabaseManager({
            sqlite: { driver: 'sqlite', database: ':memory:' }
        });
        const raw = db.raw('rawValue');
        expect(raw).toBeInstanceOf(Expression);
    });

    it('Works Bind To', () => {
        const db = new DatabaseManager({
            sqlite: { driver: 'sqlite', database: ':memory:' }
        });
        const typed = db.bindTo.bigInteger('934342342342343232');
        expect(typed).toBeInstanceOf(TypedBinding);
    });
});

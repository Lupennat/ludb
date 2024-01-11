import PostgresGrammar from '../../../../query/grammars/postgres-grammar';

describe('Postgres Query Grammar', () => {
    it('Works To Raw Sql', () => {
        const grammar = new PostgresGrammar();
        const query = grammar.substituteBindingsIntoRawSql(
            `select * from "users" where '{}' ?? 'Hello?''World??' AND "email" = ? and "buffer" = ? and "bool" = ? and "bool2" = ?`,
            ['foo', Buffer.from('text'), true, false]
        );
        expect(query).toBe(
            `select * from "users" where '{}' ? 'Hello?''World??' AND "email" = 'foo' and "buffer" = x'74657874'::bytea and "bool" = true and "bool2" = false`
        );
    });
});

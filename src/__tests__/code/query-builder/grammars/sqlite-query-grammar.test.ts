import SQLiteGrammar from '../../../../query/grammars/sqlite-grammar';

describe('SQlite Query Grammar', () => {
    it('Works To Raw Sql', () => {
        const grammar = new SQLiteGrammar();
        const query = grammar.substituteBindingsIntoRawSql(
            `select * from "users" where 'Hello?''World??' IS NOT NULL AND "email" = ? and "buffer" = ? and "not" = ?`,
            ['foo', Buffer.from('text')]
        );
        expect(query).toBe(
            `select * from "users" where 'Hello?''World??' IS NOT NULL AND "email" = 'foo' and "buffer" = x'74657874' and "not" = ?`
        );
    });
});

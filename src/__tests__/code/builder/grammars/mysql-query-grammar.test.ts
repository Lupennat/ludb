import MysqlGrammar from '../../../../query/grammars/mysql-grammar';

describe('Mysql Query Grammar', () => {
    it('Works To Raw Sql', () => {
        const grammar = new MysqlGrammar();
        const query = grammar.substituteBindingsIntoRawSql(
            `select * from "users" where 'Hello?\\'World??' IS NOT NULL AND "email" = ? and "buffer" = ? and "not" = ?`,
            ['foo', Buffer.from('text')]
        );
        expect(query).toBe(
            `select * from "users" where 'Hello?\\'World??' IS NOT NULL AND "email" = 'foo' and "buffer" = x'74657874' and "not" = ?`
        );
    });
});

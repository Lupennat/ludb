import SqlServerGrammar from '../../../../query/grammars/sqlserver-grammar';

describe('SqlServer Query Grammar', () => {
    it('Works To Raw Sql', () => {
        const grammar = new SqlServerGrammar();
        const query = grammar.substituteBindingsIntoRawSql(
            `select * from [users] where 'Hello?''World??' IS NOT NULL AND [email] = ? and "buffer" = ? and "not" = ?`,
            ['foo', Buffer.from('text')]
        );
        expect(query).toBe(
            `select * from [users] where 'Hello?''World??' IS NOT NULL AND [email] = 'foo' and "buffer" = 0x74657874 and "not" = ?`
        );
    });
});

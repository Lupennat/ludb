import Grammar from '../../grammar';

import Raw from '../../query/expression';

describe('Grammar', () => {
    class ExtendedGrammar extends Grammar {
        protected tablePrefix = 'test_';

        public wrapAliasedValue(value: string, prefixAlias?: boolean): string {
            return super.wrapAliasedValue(value, prefixAlias);
        }
    }

    it('Works Grammar Wrap Array', () => {
        const grammar = new ExtendedGrammar();
        const spiedWrap = jest.spyOn(grammar, 'wrap');
        const raw = new Raw('text');
        expect(grammar.wrapArray([raw, 'text'])).toEqual(['text', '"text"']);
        expect(spiedWrap).toHaveBeenCalledTimes(2);
        expect(spiedWrap).toHaveBeenNthCalledWith(1, raw);
        expect(spiedWrap).toHaveBeenNthCalledWith(2, 'text');
    });

    it('Works Grammar Wrap Table', () => {
        const grammar = new ExtendedGrammar();
        const spiedWrap = jest.spyOn(grammar, 'wrap');
        expect(grammar.wrapTable('table')).toBe('"test_table"');
        expect(grammar.wrapTable(new Raw('table'))).toBe('table');
        expect(spiedWrap).toHaveBeenCalledTimes(1);
        expect(spiedWrap).toHaveBeenNthCalledWith(1, 'test_table', true);
    });

    it('Works Grammar Wrap Expression', () => {
        const grammar = new ExtendedGrammar();
        expect(grammar.wrap(new Raw('text'))).toBe('text');
    });

    it('Works Grammar Wrap Alias', () => {
        const grammar = new ExtendedGrammar();
        expect(grammar.wrap('table AS   table1')).toBe('"table" as "table1"');
        expect(grammar.wrap('table AS   ')).toBe('"table" as ""');
        expect(grammar.wrap('table AS   *')).toBe('"table" as *');
        expect(grammar.wrap('tableAStable1')).toBe('"tableAStable1"');
        expect(grammar.wrap('table AS   table1', true)).toBe('"table" as "test_table1"');
        expect(grammar.wrap('tableAStable1', true)).toBe('"tableAStable1"');
    });

    it('Works Grammar Wrap Alias Value', () => {
        const grammar = new ExtendedGrammar();
        expect(grammar.wrapAliasedValue('table')).toBe('"table" as ""');
        expect(grammar.wrapAliasedValue('table', true)).toBe('"table" as "test_"');
    });

    it('Works Grammar Wrap Json Selector Throw Error', () => {
        const grammar = new ExtendedGrammar();
        expect(() => {
            grammar.wrap('options->language', true);
        }).toThrow('This database engine does not support JSON operations.');
    });

    it('Works Grammar Wrap Segments', () => {
        const grammar = new ExtendedGrammar();
        const spiedWrapTable = jest.spyOn(grammar, 'wrapTable');
        expect(grammar.wrap('user')).toBe('"user"');
        expect(grammar.wrap('*')).toBe('*');
        expect(grammar.wrap('table.*')).toBe('"test_table".*');
        expect(grammar.wrap('table2.user')).toBe('"test_table2"."user"');
        expect(grammar.wrap('table3.')).toBe('"test_table3".""');
        expect(spiedWrapTable).toHaveBeenCalledTimes(3);
        expect(spiedWrapTable).toHaveBeenNthCalledWith(1, 'table');
        expect(spiedWrapTable).toHaveBeenNthCalledWith(2, 'table2');
        expect(spiedWrapTable).toHaveBeenNthCalledWith(3, 'table3');
    });

    it('Works Columnize', () => {
        const grammar = new ExtendedGrammar();
        const spiedWrap = jest.spyOn(grammar, 'wrap');
        const raw = new Raw('text');
        expect(grammar.columnize([raw, 'text'])).toBe('text, "text"');
        expect(spiedWrap).toHaveBeenCalledTimes(2);
        expect(spiedWrap).toHaveBeenNthCalledWith(1, raw);
        expect(spiedWrap).toHaveBeenNthCalledWith(2, 'text');
    });

    it('Works Parameterize', () => {
        const grammar = new ExtendedGrammar();
        const spiedParameter = jest.spyOn(grammar, 'parameter');
        const raw = new Raw('text');
        expect(grammar.parameterize([raw, 'text'])).toBe('text, ?');
        expect(spiedParameter).toHaveBeenCalledTimes(2);
        expect(spiedParameter).toHaveBeenNthCalledWith(1, raw);
        expect(spiedParameter).toHaveBeenNthCalledWith(2, 'text');
    });

    it('Works Parameter', () => {
        const grammar = new ExtendedGrammar();
        const raw = new Raw('text');
        expect(grammar.parameter(raw)).toBe('text');
        expect(grammar.parameter('text')).toBe('?');
        expect(grammar.parameter(true)).toBe('?');
    });

    it('Works Quote String', () => {
        const grammar = new ExtendedGrammar();
        expect(grammar.quoteString('text')).toBe("'text'");
        expect(grammar.quoteString(['text', 'again'])).toBe("'text', 'again'");
    });

    it('Works Is Expression', () => {
        const grammar = new ExtendedGrammar();
        expect(grammar.isExpression(new Raw('text'))).toBeTruthy();
        expect(grammar.isExpression('text')).toBeFalsy();
    });

    it('Works Get Value', () => {
        const grammar = new ExtendedGrammar();
        expect(grammar.getValue(new Raw('text'))).toBe('text');
        expect(grammar.getValue('text')).toBe('text');
        expect(grammar.getValue(true)).toBeTruthy();
        expect(grammar.getValue(null)).toBeNull();
        expect(grammar.getValue(1)).toBe(1);
    });

    it('Works Table Prefix', () => {
        const grammar = new ExtendedGrammar();
        expect(grammar.getTablePrefix()).toBe('test_');
        grammar.setTablePrefix('test2_');
        expect(grammar.getTablePrefix()).toBe('test2_');
        expect(grammar.wrapTable('table')).toBe('"test2_table"');
    });
});

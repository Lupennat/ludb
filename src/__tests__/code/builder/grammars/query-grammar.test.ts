import { bindTo } from '../../../../bindings';
import { Grammar } from '../../../../query';
import { raw } from '../../../../utils';

describe('Query Grammar', () => {
    it('Works Escape', () => {
        const grammar = new Grammar();
        expect(grammar.escape(true)).toBe('1');
        expect(grammar.escape(false)).toBe('0');
        expect(grammar.escape(bindTo.string(null))).toBe('null');
        expect(grammar.escape(bindTo.string('test'))).toBe("'test'");
        expect(grammar.escape(BigInt(10))).toBe("'10'");
        expect(grammar.escape(100)).toBe("'100'");
        expect(grammar.escape(10.35)).toBe("'10.35'");
        expect(grammar.escape(10.35)).toBe("'10.35'");
        expect(grammar.escape(Buffer.from('text'))).toBe('<Buffer[4]>');
        expect(grammar.escape('🐶🐶🐶'.substr(0, 5))).toBe('<InvalidUtf8Byte>');
        expect(grammar.escape('Hello\0World')).toBe('<NullByte>');
        expect(grammar.escape(raw('test'))).toBe("'test'");
    });
});

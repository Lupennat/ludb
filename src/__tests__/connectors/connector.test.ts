import {
    ATTR_CASE,
    ATTR_DEBUG,
    ATTR_NULLS,
    CASE_LOWER,
    CASE_NATURAL,
    DEBUG_DISABLED,
    DEBUG_ENABLED,
    NULL_EMPTY_STRING,
    NULL_NATURAL
} from 'lupdo';
import Connector from '../../connectors/connector';

describe('Connector', () => {
    it('Works Connector Get Default Attributes', () => {
        const connector = new Connector();
        expect(connector.getDefaultAttributes()).toEqual({
            [ATTR_CASE]: CASE_NATURAL,
            [ATTR_DEBUG]: DEBUG_DISABLED,
            [ATTR_NULLS]: NULL_NATURAL
        });
    });

    it('Works Connector Set Default Attributes', () => {
        const connector = new Connector();
        connector.setDefaultAttributes({
            [ATTR_CASE]: CASE_LOWER,
            [ATTR_DEBUG]: DEBUG_ENABLED,
            [ATTR_NULLS]: NULL_EMPTY_STRING
        });
        expect(connector.getDefaultAttributes()).toEqual({
            [ATTR_CASE]: CASE_LOWER,
            [ATTR_DEBUG]: DEBUG_ENABLED,
            [ATTR_NULLS]: NULL_EMPTY_STRING
        });
    });

    it('Works Connector Get Default Pool Options', () => {
        const connector = new Connector();
        expect(connector.getDefaultPoolOptions()).toEqual({
            min: 0,
            max: 5
        });
    });

    it('Works Connector Set Default Pool Options', () => {
        const connector = new Connector();
        connector.setDefaultPoolOptions({
            min: 10,
            max: 25
        });
        expect(connector.getDefaultPoolOptions()).toEqual({
            min: 10,
            max: 25
        });
    });

    it('Works Connector Resolver', () => {
        const callback = (): void => {};
        // @ts-expect-error testing only resolution
        Connector.resolverFor('test', callback);
        expect(Connector.getResolver('test')).toEqual(callback);
    });
});

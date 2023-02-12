import { getBuilder, pdo } from '../fixtures/mocked';

describe('Query Builder Joins', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Join Aliases With Prefix', () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.select('*').from('services').join('translations AS t', 't.item_id', '=', 'services.id');
        expect(builder.toSql()).toBe(
            'select * from "prefix_services" inner join "prefix_translations" as "prefix_t" on "prefix_t"."item_id" = "prefix_services"."id"'
        );
    });
});

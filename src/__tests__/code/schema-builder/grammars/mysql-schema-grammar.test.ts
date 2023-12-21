import Expression from '../../../../query/expression';
import Blueprint from '../../../../schema/blueprint';
import Builder from '../../../../schema/builders/builder';
import ForeignIdColumnDefinition from '../../../../schema/definitions/foreign-id-column-definition';
import MySqlSchemaGrammar from '../../../../schema/grammars/mysql-grammar';
import { getConnection, getMySqlBlueprint } from '../../fixtures/mocked';

describe('MySql Schema Grammar', () => {
    it('Works Basic Create Table', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.increments('id');
        blueprint.string('email');
        jest.spyOn(connection, 'getConfig')
            .mockReturnValueOnce('utf8')
            .mockReturnValueOnce('utf8_unicode_ci')
            .mockReturnValueOnce(null);
        let statements = blueprint.toSql(connection);
        expect(statements.length).toBe(1);
        expect(
            "create table `users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255) not null) default character set utf8 collate 'utf8_unicode_ci'"
        ).toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.increments('id');
        blueprint.string('email');
        jest.spyOn(connection, 'getConfig').mockReturnValue(null);
        statements = blueprint.toSql(connection);
        expect(statements.length).toBe(1);
        expect(
            'alter table `users` add `id` int unsigned not null auto_increment primary key, add `email` varchar(255) not null'
        ).toBe(statements[0]);
    });

    it('Works Auto Increment Starting Value', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.increments('id').startingValue(1000);
        blueprint.string('email');
        jest.spyOn(connection, 'getConfig')
            .mockReturnValueOnce('utf8')
            .mockReturnValueOnce('utf8_unicode_ci')
            .mockReturnValueOnce(null);
        let statements = blueprint.toSql(connection);
        expect(statements.length).toBe(2);
        expect(
            "create table `users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255) not null) default character set utf8 collate 'utf8_unicode_ci'"
        ).toBe(statements[0]);
        expect('alter table `users` auto_increment = 1000').toBe(statements[1]);

        blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.integerIncrements('id').startingValue(1000);
        blueprint.string('email');
        jest.spyOn(connection, 'getConfig')
            .mockReturnValueOnce('utf8')
            .mockReturnValueOnce('utf8_unicode_ci')
            .mockReturnValueOnce(null);
        statements = blueprint.toSql(connection);
        expect(statements.length).toBe(2);
        expect(
            "create table `users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255) not null) default character set utf8 collate 'utf8_unicode_ci'"
        ).toBe(statements[0]);
        expect('alter table `users` auto_increment = 1000').toBe(statements[1]);

        blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.tinyIncrements('id').startingValue(1000);
        blueprint.string('email');
        jest.spyOn(connection, 'getConfig')
            .mockReturnValueOnce('utf8')
            .mockReturnValueOnce('utf8_unicode_ci')
            .mockReturnValueOnce(null);
        statements = blueprint.toSql(connection);
        expect(statements.length).toBe(2);
        expect(
            "create table `users` (`id` tinyint unsigned not null auto_increment primary key, `email` varchar(255) not null) default character set utf8 collate 'utf8_unicode_ci'"
        ).toBe(statements[0]);
        expect('alter table `users` auto_increment = 1000').toBe(statements[1]);
    });

    it('Works Add Columns With Multiple Auto Increment Starting Value', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.id().from(100);
        blueprint.string('name').from(200);

        const statements = blueprint.toSql(connection);
        expect(statements.length).toBe(2);
        expect(
            'alter table `users` add `id` bigint unsigned not null auto_increment primary key, add `name` varchar(255) not null'
        ).toBe(statements[0]);
        expect('alter table `users` auto_increment = 100').toBe(statements[1]);
    });

    it('Works Engine Create Table', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.increments('id');
        blueprint.string('email');
        blueprint.engine('InnoDB');
        jest.spyOn(connection, 'getConfig').mockReturnValueOnce('utf8').mockReturnValueOnce('utf8_unicode_ci');
        let statements = blueprint.toSql(connection);
        expect(statements.length).toBe(1);
        expect(
            "create table `users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255) not null) default character set utf8 collate 'utf8_unicode_ci' engine = InnoDB"
        ).toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.increments('id');
        blueprint.string('email');
        jest.spyOn(connection, 'getConfig')
            .mockReturnValueOnce('utf8')
            .mockReturnValueOnce('utf8_unicode_ci')
            .mockReturnValueOnce('InnoDB');
        statements = blueprint.toSql(connection);
        expect(statements.length).toBe(1);
        expect(
            "create table `users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255) not null) default character set utf8 collate 'utf8_unicode_ci' engine = InnoDB"
        ).toBe(statements[0]);
    });

    it('Works Charset Collation Create Table', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.increments('id');
        blueprint.string('email');
        blueprint.charset('utf8mb4').collation('utf8mb4_unicode_ci');

        let statements = blueprint.toSql(connection);
        expect(statements.length).toBe(1);
        expect(
            "create table `users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255) not null) default character set utf8mb4 collate 'utf8mb4_unicode_ci'"
        ).toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.increments('id');
        blueprint.string('email').charset('utf8mb4').collation('utf8mb4_unicode_ci');
        jest.spyOn(connection, 'getConfig').mockReturnValueOnce('utf8').mockReturnValueOnce('utf8_unicode_ci');

        statements = blueprint.toSql(connection);
        expect(statements.length).toBe(1);
        expect(
            "create table `users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255) character set utf8mb4 collate 'utf8mb4_unicode_ci' not null) default character set utf8 collate 'utf8_unicode_ci'"
        ).toBe(statements[0]);
    });

    it('Works Create Table With Prefix', () => {
        const connection = getConnection().sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        const blueprint = new Blueprint('users', grammar);
        grammar.setTablePrefix('prefix_');
        blueprint.create();
        blueprint.increments('id');
        blueprint.string('email');

        const statements = blueprint.toSql(connection);
        expect(statements.length).toBe(1);
        expect(
            'create table `prefix_users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255) not null)'
        ).toBe(statements[0]);
    });

    it('Works Create Temporary Table', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.temporary();
        blueprint.increments('id');
        blueprint.string('email');

        const statements = blueprint.toSql(connection);
        expect(statements.length).toBe(1);
        expect(
            'create temporary table `users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255) not null)'
        ).toBe(statements[0]);
    });

    it('Works Drop Table', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.drop();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop table `users`').toBe(statements[0]);
    });

    it('Works Drop Table If Exists', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dropIfExists();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop table if exists `users`').toBe(statements[0]);
    });

    it('Works Drop Column', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.dropColumn('foo');
        let statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` drop `foo`').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.dropColumn(['foo', 'bar']);
        statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` drop `foo`, drop `bar`').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.dropColumn('foo', 'bar');
        statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` drop `foo`, drop `bar`').toBe(statements[0]);
    });

    it('Works Drop Primary', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dropPrimary();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` drop primary key').toBe(statements[0]);
    });

    it('Works Drop Unique', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dropUnique('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` drop index `foo`').toBe(statements[0]);
    });

    it('Works Drop Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dropIndex('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` drop index `foo`').toBe(statements[0]);
    });

    it('Works Drop Full Text', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dropFulltext(['foo']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` drop index `users_foo_fulltext`').toBe(statements[0]);
    });

    it('Works Drop Spatial Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.dropSpatialIndex(['coordinates']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` drop index `geo_coordinates_spatialindex`').toBe(statements[0]);
    });

    it('Works Drop Foreign', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dropForeign('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` drop foreign key `foo`').toBe(statements[0]);
    });

    it('Works Drop Timestamps', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dropTimestamps();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` drop `created_at`, drop `updated_at`').toBe(statements[0]);
    });

    it('Works Drop Timestamps Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dropTimestampsTz();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` drop `created_at`, drop `updated_at`').toBe(statements[0]);
    });

    it('Works Drop SoftDeletes', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dropSoftDeletes('column');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` drop `column`').toBe(statements[0]);
    });

    it('Works Drop SoftDeletes Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dropSoftDeletesTz();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` drop `deleted_at`').toBe(statements[0]);
    });

    it('Works Drop Morphs', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('photos');
        blueprint.dropMorphs('imageable');
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table `photos` drop index `photos_imageable_type_imageable_id_index`').toBe(statements[0]);
        expect('alter table `photos` drop `imageable_type`, drop `imageable_id`').toBe(statements[1]);
    });

    it('Works Rename Table', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.rename('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('rename table `users` to `foo`').toBe(statements[0]);
    });

    it('Works Rename Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.renameIndex('foo', 'bar');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` rename index `foo` to `bar`').toBe(statements[0]);
    });

    it('Works Adding Primary Key', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.primary('foo', 'bar');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add primary key (`foo`)').toBe(statements[0]);
    });

    it('Works Adding Primary Key With Algorithm', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.primary('foo', 'bar', 'hash');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add primary key using hash(`foo`)').toBe(statements[0]);
    });

    it('Works Adding Unique Key', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.unique('foo', 'bar');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add unique `bar`(`foo`)').toBe(statements[0]);
    });

    it('Works Adding Fluent Unique Key', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.string('baz').unique('bar');
        let statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table `users` add unique `bar`(`baz`)').toBe(statements[1]);

        blueprint = getMySqlBlueprint('users');
        blueprint.string('baz').unique();
        statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table `users` add unique `users_baz_unique`(`baz`)').toBe(statements[1]);
    });

    it('Works Adding Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.index(['foo', 'bar'], 'baz');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add index `baz`(`foo`, `bar`)').toBe(statements[0]);
    });

    it('Works Adding Fluent Index', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.string('baz').index('bar');
        let statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table `users` add index `bar`(`baz`)').toBe(statements[1]);

        blueprint = getMySqlBlueprint('users');
        blueprint.string('baz').index();
        statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table `users` add index `users_baz_index`(`baz`)').toBe(statements[1]);
    });

    it('Works Adding Index With Algorithm', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.index(['foo', 'bar'], 'baz', 'hash');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add index `baz` using hash(`foo`, `bar`)').toBe(statements[0]);
    });

    it('Works Adding Fulltext Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.fulltext('body');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add fulltext `users_body_fulltext`(`body`)').toBe(statements[0]);
    });

    it('Works Adding Fluent Fulltext Index', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.string('baz').fulltext('bar');
        let statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table `users` add fulltext `bar`(`baz`)').toBe(statements[1]);

        blueprint = getMySqlBlueprint('users');
        blueprint.string('baz').fulltext();
        statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table `users` add fulltext `users_baz_fulltext`(`baz`)').toBe(statements[1]);
    });

    it('Works Adding Spatial Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.spatialIndex('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` add spatial index `geo_coordinates_spatialindex`(`coordinates`)').toBe(statements[0]);
    });

    it('Works Adding Fluent Spatial Index', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('geo');
        blueprint.string('coordinates').spatialIndex('bar');
        let statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table `geo` add spatial index `bar`(`coordinates`)').toBe(statements[1]);

        blueprint = getMySqlBlueprint('geo');
        blueprint.string('coordinates').spatialIndex();
        statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table `geo` add spatial index `geo_coordinates_spatialindex`(`coordinates`)').toBe(statements[1]);
    });

    it('Works Adding Raw Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.rawIndex('(function(column))', 'raw_index');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add index `raw_index`((function(column)))').toBe(statements[0]);
    });

    it('Works Adding Foreign Key', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.foreign('foo_id').references(['id', 'test']).on('orders');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table `users` add constraint `users_foo_id_foreign` foreign key (`foo_id`) references `orders` (`id`, `test`)'
        ).toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.foreign('foo_id').references('id').on('orders').cascadeOnDelete();
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table `users` add constraint `users_foo_id_foreign` foreign key (`foo_id`) references `orders` (`id`) on delete cascade'
        ).toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.foreign('foo_id').references('id').on('orders').cascadeOnUpdate();
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table `users` add constraint `users_foo_id_foreign` foreign key (`foo_id`) references `orders` (`id`) on update cascade'
        ).toBe(statements[0]);
    });

    it('Works Adding Incrementing ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.increments('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `id` int unsigned not null auto_increment primary key').toBe(statements[0]);
    });

    it('Works Adding Small Incrementing ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.smallIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `id` smallint unsigned not null auto_increment primary key').toBe(
            statements[0]
        );
    });
    it('Works Adding ID', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.id();
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `id` bigint unsigned not null auto_increment primary key').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.id('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` bigint unsigned not null auto_increment primary key').toBe(statements[0]);
    });

    it('Works Adding Foreign ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        const foreignId = blueprint.foreignId('foo');
        blueprint.foreignId('company_id').constrained();
        blueprint.foreignId('laravel_idea_id').constrained();
        blueprint.foreignId('team_id').references('id').on('teams');
        blueprint.foreignId('team_column_id').constrained('teams');

        const statements = blueprint.toSql(connection);

        expect(foreignId).toBeInstanceOf(ForeignIdColumnDefinition);
        expect([
            'alter table `users` add `foo` bigint unsigned not null, add `company_id` bigint unsigned not null, add `laravel_idea_id` bigint unsigned not null, add `team_id` bigint unsigned not null, add `team_column_id` bigint unsigned not null',
            'alter table `users` add constraint `users_company_id_foreign` foreign key (`company_id`) references `companies` (`id`)',
            'alter table `users` add constraint `users_laravel_idea_id_foreign` foreign key (`laravel_idea_id`) references `laravel_ideas` (`id`)',
            'alter table `users` add constraint `users_team_id_foreign` foreign key (`team_id`) references `teams` (`id`)',
            'alter table `users` add constraint `users_team_column_id_foreign` foreign key (`team_column_id`) references `teams` (`id`)'
        ]).toEqual(statements);
    });

    it('Works Adding Foreign Id Specifying Index Name In Constraint', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.foreignId('company_id').constrained(undefined, undefined, 'my_index');
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table `users` add `company_id` bigint unsigned not null').toBe(statements[0]);
        expect(
            'alter table `users` add constraint `my_index` foreign key (`company_id`) references `companies` (`id`)'
        ).toBe(statements[1]);
    });

    it('Works Adding Big Incrementing ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.bigIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `id` bigint unsigned not null auto_increment primary key').toBe(statements[0]);
    });

    it('Works Adding Column In Table First', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.string('name').first();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `name` varchar(255) not null first').toBe(statements[0]);
    });

    it('Works Adding Column After Another Column', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.string('name').after('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `name` varchar(255) not null after `foo`').toBe(statements[0]);
    });

    it('Works Adding Multiple Columns After Another Column', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.after('foo', blueprint => {
            blueprint.string('one');
            blueprint.string('two');
        });
        blueprint.string('three');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table `users` add `one` varchar(255) not null after `foo`, add `two` varchar(255) not null after `one`, add `three` varchar(255) not null'
        ).toBe(statements[0]);
    });

    it('Works Adding Generated Column', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('products');
        blueprint.integer('price');
        blueprint.integer('discounted_virtual').virtualAs('price - 5');
        blueprint.integer('discounted_stored').storedAs('price - 5');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table `products` add `price` int not null, add `discounted_virtual` int as (price - 5), add `discounted_stored` int as (price - 5) stored'
        ).toBe(statements[0]);

        blueprint = getMySqlBlueprint('products');
        blueprint.integer('price');
        blueprint.integer('discounted_virtual').virtualAs('price - 5').nullable(false);
        blueprint.integer('discounted_stored').storedAs('price - 5').nullable(false);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table `products` add `price` int not null, add `discounted_virtual` int as (price - 5) not null, add `discounted_stored` int as (price - 5) stored not null'
        ).toBe(statements[0]);
    });

    it('Works Adding Generated Column With Charset', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('links');
        blueprint.string('url', 2083).charset('ascii');
        blueprint.string('url_hash_virtual', 64).virtualAs('sha2(url, 256)').charset('ascii');
        blueprint.string('url_hash_stored', 64).storedAs('sha2(url, 256)').charset('ascii');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table `links` add `url` varchar(2083) character set ascii not null, add `url_hash_virtual` varchar(64) character set ascii as (sha2(url, 256)), add `url_hash_stored` varchar(64) character set ascii as (sha2(url, 256)) stored'
        ).toBe(statements[0]);
    });

    it('Works Adding Invisible Column', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.string('secret', 64).nullable(false).invisible();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `secret` varchar(64) not null invisible').toBe(statements[0]);
    });

    it('Works Column Modifying', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users', table => {
            table.double('amount', 6, 2).nullable().invisible().after('name').index(false).change();
            table.timestamp('added_at', 4).nullable(false).useCurrent().primary(false).useCurrentOnUpdate().change();
            table
                .enum('difficulty', ['easy', 'hard'])
                .default('easy')
                .fulltext(false)
                .charset('utf8mb4')
                .collation('unicode')
                .change();
            table.boolean('is_true').default(true).change();
            table.boolean('is_false').default(false).change();
            table.multiPolygon('positions').srid(1234).spatialIndex(false).storedAs('expression').change();
            table.string('old_name', 50).renameTo('new_name').unique(false).change();
            table.bigIncrements('id').first().from(10).comment('my comment').change();
        });

        expect([
            'alter table `users` modify `amount` double(6, 2) null invisible after `name`, ' +
                'modify `added_at` timestamp(4) not null default CURRENT_TIMESTAMP(4) on update CURRENT_TIMESTAMP(4), ' +
                "modify `difficulty` enum('easy', 'hard') character set utf8mb4 collate 'unicode' not null default 'easy', " +
                "modify `is_true` tinyint(1) not null default '1', " +
                "modify `is_false` tinyint(1) not null default '0', " +
                'modify `positions` multipolygon as (expression) stored srid 1234, ' +
                'change `old_name` `new_name` varchar(50) not null, ' +
                "modify `id` bigint unsigned not null auto_increment primary key comment 'my comment' first",
            'alter table `users` drop index `users_amount_index`',
            'alter table `users` drop primary key',
            'alter table `users` drop index `users_difficulty_fulltext`',
            'alter table `users` drop index `users_positions_spatialindex`',
            'alter table `users` drop index `users_old_name_unique`',
            'alter table `users` auto_increment = 10'
        ]).toEqual(blueprint.toSql(connection));
    });

    it('Works Adding Char Without Length Limit', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.char('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` char(255) not null').toBe(statements[0]);

        Builder.withoutDefaultStringLength();

        blueprint = getMySqlBlueprint('users');
        blueprint.char('foo');
        statements = blueprint.toSql(connection);

        try {
            expect(1).toBe(statements.length);
            expect('alter table `users` add `foo` char not null').toBe(statements[0]);
        } finally {
            Builder.withDefaultStringLength(255);
        }
    });

    it('Works Adding String', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.string('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` varchar(255) not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.string('foo', 100);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` varchar(100) not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.string('foo', 100).nullable().default('bar');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect("alter table `users` add `foo` varchar(100) null default 'bar'").toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.string('foo', 100).nullable().default(new Expression('CURRENT TIMESTAMP'));
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` varchar(100) null default CURRENT TIMESTAMP').toBe(statements[0]);
    });

    it('Works Adding String Without Length Limit', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.string('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` varchar(255) not null').toBe(statements[0]);

        Builder.withoutDefaultStringLength();

        blueprint = getMySqlBlueprint('users');
        blueprint.string('foo');
        statements = blueprint.toSql(connection);

        try {
            expect(1).toBe(statements.length);
            expect('alter table `users` add `foo` varchar not null').toBe(statements[0]);
        } finally {
            Builder.withDefaultStringLength(255);
        }
    });

    it('Works Adding Text', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.text('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` text not null').toBe(statements[0]);
    });

    it('Works Adding Medium Text', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.mediumText('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` mediumtext not null').toBe(statements[0]);
    });

    it('Works Adding Long Text', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.longText('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` longtext not null').toBe(statements[0]);
    });

    it('Works Adding Big Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.bigInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` bigint not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.bigInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` bigint not null auto_increment primary key').toBe(statements[0]);
    });

    it('Works Adding Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.integer('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` int not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.integer('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` int not null auto_increment primary key').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.unsignedInteger('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` int unsigned not null').toBe(statements[0]);
    });

    it('Works Fluent Unsigned', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.integer('foo').unsigned();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` int unsigned not null').toBe(statements[0]);
    });

    it('Works Adding Increments With Starting Values', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.id().startingValue(1000);
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table `users` add `id` bigint unsigned not null auto_increment primary key').toBe(statements[0]);
        expect('alter table `users` auto_increment = 1000').toBe(statements[1]);
    });

    it('Works Adding Medium Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.mediumInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` mediumint not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.mediumInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` mediumint not null auto_increment primary key').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.unsignedMediumInteger('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` mediumint unsigned not null').toBe(statements[0]);
    });

    it('Works Adding Small Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.smallInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` smallint not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.smallInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` smallint not null auto_increment primary key').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.unsignedSmallInteger('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` smallint unsigned not null').toBe(statements[0]);
    });

    it('Works Adding Tiny Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.tinyInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` tinyint not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.tinyInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` tinyint not null auto_increment primary key').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.unsignedTinyInteger('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` tinyint unsigned not null').toBe(statements[0]);
    });

    it('Works Adding Float', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.float('foo', 5, 2);
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` double(5, 2) not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.float('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` double(8, 2) not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.unsignedFloat('foo', 5, 2);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` double(5, 2) unsigned not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.unsignedFloat('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` double(8, 2) unsigned not null').toBe(statements[0]);
    });

    it('Works Adding Double', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.double('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` double not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.unsignedDouble('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` double unsigned not null').toBe(statements[0]);
    });

    it('Works Adding Double Specifying Precision', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.double('foo', 15, 8);
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` double(15, 8) not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.unsignedDouble('foo', 15, 8);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` double(15, 8) unsigned not null').toBe(statements[0]);
    });

    it('Works Adding Decimal', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.decimal('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` decimal(8, 2) not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.decimal('foo', 5, 2);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` decimal(5, 2) not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.unsignedDecimal('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` decimal(8, 2) unsigned not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.unsignedDecimal('foo', 5, 2);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` decimal(5, 2) unsigned not null').toBe(statements[0]);
    });

    it('Works Adding Boolean', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.boolean('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` tinyint(1) not null').toBe(statements[0]);
    });

    it('Works Adding Enum', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.enum('role', ['member', 'admin']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect("alter table `users` add `role` enum('member', 'admin') not null").toBe(statements[0]);
    });

    it('Works Adding Set', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.set('role', ['member', 'admin']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect("alter table `users` add `role` set('member', 'admin') not null").toBe(statements[0]);
    });

    it('Works Adding Json', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.json('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` json not null').toBe(statements[0]);
    });

    it('Works Adding Jsonb', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.jsonb('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` json not null').toBe(statements[0]);
    });

    it('Works Adding Date', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.date('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` date not null').toBe(statements[0]);
    });

    it('Works Adding Year', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.year('birth_year');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `birth_year` year not null').toBe(statements[0]);
    });

    it('Works Adding Date Time', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.dateTime('foo', null);
        let statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` datetime not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.dateTime('foo');
        statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` datetime(0) not null').toBe(statements[0]);
    });

    it('Works Adding Date Time With Default Current', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dateTime('foo').useCurrent();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` datetime(0) not null default CURRENT_TIMESTAMP').toBe(statements[0]);
    });

    it('Works Adding Date Time With On Update Current', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dateTime('foo').useCurrentOnUpdate();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` datetime(0) not null on update CURRENT_TIMESTAMP').toBe(statements[0]);
    });

    it('Works Adding Date Time With Default Current And On Update Current', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dateTime('foo').useCurrent().useCurrentOnUpdate();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table `users` add `foo` datetime(0) not null default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP'
        ).toBe(statements[0]);
    });

    it('Works Adding Date Time With Default Current On Update Current And Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.dateTime('foo', 3).useCurrent().useCurrentOnUpdate();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table `users` add `foo` datetime(3) not null default CURRENT_TIMESTAMP(3) on update CURRENT_TIMESTAMP(3)'
        ).toBe(statements[0]);
    });

    it('Works Adding Date Time Tz', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users');
        blueprint.dateTimeTz('foo');
        let statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` datetime(0) not null').toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.dateTimeTz('foo', null);
        statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` datetime not null').toBe(statements[0]);
    });

    it('Works Adding Time', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.time('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` time not null').toBe(statements[0]);
    });

    it('Works Adding Time With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.time('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` time(0) not null').toBe(statements[0]);
    });

    it('Works Adding Time Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timeTz('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` time not null').toBe(statements[0]);
    });

    it('Works Adding Time Tz With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timeTz('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` time(0) not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timestamp('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` timestamp not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timestamp('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` timestamp(0) not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp With Default', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timestamp('created_at', null).default('2015-07-22 11:43:17');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect("alter table `users` add `created_at` timestamp not null default '2015-07-22 11:43:17'").toBe(
            statements[0]
        );
    });

    it('Works Adding Timestamp With Default Current Specifying Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timestamp('created_at').useCurrent();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` timestamp(0) not null default CURRENT_TIMESTAMP').toBe(
            statements[0]
        );
    });

    it('Works Adding Timestamp With On Update Current Specifying Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timestamp('created_at', 1).useCurrentOnUpdate();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` timestamp(1) not null on update CURRENT_TIMESTAMP(1)').toBe(
            statements[0]
        );
    });

    it('Works Adding Timestamp With Default Current And On Update Current Specifying Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timestamp('created_at', 1).useCurrent().useCurrentOnUpdate();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table `users` add `created_at` timestamp(1) not null default CURRENT_TIMESTAMP(1) on update CURRENT_TIMESTAMP(1)'
        ).toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timestampTz('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` timestamp not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timestampTz('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` timestamp(0) not null').toBe(statements[0]);
    });

    it('Works Adding Time Stamp Tz With Default', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timestampTz('created_at').default('2015-07-22 11:43:17');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect("alter table `users` add `created_at` timestamp(0) not null default '2015-07-22 11:43:17'").toBe(
            statements[0]
        );
    });

    it('Works Adding Datetimes', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.datetimes();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` datetime(0) null, add `updated_at` datetime(0) null').toBe(
            statements[0]
        );
    });

    it('Works Adding Timestamps', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timestamps();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` timestamp(0) null, add `updated_at` timestamp(0) null').toBe(
            statements[0]
        );
    });

    it('Works Adding Timestamps Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.timestampsTz();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `created_at` timestamp(0) null, add `updated_at` timestamp(0) null').toBe(
            statements[0]
        );
    });

    it('Works Adding SoftDeletes Datetime', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.softDeletesDatetime('column');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `column` datetime(0) null').toBe(statements[0]);
    });

    it('Works Adding softDeletes', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.softDeletes();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `deleted_at` timestamp(0) null').toBe(statements[0]);
    });

    it('Works Adding softDeletes Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.softDeletesTz();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table `users` add `deleted_at` timestamp(0) null').toBe(statements[0]);
    });

    it('Works Adding Binary', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.binary('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` blob not null').toBe(statements[0]);
    });

    it('Works Adding Uuid', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.uuid('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` char(36) not null').toBe(statements[0]);
    });

    it('Works Adding Uuid Defaults Column Name', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.uuid();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `uuid` char(36) not null').toBe(statements[0]);
    });

    it('Works Adding Ulid', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.ulid('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` char(26) not null').toBe(statements[0]);
    });

    it('Works Adding Ulid Defaults Column Name', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.ulid();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `ulid` char(26) not null').toBe(statements[0]);
    });

    it('Works Adding Foreign Uuid', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        const foreignUuid = blueprint.foreignUuid('foo');
        blueprint.foreignUuid('company_id').constrained();
        blueprint.foreignUuid('laravel_idea_id').constrained();
        blueprint.foreignUuid('team_id').references('id').on('teams');
        blueprint.foreignUuid('team_column_id').constrained('teams');

        const statements = blueprint.toSql(connection);

        expect(foreignUuid).toBeInstanceOf(ForeignIdColumnDefinition);

        expect([
            'alter table `users` add `foo` char(36) not null, add `company_id` char(36) not null, add `laravel_idea_id` char(36) not null, add `team_id` char(36) not null, add `team_column_id` char(36) not null',
            'alter table `users` add constraint `users_company_id_foreign` foreign key (`company_id`) references `companies` (`id`)',
            'alter table `users` add constraint `users_laravel_idea_id_foreign` foreign key (`laravel_idea_id`) references `laravel_ideas` (`id`)',
            'alter table `users` add constraint `users_team_id_foreign` foreign key (`team_id`) references `teams` (`id`)',
            'alter table `users` add constraint `users_team_column_id_foreign` foreign key (`team_column_id`) references `teams` (`id`)'
        ]).toEqual(statements);
    });

    it('Works Adding Foreign Ulid', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        const foreignUlid = blueprint.foreignUlid('foo');
        blueprint.foreignUlid('company_id').constrained();
        blueprint.foreignUlid('laravel_idea_id').constrained();
        blueprint.foreignUlid('team_id').references('id').on('teams');
        blueprint.foreignUlid('team_column_id').constrained('teams');

        const statements = blueprint.toSql(connection);

        expect(foreignUlid).toBeInstanceOf(ForeignIdColumnDefinition);

        expect([
            'alter table `users` add `foo` char(26) not null, add `company_id` char(26) not null, add `laravel_idea_id` char(26) not null, add `team_id` char(26) not null, add `team_column_id` char(26) not null',
            'alter table `users` add constraint `users_company_id_foreign` foreign key (`company_id`) references `companies` (`id`)',
            'alter table `users` add constraint `users_laravel_idea_id_foreign` foreign key (`laravel_idea_id`) references `laravel_ideas` (`id`)',
            'alter table `users` add constraint `users_team_id_foreign` foreign key (`team_id`) references `teams` (`id`)',
            'alter table `users` add constraint `users_team_column_id_foreign` foreign key (`team_column_id`) references `teams` (`id`)'
        ]).toEqual(statements);
    });

    it('Works Adding Ip Address', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.ipAddress('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` varchar(45) not null').toBe(statements[0]);
    });

    it('Works Adding Ip Address Defaults Column Name', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.ipAddress();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `ip_address` varchar(45) not null').toBe(statements[0]);
    });

    it('Works Adding Mac Address', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.macAddress('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `foo` varchar(17) not null').toBe(statements[0]);
    });

    it('Works Adding Mac Address Defaults ColumnName', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.macAddress();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `users` add `mac_address` varchar(17) not null').toBe(statements[0]);
    });

    it('Works Adding Geometry', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.geometry('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` add `coordinates` geometry not null').toBe(statements[0]);
    });

    it('Works Adding Point', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.point('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` add `coordinates` point not null').toBe(statements[0]);
    });

    it('Works Adding Point With Srid', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.point('coordinates', 4326);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` add `coordinates` point not null srid 4326').toBe(statements[0]);
    });

    it('Works Adding Point With Srid Column', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.point('coordinates', 4326).after('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` add `coordinates` point not null srid 4326 after `id`').toBe(statements[0]);
    });

    it('Works Adding Line String', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.lineString('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` add `coordinates` linestring not null').toBe(statements[0]);
    });

    it('Works Adding Polygon', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.polygon('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` add `coordinates` polygon not null').toBe(statements[0]);
    });

    it('Works Adding Geometry Collection', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.geometryCollection('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` add `coordinates` geometrycollection not null').toBe(statements[0]);
    });

    it('Works Adding Multi Point', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.multiPoint('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` add `coordinates` multipoint not null').toBe(statements[0]);
    });

    it('Works Adding Multi Line String', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.multiLineString('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` add `coordinates` multilinestring not null').toBe(statements[0]);
    });

    it('Works Adding Multi Polygon', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.multiPolygon('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table `geo` add `coordinates` multipolygon not null').toBe(statements[0]);
    });

    it('Works Adding Multi PolygonZ', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('geo');
        blueprint.multiPolygonZ('coordinates');
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This Database driver does not support the multipolygonz type');
    });

    it('Works Adding Computed', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('products');
        blueprint.computed('discounted_virtual', 'price - 5').persisted();
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This Database driver does not support the computed type');
    });

    it('Works Adding Comment', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users');
        blueprint.string('foo').comment("Escape ' when using words like it's");
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            "alter table `users` add `foo` varchar(255) not null comment 'Escape \\' when using words like it\\'s'"
        ).toBe(statements[0]);
    });

    it('Works Create Database', () => {
        let connection = getConnection().sessionSchema();
        jest.spyOn(connection, 'getConfig')
            .mockReturnValueOnce('utf8mb4_foo')
            .mockReturnValueOnce('utf8mb4_unicode_ci_foo');

        let statement = new MySqlSchemaGrammar().compileCreateDatabase('my_database_a', connection);

        expect(
            'create database `my_database_a` default character set `utf8mb4_foo` default collate `utf8mb4_unicode_ci_foo`'
        ).toBe(statement);

        connection = getConnection().sessionSchema();
        jest.spyOn(connection, 'getConfig')
            .mockReturnValueOnce('utf8mb4_bar')
            .mockReturnValueOnce('utf8mb4_unicode_ci_bar');

        statement = new MySqlSchemaGrammar().compileCreateDatabase('my_database_b', connection);

        expect(
            'create database `my_database_b` default character set `utf8mb4_bar` default collate `utf8mb4_unicode_ci_bar`'
        ).toBe(statement);
    });

    it('Works Create Table With Virtual As Column', () => {
        let connection = getConnection().sessionSchema();
        jest.spyOn(connection, 'getConfig').mockReturnValueOnce('utf8').mockReturnValueOnce('utf8_unicode_ci');

        let blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.string('my_column');
        blueprint.string('my_other_column').virtualAs('my_column');

        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            "create table `users` (`my_column` varchar(255) not null, `my_other_column` varchar(255) as (my_column)) default character set utf8 collate 'utf8_unicode_ci'"
        ).toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column');
        blueprint.string('my_other_column').virtualAs('my_json_column->some_attribute');

        connection = getConnection().sessionSchema();

        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table `users` (`my_json_column` varchar(255) not null, `my_other_column` varchar(255) as (json_unquote(json_extract(`my_json_column`, \'$."some_attribute"\'))))'
        ).toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column');
        blueprint.string('my_other_column').virtualAs('my_json_column->some_attribute->nested');

        connection = getConnection().sessionSchema();

        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table `users` (`my_json_column` varchar(255) not null, `my_other_column` varchar(255) as (json_unquote(json_extract(`my_json_column`, \'$."some_attribute"."nested"\'))))'
        ).toBe(statements[0]);
    });

    it('Works Create Table With Virtual As Column When Json Column Has Array Key', () => {
        const blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column').virtualAs('my_json_column->foo[0][1]');

        const connection = getConnection().sessionSchema();

        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table `users` (`my_json_column` varchar(255) as (json_unquote(json_extract(`my_json_column`, \'$."foo"[0][1]\'))))'
        ).toBe(statements[0]);
    });

    it('Works Create Table With Stored As Column', () => {
        let connection = getConnection().sessionSchema();
        jest.spyOn(connection, 'getConfig').mockReturnValueOnce('utf8').mockReturnValueOnce('utf8_unicode_ci');

        let blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.string('my_column');
        blueprint.string('my_other_column').storedAs('my_column');

        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            "create table `users` (`my_column` varchar(255) not null, `my_other_column` varchar(255) as (my_column) stored) default character set utf8 collate 'utf8_unicode_ci'"
        ).toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column');
        blueprint.string('my_other_column').storedAs('my_json_column->some_attribute');

        connection = getConnection().sessionSchema();

        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table `users` (`my_json_column` varchar(255) not null, `my_other_column` varchar(255) as (json_unquote(json_extract(`my_json_column`, \'$."some_attribute"\'))) stored)'
        ).toBe(statements[0]);

        blueprint = getMySqlBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column');
        blueprint.string('my_other_column').storedAs('my_json_column->some_attribute->nested');

        connection = getConnection().sessionSchema();

        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table `users` (`my_json_column` varchar(255) not null, `my_other_column` varchar(255) as (json_unquote(json_extract(`my_json_column`, \'$."some_attribute"."nested"\'))) stored)'
        ).toBe(statements[0]);
    });

    it('Works Drop Database If Exists', () => {
        let statement = new MySqlSchemaGrammar().compileDropDatabaseIfExists('my_database_a');

        expect('drop database if exists `my_database_a`').toBe(statement);

        statement = new MySqlSchemaGrammar().compileDropDatabaseIfExists('my_database_b');

        expect('drop database if exists `my_database_b`').toBe(statement);

        statement = new MySqlSchemaGrammar().compileDropDatabaseIfExists('*');

        expect('drop database if exists *').toBe(statement);
    });

    it('Works Drop All Tables', () => {
        const statement = new MySqlSchemaGrammar().compileDropAllTables(['alpha', 'beta', 'gamma']);

        expect('drop table `alpha`,`beta`,`gamma`').toBe(statement);
    });

    it('Works Drop All Views', () => {
        const statement = new MySqlSchemaGrammar().compileDropAllViews(['alpha', 'beta', 'gamma']);

        expect('drop view `alpha`,`beta`,`gamma`').toBe(statement);
    });
});

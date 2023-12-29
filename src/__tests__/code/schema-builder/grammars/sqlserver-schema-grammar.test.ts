import Builder from '../../../../schema/builders/builder';
import ForeignIdColumnDefinition from '../../../../schema/definitions/foreign-id-column-definition';
import SqlServerSchemaGrammar from '../../../../schema/grammars/sqlserver-grammar';
import { getConnection, getSqlServerBlueprint } from '../../fixtures/mocked';

describe('SqlServer Schema Grammar', () => {
    it('Works Basic Create Table', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users');
        blueprint.create();
        blueprint.increments('id');
        blueprint.string('email');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create table "users" ("id" int not null identity primary key, "email" nvarchar(255) not null)').toBe(
            statements[0]
        );

        blueprint = getSqlServerBlueprint('users');
        blueprint.increments('id');
        blueprint.string('email');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "id" int not null identity primary key, "email" nvarchar(255) not null').toBe(
            statements[0]
        );
    });

    it('Works Create Temporary Table', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.create();
        blueprint.temporary();
        blueprint.increments('id');
        blueprint.string('email');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create table "#users" ("id" int not null identity primary key, "email" nvarchar(255) not null)').toBe(
            statements[0]
        );
    });

    it('Works Drop Table', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.drop();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop table "users"').toBe(statements[0]);
    });

    it('Works Drop Table If Exists', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dropTableIfExists();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect("if exists (select * from sys.sysobjects where id = object_id('users', 'U')) drop table \"users\"").toBe(
            statements[0]
        );
    });

    it('Works Drop Column', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users');
        blueprint.dropColumn('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('foo') AND [default_object_id] <> 0;EXEC(@sql);alter table \"users\" drop column \"foo\""
        ).toBe(statements[0]);

        blueprint = getSqlServerBlueprint('users');
        blueprint.dropColumn(['foo', 'bar']);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('foo','bar') AND [default_object_id] <> 0;EXEC(@sql);alter table \"users\" drop column \"foo\", \"bar\""
        ).toBe(statements[0]);

        blueprint = getSqlServerBlueprint('users');
        blueprint.dropColumn('foo', 'bar');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('foo','bar') AND [default_object_id] <> 0;EXEC(@sql);alter table \"users\" drop column \"foo\", \"bar\""
        ).toBe(statements[0]);
    });

    it('Works Drop Column Drops Creates Sql To Drop Default Constraints', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('foo');
        blueprint.dropColumn('bar');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[foo] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[foo]') AND [name] in ('bar') AND [default_object_id] <> 0;EXEC(@sql);alter table \"foo\" drop column \"bar\""
        ).toBe(statements[0]);
    });

    it('Works Drop Primary', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dropPrimary('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop constraint "foo"').toBe(statements[0]);
    });

    it('Works Drop Unique', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dropUnique('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop index "foo" on "users"').toBe(statements[0]);
    });

    it('Works Drop Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dropIndex('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop index "foo" on "users"').toBe(statements[0]);
    });

    it('Works Drop Spatial Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('geo');
        blueprint.dropSpatialIndex(['coordinates']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop index "geo_coordinates_spatialindex" on "geo"').toBe(statements[0]);
    });

    it('Works Drop Foreign', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dropForeign('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop constraint "foo"').toBe(statements[0]);
    });

    it('Works Drop Constrained Foreign Id', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dropConstrainedForeignId('foo');
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table "users" drop constraint "users_foo_foreign"').toBe(statements[0]);
        expect(
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('foo') AND [default_object_id] <> 0;EXEC(@sql);alter table \"users\" drop column \"foo\""
        ).toBe(statements[1]);
    });

    it('Works Drop Timestamps', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dropTimestamps();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('created_at','updated_at') AND [default_object_id] <> 0;EXEC(@sql);alter table \"users\" drop column \"created_at\", \"updated_at\""
        ).toBe(statements[0]);
    });

    it('Works Drop Timestamps Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dropTimestampsTz();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('created_at','updated_at') AND [default_object_id] <> 0;EXEC(@sql);alter table \"users\" drop column \"created_at\", \"updated_at\""
        ).toBe(statements[0]);
    });

    it('Works Drop Morphs', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('photos');
        blueprint.dropMorphs('imageable');
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('drop index "photos_imageable_type_imageable_id_index" on "photos"').toBe(statements[0]);
        expect(
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[photos] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[photos]') AND [name] in ('imageable_type','imageable_id') AND [default_object_id] <> 0;EXEC(@sql);alter table \"photos\" drop column \"imageable_type\", \"imageable_id\""
        ).toBe(statements[1]);
    });

    it('Works Rename Table', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.rename('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('sp_rename "users", "foo"').toBe(statements[0]);
    });

    it('Works Rename Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.renameIndex('foo', 'bar');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('sp_rename N\'"users"."foo"\', "bar", N\'INDEX\'').toBe(statements[0]);
    });

    it('Works Adding Primary Key', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.primary('foo', 'bar');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add constraint "bar" primary key ("foo")').toBe(statements[0]);
    });

    it('Works Adding Unique Key', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.unique('foo', 'bar');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create unique index "bar" on "users" ("foo")').toBe(statements[0]);
    });

    it('Works Adding Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.index(['foo', 'bar'], 'baz');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "baz" on "users" ("foo", "bar")').toBe(statements[0]);
    });

    it('Works Adding Spatial Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('geo');
        blueprint.spatialIndex('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create spatial index "geo_coordinates_spatialindex" on "geo" ("coordinates")').toBe(statements[0]);
    });

    it('Works Adding Fluent Spatial Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('geo');
        blueprint.point('coordinates').spatialIndex();
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('create spatial index "geo_coordinates_spatialindex" on "geo" ("coordinates")').toBe(statements[1]);
    });

    it('Works Adding Raw Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.rawIndex('(function(column))', 'raw_index');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "raw_index" on "users" ((function(column)))').toBe(statements[0]);
    });

    it('Works Adding Incrementing ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.increments('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "id" int not null identity primary key').toBe(statements[0]);
    });

    it('Works Adding Small Incrementing ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.smallIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "id" smallint not null identity primary key').toBe(statements[0]);
    });

    it('Works Adding Medium Incrementing ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.mediumIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "id" int not null identity primary key').toBe(statements[0]);
    });

    it('Works Adding ID', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users');
        blueprint.id();
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "id" bigint not null identity primary key').toBe(statements[0]);

        blueprint = getSqlServerBlueprint('users');
        blueprint.id('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" bigint not null identity primary key').toBe(statements[0]);
    });

    it('Works Adding Foreign ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        const foreignId = blueprint.foreignId('foo');
        blueprint.foreignId('company_id').constrained();
        blueprint.foreignId('laravel_idea_id').constrained();
        blueprint.foreignId('team_id').references('id').on('teams');
        blueprint.foreignId('team_column_id').constrained('teams');

        const statements = blueprint.toSql(connection);

        expect(foreignId).toBeInstanceOf(ForeignIdColumnDefinition);
        expect([
            'alter table "users" add "foo" bigint not null, "company_id" bigint not null, "laravel_idea_id" bigint not null, "team_id" bigint not null, "team_column_id" bigint not null',
            'alter table "users" add constraint "users_company_id_foreign" foreign key ("company_id") references "companies" ("id")',
            'alter table "users" add constraint "users_laravel_idea_id_foreign" foreign key ("laravel_idea_id") references "laravel_ideas" ("id")',
            'alter table "users" add constraint "users_team_id_foreign" foreign key ("team_id") references "teams" ("id")',
            'alter table "users" add constraint "users_team_column_id_foreign" foreign key ("team_column_id") references "teams" ("id")'
        ]).toEqual(statements);
    });

    it('Works Adding Foreign Id Specifying Index Name In Constraint', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.foreignId('company_id').constrained(undefined, undefined, 'my_index');
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table "users" add "company_id" bigint not null').toBe(statements[0]);
        expect(
            'alter table "users" add constraint "my_index" foreign key ("company_id") references "companies" ("id")'
        ).toBe(statements[1]);
    });

    it('Works Adding Big Incrementing ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.bigIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "id" bigint not null identity primary key').toBe(statements[0]);
    });

    it('Works Adding Char Without Length Limit', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users');
        blueprint.char('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nchar(255) not null').toBe(statements[0]);

        Builder.withoutDefaultStringLength();

        blueprint = getSqlServerBlueprint('users');
        blueprint.char('foo');
        statements = blueprint.toSql(connection);

        try {
            expect(1).toBe(statements.length);
            expect('alter table "users" add "foo" nchar not null').toBe(statements[0]);
        } finally {
            Builder.withDefaultStringLength(255);
        }
    });

    it('Works Adding String', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users');
        blueprint.string('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nvarchar(255) not null').toBe(statements[0]);

        blueprint = getSqlServerBlueprint('users');
        blueprint.string('foo', 100);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nvarchar(100) not null').toBe(statements[0]);

        blueprint = getSqlServerBlueprint('users');
        blueprint.string('foo', 100).nullable().default('bar');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nvarchar(100) null default \'bar\'').toBe(statements[0]);
    });

    it('Works Adding String Without Length Limit', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users');
        blueprint.string('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nvarchar(255) not null').toBe(statements[0]);

        Builder.withoutDefaultStringLength();

        blueprint = getSqlServerBlueprint('users');
        blueprint.string('foo');
        statements = blueprint.toSql(connection);

        try {
            expect(1).toBe(statements.length);
            expect('alter table "users" add "foo" nvarchar not null').toBe(statements[0]);
        } finally {
            Builder.withDefaultStringLength(255);
        }
    });

    it('works Column Modifying', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users', table => {
            table.timestamp('added_at', 4).nullable(false).useCurrent().change();
        });

        expect([
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('added_at') AND [default_object_id] <> 0;EXEC(@sql)",
            'alter table "users" alter column "added_at" datetime2(4) not null',
            'alter table "users" add default CURRENT_TIMESTAMP for "added_at"'
        ]).toEqual(blueprint.toSql(connection));

        blueprint = getSqlServerBlueprint('users', table => {
            table.char('name', 40).nullable().default('easy').collation('unicode').change();
        });

        expect([
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('name') AND [default_object_id] <> 0;EXEC(@sql)",
            'alter table "users" alter column "name" nchar(40) collate unicode null',
            'alter table "users" add default \'easy\' for "name"'
        ]).toEqual(blueprint.toSql(connection));

        blueprint = getSqlServerBlueprint('users', table => {
            table.integer('foo').change();
        });

        expect([
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('foo') AND [default_object_id] <> 0;EXEC(@sql)",
            'alter table "users" alter column "foo" int not null'
        ]).toEqual(blueprint.toSql(connection));

        blueprint = getSqlServerBlueprint('users', table => {
            table.computed('discounted_virtual', 'price - 5').persisted().change();
        });

        expect([
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('discounted_virtual') AND [default_object_id] <> 0;EXEC(@sql)",
            'alter table "users" alter column "discounted_virtual" as (price - 5) add persisted'
        ]).toEqual(blueprint.toSql(connection));

        blueprint = getSqlServerBlueprint('users', table => {
            table.computed('discounted_virtual', 'price - 5').persisted(false).change();
        });

        expect([
            "DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('discounted_virtual') AND [default_object_id] <> 0;EXEC(@sql)",
            'alter table "users" alter column "discounted_virtual" as (price - 5) drop persisted'
        ]).toEqual(blueprint.toSql(connection));
    });

    it('Works Adding Text', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.text('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nvarchar(max) not null').toBe(statements[0]);
    });

    it('Works Adding Medium Text', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.mediumText('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nvarchar(max) not null').toBe(statements[0]);
    });

    it('Works Adding Long Text', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.longText('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nvarchar(max) not null').toBe(statements[0]);
    });

    it('Works Adding Big Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users');
        blueprint.bigInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" bigint not null').toBe(statements[0]);

        blueprint = getSqlServerBlueprint('users');
        blueprint.bigInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" bigint not null identity primary key').toBe(statements[0]);
    });

    it('Works Adding Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users');
        blueprint.integer('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" int not null').toBe(statements[0]);

        blueprint = getSqlServerBlueprint('users');
        blueprint.integer('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" int not null identity primary key').toBe(statements[0]);
    });

    it('Works Adding Medium Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users');
        blueprint.mediumInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" int not null').toBe(statements[0]);

        blueprint = getSqlServerBlueprint('users');
        blueprint.mediumInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" int not null identity primary key').toBe(statements[0]);
    });

    it('Works Adding Tiny Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users');
        blueprint.tinyInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" tinyint not null').toBe(statements[0]);

        blueprint = getSqlServerBlueprint('users');
        blueprint.tinyInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" tinyint not null identity primary key').toBe(statements[0]);
    });

    it('Works Adding Small Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSqlServerBlueprint('users');
        blueprint.smallInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" smallint not null').toBe(statements[0]);

        blueprint = getSqlServerBlueprint('users');
        blueprint.smallInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" smallint not null identity primary key').toBe(statements[0]);
    });

    it('Works Adding Float', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.float('foo', 5, 2);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" float not null').toBe(statements[0]);
    });

    it('Works Adding Double', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.double('foo', 15, 2);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" float not null').toBe(statements[0]);
    });

    it('Works Adding Decimal', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.decimal('foo', 5, 2);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" decimal(5, 2) not null').toBe(statements[0]);
    });

    it('Works Adding Boolean', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.boolean('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" bit not null').toBe(statements[0]);
    });

    it('Works Adding Enum', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.enum('role', ['member', 'admin']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add "role" nvarchar(255) check ("role" in (N\'member\', N\'admin\')) not null'
        ).toBe(statements[0]);
    });

    it('Works Adding Json', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.json('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nvarchar(max) not null').toBe(statements[0]);
    });

    it('Works Adding Jsonb', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.jsonb('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nvarchar(max) not null').toBe(statements[0]);
    });

    it('Works Adding Date', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.date('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" date not null').toBe(statements[0]);
    });

    it('Works Adding Year', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.year('birth_year');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "birth_year" int not null').toBe(statements[0]);
    });

    it('Works Adding Date Time', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dateTime('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" datetime2 not null').toBe(statements[0]);
    });

    it('Works Adding Date Time With Default Current', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dateTime('foo', null).useCurrent();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" datetime2 not null default CURRENT_TIMESTAMP').toBe(statements[0]);
    });

    it('Works Adding Date Time With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dateTime('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" datetime2(0) not null').toBe(statements[0]);
    });

    it('Works Adding Date Time Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dateTimeTz('foo', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" datetimeoffset not null').toBe(statements[0]);
    });

    it('Works Adding Date Time Tz With Default Current', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dateTimeTz('foo', null).useCurrent();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" datetimeoffset not null default CURRENT_TIMESTAMP').toBe(statements[0]);
    });

    it('Works Adding Date Time Tz With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.dateTimeTz('foo');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" datetimeoffset(0) not null').toBe(statements[0]);
    });

    it('Works Adding Time', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.time('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" time not null').toBe(statements[0]);
    });

    it('Works Adding Time With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.time('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" time(0) not null').toBe(statements[0]);
    });

    it('Works Adding Time Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.timeTz('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" time not null').toBe(statements[0]);
    });

    it('Works Adding Time Tz With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.timeTz('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" time(0) not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.timestamp('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" datetime2 not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.timestamp('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" datetime2(0) not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.timestampTz('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" datetimeoffset not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.timestampTz('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" datetimeoffset(0) not null').toBe(statements[0]);
    });

    it('Works Adding Timestamps', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.timestamps(null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" datetime2 null, "updated_at" datetime2 null').toBe(statements[0]);
    });

    it('Works Adding Timestamps Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.timestampsTz(null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add "created_at" datetimeoffset null, "updated_at" datetimeoffset null').toBe(
            statements[0]
        );
    });

    it('Works Adding Binary', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.binary('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" varbinary(max) not null').toBe(statements[0]);
    });

    it('Works Adding Uuid', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.uuid('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" uniqueidentifier not null').toBe(statements[0]);
    });

    it('Works Adding Uuid Defaults Column Name', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.uuid();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "uuid" uniqueidentifier not null').toBe(statements[0]);
    });

    it('Works Adding Foreign Uuid', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        const foreignId = blueprint.foreignUuid('foo');
        blueprint.foreignUuid('company_id').constrained();
        blueprint.foreignUuid('laravel_idea_id').constrained();
        blueprint.foreignUuid('team_id').references('id').on('teams');
        blueprint.foreignUuid('team_column_id').constrained('teams');

        const statements = blueprint.toSql(connection);

        expect(foreignId).toBeInstanceOf(ForeignIdColumnDefinition);
        expect([
            'alter table "users" add "foo" uniqueidentifier not null, "company_id" uniqueidentifier not null, "laravel_idea_id" uniqueidentifier not null, "team_id" uniqueidentifier not null, "team_column_id" uniqueidentifier not null',
            'alter table "users" add constraint "users_company_id_foreign" foreign key ("company_id") references "companies" ("id")',
            'alter table "users" add constraint "users_laravel_idea_id_foreign" foreign key ("laravel_idea_id") references "laravel_ideas" ("id")',
            'alter table "users" add constraint "users_team_id_foreign" foreign key ("team_id") references "teams" ("id")',
            'alter table "users" add constraint "users_team_column_id_foreign" foreign key ("team_column_id") references "teams" ("id")'
        ]).toEqual(statements);
    });

    it('Works Adding Ip Address', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.ipAddress('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nvarchar(45) not null').toBe(statements[0]);
    });

    it('Works Adding Ip Address Defaults Column Name', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.ipAddress();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "ip_address" nvarchar(45) not null').toBe(statements[0]);
    });

    it('Works Adding Mac Address', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.macAddress('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "foo" nvarchar(17) not null').toBe(statements[0]);
    });

    it('Works Adding Mac Address Defaults Column Name', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('users');
        blueprint.macAddress();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add "mac_address" nvarchar(17) not null').toBe(statements[0]);
    });

    it('Works Adding Geometry', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('geo');
        blueprint.geometry('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add "coordinates" geography not null').toBe(statements[0]);
    });

    it('Works Adding Point', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('geo');
        blueprint.point('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add "coordinates" geography not null').toBe(statements[0]);
    });

    it('Works Adding Line String', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('geo');
        blueprint.lineString('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add "coordinates" geography not null').toBe(statements[0]);
    });

    it('Works Adding Polygon', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('geo');
        blueprint.polygon('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add "coordinates" geography not null').toBe(statements[0]);
    });

    it('Works Adding Geometry Collection', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('geo');
        blueprint.geometryCollection('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add "coordinates" geography not null').toBe(statements[0]);
    });

    it('Works Adding Multi Point', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('geo');
        blueprint.multiPoint('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add "coordinates" geography not null').toBe(statements[0]);
    });

    it('Works Adding Multi Line String', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('geo');
        blueprint.multiLineString('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add "coordinates" geography not null').toBe(statements[0]);
    });

    it('Works Adding Multi Polygon', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('geo');
        blueprint.multiPolygon('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add "coordinates" geography not null').toBe(statements[0]);
    });

    it('Works Adding Generated Column', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSqlServerBlueprint('products');
        blueprint.integer('price');
        blueprint.computed('discounted_virtual', 'price - 5');
        blueprint.computed('discounted_stored', 'price - 5').persisted();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "products" add "price" int not null, "discounted_virtual" as (price - 5), "discounted_stored" as (price - 5) persisted'
        ).toBe(statements[0]);
    });

    it('Works Quote String', () => {
        expect("N'中文測試'").toBe(new SqlServerSchemaGrammar().quoteString('中文測試'));
    });

    it('Works Quote String On Array', () => {
        expect("N'中文', N'測試'").toBe(new SqlServerSchemaGrammar().quoteString(['中文', '測試']));
    });

    it('Works Create Database', () => {
        const statement = new SqlServerSchemaGrammar().compileCreateDatabase('my_database_a');

        expect('create database "my_database_a"').toBe(statement);
    });

    it('Works Drop Database If Exists', () => {
        let statement = new SqlServerSchemaGrammar().compileDropDatabaseIfExists('my_database_a');

        expect('drop database if exists "my_database_a"').toBe(statement);

        statement = new SqlServerSchemaGrammar().compileDropDatabaseIfExists('my_database_b');

        expect('drop database if exists "my_database_b"').toBe(statement);
    });

    it('Works Drop View If Exists', () => {
        let statement = new SqlServerSchemaGrammar().compileDropViewIfExists('my_view_a');

        expect('drop view if exists "my_view_a"').toBe(statement);

        statement = new SqlServerSchemaGrammar().compileDropViewIfExists('my_view_b');

        expect('drop view if exists "my_view_b"').toBe(statement);
    });
});

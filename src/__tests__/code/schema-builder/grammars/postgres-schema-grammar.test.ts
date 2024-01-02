import Builder from '../../../../schema/builders/builder';
import ForeignIdColumnDefinition from '../../../../schema/definitions/foreign-id-column-definition';
import PostgresSchemaGrammar from '../../../../schema/grammars/postgres-grammar';
import { getPostgresBlueprint, getPostgresConnection } from '../../fixtures/mocked';

describe('Posgtres Schema Grammar', () => {
    it('Works Basic Create Table', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.create();
        blueprint.increments('id');
        blueprint.string('email');
        blueprint.string('name').collation('nb_NO.utf8');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("id" serial not null primary key, "email" varchar(255) not null, "name" varchar(255) collate "nb_NO.utf8" not null)'
        ).toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.increments('id');
        blueprint.string('email');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "id" serial not null primary key, add column "email" varchar(255) not null'
        ).toBe(statements[0]);
    });

    it('Works Create Table With Auto Increment Starting Value', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.create();
        blueprint.increments('id').startingValue(1000);
        blueprint.string('email');
        blueprint.string('name').collation('nb_NO.utf8');
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect(
            'create table "users" ("id" serial not null primary key, "email" varchar(255) not null, "name" varchar(255) collate "nb_NO.utf8" not null)'
        ).toBe(statements[0]);
        expect('alter sequence users_id_seq restart with 1000').toBe(statements[1]);
    });

    it('Works Add Columns With Multiple Auto Increment Starting Value', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.id().from(100);
        blueprint.increments('code').from(200);
        blueprint.string('name').from(300);
        const statements = blueprint.toSql(connection);

        expect([
            'alter table "users" add column "id" bigserial not null primary key, add column "code" serial not null primary key, add column "name" varchar(255) not null',
            'alter sequence users_id_seq restart with 100',
            'alter sequence users_code_seq restart with 200'
        ]).toEqual(statements);
    });

    it('Works Create Table And Comment Column', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.create();
        blueprint.increments('id');
        blueprint.string('email').comment('my first comment');
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('create table "users" ("id" serial not null primary key, "email" varchar(255) not null)').toBe(
            statements[0]
        );
        expect('comment on column "users"."email" is \'my first comment\'').toBe(statements[1]);
    });

    it('Works Create Temporary Table', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.create();
        blueprint.temporary();
        blueprint.increments('id');
        blueprint.string('email');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create temporary table "users" ("id" serial not null primary key, "email" varchar(255) not null)').toBe(
            statements[0]
        );
    });

    it('Works Drop Table', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.drop();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop table "users"').toBe(statements[0]);
    });

    it('Works Drop Table If Exists', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dropTableIfExists();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop table if exists "users"').toBe(statements[0]);
    });

    it('Works Drop Column', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.dropColumn('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "foo"').toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.dropColumn(['foo', 'bar']);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "foo", drop column "bar"').toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.dropColumn('foo', 'bar');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "foo", drop column "bar"').toBe(statements[0]);
    });

    it('Works Drop Primary', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dropPrimary();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop constraint "users_pkey"').toBe(statements[0]);
    });

    it('Works Drop Unique', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dropUnique('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop constraint "foo"').toBe(statements[0]);
    });

    it('Works Drop Index', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dropIndex('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop index "foo"').toBe(statements[0]);
    });

    it('Works Drop Full Text', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dropFulltext(['foo']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop index "users_foo_fulltext"').toBe(statements[0]);
    });

    it('Works Drop Spatial Index', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.dropSpatialIndex(['coordinates']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop index "geo_coordinates_spatialindex"').toBe(statements[0]);
    });

    it('Works Drop Foreign', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dropForeign('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop constraint "foo"').toBe(statements[0]);
    });

    it('Works Drop Timestamps', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dropTimestamps();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "created_at", drop column "updated_at"').toBe(statements[0]);
    });

    it('Works Drop Timestamps Tz', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dropTimestampsTz();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "created_at", drop column "updated_at"').toBe(statements[0]);
    });

    it('Works Drop SoftDeletes', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dropSoftDeletes();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "deleted_at"').toBe(statements[0]);
    });

    it('Works Drop SoftDeletes Tz', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dropSoftDeletesTz('column');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "column"').toBe(statements[0]);
    });

    it('Works Drop Morphs', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('photos');
        blueprint.dropMorphs('imageable');
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('drop index "photos_imageable_type_imageable_id_index"').toBe(statements[0]);
        expect('alter table "photos" drop column "imageable_type", drop column "imageable_id"').toBe(statements[1]);
    });

    it('Works Rename Table', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.rename('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" rename to "foo"').toBe(statements[0]);
    });

    it('Works Rename Index', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.renameIndex('foo', 'bar');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter index "foo" rename to "bar"').toBe(statements[0]);
    });

    it('Works Adding Primary Key', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.primary('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add primary key ("foo")').toBe(statements[0]);
    });

    it('Works Adding Unique Key', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.unique('foo', 'bar');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add constraint "bar" unique ("foo")').toBe(statements[0]);
    });

    it('Works Adding Index', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.index(['foo', 'bar'], 'baz');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "baz" on "users" ("foo", "bar")').toBe(statements[0]);
    });

    it('Works Adding Index With Algorithm', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.index(['foo', 'bar'], 'baz', 'hash');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "baz" on "users" using hash ("foo", "bar")').toBe(statements[0]);
    });

    it('Works Adding Fulltext Index', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.fulltext('body');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "users_body_fulltext" on "users" using gin ((to_tsvector(\'english\', "body")))').toBe(
            statements[0]
        );
    });

    it('Works Adding Fulltext Index Multiple Columns', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.fulltext(['body', 'title']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create index "users_body_title_fulltext" on "users" using gin ((to_tsvector(\'english\', "body") || to_tsvector(\'english\', "title")))'
        ).toBe(statements[0]);
    });

    it('Works Adding Fulltext Index With Language', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.fulltext('body').language('spanish');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "users_body_fulltext" on "users" using gin ((to_tsvector(\'spanish\', "body")))').toBe(
            statements[0]
        );
    });

    it('Works Adding Fulltext Index With Fluency', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.string('body').fulltext();
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('create index "users_body_fulltext" on "users" using gin ((to_tsvector(\'english\', "body")))').toBe(
            statements[1]
        );
    });

    it('Works Adding Spatial Index', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.spatialIndex('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "geo_coordinates_spatialindex" on "geo" using gist ("coordinates")').toBe(statements[0]);
    });

    it('Works Adding Fluent Spatial Index', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.point('coordinates').spatialIndex();
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('create index "geo_coordinates_spatialindex" on "geo" using gist ("coordinates")').toBe(statements[1]);
    });

    it('Works Adding Raw Index', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.rawIndex('(function(column))', 'raw_index');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "raw_index" on "users" ((function(column)))').toBe(statements[0]);
    });

    it('Works Adding Incrementing ID', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.increments('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" serial not null primary key').toBe(statements[0]);
    });

    it('Works Adding Small Incrementing ID', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.smallIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" smallserial not null primary key').toBe(statements[0]);
    });

    it('Works Adding Medium Incrementing ID', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.mediumIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" serial not null primary key').toBe(statements[0]);
    });

    it('Works Adding ID', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.id();
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" bigserial not null primary key').toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.id('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" bigserial not null primary key').toBe(statements[0]);
    });

    it('Works Adding Foreign ID', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        const foreignId = blueprint.foreignId('foo');
        blueprint.foreignId('company_id').constrained();
        blueprint.foreignId('laravel_idea_id').constrained();
        blueprint.foreignId('team_id').references('id').on('teams');
        blueprint.foreignId('team_column_id').constrained('teams');

        const statements = blueprint.toSql(connection);

        expect(foreignId).toBeInstanceOf(ForeignIdColumnDefinition);
        expect([
            'alter table "users" add column "foo" bigint not null, add column "company_id" bigint not null, add column "laravel_idea_id" bigint not null, add column "team_id" bigint not null, add column "team_column_id" bigint not null',
            'alter table "users" add constraint "users_company_id_foreign" foreign key ("company_id") references "companies" ("id")',
            'alter table "users" add constraint "users_laravel_idea_id_foreign" foreign key ("laravel_idea_id") references "laravel_ideas" ("id")',
            'alter table "users" add constraint "users_team_id_foreign" foreign key ("team_id") references "teams" ("id")',
            'alter table "users" add constraint "users_team_column_id_foreign" foreign key ("team_column_id") references "teams" ("id")'
        ]).toEqual(statements);
    });

    it('Works Adding Foreign Id Specifying Index Name In Constraint', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.foreignId('company_id').constrained(undefined, undefined, 'my_index');
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect('alter table "users" add column "company_id" bigint not null').toBe(statements[0]);
        expect(
            'alter table "users" add constraint "my_index" foreign key ("company_id") references "companies" ("id")'
        ).toBe(statements[1]);
    });

    it('Works Adding Big Incrementing ID', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.bigIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" bigserial not null primary key').toBe(statements[0]);
    });

    it('Works Adding String', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.string('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar(255) not null').toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.string('foo', 100);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar(100) not null').toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.string('foo', 100).nullable().default('bar');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar(100) null default \'bar\'').toBe(statements[0]);
    });

    it('Works Column Modifying', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users', table => {
            table.integer('code').autoIncrement().from(10).comment('my comment').change();
        });

        expect([
            'alter table "users" ' +
                'alter column "code" type serial, ' +
                'alter column "code" set not null, ' +
                'alter column "code" drop default, ' +
                'alter column "code" drop identity if exists',
            'alter sequence users_code_seq restart with 10',
            'comment on column "users"."code" is \'my comment\''
        ]).toEqual(blueprint.toSql(connection));

        blueprint = getPostgresBlueprint('users', table => {
            table.char('name', 40).nullable().default('easy').collation('unicode').change();
        });

        expect([
            'alter table "users" ' +
                'alter column "name" type char(40) collate "unicode", ' +
                'alter column "name" drop not null, ' +
                'alter column "name" set default \'easy\', ' +
                'alter column "name" drop identity if exists',
            'comment on column "users"."name" is NULL'
        ]).toEqual(blueprint.toSql(connection));

        blueprint = getPostgresBlueprint('users', table => {
            table.integer('foo').generatedAs('expression').always().change();
        });

        expect([
            'alter table "users" ' +
                'alter column "foo" type integer, ' +
                'alter column "foo" set not null, ' +
                'alter column "foo" drop default, ' +
                'alter column "foo" drop identity if exists, ' +
                'alter column "foo" add  generated always as identity (expression)',
            'comment on column "users"."foo" is NULL'
        ]).toEqual(blueprint.toSql(connection));

        blueprint = getPostgresBlueprint('users', table => {
            table.point('foo').isGeometry().projection(1234).unsetVirtualAs().change();
        });

        expect([
            'alter table "users" ' +
                'alter column "foo" type geometry(point, 1234), ' +
                'alter column "foo" set not null, ' +
                'alter column "foo" drop default, ' +
                'alter column "foo" drop expression if exists, ' +
                'alter column "foo" drop identity if exists',
            'comment on column "users"."foo" is NULL'
        ]).toEqual(blueprint.toSql(connection));

        blueprint = getPostgresBlueprint('users', table => {
            table.timestamp('added_at', 2).useCurrent().unsetStoredAs().change();
        });

        expect([
            'alter table "users" ' +
                'alter column "added_at" type timestamp(2) without time zone, ' +
                'alter column "added_at" set not null, ' +
                'alter column "added_at" set default CURRENT_TIMESTAMP, ' +
                'alter column "added_at" drop expression if exists, ' +
                'alter column "added_at" drop identity if exists',
            'comment on column "users"."added_at" is NULL'
        ]).toEqual(blueprint.toSql(connection));

        blueprint = getPostgresBlueprint('users', table => {
            table.timestamp('added_at', 2).useCurrent().virtualAs('foo is not null').change();
        });

        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This database driver does not support modifying generated columns.');

        blueprint = getPostgresBlueprint('users', table => {
            table.timestamp('added_at', 2).useCurrent().storedAs('foo is not null').change();
        });

        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This database driver does not support modifying generated columns.');
    });

    it('Works Adding String Without Length Limit', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.string('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar(255) not null').toBe(statements[0]);

        Builder.withoutDefaultStringLength();

        blueprint = getPostgresBlueprint('users');
        blueprint.string('foo');
        statements = blueprint.toSql(connection);

        try {
            expect(1).toBe(statements.length);
            expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);
        } finally {
            Builder.withDefaultStringLength(255);
        }
    });

    it('Works Adding Char Without Length Limit', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.char('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" char(255) not null').toBe(statements[0]);

        Builder.withoutDefaultStringLength();

        blueprint = getPostgresBlueprint('users');
        blueprint.char('foo');
        statements = blueprint.toSql(connection);

        try {
            expect(1).toBe(statements.length);
            expect('alter table "users" add column "foo" char not null').toBe(statements[0]);
        } finally {
            Builder.withDefaultStringLength(255);
        }
    });

    it('Works Adding Text', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.text('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Medium Text', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.mediumText('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Long Text', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.longText('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Big Integer', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.bigInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" bigint not null').toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.bigInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" bigserial not null primary key').toBe(statements[0]);
    });

    it('Works Adding Integer', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.integer('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.integer('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" serial not null primary key').toBe(statements[0]);
    });

    it('Works Adding Medium Integer', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.mediumInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.mediumInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" serial not null primary key').toBe(statements[0]);
    });

    it('Works Adding Tiny Integer', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.tinyInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" smallint not null').toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.tinyInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" smallserial not null primary key').toBe(statements[0]);
    });

    it('Works Adding Small Integer', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.smallInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" smallint not null').toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.smallInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" smallserial not null primary key').toBe(statements[0]);
    });

    it('Works Adding Float', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.float('foo', 5, 2);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" double precision not null').toBe(statements[0]);
    });

    it('Works Adding Double', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.double('foo', 15, 8);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" double precision not null').toBe(statements[0]);
    });

    it('Works Adding Decimal', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.decimal('foo', 5, 2);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" decimal(5, 2) not null').toBe(statements[0]);
    });

    it('Works Adding Boolean', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.boolean('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" boolean not null').toBe(statements[0]);
    });

    it('Works Adding Enum', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.enum('role', ['member', 'admin']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "role" varchar(255) check ("role" in (\'member\', \'admin\')) not null'
        ).toBe(statements[0]);
    });

    it('Works Adding Set', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.set('role', ['member', 'admin']);
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This Database driver does not support the set type.');
    });

    it('Works Adding Date', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.date('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" date not null').toBe(statements[0]);
    });

    it('Works Adding Year', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.year('birth_year');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "birth_year" integer not null').toBe(statements[0]);
    });

    it('Works Adding Json', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.json('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" json not null').toBe(statements[0]);
    });

    it('Works Adding Jsonb', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.jsonb('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" jsonb not null').toBe(statements[0]);
    });

    it('Works Adding Date Time Null Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dateTime('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp without time zone not null').toBe(statements[0]);
    });

    it('Works Adding Date Time Current', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dateTime('created_at').useCurrent();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "created_at" timestamp(0) without time zone not null default CURRENT_TIMESTAMP'
        ).toBe(statements[0]);
    });

    it('Works Adding Date Time With Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dateTime('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp(1) without time zone not null').toBe(
            statements[0]
        );
    });

    it('Works Adding Date Time With Null Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dateTime('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp without time zone not null').toBe(statements[0]);
    });

    it('Works Adding Date Time Tz Null Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dateTimeTz('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp with time zone not null').toBe(statements[0]);
    });

    it('Works Adding Date Time Tz Current', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dateTimeTz('created_at').useCurrent();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "created_at" timestamp(0) with time zone not null default CURRENT_TIMESTAMP'
        ).toBe(statements[0]);
    });

    it('Works Adding Date Time Tz With Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dateTimeTz('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp(1) with time zone not null').toBe(statements[0]);
    });

    it('Works Adding Date Time Tz With Null Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.dateTimeTz('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp with time zone not null').toBe(statements[0]);
    });

    it('Works Adding Time', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.time('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time(0) without time zone not null').toBe(statements[0]);
    });

    it('Works Adding Time With Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.time('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time(1) without time zone not null').toBe(statements[0]);
    });

    it('Works Adding Time With Null Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.time('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time without time zone not null').toBe(statements[0]);
    });

    it('Works Adding Time Tz', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timeTz('created_at', 0);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time(0) with time zone not null').toBe(statements[0]);
    });

    it('Works Adding Time Tz With Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timeTz('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time(1) with time zone not null').toBe(statements[0]);
    });

    it('Works Adding Time Tz With Null Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timeTz('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time with time zone not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timestamp('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp(0) without time zone not null').toBe(
            statements[0]
        );
    });

    it('Works Adding Timestamp Current', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timestamp('created_at').useCurrent();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "created_at" timestamp(0) without time zone not null default CURRENT_TIMESTAMP'
        ).toBe(statements[0]);
    });

    it('Works Adding Timestamp With Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timestamp('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp(1) without time zone not null').toBe(
            statements[0]
        );
    });

    it('Works Adding Timestamp With Null Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timestamp('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp without time zone not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz With Null Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timestampTz('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp with time zone not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz Current', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timestampTz('created_at').useCurrent();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "created_at" timestamp(0) with time zone not null default CURRENT_TIMESTAMP'
        ).toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz With Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timestampTz('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp(1) with time zone not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz With Null Precision', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timestampTz('created_at', null);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" timestamp with time zone not null').toBe(statements[0]);
    });

    it('Works Adding Datetimes', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.datetimes(0);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "created_at" timestamp(0) without time zone null, add column "updated_at" timestamp(0) without time zone null'
        ).toBe(statements[0]);
    });

    it('Works Adding Timestamps', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timestamps(0);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "created_at" timestamp(0) without time zone null, add column "updated_at" timestamp(0) without time zone null'
        ).toBe(statements[0]);
    });

    it('Works Adding Timestamps Tz', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.timestampsTz(0);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "created_at" timestamp(0) with time zone null, add column "updated_at" timestamp(0) with time zone null'
        ).toBe(statements[0]);
    });

    it('Works Adding SoftDeletes Datetime', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.softDeletesDatetime();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "deleted_at" timestamp(0) without time zone null').toBe(statements[0]);
    });

    it('Works Adding SoftDeletes', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.softDeletes('column', 0);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "column" timestamp(0) without time zone null').toBe(statements[0]);
    });

    it('Works Adding SoftDeletes Tz', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.softDeletesTz('column', 0);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "column" timestamp(0) with time zone null').toBe(statements[0]);
    });

    it('Works Adding Binary', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.binary('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" bytea not null').toBe(statements[0]);
    });

    it('Works Adding Uuid', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.uuid('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" uuid not null').toBe(statements[0]);
    });

    it('Works Adding Uuid Defaults Column Name', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.uuid();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "uuid" uuid not null').toBe(statements[0]);
    });

    it('Works Adding Ulid', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.ulid('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" char(26) not null').toBe(statements[0]);
    });

    it('Works Adding Ulid Defaults Column Name', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.ulid();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "ulid" char(26) not null').toBe(statements[0]);
    });

    it('Works Adding Foreign Uuid', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        const foreignUuid = blueprint.foreignUuid('foo');
        blueprint.foreignUuid('company_id').constrained();
        blueprint.foreignUuid('laravel_idea_id').constrained();
        blueprint.foreignUuid('team_id').references('id').on('teams');
        blueprint.foreignUuid('team_column_id').constrained('teams');

        const statements = blueprint.toSql(connection);

        expect(foreignUuid).toBeInstanceOf(ForeignIdColumnDefinition);
        expect([
            'alter table "users" add column "foo" uuid not null, add column "company_id" uuid not null, add column "laravel_idea_id" uuid not null, add column "team_id" uuid not null, add column "team_column_id" uuid not null',
            'alter table "users" add constraint "users_company_id_foreign" foreign key ("company_id") references "companies" ("id")',
            'alter table "users" add constraint "users_laravel_idea_id_foreign" foreign key ("laravel_idea_id") references "laravel_ideas" ("id")',
            'alter table "users" add constraint "users_team_id_foreign" foreign key ("team_id") references "teams" ("id")',
            'alter table "users" add constraint "users_team_column_id_foreign" foreign key ("team_column_id") references "teams" ("id")'
        ]).toEqual(statements);
    });

    it('Works Adding Foreign Ulid', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        const foreignUlid = blueprint.foreignUlid('foo');
        blueprint.foreignUlid('company_id').constrained();
        blueprint.foreignUlid('laravel_idea_id').constrained();
        blueprint.foreignUlid('team_id').references('id').on('teams');
        blueprint.foreignUlid('team_column_id').constrained('teams');

        const statements = blueprint.toSql(connection);

        expect(foreignUlid).toBeInstanceOf(ForeignIdColumnDefinition);
        expect([
            'alter table "users" add column "foo" char(26) not null, add column "company_id" char(26) not null, add column "laravel_idea_id" char(26) not null, add column "team_id" char(26) not null, add column "team_column_id" char(26) not null',
            'alter table "users" add constraint "users_company_id_foreign" foreign key ("company_id") references "companies" ("id")',
            'alter table "users" add constraint "users_laravel_idea_id_foreign" foreign key ("laravel_idea_id") references "laravel_ideas" ("id")',
            'alter table "users" add constraint "users_team_id_foreign" foreign key ("team_id") references "teams" ("id")',
            'alter table "users" add constraint "users_team_column_id_foreign" foreign key ("team_column_id") references "teams" ("id")'
        ]).toEqual(statements);
    });

    it('Works Adding Generated As', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.increments('foo').generatedAs();
        let statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "foo" integer not null generated by default as identity primary key'
        ).toBe(statements[0]);
        // With always modifier
        blueprint = getPostgresBlueprint('users');
        blueprint.increments('foo').generatedAs().always();
        statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null generated always as identity primary key').toBe(
            statements[0]
        );
        // With sequence options
        blueprint = getPostgresBlueprint('users');
        blueprint.increments('foo').generatedAs('increment by 10 start with 100');
        statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "foo" integer not null generated by default as identity (increment by 10 start with 100) primary key'
        ).toBe(statements[0]);
        // Not a primary key
        blueprint = getPostgresBlueprint('users');
        blueprint.integer('foo').generatedAs();
        statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null generated by default as identity').toBe(
            statements[0]
        );

        blueprint = getPostgresBlueprint('users');
        blueprint.string('foo').autoIncrement().generatedAs();
        statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "foo" varchar(255) not null generated by default as identity primary key'
        ).toBe(statements[0]);
    });

    it('Works Adding Virtual As', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.integer('foo').nullable();
        blueprint.boolean('bar').virtualAs('foo is not null');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "foo" integer null, add column "bar" boolean not null generated always as (foo is not null)'
        ).toBe(statements[0]);
    });

    it('Works Adding Stored As', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.integer('foo').nullable();
        blueprint.boolean('bar').storedAs('foo is not null');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add column "foo" integer null, add column "bar" boolean not null generated always as (foo is not null) stored'
        ).toBe(statements[0]);
    });

    it('Works Adding Ip Address', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.ipAddress('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" inet not null').toBe(statements[0]);
    });

    it('Works Adding Ip Address Defaults Column Name', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.ipAddress();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "ip_address" inet not null').toBe(statements[0]);
    });

    it('Works Adding Mac Address', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.macAddress('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" macaddr not null').toBe(statements[0]);
    });

    it('Works Adding Mac Address Defaults Column Name', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('users');
        blueprint.macAddress();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "mac_address" macaddr not null').toBe(statements[0]);
    });

    it('Works Compile Foreign', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.foreign('parent_id').references('id').on('parents').onDelete('cascade').deferrable();
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add constraint "users_parent_id_foreign" foreign key ("parent_id") references "parents" ("id") on delete cascade deferrable'
        ).toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.foreign('parent_id').references('id').on('parents').nullOnDelete().deferrable().initiallyImmediate();

        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add constraint "users_parent_id_foreign" foreign key ("parent_id") references "parents" ("id") on delete set null deferrable initially immediate'
        ).toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint
            .foreign('parent_id')
            .references('id')
            .on('parents')
            .noActionOnDelete()
            .noActionOnUpdate()
            .deferrable(false)
            .initiallyImmediate();
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add constraint "users_parent_id_foreign" foreign key ("parent_id") references "parents" ("id") on delete no action on update no action not deferrable'
        ).toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint
            .foreign('parent_id')
            .references('id')
            .on('parents')
            .onDelete('cascade')
            .deferrable()
            .initiallyImmediate(false);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add constraint "users_parent_id_foreign" foreign key ("parent_id") references "parents" ("id") on delete cascade deferrable initially deferred'
        ).toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.foreign('parent_id').references('id').on('parents').onDelete('cascade').deferrable().notValid();
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add constraint "users_parent_id_foreign" foreign key ("parent_id") references "parents" ("id") on delete cascade deferrable not valid'
        ).toBe(statements[0]);
    });

    it('Works Compile Unique', () => {
        const connection = getPostgresConnection().sessionSchema();
        let blueprint = getPostgresBlueprint('users');
        blueprint.unique('key').deferrable();
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add constraint "users_key_unique" unique ("key") deferrable').toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.unique('key').deferrable().initiallyImmediate();
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add constraint "users_key_unique" unique ("key") deferrable initially immediate'
        ).toBe(statements[0]);

        blueprint = getPostgresBlueprint('users');
        blueprint.unique('key').deferrable(false);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add constraint "users_key_unique" unique ("key") not deferrable').toBe(
            statements[0]
        );

        blueprint = getPostgresBlueprint('users');
        blueprint.unique('key').deferrable().initiallyImmediate(false);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'alter table "users" add constraint "users_key_unique" unique ("key") deferrable initially deferred'
        ).toBe(statements[0]);
    });

    it('Works Adding Geometry', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.geometry('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geography(geometry, 4326) not null').toBe(statements[0]);
    });

    it('Works Adding Point', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.point('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geography(point, 4326) not null').toBe(statements[0]);
    });

    it('Works Adding Line String', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.lineString('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geography(linestring, 4326) not null').toBe(statements[0]);
    });

    it('Works Adding Polygon', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.polygon('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geography(polygon, 4326) not null').toBe(statements[0]);
    });

    it('Works Adding Geometry Collection', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.geometryCollection('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geography(geometrycollection, 4326) not null').toBe(
            statements[0]
        );
    });

    it('Works Adding Multi Point', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.multiPoint('coordinates').isGeometry();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geometry(multipoint) not null').toBe(statements[0]);
    });

    it('Works Adding Multi Line String', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.multiLineString('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geography(multilinestring, 4326) not null').toBe(
            statements[0]
        );
    });

    it('Works Adding Multi Polygon', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.multiPolygon('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geography(multipolygon, 4326) not null').toBe(statements[0]);
    });

    it('Works Adding Multi PolygonZ', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('geo');
        blueprint.multiPolygonZ('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geography(multipolygonz, 4326) not null').toBe(
            statements[0]
        );
    });

    it('Works Adding Computed', () => {
        const connection = getPostgresConnection().sessionSchema();
        const blueprint = getPostgresBlueprint('products');
        blueprint.computed('discounted_virtual', 'price - 5').persisted();
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This Database driver does not support the computed type');
    });

    it('Works Create Database', () => {
        let connection = getPostgresConnection().sessionSchema();
        jest.spyOn(connection, 'getConfig').mockReturnValueOnce('utf8_foo');

        let statement = new PostgresSchemaGrammar().compileCreateDatabase('my_database_a', connection);

        expect('create database "my_database_a" encoding "utf8_foo"').toBe(statement);

        connection = getPostgresConnection().sessionSchema();
        jest.spyOn(connection, 'getConfig').mockReturnValueOnce('utf8_bar');

        statement = new PostgresSchemaGrammar().compileCreateDatabase('my_database_b', connection);

        expect('create database "my_database_b" encoding "utf8_bar"').toBe(statement);
    });

    it('Works Drop Database If Exists', () => {
        let statement = new PostgresSchemaGrammar().compileDropDatabaseIfExists('my_database_a');

        expect('drop database if exists "my_database_a"').toBe(statement);

        statement = new PostgresSchemaGrammar().compileDropDatabaseIfExists('my_database_b');

        expect('drop database if exists "my_database_b"').toBe(statement);
    });

    it('Works Drop Tables Escapes Table Names', () => {
        const statement = new PostgresSchemaGrammar().compileDropTables(['alpha', 'beta', 'gamma']);

        expect('drop table "alpha","beta","gamma" cascade').toBe(statement);
    });

    it('Works Drop Views Escapes Table Names', () => {
        const statement = new PostgresSchemaGrammar().compileDropViews(['alpha', 'beta', 'gamma']);

        expect('drop view "alpha","beta","gamma" cascade').toBe(statement);
    });

    it('Works Drop Types Escapes Table Names', () => {
        const statement = new PostgresSchemaGrammar().compileDropTypes(['alpha', 'beta', 'gamma']);

        expect('drop type "alpha","beta","gamma" cascade').toBe(statement);
    });
});

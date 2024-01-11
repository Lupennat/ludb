import ForeignIdColumnDefinition from '../../../../schema/definitions/foreign-id-column-definition';
import { getSqliteBlueprint, getSqliteConnection } from '../../fixtures/mocked';

describe('Sqlite Schema Grammar', () => {
    it('Works Basic Create Table', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.increments('id');
        blueprint.string('email');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create table "users" ("id" integer primary key autoincrement not null, "email" varchar not null)').toBe(
            statements[0]
        );

        blueprint = getSqliteBlueprint('users');
        blueprint.increments('id');
        blueprint.string('email');
        statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        const expected = [
            'alter table "users" add column "id" integer primary key autoincrement not null',
            'alter table "users" add column "email" varchar not null'
        ];
        expect(expected).toEqual(statements);
    });

    it('Works Create Temporary Table', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.temporary();
        blueprint.increments('id');
        blueprint.string('email');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create temporary table "users" ("id" integer primary key autoincrement not null, "email" varchar not null)'
        ).toBe(statements[0]);
    });

    it('Works Drop Table', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.drop();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop table "users"').toBe(statements[0]);
    });

    it('Works Drop Table If Exists', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dropTableIfExists();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop table if exists "users"').toBe(statements[0]);
    });

    it('Works Drop Column', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.dropColumn('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "foo"').toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.dropColumn(['foo', 'bar']);
        statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect(['alter table "users" drop column "foo"', 'alter table "users" drop column "bar"']).toEqual(statements);

        blueprint = getSqliteBlueprint('users');
        blueprint.dropColumn('foo', 'bar');
        statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect(['alter table "users" drop column "foo"', 'alter table "users" drop column "bar"']).toEqual(statements);
    });

    it('Works Drop Primary', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dropPrimary();
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This database driver does not support primary key removal.');
    });

    it('Works Drop Unique', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dropUnique('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop index "foo"').toBe(statements[0]);
    });

    it('Works Drop Index', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dropIndex('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop index "foo"').toBe(statements[0]);
    });

    it('Works Drop Full Text', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dropFulltext(['foo']);
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This database driver does not support fulltext index removal.');
    });

    it('Works Drop Spatial Index', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.dropSpatialIndex(['coordinates']);
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This database driver does not support spatial index removal.');
    });

    it('Works Drop Timestamps', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dropTimestamps();
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect([
            'alter table "users" drop column "created_at"',
            'alter table "users" drop column "updated_at"'
        ]).toEqual(statements);
    });

    it('Works Drop Timestamps Tz', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dropTimestampsTz();
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect([
            'alter table "users" drop column "created_at"',
            'alter table "users" drop column "updated_at"'
        ]).toEqual(statements);
    });

    it('Works Drop SoftDeletes', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dropSoftDeletes();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "deleted_at"').toBe(statements[0]);
    });

    it('Works Drop SoftDeletes Tz', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dropSoftDeletesTz();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "deleted_at"').toBe(statements[0]);
    });

    it('Works Rename Table', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.rename('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" rename to "foo"').toBe(statements[0]);
    });

    it('Works Rename Index', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.renameIndex('foo', 'bar');
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This database driver does not support index renaming.');
    });

    it('Works Adding Primary Key', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.string('foo').primary();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create table "users" ("foo" varchar not null, primary key ("foo"))').toBe(statements[0]);
    });

    it('Works Adding Foreign Key', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.string('foo').primary();
        blueprint.string('order_id');
        blueprint.foreign('order_id').references('id').on('orders');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("foo" varchar not null, "order_id" varchar not null, foreign key("order_id") references "orders"("id"), primary key ("foo"))'
        ).toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.string('foo').primary();
        blueprint.string('order_id');
        blueprint.foreign('order_id').references(['id', 'name']).on('orders').restrictOnUpdate().restrictOnDelete();
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("foo" varchar not null, "order_id" varchar not null, foreign key("order_id") references "orders"("id", "name") on delete restrict on update restrict, primary key ("foo"))'
        ).toBe(statements[0]);
    });

    it('Works Adding Unique Key', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.unique('foo', 'bar');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create unique index "bar" on "users" ("foo")').toBe(statements[0]);
    });

    it('Works Adding Index', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.index(['foo', 'bar'], 'baz');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "baz" on "users" ("foo", "bar")').toBe(statements[0]);
    });

    it('Works Adding Spatial Index', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.spatialIndex('coordinates');
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This database driver does not support spatial index creation.');
    });

    it('Works Adding Fluent Spatial Index', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.point('coordinates').spatialIndex();
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This database driver does not support spatial index creation.');
    });

    it('Works Adding Fulltext Index', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.fulltext('coordinates');
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This database driver does not support fulltext index creation.');
    });

    it('Works Adding Fluent Fulltext Index', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.point('coordinates').fulltext();
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This database driver does not support fulltext index creation.');
    });

    it('Works Adding Raw Index', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.rawIndex('(function(column))', 'raw_index');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "raw_index" on "users" ((function(column)))').toBe(statements[0]);
    });

    it('Works Adding Incrementing ID', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.increments('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Small Incrementing ID', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.smallIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Medium Incrementing ID', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.mediumIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding ID', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.id();
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" integer primary key autoincrement not null').toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.id('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Foreign ID', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        const foreignId = blueprint.foreignId('foo');
        blueprint.foreignId('company_id').constrained();
        blueprint.foreignId('laravel_idea_id').constrained();
        blueprint.foreignId('team_id').references(['id', 'name']).on('teams');
        blueprint.foreignId('team_column_id').constrained('teams');

        const statements = blueprint.toSql(connection);

        expect(foreignId).toBeInstanceOf(ForeignIdColumnDefinition);
        expect([
            'alter table "users" add column "foo" integer not null',
            'alter table "users" add column "company_id" integer not null',
            'alter table "users" add column "laravel_idea_id" integer not null',
            'alter table "users" add column "team_id" integer not null',
            'alter table "users" add column "team_column_id" integer not null'
        ]).toEqual(statements);
    });

    it('Works Adding Foreign Id Specifying Index Name In Constraint', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.foreignId('company_id').constrained(undefined, undefined, 'my_index');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "company_id" integer not null').toBe(statements[0]);
    });

    it('Works Adding Big Incrementing ID', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.bigIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding String', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.string('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.string('foo', 100);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.string('foo', 100).nullable().default('bar');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar default \'bar\'').toBe(statements[0]);
    });

    it('Works Adding Text', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.text('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Medium Text', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.mediumText('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Long Text', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.longText('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Big Integer', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.bigInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.bigInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Integer', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.integer('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.integer('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Medium Integer', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.mediumInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.mediumInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Tiny Integer', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.tinyInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.tinyInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Small Integer', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.smallInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.smallInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Float', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.float('foo', 5, 2);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" float not null').toBe(statements[0]);
    });

    it('Works Adding Double', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.double('foo', 15, 8);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" float not null').toBe(statements[0]);
    });

    it('Works Adding Decimal', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.decimal('foo', 5, 2);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" numeric not null').toBe(statements[0]);
    });

    it('Works Adding Boolean', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.boolean('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" tinyint(1) not null').toBe(statements[0]);
    });

    it('Works Adding Enum', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.enum('role', ['member', 'admin']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "role" varchar check ("role" in (\'member\', \'admin\')) not null').toBe(
            statements[0]
        );
    });

    it('Works Adding Set', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.set('role', ['member', 'admin']);
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This Database driver does not support the set type.');
    });

    it('Works Adding Year', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.year('birth_year');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "birth_year" integer not null').toBe(statements[0]);
    });

    it('Works Adding Json', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.json('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Jsonb', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.jsonb('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Date', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.date('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" date not null').toBe(statements[0]);
    });

    it('Works Adding Year', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.year('birth_year');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "birth_year" integer not null').toBe(statements[0]);
    });

    it('Works Adding Date Time', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dateTime('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Date Time With Precision', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dateTime('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Date Time Tz', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dateTimeTz('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Date Time Tz With Precision', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.dateTimeTz('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Time', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.time('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time not null').toBe(statements[0]);
    });

    it('Works Adding Time With Precision', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.time('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time not null').toBe(statements[0]);
    });

    it('Works Adding Time Tz', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.timeTz('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time not null').toBe(statements[0]);
    });

    it('Works Adding Time Tz With Precision', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.timeTz('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.timestamp('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp With Precision', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.timestamp('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.timestampTz('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz With Precision', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.timestampTz('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Datetimes', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.datetimes();
        const statements = blueprint.toSql(connection);
        expect(2).toBe(statements.length);
        expect([
            'alter table "users" add column "created_at" datetime',
            'alter table "users" add column "updated_at" datetime'
        ]).toEqual(statements);
    });

    it('Works Adding Timestamps', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.timestamps();
        const statements = blueprint.toSql(connection);
        expect(2).toBe(statements.length);
        expect([
            'alter table "users" add column "created_at" datetime',
            'alter table "users" add column "updated_at" datetime'
        ]).toEqual(statements);
    });

    it('Works Adding Timestamps Tz', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.timestampsTz();
        const statements = blueprint.toSql(connection);
        expect(2).toBe(statements.length);
        expect([
            'alter table "users" add column "created_at" datetime',
            'alter table "users" add column "updated_at" datetime'
        ]).toEqual(statements);
    });

    it('Works Adding SoftDeletes Datetime', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.softDeletesDatetime();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(['alter table "users" add column "deleted_at" datetime']).toEqual(statements);
    });

    it('Works Adding SoftDeletes', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.softDeletes();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(['alter table "users" add column "deleted_at" datetime']).toEqual(statements);
    });

    it('Works Adding SoftDeletes Tz', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.softDeletesTz();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(['alter table "users" add column "deleted_at" datetime']).toEqual(statements);
    });

    it('Works Adding Binary', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.binary('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" blob not null').toBe(statements[0]);
    });

    it('Works Adding Uuid', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.uuid('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Uuid Defaults Column Name', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.uuid();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "uuid" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Ulid', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.ulid('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Ulid Defaults Column Name', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.ulid();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "ulid" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Foreign Uuid', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        const foreignUuid = blueprint.foreignUuid('foo');
        blueprint.foreignUuid('company_id').constrained();
        blueprint.foreignUuid('laravel_idea_id').constrained();
        blueprint.foreignUuid('team_id').references('id').on('teams');
        blueprint.foreignUuid('team_column_id').constrained('teams');

        const statements = blueprint.toSql(connection);

        expect(foreignUuid).toBeInstanceOf(ForeignIdColumnDefinition);
        expect([
            'alter table "users" add column "foo" varchar not null',
            'alter table "users" add column "company_id" varchar not null',
            'alter table "users" add column "laravel_idea_id" varchar not null',
            'alter table "users" add column "team_id" varchar not null',
            'alter table "users" add column "team_column_id" varchar not null'
        ]).toEqual(statements);
    });

    it('Works Adding Foreign Ulid', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        const foreignUlid = blueprint.foreignUlid('foo');
        blueprint.foreignUlid('company_id').constrained();
        blueprint.foreignUlid('laravel_idea_id').constrained();
        blueprint.foreignUlid('team_id').references('id').on('teams');
        blueprint.foreignUlid('team_column_id').constrained('teams');

        const statements = blueprint.toSql(connection);

        expect(foreignUlid).toBeInstanceOf(ForeignIdColumnDefinition);
        expect([
            'alter table "users" add column "foo" varchar not null',
            'alter table "users" add column "company_id" varchar not null',
            'alter table "users" add column "laravel_idea_id" varchar not null',
            'alter table "users" add column "team_id" varchar not null',
            'alter table "users" add column "team_column_id" varchar not null'
        ]).toEqual(statements);
    });

    it('Works Adding Ip Address', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.ipAddress('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Ip Address Defaults Column Name', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.ipAddress();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "ip_address" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Mac Address', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.macAddress('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Mac Address Defaults Column Name', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.macAddress();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "mac_address" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Geometry', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.geometry('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geometry not null').toBe(statements[0]);
    });

    it('Works Adding Point', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.point('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" point not null').toBe(statements[0]);
    });

    it('Works Adding Line String', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.lineString('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" linestring not null').toBe(statements[0]);
    });

    it('Works Adding Polygon', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.polygon('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" polygon not null').toBe(statements[0]);
    });

    it('Works Adding Geometry Collection', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.geometryCollection('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geometrycollection not null').toBe(statements[0]);
    });

    it('Works Adding Multi Point', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.multiPoint('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" multipoint not null').toBe(statements[0]);
    });

    it('Works Adding Multi Line String', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.multiLineString('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" multilinestring not null').toBe(statements[0]);
    });

    it('Works Adding Multi Polygon', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.multiPolygon('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" multipolygon not null').toBe(statements[0]);
    });

    it('Works Adding Multi PolygonZ', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('geo');
        blueprint.multiPolygonZ('coordinates');
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This Database driver does not support the multipolygonz type');
    });

    it('Works Adding Computed', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('products');
        blueprint.computed('discounted_virtual', 'price - 5').persisted();
        expect(() => {
            blueprint.toSql(connection);
        }).toThrow('This Database driver does not support the computed type');
    });

    it('Works Adding Generated Column', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('products');
        blueprint.create();
        blueprint.integer('price');
        blueprint.integer('discounted_virtual').virtualAs('"price" - 5');
        blueprint.integer('discounted_stored').storedAs('"price" - 5');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "products" ("price" integer not null, "discounted_virtual" integer as ("price" - 5), "discounted_stored" integer as ("price" - 5) stored)'
        ).toBe(statements[0]);

        blueprint = getSqliteBlueprint('products');
        blueprint.integer('price');
        blueprint.integer('discounted_virtual').virtualAs('"price" - 5').nullable(false);
        blueprint.integer('discounted_stored').storedAs('"price" - 5').nullable(false);
        statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        const expected = [
            'alter table "products" add column "price" integer not null',
            'alter table "products" add column "discounted_virtual" integer not null as ("price" - 5)'
        ];
        expect(expected).toEqual(statements);
    });

    it('Works Create Table With Virtual As Column', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.string('my_column');
        blueprint.string('my_other_column').virtualAs('my_column');

        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create table "users" ("my_column" varchar not null, "my_other_column" varchar as (my_column))').toBe(
            statements[0]
        );

        blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column');
        blueprint.string('my_other_column').virtualAs('my_json_column->some_attribute');

        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("my_json_column" varchar not null, "my_other_column" varchar as (json_extract("my_json_column", \'$."some_attribute"\')))'
        ).toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column');
        blueprint.string('my_other_column').virtualAs('my_json_column->some_attribute->nested');

        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("my_json_column" varchar not null, "my_other_column" varchar as (json_extract("my_json_column", \'$."some_attribute"."nested"\')))'
        ).toBe(statements[0]);
    });

    it('Works Create Table With Virtual As Column When Json Column Has ArrayKey', () => {
        const connection = getSqliteConnection().sessionSchema();
        const blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column').virtualAs('my_json_column->foo[0][1]');

        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("my_json_column" varchar as (json_extract("my_json_column", \'$."foo"[0][1]\')))'
        ).toBe(statements[0]);
    });

    it('Works Create Table With Stored As Column', () => {
        const connection = getSqliteConnection().sessionSchema();
        let blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.string('my_column');
        blueprint.string('my_other_column').storedAs('my_column');

        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("my_column" varchar not null, "my_other_column" varchar as (my_column) stored)'
        ).toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column');
        blueprint.string('my_other_column').storedAs('my_json_column->some_attribute');

        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("my_json_column" varchar not null, "my_other_column" varchar as (json_extract("my_json_column", \'$."some_attribute"\')) stored)'
        ).toBe(statements[0]);

        blueprint = getSqliteBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column');
        blueprint.string('my_other_column').storedAs('my_json_column->some_attribute->nested');

        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("my_json_column" varchar not null, "my_other_column" varchar as (json_extract("my_json_column", \'$."some_attribute"."nested"\')) stored)'
        ).toBe(statements[0]);
    });
});

import ForeignIdColumnDefinition from '../../../../schema/definitions/foreign-id-column-definition';
import { getConnection, getSQLiteBlueprint } from '../../fixtures/mocked';

describe('SQLite Schema Grammar', () => {
    it('Works Basic Create Table', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.create();
        blueprint.increments('id');
        blueprint.string('email');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create table "users" ("id" integer primary key autoincrement not null, "email" varchar not null)').toBe(
            statements[0]
        );

        blueprint = getSQLiteBlueprint('users');
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
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
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
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.drop();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop table "users"').toBe(statements[0]);
    });

    it('Works Drop Table If Exists', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dropIfExists();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop table if exists "users"').toBe(statements[0]);
    });

    it('Works Drop Column', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.dropColumn('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "foo"').toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
        blueprint.dropColumn(['foo', 'bar']);
        statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect(['alter table "users" drop column "foo"', 'alter table "users" drop column "bar"']).toEqual(statements);

        blueprint = getSQLiteBlueprint('users');
        blueprint.dropColumn('foo', 'bar');
        statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect(['alter table "users" drop column "foo"', 'alter table "users" drop column "bar"']).toEqual(statements);
    });

    it('Works Drop Primary', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dropPrimary();
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support primary key removal.');
    });

    it('Works Drop Unique', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dropUnique('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop index "foo"').toBe(statements[0]);
    });

    it('Works Drop Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dropIndex('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('drop index "foo"').toBe(statements[0]);
    });

    it('Works Drop Full Text', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dropFulltext(['foo']);
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support fulltext index removal.');
    });

    it('Works Drop Spatial Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.dropSpatialIndex(['coordinates']);
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support spatial index removal.');
    });

    it('Works Drop Foreign', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dropForeign('foo');
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support foreign index removal.');
    });

    it('Works Drop Timestamps', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dropTimestamps();
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect([
            'alter table "users" drop column "created_at"',
            'alter table "users" drop column "updated_at"'
        ]).toEqual(statements);
    });

    it('Works Drop Timestamps Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dropTimestampsTz();
        const statements = blueprint.toSql(connection);

        expect(2).toBe(statements.length);
        expect([
            'alter table "users" drop column "created_at"',
            'alter table "users" drop column "updated_at"'
        ]).toEqual(statements);
    });

    it('Works Drop SoftDeletes', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dropSoftDeletes();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "deleted_at"').toBe(statements[0]);
    });

    it('Works Drop SoftDeletes Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dropSoftDeletesTz();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" drop column "deleted_at"').toBe(statements[0]);
    });

    it('Works Rename Table', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.rename('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" rename to "foo"').toBe(statements[0]);
    });

    it('Works Rename Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.renameIndex('foo', 'bar');
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support index renaming.');
    });

    it('Works Adding Primary Key', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.create();
        blueprint.string('foo').primary();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create table "users" ("foo" varchar not null, primary key ("foo"))').toBe(statements[0]);
    });

    it('Works Adding Foreign Key', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.create();
        blueprint.string('foo').primary();
        blueprint.string('order_id');
        blueprint.foreign('order_id').references('id').on('orders');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("foo" varchar not null, "order_id" varchar not null, foreign key("order_id") references "orders"("id"), primary key ("foo"))'
        ).toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
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
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.unique('foo', 'bar');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create unique index "bar" on "users" ("foo")').toBe(statements[0]);
    });

    it('Works Adding Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.index(['foo', 'bar'], 'baz');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "baz" on "users" ("foo", "bar")').toBe(statements[0]);
    });

    it('Works Adding Spatial Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.spatialIndex('coordinates');
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support spatial index creation.');
    });

    it('Works Adding Fluent Spatial Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.point('coordinates').spatialIndex();
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support spatial index creation.');
    });

    it('Works Adding Fulltext Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.fulltext('coordinates');
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support fulltext index creation.');
    });

    it('Works Adding Fluent Fulltext Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.point('coordinates').fulltext();
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support fulltext index creation.');
    });

    it('Works Adding Raw Index', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.rawIndex('(function(column))', 'raw_index');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create index "raw_index" on "users" ((function(column)))').toBe(statements[0]);
    });

    it('Works Adding Incrementing ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.increments('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Small Incrementing ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.smallIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Medium Incrementing ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.mediumIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding ID', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.id();
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" integer primary key autoincrement not null').toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
        blueprint.id('foo');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Foreign ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
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
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.foreignId('company_id').constrained(undefined, undefined, 'my_index');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "company_id" integer not null').toBe(statements[0]);
    });

    it('Works Adding Big Incrementing ID', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.bigIncrements('id');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "id" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding String', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.string('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
        blueprint.string('foo', 100);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
        blueprint.string('foo', 100).nullable().default('bar');
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar default \'bar\'').toBe(statements[0]);
    });

    it('Works Adding Text', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.text('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Medium Text', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.mediumText('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Long Text', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.longText('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Big Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.bigInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
        blueprint.bigInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.integer('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
        blueprint.integer('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Medium Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.mediumInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
        blueprint.mediumInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Tiny Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.tinyInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
        blueprint.tinyInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Small Integer', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.smallInteger('foo');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer not null').toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
        blueprint.smallInteger('foo', true);
        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" integer primary key autoincrement not null').toBe(statements[0]);
    });

    it('Works Adding Float', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.float('foo', 5, 2);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" float not null').toBe(statements[0]);
    });

    it('Works Adding Double', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.double('foo', 15, 8);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" float not null').toBe(statements[0]);
    });

    it('Works Adding Decimal', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.decimal('foo', 5, 2);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" numeric not null').toBe(statements[0]);
    });

    it('Works Adding Boolean', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.boolean('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" tinyint(1) not null').toBe(statements[0]);
    });

    it('Works Adding Enum', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.enum('role', ['member', 'admin']);
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "role" varchar check ("role" in (\'member\', \'admin\')) not null').toBe(
            statements[0]
        );
    });

    it('Works Adding Set', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.set('role', ['member', 'admin']);
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This Database driver does not support the set type.');
    });

    it('Works Adding Year', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.year('birth_year');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "birth_year" integer not null').toBe(statements[0]);
    });

    it('Works Adding Json', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.json('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Jsonb', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.jsonb('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" text not null').toBe(statements[0]);
    });

    it('Works Adding Date', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.date('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" date not null').toBe(statements[0]);
    });

    it('Works Adding Year', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.year('birth_year');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "birth_year" integer not null').toBe(statements[0]);
    });

    it('Works Adding Date Time', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dateTime('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Date Time With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dateTime('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Date Time Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dateTimeTz('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Date Time Tz With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.dateTimeTz('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Time', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.time('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time not null').toBe(statements[0]);
    });

    it('Works Adding Time With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.time('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time not null').toBe(statements[0]);
    });

    it('Works Adding Time Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.timeTz('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time not null').toBe(statements[0]);
    });

    it('Works Adding Time Tz With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.timeTz('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" time not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.timestamp('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.timestamp('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.timestampTz('created_at');
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Timestamp Tz With Precision', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.timestampTz('created_at', 1);
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect('alter table "users" add column "created_at" datetime not null').toBe(statements[0]);
    });

    it('Works Adding Datetimes', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.datetimes();
        const statements = blueprint.toSql(connection);
        expect(2).toBe(statements.length);
        expect([
            'alter table "users" add column "created_at" datetime',
            'alter table "users" add column "updated_at" datetime'
        ]).toEqual(statements);
    });

    it('Works Adding Timestamps', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.timestamps();
        const statements = blueprint.toSql(connection);
        expect(2).toBe(statements.length);
        expect([
            'alter table "users" add column "created_at" datetime',
            'alter table "users" add column "updated_at" datetime'
        ]).toEqual(statements);
    });

    it('Works Adding Timestamps Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.timestampsTz();
        const statements = blueprint.toSql(connection);
        expect(2).toBe(statements.length);
        expect([
            'alter table "users" add column "created_at" datetime',
            'alter table "users" add column "updated_at" datetime'
        ]).toEqual(statements);
    });

    it('Works Adding SoftDeletes Datetime', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.softDeletesDatetime();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(['alter table "users" add column "deleted_at" datetime']).toEqual(statements);
    });

    it('Works Adding SoftDeletes', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.softDeletes();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(['alter table "users" add column "deleted_at" datetime']).toEqual(statements);
    });

    it('Works Adding SoftDeletes Tz', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.softDeletesTz();
        const statements = blueprint.toSql(connection);
        expect(1).toBe(statements.length);
        expect(['alter table "users" add column "deleted_at" datetime']).toEqual(statements);
    });

    it('Works Adding Binary', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.binary('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" blob not null').toBe(statements[0]);
    });

    it('Works Adding Uuid', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.uuid('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Uuid Defaults Column Name', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.uuid();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "uuid" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Ulid', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.ulid('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Ulid Defaults Column Name', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.ulid();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "ulid" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Foreign Uuid', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
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
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
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
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.ipAddress('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Ip Address Defaults Column Name', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.ipAddress();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "ip_address" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Mac Address', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.macAddress('foo');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "foo" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Mac Address Defaults Column Name', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.macAddress();
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "users" add column "mac_address" varchar not null').toBe(statements[0]);
    });

    it('Works Adding Geometry', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.geometry('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geometry not null').toBe(statements[0]);
    });

    it('Works Adding Point', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.point('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" point not null').toBe(statements[0]);
    });

    it('Works Adding Line String', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.lineString('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" linestring not null').toBe(statements[0]);
    });

    it('Works Adding Polygon', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.polygon('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" polygon not null').toBe(statements[0]);
    });

    it('Works Adding Geometry Collection', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.geometryCollection('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" geometrycollection not null').toBe(statements[0]);
    });

    it('Works Adding Multi Point', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.multiPoint('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" multipoint not null').toBe(statements[0]);
    });

    it('Works Adding Multi Line String', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.multiLineString('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" multilinestring not null').toBe(statements[0]);
    });

    it('Works Adding Multi Polygon', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.multiPolygon('coordinates');
        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('alter table "geo" add column "coordinates" multipolygon not null').toBe(statements[0]);
    });

    it('Works Adding Multi PolygonZ', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('geo');
        blueprint.multiPolygonZ('coordinates');
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This Database driver does not support the multipolygonz type');
    });

    it('Works Adding Computed', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('products');
        blueprint.computed('discounted_virtual', 'price - 5').persisted();
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This Database driver does not support the computed type');
    });

    it('Works Adding Generated Column', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('products');
        blueprint.create();
        blueprint.integer('price');
        blueprint.integer('discounted_virtual').virtualAs('"price" - 5');
        blueprint.integer('discounted_stored').storedAs('"price" - 5');
        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "products" ("price" integer not null, "discounted_virtual" integer as ("price" - 5), "discounted_stored" integer as ("price" - 5) stored)'
        ).toBe(statements[0]);

        blueprint = getSQLiteBlueprint('products');
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
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.create();
        blueprint.string('my_column');
        blueprint.string('my_other_column').virtualAs('my_column');

        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect('create table "users" ("my_column" varchar not null, "my_other_column" varchar as (my_column))').toBe(
            statements[0]
        );

        blueprint = getSQLiteBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column');
        blueprint.string('my_other_column').virtualAs('my_json_column->some_attribute');

        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("my_json_column" varchar not null, "my_other_column" varchar as (json_extract("my_json_column", \'$."some_attribute"\')))'
        ).toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
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
        const connection = getConnection().sessionSchema();
        const blueprint = getSQLiteBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column').virtualAs('my_json_column->foo[0][1]');

        const statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("my_json_column" varchar as (json_extract("my_json_column", \'$."foo"[0][1]\')))'
        ).toBe(statements[0]);
    });

    it('Works Create Table With Stored As Column', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getSQLiteBlueprint('users');
        blueprint.create();
        blueprint.string('my_column');
        blueprint.string('my_other_column').storedAs('my_column');

        let statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("my_column" varchar not null, "my_other_column" varchar as (my_column) stored)'
        ).toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
        blueprint.create();
        blueprint.string('my_json_column');
        blueprint.string('my_other_column').storedAs('my_json_column->some_attribute');

        statements = blueprint.toSql(connection);

        expect(1).toBe(statements.length);
        expect(
            'create table "users" ("my_json_column" varchar not null, "my_other_column" varchar as (json_extract("my_json_column", \'$."some_attribute"\')) stored)'
        ).toBe(statements[0]);

        blueprint = getSQLiteBlueprint('users');
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

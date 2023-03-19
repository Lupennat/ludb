import Blueprint from '../../../schema/blueprint';
import Builder from '../../../schema/builders/builder';
import Grammar from '../../../schema/grammars/grammar';
import { Relatable } from '../../../types/schema/blueprint';
import {
    getConnection,
    getMySqlBlueprint,
    getPostgresBlueprint,
    getSQLiteBlueprint,
    getSqlServerBlueprint
} from '../fixtures/mocked';

describe('Blueprint', () => {
    it('Works Get Commands', () => {
        const blueprint = new Blueprint('users', new Grammar());
        blueprint.drop();

        expect(blueprint.getCommands().length).toBe(1);
    });

    it('Works Get Columns', () => {
        const blueprint = new Blueprint('users', new Grammar(), table => {
            table.string('test');
        });

        expect(blueprint.getColumns().length).toBe(1);
    });

    it('Works Get Table', () => {
        const blueprint = new Blueprint('users', new Grammar());

        expect(blueprint.getTable()).toBe('users');
    });

    it('Works Get Grammar', () => {
        const grammar = new Grammar();
        const blueprint = new Blueprint('users', grammar);

        expect(blueprint.getGrammar()).toEqual(grammar);
    });

    it('Works After', () => {
        const grammar = new Grammar();
        const blueprint = new Blueprint('users', grammar);
        blueprint.after('test', table => {
            expect(table.getRegistry().after).toBe('test');
            table.string('test2');
        });
        expect(blueprint.getRegistry().after).toBeUndefined();
        expect(blueprint.getColumns()[0].getRegistry().after).toBe('test');
    });

    it('Works To Sql Run Commands From Blueprint', async () => {
        const conn = getConnection().sessionSchema();
        const blueprint = new Blueprint('users', new Grammar());
        jest.spyOn(conn, 'statement')
            .mockImplementationOnce(async sql => {
                expect(sql).toBe('foo');
                return true;
            })
            .mockImplementationOnce(async sql => {
                expect(sql).toBe('bar');
                return true;
            });
        jest.spyOn(blueprint, 'toSql').mockImplementationOnce(connection => {
            expect(connection).toEqual(conn);
            return ['foo', 'bar'];
        });

        await blueprint.build(conn);
    });

    it('Works Index Default Names', () => {
        let blueprint = new Blueprint('users', new Grammar());
        let command = blueprint.unique(['foo', 'bar']);
        expect(command.getRegistry().index).toBe('users_foo_bar_unique');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.unique(['foo', 'bar'], 'foo_bar');
        expect(command.getRegistry().index).toBe('foo_bar');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.index('foo');
        expect(command.getRegistry().index).toBe('users_foo_index');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.index('foo', 'foo');
        expect(command.getRegistry().index).toBe('foo');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.primary('foo');
        expect(command.getRegistry().index).toBe('users_foo_primary');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.primary('foo', 'foo');
        expect(command.getRegistry().index).toBe('foo');

        blueprint = new Blueprint('geo', new Grammar());
        command = blueprint.spatialIndex('coordinates');
        expect(command.getRegistry().index).toBe('geo_coordinates_spatialindex');

        blueprint = new Blueprint('geo', new Grammar());
        command = blueprint.spatialIndex('coordinates', 'coordinates');
        expect(command.getRegistry().index).toBe('coordinates');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.fulltext('name');
        expect(command.getRegistry().index).toBe('users_name_fulltext');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.fulltext('name', 'name');
        expect(command.getRegistry().index).toBe('name');
    });

    it('Works Index Default Names When Prefix Supplied', () => {
        let blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        let command = blueprint.unique(['foo', 'bar']);
        expect(command.getRegistry().index).toBe('prefix_users_foo_bar_unique');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.unique(['foo', 'bar'], 'foo_bar');
        expect(command.getRegistry().index).toBe('foo_bar');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.index('foo');
        expect(command.getRegistry().index).toBe('prefix_users_foo_index');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.index('foo', 'foo');
        expect(command.getRegistry().index).toBe('foo');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.primary('foo');
        expect(command.getRegistry().index).toBe('prefix_users_foo_primary');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.primary('foo', 'foo');
        expect(command.getRegistry().index).toBe('foo');

        blueprint = new Blueprint('geo', new Grammar(), undefined, 'prefix_');
        command = blueprint.spatialIndex('coordinates');
        expect(command.getRegistry().index).toBe('prefix_geo_coordinates_spatialindex');

        blueprint = new Blueprint('geo', new Grammar(), undefined, 'prefix_');
        command = blueprint.spatialIndex('coordinates', 'coordinates');
        expect(command.getRegistry().index).toBe('coordinates');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.fulltext('name');
        expect(command.getRegistry().index).toBe('prefix_users_name_fulltext');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.fulltext('name', 'name');
        expect(command.getRegistry().index).toBe('name');
    });

    it('Works Drop Index Default Names', () => {
        let blueprint = new Blueprint('users', new Grammar());
        let command = blueprint.dropUnique(['foo', 'bar']);
        expect(command.getRegistry().index).toBe('users_foo_bar_unique');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.dropUnique('foo_bar');
        expect(command.getRegistry().index).toBe('foo_bar');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.dropIndex(['foo']);
        expect(command.getRegistry().index).toBe('users_foo_index');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.dropIndex('foo');
        expect(command.getRegistry().index).toBe('foo');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.dropPrimary(['foo']);
        expect(command.getRegistry().index).toBe('users_foo_primary');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.dropPrimary('foo');
        expect(command.getRegistry().index).toBe('foo');

        blueprint = new Blueprint('geo', new Grammar());
        command = blueprint.dropSpatialIndex(['coordinates']);
        expect(command.getRegistry().index).toBe('geo_coordinates_spatialindex');

        blueprint = new Blueprint('geo', new Grammar());
        command = blueprint.dropSpatialIndex('coordinates');
        expect(command.getRegistry().index).toBe('coordinates');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.dropFulltext(['name']);
        expect(command.getRegistry().index).toBe('users_name_fulltext');

        blueprint = new Blueprint('users', new Grammar());
        command = blueprint.dropFulltext('name');
        expect(command.getRegistry().index).toBe('name');
    });

    it('Works Drop Index Default Names When Prefix Supplied', () => {
        let blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        let command = blueprint.dropUnique(['foo', 'bar']);
        expect(command.getRegistry().index).toBe('prefix_users_foo_bar_unique');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.dropUnique('foo_bar');
        expect(command.getRegistry().index).toBe('foo_bar');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.dropIndex(['foo']);
        expect(command.getRegistry().index).toBe('prefix_users_foo_index');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.dropIndex('foo');
        expect(command.getRegistry().index).toBe('foo');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.dropPrimary(['foo']);
        expect(command.getRegistry().index).toBe('prefix_users_foo_primary');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.dropPrimary('foo');
        expect(command.getRegistry().index).toBe('foo');

        blueprint = new Blueprint('geo', new Grammar(), undefined, 'prefix_');
        command = blueprint.dropSpatialIndex(['coordinates']);
        expect(command.getRegistry().index).toBe('prefix_geo_coordinates_spatialindex');

        blueprint = new Blueprint('geo', new Grammar(), undefined, 'prefix_');
        command = blueprint.dropSpatialIndex('coordinates');
        expect(command.getRegistry().index).toBe('coordinates');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.dropFulltext(['name']);
        expect(command.getRegistry().index).toBe('prefix_users_name_fulltext');

        blueprint = new Blueprint('users', new Grammar(), undefined, 'prefix_');
        command = blueprint.dropFulltext('name');
        expect(command.getRegistry().index).toBe('name');
    });

    it('Works Default Current Date Time', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users', table => {
            table.dateTime('created').useCurrent();
        });
        expect(['alter table `users` add `created` datetime(0) not null default CURRENT_TIMESTAMP']).toEqual(
            blueprint.toSql(connection)
        );
        blueprint = getPostgresBlueprint('users', table => {
            table.dateTime('created').useCurrent();
        });
        expect([
            'alter table "users" add column "created" timestamp(0) without time zone not null default CURRENT_TIMESTAMP'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('users', table => {
            table.dateTime('created').useCurrent();
        });
        expect(['alter table "users" add column "created" datetime not null default CURRENT_TIMESTAMP']).toEqual(
            blueprint.toSql(connection)
        );
        blueprint = getSqlServerBlueprint('users', table => {
            table.dateTime('created').useCurrent();
        });
        expect(['alter table "users" add "created" datetime2(0) not null default CURRENT_TIMESTAMP']).toEqual(
            blueprint.toSql(connection)
        );
    });

    it('Works Default Current Timestamp', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users', table => {
            table.timestamp('created').useCurrent();
        });
        expect(['alter table `users` add `created` timestamp(0) not null default CURRENT_TIMESTAMP']).toEqual(
            blueprint.toSql(connection)
        );
        blueprint = getPostgresBlueprint('users', table => {
            table.timestamp('created').useCurrent();
        });
        expect([
            'alter table "users" add column "created" timestamp(0) without time zone not null default CURRENT_TIMESTAMP'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('users', table => {
            table.timestamp('created').useCurrent();
        });
        expect(['alter table "users" add column "created" datetime not null default CURRENT_TIMESTAMP']).toEqual(
            blueprint.toSql(connection)
        );
        blueprint = getSqlServerBlueprint('users', table => {
            table.timestamp('created').useCurrent();
        });
        expect(['alter table "users" add "created" datetime2(0) not null default CURRENT_TIMESTAMP']).toEqual(
            blueprint.toSql(connection)
        );
    });

    it('Works Unsigned Decimal Table', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users', table => {
            table.unsignedDecimal('money', 10, 2);
        });
        expect(['alter table `users` add `money` decimal(10, 2) unsigned not null']).toEqual(
            blueprint.toSql(connection)
        );
        blueprint = getPostgresBlueprint('users', table => {
            table.unsignedDecimal('money', 10, 2);
        });
        expect(['alter table "users" add column "money" decimal(10, 2) not null']).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('users', table => {
            table.unsignedDecimal('money', 10, 2);
        });
        expect(['alter table "users" add column "money" numeric not null']).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('users', table => {
            table.unsignedDecimal('money', 10, 2);
        });
        expect(['alter table "users" add "money" decimal(10, 2) not null']).toEqual(blueprint.toSql(connection));
    });

    it('Works Remove Column', () => {
        const connection = getConnection().sessionSchema();
        const blueprint = getMySqlBlueprint('users', table => {
            table.string('foo');
            table.string('remove_this');
            table.removeColumn('remove_this');
        });

        expect(['alter table `users` add `foo` varchar(255) not null']).toEqual(blueprint.toSql(connection));
    });

    it('Works Rename Column', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users', table => {
            table.renameColumn('foo', 'bar');
        });
        expect(['alter table `users` rename column `foo` to `bar`']).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('users', table => {
            table.renameColumn('foo', 'bar');
        });
        expect(['alter table "users" rename column "foo" to "bar"']).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('users', table => {
            table.renameColumn('foo', 'bar');
        });
        expect(['alter table "users" rename column "foo" to "bar"']).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('users', table => {
            table.renameColumn('foo', 'bar');
        });
        expect(['sp_rename \'"users"."foo"\', "bar", \'COLUMN\'']).toEqual(blueprint.toSql(connection));
    });

    it('Works Drop Column', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('users', table => {
            table.dropColumn('foo');
        });
        expect(['alter table `users` drop `foo`']).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('users', table => {
            table.dropColumn('foo');
        });
        expect(['alter table "users" drop column "foo"']).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('users', table => {
            table.dropColumn('foo');
        });
        expect(['alter table "users" drop column "foo"']).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('users', table => {
            table.dropColumn('foo');
        });
        const sqls = blueprint.toSql(connection);
        expect(sqls.length).toBe(1);
        expect(
            `DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[users]') AND [name] in ('foo') AND [default_object_id] <> 0;EXEC(@sql);alter table "users" drop column "foo"`
        ).toBe(sqls[0]);
    });

    it('Works Default Using Id Morph', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table `comments` add `commentable_type` varchar(255) not null, add `commentable_id` bigint unsigned not null',
            'alter table `comments` add index `comments_commentable_type_commentable_id_index`(`commentable_type`, `commentable_id`)'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar(255) not null, add column "commentable_id" bigint not null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar not null',
            'alter table "comments" add column "commentable_id" integer not null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table "comments" add "commentable_type" nvarchar(255) not null, "commentable_id" bigint not null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
    });

    it('Works Default Using Nullable Id Morph', () => {
        Builder.morphUsingInts();
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table `comments` add `commentable_type` varchar(255) null, add `commentable_id` bigint unsigned null',
            'alter table `comments` add index `comments_commentable_type_commentable_id_index`(`commentable_type`, `commentable_id`)'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar(255) null, add column "commentable_id" bigint null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar',
            'alter table "comments" add column "commentable_id" integer',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table "comments" add "commentable_type" nvarchar(255) null, "commentable_id" bigint null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
    });

    it('Works Default Using Uuid Morph', () => {
        const connection = getConnection().sessionSchema();
        Builder.morphUsingUuids();
        let blueprint = getMySqlBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table `comments` add `commentable_type` varchar(255) not null, add `commentable_id` char(36) not null',
            'alter table `comments` add index `comments_commentable_type_commentable_id_index`(`commentable_type`, `commentable_id`)'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar(255) not null, add column "commentable_id" uuid not null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar not null',
            'alter table "comments" add column "commentable_id" varchar not null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table "comments" add "commentable_type" nvarchar(255) not null, "commentable_id" uniqueidentifier not null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
    });

    it('Works Default Using Nullable Uuid Morph', () => {
        const connection = getConnection().sessionSchema();
        Builder.morphUsingUuids();
        let blueprint = getMySqlBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table `comments` add `commentable_type` varchar(255) null, add `commentable_id` char(36) null',
            'alter table `comments` add index `comments_commentable_type_commentable_id_index`(`commentable_type`, `commentable_id`)'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar(255) null, add column "commentable_id" uuid null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar',
            'alter table "comments" add column "commentable_id" varchar',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table "comments" add "commentable_type" nvarchar(255) null, "commentable_id" uniqueidentifier null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
    });

    it('Works Default Using Ulid Morph', () => {
        const connection = getConnection().sessionSchema();
        Builder.morphUsingUlids();
        let blueprint = getMySqlBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table `comments` add `commentable_type` varchar(255) not null, add `commentable_id` char(26) not null',
            'alter table `comments` add index `comments_commentable_type_commentable_id_index`(`commentable_type`, `commentable_id`)'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar(255) not null, add column "commentable_id" char(26) not null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar not null',
            'alter table "comments" add column "commentable_id" varchar not null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('comments', table => {
            table.morphs('commentable');
        });
        expect([
            'alter table "comments" add "commentable_type" nvarchar(255) not null, "commentable_id" nchar(26) not null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
    });

    it('Works Default Using Nullable Ulid Morph', () => {
        const connection = getConnection().sessionSchema();
        Builder.morphUsingUlids();
        let blueprint = getMySqlBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table `comments` add `commentable_type` varchar(255) null, add `commentable_id` char(26) null',
            'alter table `comments` add index `comments_commentable_type_commentable_id_index`(`commentable_type`, `commentable_id`)'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar(255) null, add column "commentable_id" char(26) null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table "comments" add column "commentable_type" varchar',
            'alter table "comments" add column "commentable_id" varchar',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('comments', table => {
            table.nullableMorphs('commentable');
        });
        expect([
            'alter table "comments" add "commentable_type" nvarchar(255) null, "commentable_id" nchar(26) null',
            'create index "comments_commentable_type_commentable_id_index" on "comments" ("commentable_type", "commentable_id")'
        ]).toEqual(blueprint.toSql(connection));
    });

    it('Works Generate Relationship Column With Incremental Model', () => {
        class User implements Relatable {
            getForeignKey(): string {
                return 'user_id';
            }
            getKeyType(): string {
                return 'int';
            }
            getIncrementing(): boolean {
                return true;
            }
        }
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('posts', table => {
            table.foreignIdFor(User);
        });
        expect(['alter table `posts` add `user_id` bigint unsigned not null']).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('posts', table => {
            table.foreignIdFor(User);
        });
        expect(['alter table "posts" add column "user_id" bigint not null']).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('posts', table => {
            table.foreignIdFor(User);
        });
        expect(['alter table "posts" add column "user_id" integer not null']).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('posts', table => {
            table.foreignIdFor(new User());
        });
        expect(['alter table "posts" add "user_id" bigint not null']).toEqual(blueprint.toSql(connection));
    });

    it('Works Generate Relationship Column With Uuid Model', () => {
        class User implements Relatable {
            getForeignKey(): string {
                return 'user_uuid';
            }
            getKeyType(): string {
                return 'string';
            }
            getIncrementing(): boolean {
                return false;
            }
        }
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('posts', table => {
            table.foreignIdFor(User);
        });
        expect(['alter table `posts` add `user_uuid` char(36) not null']).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('posts', table => {
            table.foreignIdFor(User);
        });
        expect(['alter table "posts" add column "user_uuid" uuid not null']).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('posts', table => {
            table.foreignIdFor(User);
        });
        expect(['alter table "posts" add column "user_uuid" varchar not null']).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('posts', table => {
            table.foreignIdFor(new User());
        });
        expect(['alter table "posts" add "user_uuid" uniqueidentifier not null']).toEqual(blueprint.toSql(connection));
    });

    it('Works Drop Relationship Column With Incremental Model', () => {
        class User implements Relatable {
            getForeignKey(): string {
                return 'user_id';
            }
            getKeyType(): string {
                return 'int';
            }
            getIncrementing(): boolean {
                return true;
            }
        }
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('posts', table => {
            table.dropForeignIdFor(User);
        });
        expect(['alter table `posts` drop foreign key `posts_user_id_foreign`']).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('posts', table => {
            table.dropForeignIdFor(User);
        });
        expect(['alter table "posts" drop constraint "posts_user_id_foreign"']).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('posts', table => {
            table.dropForeignIdFor(User);
        });
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support foreign index removal.');
        blueprint = getSqlServerBlueprint('posts', table => {
            table.dropForeignIdFor(new User());
        });
        expect(['alter table "posts" drop constraint "posts_user_id_foreign"']).toEqual(blueprint.toSql(connection));
    });

    it('Works Drop Foreign not valid on sqlite', () => {
        const connection = getConnection().sessionSchema();
        jest.spyOn(connection, 'getDriverName').mockReturnValueOnce('sqlite');
        const blueprint = getSQLiteBlueprint('users', table => {
            table.dropForeign('test');
        });

        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError("SQLite doesn't support dropping foreign keys (you would need to re-create the table).");
    });

    it('Works Drop Relationship Column With Uuid Model', () => {
        class User implements Relatable {
            getForeignKey(): string {
                return 'user_uuid';
            }
            getKeyType(): string {
                return 'string';
            }
            getIncrementing(): boolean {
                return false;
            }
        }
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('posts', table => {
            table.dropForeignIdFor(User);
        });
        expect(['alter table `posts` drop foreign key `posts_user_uuid_foreign`']).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('posts', table => {
            table.dropForeignIdFor(User);
        });
        expect(['alter table "posts" drop constraint "posts_user_uuid_foreign"']).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('posts', table => {
            table.dropForeignIdFor(User);
        });
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support foreign index removal.');
        blueprint = getSqlServerBlueprint('posts', table => {
            table.dropForeignIdFor(new User());
        });
        expect(['alter table "posts" drop constraint "posts_user_uuid_foreign"']).toEqual(blueprint.toSql(connection));
    });

    it('Works Drop Constrained Relationship Column With Incremental Model', () => {
        class User implements Relatable {
            getForeignKey(): string {
                return 'user_id';
            }
            getKeyType(): string {
                return 'int';
            }
            getIncrementing(): boolean {
                return true;
            }
        }
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('posts', table => {
            table.dropConstrainedForeignIdFor(User);
        });
        expect([
            'alter table `posts` drop foreign key `posts_user_id_foreign`',
            'alter table `posts` drop `user_id`'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('posts', table => {
            table.dropConstrainedForeignIdFor(User);
        });
        expect([
            'alter table "posts" drop constraint "posts_user_id_foreign"',
            'alter table "posts" drop column "user_id"'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('posts', table => {
            table.dropConstrainedForeignIdFor(User);
        });
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support foreign index removal.');
        blueprint = getSqlServerBlueprint('posts', table => {
            table.dropConstrainedForeignIdFor(new User());
        });
        expect([
            'alter table "posts" drop constraint "posts_user_id_foreign"',
            `DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[posts] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[posts]') AND [name] in ('user_id') AND [default_object_id] <> 0;EXEC(@sql);alter table "posts" drop column "user_id"`
        ]).toEqual(blueprint.toSql(connection));
    });

    it('Works Drop Constrained Relationship Column With Uuid Model', () => {
        class User implements Relatable {
            getForeignKey(): string {
                return 'user_uuid';
            }
            getKeyType(): string {
                return 'string';
            }
            getIncrementing(): boolean {
                return false;
            }
        }
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('posts', table => {
            table.dropConstrainedForeignIdFor(User);
        });
        expect([
            'alter table `posts` drop foreign key `posts_user_uuid_foreign`',
            'alter table `posts` drop `user_uuid`'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('posts', table => {
            table.dropConstrainedForeignIdFor(User);
        });
        expect([
            'alter table "posts" drop constraint "posts_user_uuid_foreign"',
            'alter table "posts" drop column "user_uuid"'
        ]).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('posts', table => {
            table.dropConstrainedForeignIdFor(User);
        });
        expect(() => {
            blueprint.toSql(connection);
        }).toThrowError('This database driver does not support foreign index removal.');
        blueprint = getSqlServerBlueprint('posts', table => {
            table.dropConstrainedForeignIdFor(new User());
        });
        expect([
            'alter table "posts" drop constraint "posts_user_uuid_foreign"',
            `DECLARE @sql NVARCHAR(MAX) = '';SELECT @sql += 'ALTER TABLE [dbo].[posts] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' FROM sys.columns WHERE [object_id] = OBJECT_ID('[dbo].[posts]') AND [name] in ('user_uuid') AND [default_object_id] <> 0;EXEC(@sql);alter table "posts" drop column "user_uuid"`
        ]).toEqual(blueprint.toSql(connection));
    });

    it('Works Tiny Text Column', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('posts', table => {
            table.tinyText('note');
        });
        expect(['alter table `posts` add `note` tinytext not null']).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('posts', table => {
            table.tinyText('note');
        });
        expect(['alter table "posts" add column "note" varchar(255) not null']).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('posts', table => {
            table.tinyText('note');
        });
        expect(['alter table "posts" add column "note" text not null']).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('posts', table => {
            table.tinyText('note');
        });
        expect(['alter table "posts" add "note" nvarchar(255) not null']).toEqual(blueprint.toSql(connection));
    });

    it('Works Tiny Text Nullable Column', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('posts', table => {
            table.tinyText('note').nullable();
        });
        expect(['alter table `posts` add `note` tinytext null']).toEqual(blueprint.toSql(connection));
        blueprint = getPostgresBlueprint('posts', table => {
            table.tinyText('note').nullable();
        });
        expect(['alter table "posts" add column "note" varchar(255) null']).toEqual(blueprint.toSql(connection));
        blueprint = getSQLiteBlueprint('posts', table => {
            table.tinyText('note').nullable();
        });
        expect(['alter table "posts" add column "note" text']).toEqual(blueprint.toSql(connection));
        blueprint = getSqlServerBlueprint('posts', table => {
            table.tinyText('note').nullable();
        });
        expect(['alter table "posts" add "note" nvarchar(255) null']).toEqual(blueprint.toSql(connection));
    });

    it('Works Table Comment', () => {
        const connection = getConnection().sessionSchema();
        let blueprint = getMySqlBlueprint('posts', table => {
            table.comment('Look at my comment, it is amazing');
        });
        expect(["alter table `posts` comment = 'Look at my comment, it is amazing'"]).toEqual(
            blueprint.toSql(connection)
        );
        blueprint = getPostgresBlueprint('posts', table => {
            table.comment('Look at my comment, it is amazing');
        });
        expect(['comment on table "posts" is \'Look at my comment, it is amazing\'']).toEqual(
            blueprint.toSql(connection)
        );
    });
});

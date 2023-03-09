import ColumnDefinition from '../../../schema/definitions/column-definition';
import CommandDefinition from '../../../schema/definitions/commands/command-definition';
import CommandIndexDefinition from '../../../schema/definitions/commands/command-index-definition';
import Grammar from '../../../schema/grammars/grammar';
import {
    ColumnDefinitionRegistryI,
    ColumnsRegistryI,
    CommentRegistryI,
    IndexRegistryI,
    RenameFullRegistryI,
    RenameRegistryI
} from '../../../types/schema/registry';
import { MockedGrammar, getConnection, getMySqlBlueprint } from '../../fixtures/mocked';

describe('MySql Schema Grammar', () => {
    function getCommand(): CommandDefinition {
        return new CommandDefinition('add', {});
    }

    it('Works Compile Create Database', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileCreateDatabase('name', getConnection().sessionSchema());
        }).toThrowError('This database driver does not support creating databases.');
    });

    it('Works Compile Get All Tables', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileGetAllTables();
        }).toThrowError('This database driver does not support get all tables.');
    });

    it('Works Compile Get All Views', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileGetAllViews();
        }).toThrowError('This database driver does not support get all views.');
    });

    it('Works Compile Get All Types', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileGetAllTypes();
        }).toThrowError('This database driver does not support get all types.');
    });

    it('Works Compile Drop Database If Exists', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropDatabaseIfExists('name');
        }).toThrowError('This database driver does not support dropping databases.');
    });

    it('Works Compile Drop', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDrop(getMySqlBlueprint('test'), getCommand(), getConnection().sessionSchema());
        }).toThrowError('This database driver does not support drop table.');
    });

    it('Works Compile Drop All Tables', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropAllTables();
        }).toThrowError('This database driver does not support drop all tables.');
    });

    it('Works Compile Drop All Views', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropAllViews();
        }).toThrowError('This database driver does not support drop all views.');
    });

    it('Works Compile Drop All Types', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropAllTypes();
        }).toThrowError('This database driver does not support drop all types.');
    });

    it('Works Compile Drop All Foreign Keys', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropAllForeignKeys();
        }).toThrowError('This database driver does not support drop all foreign keys.');
    });

    it('Works Compile Rebuild', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileRebuild();
        }).toThrowError('This database driver does not support rebuild.');
    });

    it('Works Compile Create', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileCreate(getMySqlBlueprint('test'), getCommand(), getConnection().sessionSchema());
        }).toThrowError('This database driver does not support create table.');
    });

    it('Works Compile Table Exists', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileTableExists();
        }).toThrowError('This database driver does not support table exists.');
    });

    it('Works Compile Column Type', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileColumnType();
        }).toThrowError('This database driver does not support get column type.');
    });

    it('Works Compile Column Listing', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileColumnListing();
        }).toThrowError('This database driver does not support column listing.');
    });

    it('Works Compile Enable Foreign Key Constraints', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileEnableForeignKeyConstraints();
        }).toThrowError('This database driver does not support foreign key enabling.');
    });

    it('Works Compile Disable Foreign Key Constraints', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDisableForeignKeyConstraints();
        }).toThrowError('This database driver does not support foreign key disabling.');
    });

    it('Works Compile Enable Writeable Schema', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileEnableWriteableSchema();
        }).toThrowError('This database driver does not support enable writable schema.');
    });

    it('Works Compile Disable Writeable Schema', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDisableWriteableSchema();
        }).toThrowError('This database driver does not support disable writable schema.');
    });

    it('Works Compile Rename', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileRename(
                getMySqlBlueprint('test'),
                getCommand() as CommandDefinition<RenameRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support rename table.');
    });

    it('Works Compile Add', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileAdd(getMySqlBlueprint('test'), getCommand(), getConnection().sessionSchema());
        }).toThrowError('This database driver does not support add column.');
    });

    it('Works Compile Change', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileChange(getMySqlBlueprint('test'), getCommand(), getConnection().sessionSchema());
        }).toThrowError('This database driver does not support change column.');
    });

    it('Works Compile Drop Column', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropColumn(
                getMySqlBlueprint('test'),
                getCommand() as CommandDefinition<ColumnsRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support drop column.');
    });

    it('Works Compile Rename Column', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileRenameColumn(
                getMySqlBlueprint('test'),
                getCommand() as CommandDefinition<RenameFullRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support rename column.');
    });

    it('Works Compile Auto Increment Starting Values', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileAutoIncrementStartingValues(
                getMySqlBlueprint('test'),
                getCommand() as CommandDefinition<ColumnDefinitionRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support rename column.');
    });

    it('Works Compile Comment', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileComment(
                getMySqlBlueprint('test'),
                getCommand() as CommandDefinition<ColumnDefinitionRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support comment on table.');
    });

    it('Works Compile Default', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDefault(
                getMySqlBlueprint('test'),
                getCommand() as CommandDefinition<ColumnDefinitionRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support rename column.');
    });

    it('Works Compile Primary', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compilePrimary(
                getMySqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support primary key creation.');
    });

    it('Works Compile Drop Primary', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropPrimary(
                getMySqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support primary key removal.');
    });

    it('Works Compile Unique', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileUnique(
                getMySqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support unique index creation.');
    });

    it('Works Compile Drop Unique', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropUnique(
                getMySqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support unique index removal.');
    });

    it('Works Compile Index', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileIndex(
                getMySqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support index creation.');
    });

    it('Works Compile Drop Index', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropIndex(
                getMySqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support index removal.');
    });

    it('Works Compile Fulltext', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileFulltext(
                getMySqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support fulltext index creation.');
    });

    it('Works Compile Drop Fulltext', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropFulltext(
                getMySqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support fulltext index removal.');
    });

    it('Works Compile Spatial Index', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileSpatialIndex(
                getMySqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support spatial index creation.');
    });

    it('Works Compile Drop Spatial Index', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropSpatialIndex(
                getMySqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support spatial index removal.');
    });

    it('Works Compile Table Comment', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileTableComment(
                getMySqlBlueprint('test'),
                getCommand() as CommandDefinition<CommentRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrowError('This database driver does not support table comment.');
    });

    it('Works Compile Modify After', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyAfter(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support after column modifier.');
    });

    it('Works Compile Modify Charset', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyCharset(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support charset column modifier.');
    });

    it('Works Compile Modify Collate', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyCollate(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support collate column modifier.');
    });

    it('Works Compile Modify Comment', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyComment(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support comment column modifier.');
    });

    it('Works Compile Modify Default', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyDefault(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support default column modifier.');
    });

    it('Works Compile Modify First', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyFirst(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support first column modifier.');
    });

    it('Works Compile Modify GeneratedAs', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyGeneratedAs(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support generated as column modifier.');
    });

    it('Works Compile Modify Increment', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyIncrement(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support increment column modifier.');
    });

    it('Works Compile Modify Invisible', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyInvisible(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support invisible column modifier.');
    });

    it('Works Compile Modify Nullable', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyNullable(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support nullable column modifier.');
    });

    it('Works Compile Modify OnUpdate', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyOnUpdate(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support on update column modifier.');
    });

    it('Works Compile Modify Persisted', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyPersisted(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support persisted column modifier.');
    });

    it('Works Compile Modify Srid', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifySrid(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support srid column modifier.');
    });

    it('Works Compile Modify StoredAs', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyStoredAs(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support stored as column modifier.');
    });

    it('Works Compile Modify Unsigned', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyUnsigned(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support unsigned column modifier.');
    });

    it('Works Compile Modify VirtualAs', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyVirtualAs(getMySqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrowError('this database driver does not support virtual as column modifier.');
    });

    it('Works Supports Schema Transactions', () => {
        const grammar = new Grammar();
        expect(grammar.supportsSchemaTransactions()).toBeFalsy();
    });
});

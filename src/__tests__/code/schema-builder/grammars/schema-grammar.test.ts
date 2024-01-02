import ColumnDefinition from '../../../../schema/definitions/column-definition';
import CommandDefinition from '../../../../schema/definitions/commands/command-definition';
import CommandIndexDefinition from '../../../../schema/definitions/commands/command-index-definition';
import Grammar from '../../../../schema/grammars/grammar';
import {
    ColumnDefinitionRegistryI,
    ColumnsRegistryI,
    CommentRegistryI,
    IndexRegistryI,
    RenameFullRegistryI,
    RenameRegistryI
} from '../../../../types/schema/registry';
import { MockedGrammar, getConnection, getMysqlBlueprint } from '../../fixtures/mocked';

describe('Mysql Schema Grammar', () => {
    function getCommand(): CommandDefinition {
        return new CommandDefinition('add', {});
    }

    it('Works Compile Create Database', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileCreateDatabase('name', getConnection().sessionSchema());
        }).toThrow('This database driver does not support creating databases.');
    });

    it('Works Compile Create Type', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileCreateType('type', 'simple', {});
        }).toThrow('This database driver does not support creating types.');
    });

    it('Works Compile DbStat Database', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDbstatExists();
        }).toThrow('This database driver can not check if database exists');
    });

    it('Works Compile Get Tables', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileTables();
        }).toThrow('This database driver does not support get tables.');
    });

    it('Works Compile Get Views', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileViews();
        }).toThrow('This database driver does not support get views.');
    });

    it('Works Compile Get Types', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileTypes();
        }).toThrow('This database driver does not support get types.');
    });

    it('Works Compile Columns', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileColumns('table');
        }).toThrow('This database driver does not support get table columns.');
    });

    it('Works Compile Indexes', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileIndexes('table');
        }).toThrow('This database driver does not support get table indexes.');
    });

    it('Works Compile Foreign Keys', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileForeignKeys('table');
        }).toThrow('This database driver does not support get table foreign keys.');
    });

    it('Works Compile Drop Database If Exists', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropDatabaseIfExists('name');
        }).toThrow('This database driver does not support dropping databases.');
    });

    it('Works Compile Drop View', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropView('name');
        }).toThrow('This database driver does not support dropping views.');
    });

    it('Works Compile Drop View If Exists', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropViewIfExists('name');
        }).toThrow('This database driver does not support dropping views.');
    });

    it('Works Compile Drop Type', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropType('name');
        }).toThrow('This database driver does not support dropping types.');
    });

    it('Works Compile Drop Type If Exists', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropTypeIfExists('name');
        }).toThrow('This database driver does not support dropping types.');
    });

    it('Works Compile Drop Domain', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropDomain('name');
        }).toThrow('This database driver does not support dropping domains.');
    });

    it('Works Compile Drop Domain If Exists', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropDomainIfExists('name');
        }).toThrow('This database driver does not support dropping domains.');
    });

    it('Works Compile Drop', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDrop(getMysqlBlueprint('test'), getCommand(), getConnection().sessionSchema());
        }).toThrow('This database driver does not support drop table.');
    });

    it('Works Compile Drop Tables', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropTables();
        }).toThrow('This database driver does not support drop tables.');
    });

    it('Works Compile Drop Views', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropViews();
        }).toThrow('This database driver does not support drop views.');
    });

    it('Works Compile Drop Types', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropTypes();
        }).toThrow('This database driver does not support drop types.');
    });

    it('Works Compile Drop Domains', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropDomains();
        }).toThrow('This database driver does not support drop domains.');
    });

    it('Works Compile Drop Foreign Keys', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropForeignKeys();
        }).toThrow('This database driver does not support drop foreign keys.');
    });

    it('Works Compile Rebuild', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileRebuild();
        }).toThrow('This database driver does not support rebuild.');
    });

    it('Works Compile Create', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileCreate(getMysqlBlueprint('test'), getCommand(), getConnection().sessionSchema());
        }).toThrow('This database driver does not support create table.');
    });

    it('Works Compile Enable Foreign Key Constraints', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileEnableForeignKeyConstraints();
        }).toThrow('This database driver does not support foreign key enabling.');
    });

    it('Works Compile Disable Foreign Key Constraints', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDisableForeignKeyConstraints();
        }).toThrow('This database driver does not support foreign key disabling.');
    });

    it('Works Compile Enable Writeable Schema', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileEnableWriteableSchema();
        }).toThrow('This database driver does not support enable writable schema.');
    });

    it('Works Compile Disable Writeable Schema', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDisableWriteableSchema();
        }).toThrow('This database driver does not support disable writable schema.');
    });

    it('Works Compile Rename', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileRename(
                getMysqlBlueprint('test'),
                getCommand() as CommandDefinition<RenameRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support rename table.');
    });

    it('Works Compile Add', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileAdd(getMysqlBlueprint('test'), getCommand(), getConnection().sessionSchema());
        }).toThrow('This database driver does not support add column.');
    });

    it('Works Compile Change', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileChange(getMysqlBlueprint('test'), getCommand(), getConnection().sessionSchema());
        }).toThrow('This database driver does not support change column.');
    });

    it('Works Compile Drop Column', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropColumn(
                getMysqlBlueprint('test'),
                getCommand() as CommandDefinition<ColumnsRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support drop column.');
    });

    it('Works Compile Rename Column', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileRenameColumn(
                getMysqlBlueprint('test'),
                getCommand() as CommandDefinition<RenameFullRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support rename column.');
    });

    it('Works Compile Auto Increment Starting Values', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileAutoIncrementStartingValues(
                getMysqlBlueprint('test'),
                getCommand() as CommandDefinition<ColumnDefinitionRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support rename column.');
    });

    it('Works Compile Comment', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileComment(
                getMysqlBlueprint('test'),
                getCommand() as CommandDefinition<ColumnDefinitionRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support comment on table.');
    });

    it('Works Compile Default', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDefault(
                getMysqlBlueprint('test'),
                getCommand() as CommandDefinition<ColumnDefinitionRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support rename column.');
    });

    it('Works Compile Primary', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compilePrimary(
                getMysqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support primary key creation.');
    });

    it('Works Compile Drop Primary', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropPrimary(
                getMysqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support primary key removal.');
    });

    it('Works Compile Unique', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileUnique(
                getMysqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support unique index creation.');
    });

    it('Works Compile Drop Unique', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropUnique(
                getMysqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support unique index removal.');
    });

    it('Works Compile Index', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileIndex(
                getMysqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support index creation.');
    });

    it('Works Compile Drop Index', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropIndex(
                getMysqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support index removal.');
    });

    it('Works Compile Fulltext', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileFulltext(
                getMysqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support fulltext index creation.');
    });

    it('Works Compile Drop Fulltext', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropFulltext(
                getMysqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support fulltext index removal.');
    });

    it('Works Compile Spatial Index', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileSpatialIndex(
                getMysqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support spatial index creation.');
    });

    it('Works Compile Drop Spatial Index', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileDropSpatialIndex(
                getMysqlBlueprint('test'),
                getCommand() as CommandIndexDefinition<IndexRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support spatial index removal.');
    });

    it('Works Compile Table Comment', () => {
        const grammar = new Grammar();
        expect(() => {
            grammar.compileTableComment(
                getMysqlBlueprint('test'),
                getCommand() as CommandDefinition<CommentRegistryI>,
                getConnection().sessionSchema()
            );
        }).toThrow('This database driver does not support table comment.');
    });

    it('Works Compile Modify After', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyAfter(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support after column modifier.');
    });

    it('Works Compile Modify Charset', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyCharset(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support charset column modifier.');
    });

    it('Works Compile Modify Collate', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyCollate(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support collate column modifier.');
    });

    it('Works Compile Modify Comment', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyComment(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support comment column modifier.');
    });

    it('Works Compile Modify Default', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyDefault(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support default column modifier.');
    });

    it('Works Compile Modify First', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyFirst(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support first column modifier.');
    });

    it('Works Compile Modify GeneratedAs', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyGeneratedAs(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support generated as column modifier.');
    });

    it('Works Compile Modify Increment', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyIncrement(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support increment column modifier.');
    });

    it('Works Compile Modify Invisible', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyInvisible(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support invisible column modifier.');
    });

    it('Works Compile Modify Nullable', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyNullable(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support nullable column modifier.');
    });

    it('Works Compile Modify OnUpdate', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyOnUpdate(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support on update column modifier.');
    });

    it('Works Compile Modify Persisted', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyPersisted(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support persisted column modifier.');
    });

    it('Works Compile Modify Srid', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifySrid(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support srid column modifier.');
    });

    it('Works Compile Modify StoredAs', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyStoredAs(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support stored as column modifier.');
    });

    it('Works Compile Modify Unsigned', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyUnsigned(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support unsigned column modifier.');
    });

    it('Works Compile Modify VirtualAs', () => {
        const grammar = new MockedGrammar();
        expect(() => {
            grammar.compileModifyVirtualAs(getMysqlBlueprint('test'), new ColumnDefinition('string', 'test', {}));
        }).toThrow('this database driver does not support virtual as column modifier.');
    });

    it('Works Supports Schema Transactions', () => {
        const grammar = new Grammar();
        expect(grammar.supportsSchemaTransactions()).toBeFalsy();
    });
});

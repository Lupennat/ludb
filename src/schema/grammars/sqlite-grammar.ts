import Expression from '../../query/expression';
import { Stringable } from '../../types/query/builder';
import BlueprintI from '../../types/schema/blueprint';
import {
    ColumnType,
    ColumnsRegistryI,
    CommandType,
    ModifiersType,
    RenameFullRegistryI,
    RenameRegistryI
} from '../../types/schema/registry';
import ColumnDefinition from '../definitions/column-definition';
import CommandDefinition from '../definitions/commands/command-definition';
import CommandForeignKeyDefinition from '../definitions/commands/command-foreign-key-definition';
import CommandIndexDefinition from '../definitions/commands/command-index-definition';
import Grammar from './grammar';

class SQLiteGrammar extends Grammar {
    /**
     * The possible column modifiers.
     */
    protected modifiers: ModifiersType[] = ['increment', 'nullable', 'default', 'virtualAs', 'storedAs'];

    /**
     * The possible column serials.
     */
    protected serials: ColumnType[] = ['bigInteger', 'integer', 'mediumInteger', 'smallInteger', 'tinyInteger'];

    /**
     * The commands to be executed outside of create or alter command.
     */
    protected commands: CommandType[] = [];

    /**
     * Compile the SQL needed to retrieve all table names.
     */
    public compileGetAllTables(): string {
        return "select type, name from sqlite_master where type = 'table' and name not like 'sqlite_%'";
    }

    /**
     * Compile the SQL needed to retrieve all table views.
     */
    public compileGetAllViews(): string {
        return "select type, name from sqlite_master where type = 'view'";
    }

    /**
     * Compile a drop table command.
     */
    public compileDrop(blueprint: BlueprintI): string {
        return `drop table ${this.wrapTable(blueprint)}`;
    }

    /**
     * Compile the SQL needed to drop all tables.
     */
    public compileDropAllTables(): string {
        return "delete from sqlite_master where type in ('table', 'index', 'trigger')";
    }

    /**
     * Compile the SQL needed to drop all views.
     */
    public compileDropAllViews(): string {
        return "delete from sqlite_master where type in ('view')";
    }

    /**
     * Compile the SQL needed to rebuild the database.
     */
    public compileRebuild(): string {
        return 'vacuum';
    }

    /**
     * Compile a create table command.
     */
    public compileCreate(blueprint: BlueprintI): string {
        return `${blueprint.getRegistry().temporary ? 'create temporary' : 'create'} table ${this.wrapTable(
            blueprint
        )} (${this.getColumns(blueprint).join(', ')}${this.addForeignKeys(blueprint)}${this.addPrimaryKeys(
            blueprint
        )})`;
    }

    /**
     * Get the foreign key syntax for a table creation statement.
     */
    protected addForeignKeys(blueprint: BlueprintI): string {
        const foreigns = this.getCommandsByName<CommandForeignKeyDefinition>(blueprint, 'foreign');

        return foreigns.reduce((sql, command) => {
            sql += this.getForeignKey(command);

            const onDelete = command.getRegistry().onDelete;
            const onUpdate = command.getRegistry().onUpdate;

            if (onDelete) {
                sql += ` on delete ${onDelete}`;
            }

            if (onUpdate) {
                sql += ` on update ${onUpdate}`;
            }

            return sql;
        }, '');
    }

    /**
     * Get the SQL for the foreign key.
     */
    protected getForeignKey(command: CommandForeignKeyDefinition): string {
        const registry = command.getRegistry();
        // We need to columnize the columns that the foreign key is being defined for
        // so that it is a properly formatted list. Once we have done this, we can
        // return the foreign key SQL declaration to the calling method for use.
        return `, foreign key(${this.columnize(registry.columns)}) references ${this.wrapTable(
            registry.on
        )}(${this.columnize(Array.isArray(registry.references) ? registry.references : [registry.references])})`;
    }

    /**
     * Get the primary key syntax for a table creation statement.
     */
    protected addPrimaryKeys(blueprint: BlueprintI): string {
        const primary = this.getCommandByName<CommandIndexDefinition>(blueprint, 'primary');

        if (primary) {
            return `, primary key (${this.columnize(primary.getRegistry().columns)})`;
        }

        return '';
    }

    /**
     * Compile the query to determine the list of tables.
     */
    public compileTableExists(): string {
        return "select * from sqlite_master where type = 'table' and name = ?";
    }

    /**
     * Compile the query to determine the data type of column.
     */
    public compileColumnType(table: string): string {
        return `pragma table_xinfo(${this.wrap(table.replace(/\./g, '__'))})`;
    }

    /**
     * Compile the query to determine the list of columns.
     */
    public compileColumnListing(table: string): string {
        return `pragma table_info(${this.wrap(table.replace(/\./g, '__'))})`;
    }

    /**
     * Compile the command to enable foreign key constraints.
     */
    public compileEnableForeignKeyConstraints(): string {
        return 'PRAGMA foreign_keys = ON;';
    }

    /**
     * Compile the command to disable foreign key constraints.
     */
    public compileDisableForeignKeyConstraints(): string {
        return 'PRAGMA foreign_keys = OFF;';
    }

    /**
     * Compile the SQL needed to enable a writable schema.
     */
    public compileEnableWriteableSchema(): string {
        return 'PRAGMA writable_schema = 1;';
    }

    /**
     * Compile the SQL needed to disable a writable schema.
     */
    public compileDisableWriteableSchema(): string {
        return 'PRAGMA writable_schema = 0;';
    }

    /**
     * Compile a rename table command.
     */
    public compileRename(blueprint: BlueprintI, command: CommandDefinition<RenameRegistryI>): string {
        return `alter table ${this.wrapTable(blueprint)} to ${this.wrapTable(command.getRegistry().to)}`;
    }

    /**
     * Compile an add column command.
     */
    public compileAdd(blueprint: BlueprintI): string[] {
        const regex = new RegExp(/as \(.*\) stored/, 'g');
        const columns = this.prefixArray('add column', this.getColumns(blueprint));

        return columns
            .filter(column => {
                return column.match(regex) === null;
            })
            .map(column => {
                return `alter table ${this.wrapTable(blueprint)} ${column}`;
            });
    }

    /**
     * Compile a drop column command.
     */
    public compileDropColumn(blueprint: BlueprintI, command: CommandDefinition<ColumnsRegistryI>): string[] {
        const table = this.wrapTable(blueprint);
        const columns = this.prefixArray('drop column', this.wrapArray(command.getRegistry().columns));
        return columns.map(column => `alter table ${table} ${column}`);
    }

    /**
     * Compile a rename column command.
     */
    public compileRenameColumn(blueprint: BlueprintI, command: CommandDefinition<RenameFullRegistryI>): string {
        const registry = command.getRegistry();
        return `alter table ${this.wrapTable(blueprint)} rename ${this.wrap(registry.from)} to ${registry.to}`;
    }

    /**
     * Compile a unique key command.
     */
    public compileUnique(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        const registry = command.getRegistry();
        return `create unique index ${this.wrap(registry.index)} on ${this.wrapTable(blueprint)} (${this.columnize(
            registry.columns
        )})`;
    }

    /**
     * Compile a drop unique key command.
     */
    public compileDropUnique(_blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `drop index ${this.wrap(command.getRegistry().index)}`;
    }

    /**
     * Compile a primary key command.
     */
    public compilePrimary(): string {
        // Handled on table creation...
        return '';
    }

    /**
     * Compile a index command.
     */
    public compileIndex(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        const registry = command.getRegistry();
        return `create index ${this.wrap(registry.index)} on ${this.wrapTable(blueprint)} (${this.columnize(
            registry.columns
        )})`;
    }

    /**
     * Compile a drop index command.
     */
    public compileDropIndex(_blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `drop index ${this.wrap(command.getRegistry().index)}`;
    }

    /**
     * Compile a foreign key command.
     */
    public compileForeign(): string {
        // Handled on table creation...
        return '';
    }

    /**
     * Compile a drop table (if exists) command.
     */
    public compileDropIfExists(blueprint: BlueprintI): string {
        return `drop table if exists ${this.wrapTable(blueprint)}`;
    }

    /**
     * Compile a rename index command.
     */
    public compileRenameIndex(): string {
        throw new Error('do without doctrine');
    }

    /**
     * Compile Column Char
     */
    protected compileTypeChar(): string {
        return 'varchar';
    }

    /**
     * Compile Column String
     */
    protected compileTypeString(): string {
        return 'varchar';
    }

    /**
     * Compile Column TinyText
     */
    protected compileTypeTinyText(): string {
        return 'text';
    }

    /**
     * Compile Column MediumText
     */
    protected compileTypeMediumText(): string {
        return 'text';
    }

    /**
     * Compile Column LongText
     */
    protected compileTypeLongText(): string {
        return 'text';
    }

    /**
     * Compile Column BigInteger
     */
    protected compileTypeBigInteger(): string {
        return 'integer';
    }

    /**
     * Compile Column Integer
     */
    protected compileTypeInteger(): string {
        return 'integer';
    }

    /**
     * Compile Column MediumInteger
     */
    protected compileTypeMediumInteger(): string {
        return 'integer';
    }

    /**
     * Compile Column TinyInteger
     */
    protected compileTypeTinyInteger(): string {
        return 'integer';
    }

    /**
     * Compile Column SmallInteger
     */
    protected compileTypeSmallInteger(): string {
        return 'integer';
    }

    /**
     * Compile Column Double
     */
    protected compileTypeDouble(): string {
        return 'float';
    }

    /**
     * Compile Column Decimal
     */
    protected compileTypeDecimal(): string {
        return 'numeric';
    }

    /**
     * Compile Column Boolean
     */
    protected compileTypeBoolean(): string {
        return 'tinyint(1)';
    }

    /**
     * Compile Column Enum
     */
    protected compileTypeEnum(column: ColumnDefinition): string {
        return `varchar check ("${this.getValue(column.name).toString()}" in (${this.quoteString(
            column.getRegistry().allowed ?? []
        )}))`;
    }

    /**
     * Compile Column Json
     */
    protected compileTypeJson(): string {
        return 'text';
    }

    /**
     * Compile Column Jsonb
     */
    protected compileTypeJsonb(): string {
        return 'text';
    }

    /**
     * Compile Column DateTime
     */
    protected compileTypeDateTime(column: ColumnDefinition): string {
        return this.compileTypeTimestamp(column);
    }

    /**
     * Compile Column Time
     */
    protected compileTypeTime(): string {
        return 'time';
    }

    /**
     * Compile Column Timestamp
     */
    protected compileTypeTimestamp(column: ColumnDefinition): string {
        if (column.getRegistry().useCurrent) {
            column.default(new Expression('CURRENT_TIMESTAMP'));
        }

        return 'datetime';
    }

    /**
     * Compile Column Year
     */
    protected compileTypeYear(): string {
        return this.compileTypeInteger();
    }

    /**
     * Compile Column Uuid
     */
    protected compileTypeUuid(): string {
        return 'varchar';
    }

    /**
     * Compile Column IpAddress
     */
    protected compileTypeIpAddress(): string {
        return 'varchar';
    }

    /**
     * Compile Column MacAddress
     */
    protected compileTypeMacAddress(): string {
        return 'varchar';
    }

    /**
     * Get the SQL for a default column modifier.
     */
    protected compileModifyDefault(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const defaultVal = column.getRegistry().default;
        const virtualAs = column.getRegistry().virtualAs;
        const storedAs = column.getRegistry().storedAs;

        if (defaultVal !== undefined && virtualAs === undefined && storedAs === undefined) {
            return ` default ${this.getDefaultValue(defaultVal)}`;
        }

        return '';
    }

    /**
     * Get the SQL for an increment column modifier.
     */
    protected compileModifyIncrement(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const autoIncrement = column.getRegistry().autoIncrement;

        if (autoIncrement && this.serials.includes(column.getRegistry().type)) {
            return ' primary key autoincrement';
        }

        return '';
    }

    /**
     * Get the SQL for a nullable column modifier.
     */
    protected compileModifyNullable(_blueprint: BlueprintI, column: ColumnDefinition): string {
        if (column.getRegistry().virtualAs === undefined && column.getRegistry().storedAs === undefined) {
            return column.getRegistry().nullable ? '' : ' not null';
        }
        if (column.getRegistry().nullable === false) {
            return ' not null';
        }

        return '';
    }

    /**
     * Get the SQL for a stored as column modifier.
     */
    protected compileModifyStoredAs(_blueprint: BlueprintI, column: ColumnDefinition): string {
        let storedAs = column.getRegistry().storedAs;
        if (storedAs) {
            if (this.isJsonSelector(storedAs)) {
                storedAs = this.wrapJsonSelector(storedAs);
            }

            return ` as (${storedAs}) stored`;
        }

        return '';
    }

    /**
     * Get the SQL for a virtual as column modifier.
     */
    protected compileModifyVirtualAs(_blueprint: BlueprintI, column: ColumnDefinition): string {
        let virtualAs = column.getRegistry().virtualAs;
        if (virtualAs) {
            if (this.isJsonSelector(virtualAs)) {
                virtualAs = this.wrapJsonSelector(virtualAs);
            }

            return ` as (${virtualAs})`;
        }

        return '';
    }

    /**
     * Wrap the given JSON selector.
     */
    protected wrapJsonSelector(value: Stringable): string {
        const [field, path] = this.wrapJsonFieldAndPath(value);

        return `json_extract(${field}${path})`;
    }
}

export default SQLiteGrammar;

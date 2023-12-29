import Expression from '../../query/expression';
import { Stringable } from '../../types/generics';
import BlueprintI from '../../types/schema/blueprint';
import {
    ColumnType,
    ColumnsRegistryI,
    CommandType,
    ModifiersType,
    RenameFullRegistryI,
    RenameRegistryI,
    ViewRegistryI
} from '../../types/schema/registry';
import ColumnDefinition from '../definitions/column-definition';
import CommandDefinition from '../definitions/commands/command-definition';
import CommandForeignKeyDefinition from '../definitions/commands/command-foreign-key-definition';
import CommandIndexDefinition from '../definitions/commands/command-index-definition';
import CommandViewDefinition from '../definitions/commands/command-view-definition';
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
     * Compile the query to determine if the dbstat table is available.
     */
    public compileDbstatExists(): string {
        return "select exists (select 1 from pragma_compile_options where compile_options = 'ENABLE_DBSTAT_VTAB') as enabled";
    }

    /**
     * Compile a create view command;
     */
    public compileCreateView(name: Stringable, command: CommandViewDefinition<ViewRegistryI>): string {
        const registry = command.getRegistry();
        let sql = `create${registry.temporary ? ' temporary' : ''} view ${this.wrapTable(name)}`;

        const columns = registry.columnNames ? registry.columnNames : [];

        if (columns.length) {
            sql += ` (${this.columnize(columns)})`;
        }

        sql += ` as ${registry.as.toRawSql()}`;

        return sql;
    }
    /**
     * Compile the query to determine the tables.
     */
    public compileTables(withSize?: boolean): string {
        return withSize
            ? 'select m.tbl_name as name, sum(s.pgsize) as size from sqlite_master as m ' +
                  'join dbstat as s on s.name = m.name ' +
                  "where m.type in ('table', 'index') and m.tbl_name not like 'sqlite_%' " +
                  'group by m.tbl_name ' +
                  'order by m.tbl_name'
            : "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name";
    }

    /**
     * Compile the query to determine the views.
     */
    public compileViews(): string {
        return "select name, sql as definition from sqlite_master where type = 'view' order by name";
    }

    /**
     * Compile the query to determine the columns.
     */
    public compileColumns(table: string): string {
        return (
            'select name, type, not "notnull" as "nullable", dflt_value as "default", pk as "primary" ' +
            'from pragma_table_info(' +
            this.wrap(table.replace('.', '__')) +
            ') order by cid asc'
        );
    }

    /**
     * Compile the query to determine the indexes.
     */
    public compileIndexes(table: string): string {
        return (
            'select "primary" as name, group_concat(col) as columns, 1 as "unique", 1 as "primary" ' +
            'from (select name as col from pragma_table_info(' +
            this.wrap(table.replace('.', '__')) +
            ') where pk > 0 order by pk, cid) group by name ' +
            'union select name, group_concat(col) as columns, "unique", origin = "pk" as "primary" ' +
            'from (select il.*, ii.name as col from pragma_index_list(' +
            table +
            ') il, pragma_index_info(il.name) ii order by il.seq, ii.seqno) ' +
            'group by name, "unique", "primary"'
        );
    }

    /**
     * Compile the query to determine the foreign keys.
     */
    public compileForeignKeys(table: string): string {
        return (
            'select group_concat("from") as columns, "table" as foreign_table, ' +
            'group_concat("to") as foreign_columns, on_update, on_delete ' +
            'from (select * from pragma_foreign_key_list(' +
            this.wrap(table.replace('.', '__')) +
            ') as fkl inner join pragmar_index_list(' +
            this.wrap(table.replace('.', '__')) +
            ') as il on il.seq = fkl.id order by id desc, seq) ' +
            'group by id, "table", on_update, on_delete'
        );
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
    public compileDropTables(): string {
        return "delete from sqlite_master where type in ('table', 'index', 'trigger')";
    }

    /**
     * Compile the SQL needed to drop all views.
     */
    public compileDropViews(): string {
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
                sql += ` on delete ${this.getValue(onDelete).toString()}`;
            }

            if (onUpdate) {
                sql += ` on update ${this.getValue(onUpdate).toString()}`;
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
        return `alter table ${this.wrapTable(blueprint)} rename to ${this.wrapTable(command.getRegistry().to)}`;
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
        return `alter table ${this.wrapTable(blueprint)} rename column ${this.wrap(registry.from)} to ${this.wrap(
            registry.to
        )}`;
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
    public compileDropTableIfExists(blueprint: BlueprintI): string {
        return `drop table if exists ${this.wrapTable(blueprint)}`;
    }

    /**
     * Compile a drop view (if exists) command.
     */
    public compileDropViewIfExists(name: string): string {
        return `drop view if exists ${this.wrapTable(name)}`;
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
            column.getRegistry().allowed!
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
     * Compile Column DateTimeTz
     */
    protected compileTypeDateTimeTz(column: ColumnDefinition): string {
        return this.compileTypeDateTime(column);
    }

    /**
     * Compile Column Time
     */
    protected compileTypeTime(): string {
        return 'time';
    }

    /**
     * Compile Column TimeTz
     */
    protected compileTypeTimeTz(): string {
        return this.compileTypeTime();
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
     * Compile Column TimestampTz
     */
    protected compileTypeTimestampTz(column: ColumnDefinition): string {
        return this.compileTypeTimestamp(column);
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

            return ` as (${this.getValue(storedAs).toString()}) stored`;
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

            return ` as (${this.getValue(virtualAs).toString()})`;
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

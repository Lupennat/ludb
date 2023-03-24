import Expression from '../../query/expression';
import { ConnectionSessionI } from '../../types';
import { Stringable } from '../../types/query/builder';
import BlueprintI from '../../types/schema/blueprint';
import {
    ColumnDefinitionRegistryI,
    ColumnType,
    ColumnsRegistryI,
    CommandType,
    CommentRegistryI,
    ModifiersType,
    RenameFullRegistryI,
    RenameRegistryI
} from '../../types/schema/registry';
import { addslashes, escapeQuoteForSql } from '../../utils';
import ColumnDefinition from '../definitions/column-definition';
import CommandDefinition from '../definitions/commands/command-definition';
import CommandForeignKeyDefinition from '../definitions/commands/command-foreign-key-definition';
import CommandIndexDefinition from '../definitions/commands/command-index-definition';
import Grammar from './grammar';

class MySqlGrammar extends Grammar {
    /**
     * The possible column modifiers.
     */
    protected modifiers: ModifiersType[] = [
        'unsigned',
        'charset',
        'collate',
        'virtualAs',
        'storedAs',
        'nullable',
        'srid',
        'default',
        'onUpdate',
        'invisible',
        'increment',
        'comment',
        'after',
        'first'
    ];

    /**
     * The possible column serials.
     */
    protected serials: ColumnType[] = ['bigInteger', 'integer', 'mediumInteger', 'smallInteger', 'tinyInteger'];

    /**
     * The commands to be executed outside of create or alter command.
     */
    protected commands: CommandType[] = ['autoIncrementStartingValues'];

    /**
     * Compile a create database command.
     */
    public compileCreateDatabase(name: string, connection: ConnectionSessionI): string {
        let sql = `create database ${this.wrapValue(name)}`;
        const charset = connection.getConfig<string>('charset');
        if (charset) {
            sql += ` default character set ${this.wrapValue(charset)}`;
            const collation = connection.getConfig<string>('collation');
            if (collation) {
                sql += ` default collate ${this.wrapValue(collation)}`;
            }
        }
        return sql;
    }

    /**
     * Compile the SQL needed to retrieve all table names.
     */
    public compileGetAllTables(): string {
        return "SHOW FULL TABLES WHERE table_type = 'BASE TABLE'";
    }

    /**
     * Compile the SQL needed to retrieve all table views.
     */
    public compileGetAllViews(): string {
        return "SHOW FULL TABLES WHERE table_type = 'VIEW'";
    }

    /**
     * Compile a drop database if exists command.
     */
    public compileDropDatabaseIfExists(name: string): string {
        return `drop database if exists ${this.wrapValue(name)}`;
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
    public compileDropAllTables(tables: Stringable[]): string {
        return `drop table ${this.wrapArray(tables).join(',')}`;
    }

    /**
     * Compile the SQL needed to drop all views.
     */
    public compileDropAllViews(views: Stringable[]): string {
        return `drop view ${this.wrapArray(views).join(',')}`;
    }

    /**
     * Compile a create table command.
     */
    public compileCreate(blueprint: BlueprintI, _command: CommandDefinition, connection: ConnectionSessionI): string {
        let sql = this.compileCreateTable(blueprint);

        // Once we have the primary SQL, we can add the encoding option to the SQL for
        // the table.  Then, we can check if a storage engine has been supplied for
        // the table. If so, we will add the engine declaration to the SQL query.
        sql = this.compileCreateEncoding(sql, connection, blueprint);

        // Finally, we will append the engine configuration onto this SQL statement as
        // the final thing we do before returning this finished SQL. Once this gets
        // added the query will be ready to execute against the real connections.
        return this.compileCreateEngine(sql, connection, blueprint);
    }

    /**
     * Create the main create table clause.
     */
    protected compileCreateTable(blueprint: BlueprintI): string {
        return `${blueprint.getRegistry().temporary ? 'create temporary' : 'create'} table ${this.wrapTable(
            blueprint
        )} (${this.getColumns(blueprint).join(', ')})`;
    }

    /**
     * Append the character set specifications to a command.
     */
    protected compileCreateEncoding(sql: string, connection: ConnectionSessionI, blueprint: BlueprintI): string {
        const charset = blueprint.getRegistry().charset ?? connection.getConfig('charset');

        // First we will set the character set if one has been set on either the create
        // blueprint itself or on the root configuration for the connection that the
        // table is being created on. We will add these to the create table query.
        if (charset) {
            sql += ` default character set ${charset}`;
        }

        const collation = blueprint.getRegistry().collation ?? connection.getConfig('collation');

        // Next we will add the collation to the create table statement if one has been
        // added to either this create table blueprint or the configuration for this
        // connection that the query is targeting. We'll add it to this SQL query.
        if (collation) {
            sql += ` collate '${collation}'`;
        }

        return sql;
    }

    /**
     * Append the engine specifications to a command.
     */
    protected compileCreateEngine(sql: string, connection: ConnectionSessionI, blueprint: BlueprintI): string {
        const engine = blueprint.getRegistry().engine ?? connection.getConfig('engine');
        if (engine) {
            return `${sql} engine = ${engine}`;
        }

        return sql;
    }

    /**
     * Compile the query to determine the list of tables.
     */
    public compileTableExists(): string {
        return "select * from information_schema.tables where table_schema = ? and table_name = ? and table_type = 'BASE TABLE'";
    }

    /**
     * Compile the query to determine the data type of column.
     */
    public compileColumnType(): string {
        return 'select column_name as `column_name`, data_type as `data_type` from information_schema.columns where table_schema = ? and table_name = ? and column_name = ?';
    }

    /**
     * Compile the query to determine the list of columns.
     */
    public compileColumnListing(): string {
        return 'select column_name as `column_name` from information_schema.columns where table_schema = ? and table_name = ?';
    }

    /**
     * Compile the command to enable foreign key constraints.
     */
    public compileEnableForeignKeyConstraints(): string {
        return 'SET FOREIGN_KEY_CHECKS=1;';
    }

    /**
     * Compile the command to disable foreign key constraints.
     */
    public compileDisableForeignKeyConstraints(): string {
        return 'SET FOREIGN_KEY_CHECKS=0;';
    }

    /**
     * Compile a rename table command.
     */
    public compileRename(blueprint: BlueprintI, command: CommandDefinition<RenameRegistryI>): string {
        return `rename table ${this.wrapTable(blueprint)} to ${this.wrapTable(command.getRegistry().to)}`;
    }

    /**
     * Compile an add column command.
     */
    public compileAdd(blueprint: BlueprintI): string {
        const columns = this.prefixArray('add', this.getColumns(blueprint));

        return `alter table ${this.wrapTable(blueprint)} ${columns.join(', ')}`;
    }

    /**
     * Compile a change column command into a series of SQL statements.
     */
    public compileChange(blueprint: BlueprintI): string {
        const columns = [];

        for (const column of blueprint.getChangedColumns()) {
            const registry = column.getRegistry();
            const renameTo = registry.renameTo;
            const sql = `${renameTo ? 'change' : 'modify'} ${this.wrap(column)}${
                renameTo ? ' ' + this.wrap(renameTo) : ''
            } ${this.getType(column)}`;
            columns.push(this.addModifiers(sql, blueprint, column));
        }

        return `alter table ${this.wrapTable(blueprint)} ${columns.join(', ')}`;
    }

    /**
     * Compile a drop column command.
     */
    public compileDropColumn(blueprint: BlueprintI, command: CommandDefinition<ColumnsRegistryI>): string {
        const columns = this.prefixArray('drop', this.wrapArray(command.getRegistry().columns));

        return `alter table ${this.wrapTable(blueprint)} ${columns.join(', ')}`;
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
     * Compile the auto-incrementing column starting values.
     */
    public compileAutoIncrementStartingValues(
        blueprint: BlueprintI,
        command: CommandDefinition<ColumnDefinitionRegistryI>
    ): string {
        const columnDefinition = command.getRegistry().column;
        const column = columnDefinition.getRegistry();
        const value = column.startingValue ?? column.from;

        if (column.autoIncrement && value !== undefined) {
            return `alter table ${this.wrapTable(blueprint)} auto_increment = ${value.toString()}`;
        }

        return '';
    }

    /**
     * Compile a primary key command.
     */
    public compilePrimary(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        const registry = command.getRegistry();
        return `alter table ${this.wrapTable(blueprint)} add primary key ${
            registry.algorithm ? 'using ' + registry.algorithm : ''
        }(${this.columnize(registry.columns)})`;
    }

    /**
     * Compile a drop primary key command.
     */
    public compileDropPrimary(blueprint: BlueprintI): string {
        return `alter table ${this.wrapTable(blueprint)} drop primary key`;
    }

    /**
     * Compile a unique key command.
     */
    public compileUnique(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return this.compileKey(blueprint, command, 'unique');
    }

    /**
     * Compile a drop unique key command.
     */
    public compileDropUnique(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return this.compileDropIndex(blueprint, command);
    }

    /**
     * Compile a index command.
     */
    public compileIndex(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return this.compileKey(blueprint, command, 'index');
    }

    /**
     * Compile a drop index command.
     */
    public compileDropIndex(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `alter table ${this.wrapTable(blueprint)} drop index ${this.wrap(command.getRegistry().index)}`;
    }

    /**
     * Compile a fulltext index key command.
     */
    public compileFulltext(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return this.compileKey(blueprint, command, 'fulltext');
    }

    /**
     * Compile a drop fulltext index command.
     */
    public compileDropFulltext(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return this.compileDropIndex(blueprint, command);
    }

    /**
     * Compile a spatial index command.
     */
    public compileSpatialIndex(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return this.compileKey(blueprint, command, 'spatial index');
    }

    /**
     * Compile a drop spatial index command.
     */
    public compileDropSpatialIndex(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return this.compileDropIndex(blueprint, command);
    }

    /**
     * Compile an index creation command.
     */
    protected compileKey(blueprint: BlueprintI, command: CommandIndexDefinition, type: string): string {
        const registry = command.getRegistry();
        return `alter table ${this.wrapTable(blueprint)} add ${type} ${this.wrap(registry.index)}${
            registry.algorithm ? ' using ' + registry.algorithm : ''
        }(${this.columnize(registry.columns)})`;
    }

    /**
     * Compile a drop foreign key command.
     */
    public compileDropForeign(blueprint: BlueprintI, command: CommandForeignKeyDefinition): string {
        return `alter table ${this.wrapTable(blueprint)} drop foreign key ${this.wrap(command.getRegistry().index)}`;
    }

    /**
     * Compile a drop table (if exists) command.
     */
    public compileDropIfExists(blueprint: BlueprintI): string {
        return `drop table if exists ${this.wrapTable(blueprint)}`;
    }

    /**
     * Compile a table comment command.
     */
    public compileTableComment(blueprint: BlueprintI, command: CommandDefinition<CommentRegistryI>): string {
        return `alter table ${this.wrapTable(blueprint)} comment = '${escapeQuoteForSql(
            command.getRegistry().comment
        )}'`;
    }

    /**
     * Compile a rename index command.
     */
    public compileRenameIndex(blueprint: BlueprintI, command: CommandDefinition<RenameFullRegistryI>): string {
        const registry = command.getRegistry();
        return `alter table ${this.wrapTable(blueprint)} rename index ${this.wrap(registry.from)} to ${this.wrap(
            registry.to
        )}`;
    }

    /**
     * Compile Column Float
     */
    protected compileTypeFloat(column: ColumnDefinition): string {
        return this.compileTypeDouble(column);
    }

    /**
     * Compile Column Boolean
     */
    protected compileTypeBoolean(): string {
        return 'tinyint(1)';
    }

    /**
     * Compile Column Set
     */
    protected compileTypeSet(column: ColumnDefinition): string {
        return `set(${this.quoteString(column.getRegistry().allowed!)})`;
    }

    /**
     * Compile Column Jsonb
     */
    protected compileTypeJsonb(): string {
        return 'json';
    }

    /**
     * Compile Column DateTime
     */
    protected compileTypeDateTime(column: ColumnDefinition): string {
        const registry = column.getRegistry();
        const current = registry.precision ? `CURRENT_TIMESTAMP(${registry.precision})` : 'CURRENT_TIMESTAMP';

        if (registry.useCurrent) {
            column.default(new Expression(current));
        }

        if (registry.useCurrentOnUpdate) {
            column.onUpdate(new Expression(current));
        }

        return super.compileTypeDateTime(column);
    }

    /**
     * Compile Column Timestamp
     */
    protected compileTypeTimestamp(column: ColumnDefinition): string {
        const registry = column.getRegistry();
        const current = registry.precision ? `CURRENT_TIMESTAMP(${registry.precision})` : 'CURRENT_TIMESTAMP';

        if (registry.useCurrent) {
            column.default(new Expression(current));
        }

        if (registry.useCurrentOnUpdate) {
            column.onUpdate(new Expression(current));
        }

        return super.compileTypeTimestamp(column);
    }

    /**
     * Compile Column Timestamp
     */
    protected compileTypeTimestampTz(column: ColumnDefinition): string {
        return this.compileTypeTimestamp(column);
    }

    /**
     * Compile Column Uuid
     */
    protected compileTypeUuid(): string {
        return 'char(36)';
    }

    /**
     * Compile Column IpAddress
     */
    protected compileTypeIpAddress(): string {
        return 'varchar(45)';
    }

    /**
     * Compile Column MacAddress
     */
    protected compileTypeMacAddress(): string {
        return 'varchar(17)';
    }

    /**
     * Get the SQL for an after column modifier.
     */
    protected compileModifyAfter(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const after = column.getRegistry().after;
        if (after) {
            return ` after ${this.wrap(after)}`;
        }

        return '';
    }

    /**
     * Get the SQL for a charset column modifier.
     */
    protected compileModifyCharset(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const charset = column.getRegistry().charset;
        if (charset) {
            return ` character set ${charset}`;
        }

        return '';
    }

    /**
     * Get the SQL for a collate column modifier.
     */
    protected compileModifyCollate(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const collation = column.getRegistry().collation;
        if (collation) {
            return ` collate '${collation}'`;
        }

        return '';
    }

    /**
     * Get the SQL for a comment column modifier.
     */
    protected compileModifyComment(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const comment = column.getRegistry().comment;
        if (comment) {
            return ` comment '${addslashes(comment)}'`;
        }

        return '';
    }

    /**
     * Get the SQL for a default column modifier.
     */
    protected compileModifyDefault(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const defaultVal = column.getRegistry().default;
        if (defaultVal !== undefined) {
            return ` default ${this.getDefaultValue(defaultVal)}`;
        }

        return '';
    }

    /**
     * Get the SQL for a first column modifier.
     */
    protected compileModifyFirst(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const first = column.getRegistry().first;
        if (first) {
            return ' first';
        }

        return '';
    }

    /**
     * Get the SQL for an increment column modifier.
     */
    protected compileModifyIncrement(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const autoIncrement = column.getRegistry().autoIncrement;

        if (autoIncrement && this.serials.includes(column.getRegistry().type)) {
            return ' auto_increment primary key';
        }

        return '';
    }

    /**
     * Get the SQL for an invisible column modifier.
     */
    protected compileModifyInvisible(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const invisible = column.getRegistry().invisible;
        if (invisible) {
            return ' invisible';
        }

        return '';
    }

    /**
     * Get the SQL for a nullable column modifier.
     */
    protected compileModifyNullable(_blueprint: BlueprintI, column: ColumnDefinition): string {
        if (!column.getRegistry().virtualAs && !column.getRegistry().storedAs) {
            return column.getRegistry().nullable ? ' null' : ' not null';
        }
        if (column.getRegistry().nullable === false) {
            return ' not null';
        }

        return '';
    }

    /**
     * Get the SQL for an on update column modifier.
     */
    protected compileModifyOnUpdate(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const onUpdate = column.getRegistry().onUpdate;
        if (onUpdate !== undefined) {
            return ` on update ${this.getDefaultValue(onUpdate)}`;
        }

        return '';
    }

    /**
     * Get the SQL for a srid column modifier.
     */
    protected compileModifySrid(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const srid = column.getRegistry().srid;
        if (srid && srid > 0) {
            return ` srid ${srid}`;
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
     * Get the SQL for an unsigned column modifier.
     */
    protected compileModifyUnsigned(_blueprint: BlueprintI, column: ColumnDefinition): string {
        if (column.getRegistry().unsigned) {
            return ' unsigned';
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
     * Wrap a single string in keyword identifiers.
     */
    protected wrapValue(value: string): string {
        return value === '*' ? value : '`' + value.replace(/`/g, '``') + '`';
    }

    /**
     * Wrap the given JSON selector.
     */
    protected wrapJsonSelector(value: Stringable): string {
        const [field, path] = this.wrapJsonFieldAndPath(value);

        return `json_unquote(json_extract(${field}${path}))`;
    }
}

export default MySqlGrammar;

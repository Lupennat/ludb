import Expression from '../../query/expression';
import { ConnectionSessionI } from '../../types/connection/connection';
import { Stringable } from '../../types/generics';
import BlueprintI from '../../types/schema/blueprint';
import {
    ColumnDefinitionRegistryI,
    ColumnType,
    ColumnsRegistryI,
    CommandType,
    CommentRegistryI,
    ModifiersType,
    RenameFullRegistryI,
    RenameRegistryI,
    ViewRegistryI
} from '../../types/schema/registry';
import { addslashes, escapeQuoteForSql } from '../../utils';
import ColumnDefinition from '../definitions/column-definition';
import CommandDefinition from '../definitions/commands/command-definition';
import CommandForeignKeyDefinition from '../definitions/commands/command-foreign-key-definition';
import CommandIndexDefinition from '../definitions/commands/command-index-definition';
import CommandViewDefinition from '../definitions/commands/command-view-definition';
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
     * Compile a create view command;
     */
    public compileCreateView(name: Stringable, command: CommandViewDefinition<ViewRegistryI>): string {
        const registry = command.getRegistry();
        let sql = `create`;
        const algorithm = registry.algorithm ? this.getValue(registry.algorithm).toString() : '';

        if (algorithm) {
            sql += ` algorithm=${algorithm}`;
        }

        const definer = registry.definer ? this.getValue(registry.definer).toString() : '';

        if (definer) {
            sql += ` definer=${definer} sql security definer`;
        }

        sql += ` view ${this.wrapTable(name)}`;

        const columns = registry.columnNames ? registry.columnNames : [];

        if (columns.length) {
            sql += ` (${this.columnize(columns)})`;
        }

        sql += ` as ${registry.as.toRawSql()}`;

        const check = registry.check ? registry.check : '';

        if (check) {
            sql += ` with ${check} check option`;
        }

        return sql;
    }

    /**
     * Compile the query to determine the tables.
     */
    public compileTables(database: string): string {
        return (
            'select table_name as `name`, (data_length + index_length) as `size`, ' +
            'table_comment as `comment`, engine as `engine`, table_collation as `collation` ' +
            'from information_schema.tables where table_schema = ' +
            this.quoteString(database) +
            " and table_type = 'BASE TABLE' " +
            'order by table_name'
        );
    }

    /**
     * Compile the query to determine the views.
     */
    public compileViews(database: string): string {
        return (
            'select table_name as `name`, view_definition as `definition` ' +
            'from information_schema.views where table_schema = ' +
            this.quoteString(database) +
            ' order by table_name'
        );
    }

    /**
     * Compile the query to determine the columns.
     */
    public compileColumns(table: string, database: string): string {
        return (
            'select column_name as `name`, data_type as `type_name`, column_type as `type`, ' +
            'collation_name as `collation`, is_nullable as `nullable`, ' +
            'column_default as `default`, column_comment as `comment`, extra as `extra` ' +
            'from information_schema.columns where table_schema = ' +
            this.quoteString(database) +
            ' and table_name = ' +
            this.quoteString(table)
        );
    }

    /**
     * Compile the query to determine the indexes.
     */
    public compileIndexes(table: string, database: string): string {
        return (
            'select index_name as `name`, group_concat(column_name order by seq_in_index) as `columns`, ' +
            'index_type as `type`, not non_unique as `unique` ' +
            'from information_schema.statistics where table_schema = ' +
            this.quoteString(database) +
            ' and table_name = ' +
            this.quoteString(table) +
            ' group by index_name, index_type, non_unique'
        );
    }

    /**
     * Compile the query to determine the foreign keys.
     */
    public compileForeignKeys(table: string, database: string): string {
        return (
            'select kc.constraint_name as `name`, ' +
            'group_concat(kc.column_name order by kc.ordinal_position) as `columns`, ' +
            'kc.referenced_table_schema as `foreign_schema`, ' +
            'kc.referenced_table_name as `foreign_table`, ' +
            'group_concat(kc.referenced_column_name order by kc.ordinal_position) as `foreign_columns`, ' +
            'rc.update_rule as `on_update`, ' +
            'rc.delete_rule as `on_delete` ' +
            'from information_schema.key_column_usage kc join information_schema.referential_constraints rc ' +
            'on kc.constraint_schema = rc.constraint_schema and kc.constraint_name = rc.constraint_name ' +
            'where kc.table_schema = ' +
            this.quoteString(database) +
            ' and kc.table_name = ' +
            this.quoteString(table) +
            ' and kc.referenced_table_name is not null ' +
            'group by kc.constraint_name, kc.referenced_table_schema, kc.referenced_table_name, rc.update_rule, rc.delete_rule'
        );
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
    public compileDropTables(tables: Stringable[]): string {
        return `drop table ${this.wrapArray(tables).join(',')}`;
    }

    /**
     * Compile the SQL needed to drop all views.
     */
    public compileDropViews(views: Stringable[]): string {
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
        const tableStructure = this.getColumns(blueprint);

        const primaryKey = this.getCommandByName<CommandIndexDefinition>(blueprint, 'primary');

        if (primaryKey) {
            const registry = primaryKey.getRegistry();
            const algorithm = registry.algorithm ? this.getValue(registry.algorithm).toString() : '';
            tableStructure.push(
                `primary key ${algorithm ? 'using ' + algorithm : ''}(${this.columnize(
                    primaryKey.getRegistry().columns
                )})`
            );

            primaryKey.shouldBeSkipped = true;
        }

        return `${blueprint.getRegistry().temporary ? 'create temporary' : 'create'} table ${this.wrapTable(
            blueprint
        )} (${tableStructure.join(', ')})`;
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
            sql += ` default character set ${this.getValue(charset).toString()}`;
        }

        const collation = blueprint.getRegistry().collation ?? connection.getConfig('collation');

        // Next we will add the collation to the create table statement if one has been
        // added to either this create table blueprint or the configuration for this
        // connection that the query is targeting. We'll add it to this SQL query.
        if (collation) {
            sql += ` collate '${this.getValue(collation).toString()}'`;
        }

        return sql;
    }

    /**
     * Append the engine specifications to a command.
     */
    protected compileCreateEngine(sql: string, connection: ConnectionSessionI, blueprint: BlueprintI): string {
        const engine = blueprint.getRegistry().engine ?? connection.getConfig('engine');
        if (engine) {
            return `${sql} engine = ${this.getValue(engine).toString()}`;
        }

        return sql;
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
        const algorithm = registry.algorithm ? this.getValue(registry.algorithm).toString() : '';
        return `alter table ${this.wrapTable(blueprint)} add primary key ${
            algorithm ? 'using ' + algorithm : ''
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
        const algorithm = registry.algorithm ? this.getValue(registry.algorithm).toString() : '';
        return `alter table ${this.wrapTable(blueprint)} add ${type} ${this.wrap(registry.index)}${
            algorithm ? ' using ' + algorithm : ''
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
            return ` character set ${this.getValue(charset).toString()}`;
        }

        return '';
    }

    /**
     * Get the SQL for a collate column modifier.
     */
    protected compileModifyCollate(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const collation = column.getRegistry().collation;
        if (collation) {
            return ` collate '${this.getValue(collation).toString()}'`;
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

            return ` as (${this.getValue(storedAs).toString()}) stored`;
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

            return ` as (${this.getValue(virtualAs).toString()})`;
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

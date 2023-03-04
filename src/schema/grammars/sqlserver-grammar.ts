import Expression from '../../query/expression';
import { Stringable } from '../../types/query/builder';
import BlueprintI from '../../types/schema/blueprint';
import {
    ColumnDefinitionRegistryI,
    ColumnType,
    ColumnsRegistryI,
    CommandType,
    ModifiersType,
    RenameFullRegistryI,
    RenameRegistryI
} from '../../types/schema/registry';
import { isStringable } from '../../utils';
import ColumnDefinition from '../definitions/column-definition';
import CommandDefinition from '../definitions/commands/command-definition';
import CommandForeignKeyDefinition from '../definitions/commands/command-foreign-key-definition';
import CommandIndexDefinition from '../definitions/commands/command-index-definition';
import Grammar from './grammar';

class SqlServerGrammar extends Grammar {
    /**
     * The possible column modifiers.
     */
    protected modifiers: ModifiersType[] = ['collate', 'nullable', 'default', 'persisted', 'increment'];

    /**
     * The possible column serials.
     */
    protected serials: ColumnType[] = ['bigInteger', 'integer', 'mediumInteger', 'smallInteger', 'tinyInteger'];

    /**
     * The commands to be executed outside of create or alter command.
     */
    protected commands: CommandType[] = ['default'];

    /**
     * Compile a create database command.
     */
    public compileCreateDatabase(name: string): string {
        return `create database ${this.wrapValue(name)}`;
    }

    /**
     * Compile the SQL needed to retrieve all table names.
     */
    public compileGetAllTables(): string {
        return "select name, type from sys.tables where type = 'U'";
    }

    /**
     * Compile the SQL needed to retrieve all table views.
     */
    public compileGetAllViews(): string {
        return "select name, type from sys.objects where type = 'V'";
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
    public compileDropAllTables(): string {
        return "EXEC sp_msforeachtable 'DROP TABLE ?'";
    }

    /**
     * Compile the SQL needed to drop all views.
     */
    public compileDropAllViews(): string {
        return `DECLARE @sql NVARCHAR(MAX) = N'';
        SELECT @sql += 'DROP VIEW ' + QUOTENAME(OBJECT_SCHEMA_NAME(object_id)) + '.' + QUOTENAME(name) + ';'
        FROM sys.views;

        EXEC sp_executesql @sql;`;
    }

    /**
     * Compile the command to drop all foreign keys.
     */
    public compileDropAllForeignKeys(): string {
        return `DECLARE @sql NVARCHAR(MAX) = N'';
        SELECT @sql += 'ALTER TABLE '
            + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + + QUOTENAME(OBJECT_NAME(parent_object_id))
            + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
        FROM sys.foreign_keys;

        EXEC sp_executesql @sql;`;
    }

    /**
     * Compile a create table command.
     */
    public compileCreate(blueprint: BlueprintI): string {
        return `create table ${this.wrapTable(blueprint)} (${this.getColumns(blueprint).join(', ')})`;
    }

    /**
     * Compile the query to determine the list of tables.
     */
    public compileTableExists(): string {
        return "select * from sys.sysobjects where id = object_id(?) and xtype in ('U', 'V')";
    }

    /**
     * Compile the query to determine the data type of column.
     */
    public compileColumnType(): string {
        return `select c.name, t.name 'type' from sys.columns c inner join sys.types t on c.user_type_id = t.user_type_id where object_id = object_id(?) and c.name = ?`;
    }

    /**
     * Compile the query to determine the list of columns.
     */
    public compileColumnListing(): string {
        return `select name from sys.columns where object_id = object_id(?)`;
    }

    /**
     * Compile the command to enable foreign key constraints.
     */
    public compileEnableForeignKeyConstraints(): string {
        return 'EXEC sp_msforeachtable @command1="print \'?\'", @command2="ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all";';
    }

    /**
     * Compile the command to disable foreign key constraints.
     */
    public compileDisableForeignKeyConstraints(): string {
        return 'EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all";';
    }

    /**
     * Compile a rename table command.
     */
    public compileRename(blueprint: BlueprintI, command: CommandDefinition<RenameRegistryI>): string {
        return `sp_rename ${this.wrapTable(blueprint)}, ${this.wrapTable(command.getRegistry().to)}`;
    }

    /**
     * Compile an add column command.
     */
    public compileAdd(blueprint: BlueprintI): string {
        return `alter table ${this.wrapTable(blueprint)} add ${this.getColumns(blueprint).join(', ')}`;
    }

    /**
     * Compile a change column command into a series of SQL statements.
     */
    public compileChange(blueprint: BlueprintI): string | string[] {
        const changes = [
            this.compileDropDefaultConstraint(
                blueprint,
                blueprint.getChangedColumns().map(column => column.name)
            )
        ];

        for (const column of blueprint.getChangedColumns()) {
            let sql = `alter table ${this.wrapTable(blueprint)} alter column ${this.wrap(column)} ${this.getType(
                column
            )}`;

            for (const modifier of this.modifiers) {
                sql += this.compileModifier(modifier, blueprint, column);

                changes.push(sql);
            }
        }

        return changes;
    }

    /**
     * Compile a drop default constraint command.
     */
    protected compileDropDefaultConstraint(blueprint: BlueprintI, columns: Stringable[]): string {
        const table = `${this.getTablePrefix()}${this.getValue(blueprint.getTable()).toString()}`;
        let sql = "DECLARE @sql NVARCHAR(MAX) = '';";
        sql += `SELECT @sql += 'ALTER TABLE [dbo].[${table}] DROP CONSTRAINT ' + OBJECT_NAME([default_object_id]) + ';' `;
        sql += 'FROM sys.columns ';
        sql += `WHERE [object_id] = OBJECT_ID('[dbo].[${table}]') AND [name] in ('${columns
            .map(column => this.getValue(column).toString())
            .join("','")}') AND [default_object_id] <> 0;`;
        sql += 'EXEC(@sql)';

        return sql;
    }

    /**
     * Compile a drop column command.
     */
    public compileDropColumn(blueprint: BlueprintI, command: CommandDefinition<ColumnsRegistryI>): string {
        const columns = this.wrapArray(command.getRegistry().columns);

        return `${this.compileDropDefaultConstraint(
            blueprint,
            command.getRegistry().columns
        )}; alter table ${this.wrapTable(blueprint)} drop column ${columns.join(', ')}`;
    }

    /**
     * Compile a rename column command.
     */
    public compileRenameColumn(blueprint: BlueprintI, command: CommandDefinition<RenameFullRegistryI>): string {
        const registry = command.getRegistry();
        const column = `${this.getValue(blueprint.getTable()).toString()}.${this.getValue(registry.from).toString()}`;
        return `sp_rename '${this.wrap(column)}', ${this.wrap(registry.to)}, 'COLUMN'`;
    }

    /**
     * Compile a default command.
     */
    public compileDefault(blueprint: BlueprintI, command: CommandDefinition<ColumnDefinitionRegistryI>): string {
        const column = command.getRegistry().column;
        const change = column.getRegistry().change;
        const defaultVal = column.getRegistry().default;

        if (change && defaultVal !== undefined) {
            return `alter table ${this.wrapTable(blueprint)} add default ${this.getDefaultValue(
                defaultVal
            )} for ${this.wrap(column)}`;
        }

        return '';
    }

    /**
     * Compile a primary key command.
     */
    public compilePrimary(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `alter table ${this.wrapTable(blueprint)} add constraint ${this.wrap(
            command.getRegistry().index
        )} primary key (${this.columnize(command.getRegistry().columns)})`;
    }

    /**
     * Compile a drop primary key command.
     */
    public compileDropPrimary(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `alter table ${this.wrapTable(blueprint)} drop constraint ${this.wrap(command.getRegistry().index)}`;
    }

    /**
     * Compile a unique key command.
     */
    public compileUnique(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `create unique index ${this.wrap(command.getRegistry().index)} on ${this.wrapTable(
            blueprint
        )} (${this.columnize(command.getRegistry().columns)})`;
    }

    /**
     * Compile a drop unique key command.
     */
    public compileDropUnique(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `drop index ${this.wrap(command.getRegistry().index)} on ${this.wrapTable(blueprint)}`;
    }

    /**
     * Compile a index command.
     */
    public compileIndex(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `create index ${this.wrap(command.getRegistry().index)} on ${this.wrapTable(
            blueprint
        )} (${this.columnize(command.getRegistry().columns)})`;
    }

    /**
     * Compile a drop index command.
     */
    public compileDropIndex(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `drop index ${this.wrap(command.getRegistry().index)} on ${this.wrapTable(blueprint)}`;
    }

    /**
     * Compile a spatial index command.
     */
    public compileSpatialIndex(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `create spatial index ${this.wrap(command.getRegistry().index)} on ${this.wrapTable(
            blueprint
        )} (${this.columnize(command.getRegistry().columns)})`;
    }

    /**
     * Compile a drop spatial index command.
     */
    public compileDropSpatialIndex(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return this.compileDropIndex(blueprint, command);
    }

    /**
     * Compile a drop foreign key command.
     */
    public compileDropForeign(blueprint: BlueprintI, command: CommandForeignKeyDefinition): string {
        return `alter table ${this.wrapTable(blueprint)} drop constraint ${this.wrap(command.getRegistry().index)}`;
    }

    /**
     * Compile a drop table (if exists) command.
     */
    public compileDropIfExists(blueprint: BlueprintI): string {
        const table = `${this.getTablePrefix()}${this.getValue(blueprint.getTable()).toString()}`.replace(/'/g, "''");
        return `if exists (select * from sys.sysobjects where id = object_id('${table}', 'U')) drop table ${this.wrapTable(
            blueprint
        )}`;
    }

    /**
     * Compile a rename index command.
     */
    public compileRenameIndex(blueprint: BlueprintI, command: CommandDefinition<RenameFullRegistryI>): string {
        const from = `${this.getValue(blueprint.getTable()).toString()}.${this.getValue(
            command.getRegistry().from
        ).toString()}`;
        return `sp_rename N'${this.wrap(from)}', ${this.wrap(command.getRegistry().to)}, N'INDEX'`;
    }

    /**
     * Compile Column Char
     */
    protected compileTypeChar(column: ColumnDefinition): string {
        return `nchar(${column.getRegistry().length ?? ''})`;
    }

    /**
     * Compile Column String
     */
    protected compileTypeString(column: ColumnDefinition): string {
        return `nvarchar(${column.getRegistry().length ?? ''})`;
    }

    /**
     * Compile Column TinyText
     */
    protected compileTypeTinyText(): string {
        return 'nvarchar(255)';
    }

    /**
     * Compile Column Text
     */
    protected compileTypeText(): string {
        return 'nvarchar(max)';
    }

    /**
     * Compile Column MediumText
     */
    protected compileTypeMediumText(): string {
        return 'nvarchar(max)';
    }

    /**
     * Compile Column LongText
     */
    protected compileTypeLongText(): string {
        return 'nvarchar(max)';
    }

    /**
     * Compile Column MediumInteger
     */
    protected compileTypeMediumInteger(): string {
        return 'int';
    }

    /**
     * Compile Column Double
     */
    protected compileTypeDouble(): string {
        return 'float';
    }

    /**
     * Compile Column Boolean
     */
    protected compileTypeBoolean(): string {
        return 'bit';
    }

    /**
     * Compile Column Enum
     */
    protected compileTypeEnum(column: ColumnDefinition): string {
        return `nvarchar(255) check ("${this.getValue(column.name).toString()}" in (${this.quoteString(
            column.getRegistry().allowed ?? []
        )}))`;
    }

    /**
     * Compile Column Json
     */
    protected compileTypeJson(): string {
        return 'nvarchar(max)';
    }

    /**
     * Compile Column Jsonb
     */
    protected compileTypeJsonb(): string {
        return 'nvarchar(max)';
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
        return this.compileTypeTimestampTz(column);
    }

    /**
     * Compile Column Timestamp
     */
    protected compileTypeTimestamp(column: ColumnDefinition): string {
        if (column.getRegistry().useCurrent) {
            column.default(new Expression('CURRENT_TIMESTAMP'));
        }

        const precision = column.getRegistry().precision;
        return precision !== undefined ? `datetime2(${precision})` : 'datetime';
    }

    /**
     * Compile Column TimestampTz
     */
    protected compileTypeTimestampTz(column: ColumnDefinition): string {
        if (column.getRegistry().useCurrent) {
            column.default(new Expression('CURRENT_TIMESTAMP'));
        }

        const precision = column.getRegistry().precision;
        return precision !== undefined ? `datetimeoffset(${precision})` : 'datetimeoffset';
    }

    /**
     * Compile Column Year
     */
    protected compileTypeYear(column: ColumnDefinition): string {
        return this.compileTypeInteger(column);
    }

    /**
     * Compile Column Binary
     */
    protected compileTypeBinary(): string {
        return 'varbinary(max)';
    }

    /**
     * Compile Column Uuid
     */
    protected compileTypeUuid(): string {
        return 'uniqueidentifier';
    }

    /**
     * Compile Column IpAddress
     */
    protected compileTypeIpAddress(): string {
        return 'nvarchar(45)';
    }

    /**
     * Compile Column MacAddress
     */
    protected compileTypeMacAddress(): string {
        return 'nvarchar(17)';
    }

    /**
     * Compile Column Geometry
     */
    protected compileTypeGeometry(): string {
        return 'geography';
    }

    /**
     * Compile Column Point
     */
    protected compileTypePoint(): string {
        return 'geography';
    }

    /**
     * Compile Column LineString
     */
    protected compileTypeLineString(): string {
        return 'geography';
    }

    /**
     * Compile Column Polygon
     */
    protected compileTypePolygon(): string {
        return 'geography';
    }

    /**
     * Compile Column GeometryCollection
     */
    protected compileTypeGeometryCollection(): string {
        return 'geography';
    }

    /**
     * Compile Column MultiPoint
     */
    protected compileTypeMultiPoint(): string {
        return 'geography';
    }

    /**
     * Compile Column MultiLineString
     */
    protected compileTypeMultiLineString(): string {
        return 'geography';
    }

    /**
     * Compile Column MultiPolygon
     */
    protected compileTypeMultiPolygon(): string {
        return 'geography';
    }

    /**
     * Compile Column Computed
     */
    protected compileTypeComputed(column: ColumnDefinition): string {
        return `as (${this.getValue(column.getRegistry().expression ?? '').toString()})`;
    }

    /**
     * Get the SQL for a collate column modifier.
     */
    protected compileModifyCollate(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const collation = column.getRegistry().collation;
        if (collation) {
            return ` collate ${this.getValue(collation).toString()}`;
        }

        return '';
    }

    /**
     * Get the SQL for a default column modifier.
     */
    protected compileModifyDefault(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const defaultVal = column.getRegistry().default;
        const change = column.getRegistry().change;

        if (!change && defaultVal !== undefined) {
            return ` default ${this.getDefaultValue(defaultVal)}`;
        }

        return '';
    }

    /**
     * Get the SQL for an increment column modifier.
     */
    protected compileModifyIncrement(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const change = column.getRegistry().change;
        const type = column.getRegistry().type;
        const autoIncrement = column.getRegistry().autoIncrement;

        if (!change && autoIncrement && this.serials.includes(type)) {
            return ' identity primary key';
        }

        return '';
    }

    /**
     * Get the SQL for a nullable column modifier.
     */
    protected compileModifyNullable(_blueprint: BlueprintI, column: ColumnDefinition): string {
        if (column.getRegistry().type !== 'computed') {
            return column.getRegistry().nullable ? ' null' : ' not null';
        }

        return '';
    }

    /**
     * Get the SQL for a persisted column modifier.
     */
    protected compileModifyPersisted(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const registry = column.getRegistry();
        if (registry.change) {
            if (registry.type === 'computed') {
                return registry.persisted ? ' add persisted' : ' drop persisted';
            }

            return '';
        }

        if (registry.persisted) {
            return ' persisted';
        }

        return '';
    }

    /**
     * Wrap a table in keyword identifiers.
     */
    public wrapTable(table: Stringable | BlueprintI): string {
        if (!isStringable(table) && table.getRegistry().temporary) {
            this.setTablePrefix('#');
        }

        return super.wrapTable(table);
    }

    /**
     * Quote the given string literal.
     */
    public quoteString(value: string | string[]): string {
        if (Array.isArray(value)) {
            return value.map((val: string) => this.quoteString(val)).join(', ');
        }

        return `N'${value}'`;
    }
}

export default SqlServerGrammar;

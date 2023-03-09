/* eslint-disable @typescript-eslint/no-unused-vars */

import BaseGrammar from '../../grammar';
import ExpressionContract from '../../query/expression-contract';
import { ConnectionSessionI } from '../../types';
import { Stringable } from '../../types/query/builder';
import BlueprintI from '../../types/schema/blueprint';
import GrammarI from '../../types/schema/grammar';
import {
    ColumnDefinitionRegistryI,
    ColumnsRegistryI,
    CommandType,
    CommentRegistryI,
    ModifiersType,
    RenameFullRegistryI,
    RenameRegistryI
} from '../../types/schema/registry';
import { isStringable, trimChar } from '../../utils';
import ColumnDefinition from '../definitions/column-definition';
import CommandDefinition from '../definitions/commands/command-definition';
import CommandForeignKeyDefinition from '../definitions/commands/command-foreign-key-definition';
import CommandIndexDefinition from '../definitions/commands/command-index-definition';

class Grammar extends BaseGrammar implements GrammarI {
    /**
     * The possible column modifiers.
     */
    protected modifiers: ModifiersType[] = [];

    /**
     * If this Grammar supports schema changes wrapped in a transaction.
     */
    protected transactions = false;

    /**
     * The commands to be executed outside of create or alter command.
     */
    protected commands: CommandType[] = [];

    /**
     * Compile a create database command.
     */
    public compileCreateDatabase(_name: string, _connection: ConnectionSessionI): string {
        throw new Error('This database driver does not support creating databases.');
    }

    /**
     * Compile the SQL needed to retrieve all table names.
     */
    public compileGetAllTables(_searchPath?: string[]): string {
        throw new Error('This database driver does not support get all tables.');
    }

    /**
     * Compile the SQL needed to retrieve all table views.
     */
    public compileGetAllViews(_searchPath?: string[]): string {
        throw new Error('This database driver does not support get all views.');
    }

    /**
     * Compile the SQL needed to retrieve all type names.
     */
    public compileGetAllTypes(): string {
        throw new Error('This database driver does not support get all types.');
    }

    /**
     * Compile a drop database if exists command.
     */
    public compileDropDatabaseIfExists(_name: string): string {
        throw new Error('This database driver does not support dropping databases.');
    }

    /**
     * Compile a drop table command.
     */
    public compileDrop(_blueprint: BlueprintI, _command: CommandDefinition, _connection: ConnectionSessionI): string {
        throw new Error('This database driver does not support drop table.');
    }

    /**
     * Compile the SQL needed to drop all tables.
     */
    public compileDropAllTables(_tables?: Stringable[]): string {
        throw new Error('This database driver does not support drop all tables.');
    }

    /**
     * Compile the SQL needed to drop all views.
     */
    public compileDropAllViews(_views?: Stringable[]): string {
        throw new Error('This database driver does not support drop all views.');
    }

    /**
     * Compile the SQL needed to drop all types.
     */
    public compileDropAllTypes(_types?: Stringable[]): string {
        throw new Error('This database driver does not support drop all types.');
    }

    /**
     * Compile the command to drop all foreign keys.
     */
    public compileDropAllForeignKeys(): string {
        throw new Error('This database driver does not support drop all foreign keys.');
    }

    /**
     * Compile the SQL needed to rebuild the database.
     */
    public compileRebuild(): string {
        throw new Error('This database driver does not support rebuild.');
    }

    /**
     * Compile a create table command.
     */
    public compileCreate(_blueprint: BlueprintI, _command: CommandDefinition, _connection: ConnectionSessionI): string {
        throw new Error('This database driver does not support create table.');
    }

    /**
     * Compile the query to determine the list of tables.
     */
    public compileTableExists(): string {
        throw new Error('This database driver does not support table exists.');
    }

    /**
     * Compile the query to determine the data type of column.
     */
    public compileColumnType(_table?: string, _column?: string): string {
        throw new Error('This database driver does not support get column type.');
    }

    /**
     * Compile the query to determine the list of columns.
     */
    public compileColumnListing(_table?: string): string {
        throw new Error('This database driver does not support column listing.');
    }

    /**
     * Compile the command to enable foreign key constraints.
     */
    public compileEnableForeignKeyConstraints(): string {
        throw new Error('This database driver does not support foreign key enabling.');
    }

    /**
     * Compile the command to disable foreign key constraints.
     */
    public compileDisableForeignKeyConstraints(): string {
        throw new Error('This database driver does not support foreign key disabling.');
    }

    /**
     * Compile the SQL needed to enable a writable schema.
     */
    public compileEnableWriteableSchema(): string {
        throw new Error('This database driver does not support enable writable schema.');
    }

    /**
     * Compile the SQL needed to disable a writable schema.
     */
    public compileDisableWriteableSchema(): string {
        throw new Error('This database driver does not support disable writable schema.');
    }

    /**
     * Compile a rename table command.
     */
    public compileRename(
        _blueprint: BlueprintI,
        _command: CommandDefinition<RenameRegistryI>,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support rename table.');
    }

    /**
     * Compile an add column command.
     */
    public compileAdd(
        _blueprint: BlueprintI,
        _command: CommandDefinition,
        _connection: ConnectionSessionI
    ): string | string[] {
        throw new Error('This database driver does not support add column.');
    }

    /**
     * Compile a change column command into a series of SQL statements.
     */
    public compileChange(
        _blueprint: BlueprintI,
        _command: CommandDefinition,
        _connection: ConnectionSessionI
    ): string | string[] {
        throw new Error('This database driver does not support change column.');
    }

    /**
     * Compile a drop column command.
     */
    public compileDropColumn(
        _blueprint: BlueprintI,
        _command: CommandDefinition<ColumnsRegistryI>,
        _connection: ConnectionSessionI
    ): string | string[] {
        throw new Error('This database driver does not support drop column.');
    }

    /**
     * Compile a rename column command.
     */
    public compileRenameColumn(
        _blueprint: BlueprintI,
        _command: CommandDefinition<RenameFullRegistryI>,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support rename column.');
    }

    /**
     * Compile the auto-incrementing column starting values.
     */
    public compileAutoIncrementStartingValues(
        _blueprint: BlueprintI,
        _command: CommandDefinition<ColumnDefinitionRegistryI>,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support rename column.');
    }

    /**
     * Compile a comment command.
     */
    public compileComment(
        _blueprint: BlueprintI,
        _command: CommandDefinition<ColumnDefinitionRegistryI>,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support comment on table.');
    }

    /**
     * Compile a default command.
     */
    public compileDefault(
        _blueprint: BlueprintI,
        _command: CommandDefinition<ColumnDefinitionRegistryI>,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support rename column.');
    }

    /**
     * Compile a primary key command.
     */
    public compilePrimary(
        _blueprint: BlueprintI,
        _command: CommandIndexDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support primary key creation.');
    }

    /**
     * Compile a drop primary key command.
     */
    public compileDropPrimary(
        _blueprint: BlueprintI,
        _command: CommandIndexDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support primary key removal.');
    }

    /**
     * Compile a unique key command.
     */
    public compileUnique(
        _blueprint: BlueprintI,
        _command: CommandIndexDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support unique index creation.');
    }

    /**
     * Compile a drop unique key command.
     */
    public compileDropUnique(
        _blueprint: BlueprintI,
        _command: CommandIndexDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support unique index removal.');
    }

    /**
     * Compile a index command.
     */
    public compileIndex(
        _blueprint: BlueprintI,
        _command: CommandIndexDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support index creation.');
    }

    /**
     * Compile a drop index command.
     */
    public compileDropIndex(
        _blueprint: BlueprintI,
        _command: CommandIndexDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support index removal.');
    }

    /**
     * Compile a fulltext index key command.
     */
    public compileFulltext(
        _blueprint: BlueprintI,
        _command: CommandIndexDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support fulltext index creation.');
    }

    /**
     * Compile a drop fulltext index command.
     */
    public compileDropFulltext(
        _blueprint: BlueprintI,
        _command: CommandIndexDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support fulltext index removal.');
    }

    /**
     * Compile a spatial index command.
     */
    public compileSpatialIndex(
        _blueprint: BlueprintI,
        _command: CommandIndexDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support spatial index creation.');
    }

    /**
     * Compile a drop spatial index command.
     */
    public compileDropSpatialIndex(
        _blueprint: BlueprintI,
        _command: CommandIndexDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support spatial index removal.');
    }

    /**
     * Compile a foreign key command.
     */
    public compileForeign(blueprint: BlueprintI, command: CommandForeignKeyDefinition): string {
        const registry = command.getRegistry();
        // We need to prepare several of the elements of the foreign key definition
        // before we can create the SQL, such as wrapping the tables and convert
        // an array of columns to comma-delimited strings for the SQL queries.
        let sql = `alter table ${this.wrapTable(blueprint)} add constraint ${this.wrap(registry.index)} `;

        // Once we have the initial portion of the SQL statement we will add on the
        // key name, table name, and referenced columns. These will complete the
        // main portion of the SQL statement and this SQL will almost be done.
        sql += `foreign key (${this.columnize(registry.columns)}) references ${this.wrapTable(
            registry.on
        )} (${this.columnize(Array.isArray(registry.references) ? registry.references : [registry.references])})`;

        // Once we have the basic foreign key creation statement constructed we can
        // build out the syntax for what should happen on an update or delete of
        // the affected columns, which will get something like "cascade", etc.
        if (registry.onDelete != null) {
            sql += ` on delete ${this.getValue(registry.onDelete)}`;
        }

        if (registry.onUpdate != null) {
            sql += ` on update ${this.getValue(registry.onUpdate)}`;
        }

        return sql;
    }

    /**
     * Compile a drop foreign key command.
     */
    public compileDropForeign(
        _blueprint: BlueprintI,
        _command: CommandForeignKeyDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support foreign index removal.');
    }

    /**
     * Compile a drop table (if exists) command.
     */
    public compileDropIfExists(
        _blueprint: BlueprintI,
        _command: CommandDefinition,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support drop table if exists.');
    }

    /**
     * Compile a table comment command.
     */
    public compileTableComment(
        _blueprint: BlueprintI,
        _command: CommandDefinition<CommentRegistryI>,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support table comment.');
    }

    /**
     * Compile a rename index command.
     */
    public compileRenameIndex(
        _blueprint: BlueprintI,
        _command: CommandDefinition<RenameFullRegistryI>,
        _connection: ConnectionSessionI
    ): string {
        throw new Error('This database driver does not support index renaming.');
    }

    /**
     * Compile the blueprint's added column definitions.
     */
    protected getColumns(blueprint: BlueprintI): string[] {
        const columns = [];

        for (const column of blueprint.getAddedColumns()) {
            // Each of the column types has their own compiler functions, which are tasked
            // with turning the column definition into its SQL format for this platform
            // used by the connection. The column's modifiers are compiled and added.
            const sql = `${this.wrap(column)} ${this.getType(column)}`;

            columns.push(this.addModifiers(sql, blueprint, column));
        }

        return columns;
    }

    /**
     * Get the SQL for the column data type.
     */
    protected getType(column: ColumnDefinition): string {
        switch (column.getRegistry().type) {
            case 'bigInteger':
                return this.compileTypeBigInteger(column);
            case 'binary':
                return this.compileTypeBinary(column);
            case 'boolean':
                return this.compileTypeBoolean(column);
            case 'char':
                return this.compileTypeChar(column);
            case 'computed':
                return this.compileTypeComputed(column);
            case 'date':
                return this.compileTypeDate(column);
            case 'dateTime':
                return this.compileTypeDateTime(column);
            case 'dateTimeTz':
                return this.compileTypeDateTimeTz(column);
            case 'decimal':
                return this.compileTypeDecimal(column);
            case 'double':
                return this.compileTypeDouble(column);
            case 'enum':
                return this.compileTypeEnum(column);
            case 'float':
                return this.compileTypeFloat(column);
            case 'geometry':
                return this.compileTypeGeometry(column);
            case 'geometryCollection':
                return this.compileTypeGeometryCollection(column);
            case 'integer':
                return this.compileTypeInteger(column);
            case 'ipAddress':
                return this.compileTypeIpAddress(column);
            case 'json':
                return this.compileTypeJson(column);
            case 'jsonb':
                return this.compileTypeJsonb(column);
            case 'lineString':
                return this.compileTypeLineString(column);
            case 'longText':
                return this.compileTypeLongText(column);
            case 'macAddress':
                return this.compileTypeMacAddress(column);
            case 'mediumInteger':
                return this.compileTypeMediumInteger(column);
            case 'mediumText':
                return this.compileTypeMediumText(column);
            case 'multiLineString':
                return this.compileTypeMultiLineString(column);
            case 'multiPoint':
                return this.compileTypeMultiPoint(column);
            case 'multiPolygon':
                return this.compileTypeMultiPolygon(column);
            case 'multiPolygonZ':
                return this.compileTypeMultiPolygonZ(column);
            case 'point':
                return this.compileTypePoint(column);
            case 'polygon':
                return this.compileTypePolygon(column);
            case 'set':
                return this.compileTypeSet(column);
            case 'smallInteger':
                return this.compileTypeSmallInteger(column);
            case 'string':
                return this.compileTypeString(column);
            case 'text':
                return this.compileTypeText(column);
            case 'time':
                return this.compileTypeTime(column);
            case 'timestamp':
                return this.compileTypeTimestamp(column);
            case 'timestampTz':
                return this.compileTypeTimestampTz(column);
            case 'timeTz':
                return this.compileTypeTimeTz(column);
            case 'tinyInteger':
                return this.compileTypeTinyInteger(column);
            case 'tinyText':
                return this.compileTypeTinyText(column);
            case 'uuid':
                return this.compileTypeUuid(column);
            case 'year':
                return this.compileTypeYear(column);
        }
    }

    /**
     * Compile Column Char
     */
    protected compileTypeChar(column: ColumnDefinition): string {
        return column.getRegistry().length ? `char(${column.getRegistry().length})` : 'char';
    }

    /**
     * Compile Column String
     */
    protected compileTypeString(column: ColumnDefinition): string {
        return column.getRegistry().length ? `varchar(${column.getRegistry().length})` : 'varchar';
    }

    /**
     * Compile Column TinyText
     */
    protected compileTypeTinyText(_column: ColumnDefinition): string {
        return 'tinytext';
    }

    /**
     * Compile Column Text
     */
    protected compileTypeText(_column: ColumnDefinition): string {
        return 'text';
    }

    /**
     * Compile Column MediumText
     */
    protected compileTypeMediumText(_column: ColumnDefinition): string {
        return 'mediumtext';
    }

    /**
     * Compile Column LongText
     */
    protected compileTypeLongText(_column: ColumnDefinition): string {
        return 'longtext';
    }

    /**
     * Compile Column BigInteger
     */
    protected compileTypeBigInteger(_column: ColumnDefinition): string {
        return 'bigint';
    }

    /**
     * Compile Column Integer
     */
    protected compileTypeInteger(_column: ColumnDefinition): string {
        return 'int';
    }

    /**
     * Compile Column MediumInteger
     */
    protected compileTypeMediumInteger(_column: ColumnDefinition): string {
        return 'mediumint';
    }

    /**
     * Compile Column TinyInteger
     */
    protected compileTypeTinyInteger(_column: ColumnDefinition): string {
        return 'tinyint';
    }

    /**
     * Compile Column SmallInteger
     */
    protected compileTypeSmallInteger(_column: ColumnDefinition): string {
        return 'smallint';
    }

    /**
     * Compile Column Float
     */
    protected compileTypeFloat(_column: ColumnDefinition): string {
        return 'float';
    }

    /**
     * Compile Column Double
     */
    protected compileTypeDouble(column: ColumnDefinition): string {
        const registry = column.getRegistry();
        if (registry.total && registry.places) {
            return `double(${registry.total}, ${registry.places})`;
        }

        return 'double';
    }

    /**
     * Compile Column Decimal
     */
    protected compileTypeDecimal(column: ColumnDefinition): string {
        const registry = column.getRegistry();
        return `decimal(${registry.total}, ${registry.places})`;
    }

    /**
     * Compile Column Boolean
     */
    protected compileTypeBoolean(_column: ColumnDefinition): string {
        return 'boolean';
    }

    /**
     * Compile Column Enum
     */
    protected compileTypeEnum(column: ColumnDefinition): string {
        return `enum(${this.quoteString(column.getRegistry().allowed!)})`;
    }

    /**
     * Compile Column Json
     */
    protected compileTypeJson(_column: ColumnDefinition): string {
        return 'json';
    }

    /**
     * Compile Column Jsonb
     */
    protected compileTypeJsonb(_column: ColumnDefinition): string {
        return 'jsonb';
    }

    /**
     * Compile Column Date
     */
    protected compileTypeDate(_column: ColumnDefinition): string {
        return 'date';
    }

    /**
     * Compile Column DateTime
     */
    protected compileTypeDateTime(column: ColumnDefinition): string {
        const precision = column.getRegistry().precision;
        return precision !== undefined ? `datetime(${precision})` : 'datetime';
    }

    /**
     * Compile Column DateTimeTz
     */
    protected compileTypeDateTimeTz(column: ColumnDefinition): string {
        const precision = column.getRegistry().precision;
        return precision !== undefined ? `datetime(${precision})` : 'datetime';
    }

    /**
     * Compile Column Time
     */
    protected compileTypeTime(column: ColumnDefinition): string {
        const precision = column.getRegistry().precision;
        return precision !== undefined ? `time(${precision})` : 'time';
    }

    /**
     * Compile Column TimeTz
     */
    protected compileTypeTimeTz(column: ColumnDefinition): string {
        const precision = column.getRegistry().precision;
        return precision !== undefined ? `time(${precision})` : 'time';
    }

    /**
     * Compile Column Timestamp
     */
    protected compileTypeTimestamp(column: ColumnDefinition): string {
        const precision = column.getRegistry().precision;
        return precision !== undefined ? `timestamp(${precision})` : 'timestamp';
    }

    /**
     * Compile Column TimestampTz
     */
    protected compileTypeTimestampTz(column: ColumnDefinition): string {
        const precision = column.getRegistry().precision;
        return precision !== undefined ? `timestamp(${precision})` : 'timestamp';
    }

    /**
     * Compile Column Year
     */
    protected compileTypeYear(_column: ColumnDefinition): string {
        return 'year';
    }

    /**
     * Compile Column Binary
     */
    protected compileTypeBinary(_column: ColumnDefinition): string {
        return 'blob';
    }

    /**
     * Compile Column Uuid
     */
    protected compileTypeUuid(_column: ColumnDefinition): string {
        return 'uuid';
    }

    /**
     * Compile Column IpAddress
     */
    protected compileTypeIpAddress(_column: ColumnDefinition): string {
        return 'inet';
    }

    /**
     * Compile Column MacAddress
     */
    protected compileTypeMacAddress(_column: ColumnDefinition): string {
        return 'macaddr';
    }

    /**
     * Compile Column Geometry
     */
    protected compileTypeGeometry(_column: ColumnDefinition): string {
        return 'geometry';
    }

    /**
     * Compile Column Point
     */
    protected compileTypePoint(_column: ColumnDefinition): string {
        return 'point';
    }

    /**
     * Compile Column LineString
     */
    protected compileTypeLineString(_column: ColumnDefinition): string {
        return 'linestring';
    }

    /**
     * Compile Column Polygon
     */
    protected compileTypePolygon(_column: ColumnDefinition): string {
        return 'polygon';
    }

    /**
     * Compile Column GeometryCollection
     */
    protected compileTypeGeometryCollection(_column: ColumnDefinition): string {
        return 'geometrycollection';
    }

    /**
     * Compile Column MultiPoint
     */
    protected compileTypeMultiPoint(_column: ColumnDefinition): string {
        return 'multipoint';
    }

    /**
     * Compile Column MultiLineString
     */
    protected compileTypeMultiLineString(_column: ColumnDefinition): string {
        return 'multilinestring';
    }

    /**
     * Compile Column MultiPolygon
     */
    protected compileTypeMultiPolygon(_column: ColumnDefinition): string {
        return 'multipolygon';
    }

    /**
     * Compile Column MultiPolygonZ
     */
    protected compileTypeMultiPolygonZ(_column: ColumnDefinition): string {
        throw new Error('This Database driver does not support the multipolygonz type.');
    }

    /**
     * Compile Column Computed
     */
    protected compileTypeComputed(_column: ColumnDefinition): string {
        throw new Error('This Database driver does not support the computed type.');
    }

    /**
     * Compile Column Set
     */
    protected compileTypeSet(_column: ColumnDefinition): string {
        throw new Error('This Database driver does not support the set type.');
    }

    /**
     * Add the column modifiers to the definition.
     */
    protected addModifiers(sql: string, blueprint: BlueprintI, column: ColumnDefinition): string {
        for (const modifier of this.modifiers) {
            sql += this.compileModifier(modifier, blueprint, column);
        }

        return sql;
    }

    protected compileModifier(modifier: ModifiersType, blueprint: BlueprintI, column: ColumnDefinition): string {
        switch (modifier) {
            case 'after':
                return this.compileModifyAfter(blueprint, column);
            case 'charset':
                return this.compileModifyCharset(blueprint, column);
            case 'collate':
                return this.compileModifyCollate(blueprint, column);
            case 'comment':
                return this.compileModifyComment(blueprint, column);
            case 'default':
                return this.compileModifyDefault(blueprint, column);
            case 'first':
                return this.compileModifyFirst(blueprint, column);
            case 'generatedAs':
                return this.compileModifyGeneratedAs(blueprint, column);
            case 'increment':
                return this.compileModifyIncrement(blueprint, column);
            case 'invisible':
                return this.compileModifyInvisible(blueprint, column);
            case 'nullable':
                return this.compileModifyNullable(blueprint, column);
            case 'onUpdate':
                return this.compileModifyOnUpdate(blueprint, column);
            case 'persisted':
                return this.compileModifyPersisted(blueprint, column);
            case 'srid':
                return this.compileModifySrid(blueprint, column);
            case 'storedAs':
                return this.compileModifyStoredAs(blueprint, column);
            case 'unsigned':
                return this.compileModifyUnsigned(blueprint, column);
            case 'virtualAs':
                return this.compileModifyVirtualAs(blueprint, column);
        }
    }

    /**
     * Get the SQL for an after column modifier.
     */
    protected compileModifyAfter(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support after column modifier.');
    }

    /**
     * Get the SQL for a charset column modifier.
     */
    protected compileModifyCharset(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support charset column modifier.');
    }

    /**
     * Get the SQL for a collate column modifier.
     */
    protected compileModifyCollate(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support collate column modifier.');
    }

    /**
     * Get the SQL for a comment column modifier.
     */
    protected compileModifyComment(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support comment column modifier.');
    }

    /**
     * Get the SQL for a default column modifier.
     */
    protected compileModifyDefault(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support default column modifier.');
    }

    /**
     * Get the SQL for a first column modifier.
     */
    protected compileModifyFirst(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support first column modifier.');
    }

    /**
     * Get the SQL for a generated as column modifier.
     */
    protected compileModifyGeneratedAs(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support generated as column modifier.');
    }

    /**
     * Get the SQL for an increment column modifier.
     */
    protected compileModifyIncrement(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support increment column modifier.');
    }

    /**
     * Get the SQL for an invisible column modifier.
     */
    protected compileModifyInvisible(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support invisible column modifier.');
    }

    /**
     * Get the SQL for a nullable column modifier.
     */
    protected compileModifyNullable(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support nullable column modifier.');
    }

    /**
     * Get the SQL for an on update column modifier.
     */
    protected compileModifyOnUpdate(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support on update column modifier.');
    }

    /**
     * Get the SQL for a persisted column modifier.
     */
    protected compileModifyPersisted(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support persisted column modifier.');
    }

    /**
     * Get the SQL for a srid column modifier.
     */
    protected compileModifySrid(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support srid column modifier.');
    }

    /**
     * Get the SQL for a stored as column modifier.
     */
    protected compileModifyStoredAs(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support stored as column modifier.');
    }

    /**
     * Get the SQL for an unsigned column modifier.
     */
    protected compileModifyUnsigned(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support unsigned column modifier.');
    }

    /**
     * Get the SQL for a virtual as column modifier.
     */
    protected compileModifyVirtualAs(_blueprint: BlueprintI, _column: ColumnDefinition): string {
        throw new Error('this database driver does not support virtual as column modifier.');
    }

    /**
     * Get the primary key command if it exists on the blueprint.
     */
    protected getCommandByName<T extends CommandDefinition = CommandDefinition>(
        blueprint: BlueprintI,
        name: string
    ): T | void {
        const commands = this.getCommandsByName<T>(blueprint, name);

        if (commands.length > 0) {
            return commands[0];
        }
    }

    /**
     * Get all of the commands with a given name.
     */
    protected getCommandsByName<T extends CommandDefinition = CommandDefinition>(
        blueprint: BlueprintI,
        name: string
    ): T[] {
        return blueprint.getCommands<T>().filter(command => command.name === name);
    }

    /**
     * Add a prefix to an array of values.
     */
    public prefixArray(prefix: string, values: string[]): string[] {
        return values.map(value => `${prefix} ${value}`);
    }

    /**
     * Wrap a table in keyword identifiers.
     */
    public wrapTable(table: Stringable | BlueprintI): string {
        return super.wrapTable(isStringable(table) ? table : table.getTable());
    }

    /**
     * Wrap a value in keyword identifiers.
     */
    public wrap(value: Stringable | CommandDefinition | ColumnDefinition, prefixAlias = false): string {
        return super.wrap(
            value instanceof CommandDefinition || value instanceof ColumnDefinition ? value.name : value,
            prefixAlias
        );
    }

    /**
     * Quote-escape the given tables, views, or types.
     */
    public escapeNames(names: Stringable[]): string[] {
        return names.map(name => {
            const value = this.getValue(name).toString();
            const exploded = value.split('.');
            return `"${exploded.map(segment => trimChar(segment, '\'"')).join('"."')}"`;
        });
    }

    /**
     * Format a value so that it can be used in "default" clauses.
     */
    protected getDefaultValue(value: Stringable | boolean | number | bigint): string {
        if (value instanceof ExpressionContract) {
            return this.getValue(value).toString();
        }

        return typeof value === 'boolean' ? `'${Number(value)}'` : `'${value.toString()}'`;
    }

    // /**
    //  * Create an empty Doctrine DBAL TableDiff from the BlueprintI.
    //  *
    //  * @param  \Illuminate\Database\Schema\BlueprintI  $blueprint
    //  * @param  \Doctrine\DBAL\Schema\AbstractSchemaManager  $schema
    //  * @return \Doctrine\DBAL\Schema\TableDiff
    //  */
    // public function getDoctrineTableDiff(BlueprintI $blueprint, SchemaManager $schema)
    // {
    //     $table = $this->getTablePrefix().$blueprint->getTable();

    //     return tap(new TableDiff($table), function ($tableDiff) use ($schema, $table) {
    //         $tableDiff->fromTable = $schema->introspectTable($table);
    //     });
    // }

    /**
     * Get the commands for the grammar.
     */
    public getCommands(): CommandType[] {
        return this.commands;
    }

    /**
     * Check if this Grammar supports schema changes wrapped in a transaction.
     */
    public supportsSchemaTransactions(): boolean {
        return this.transactions;
    }
}

export default Grammar;

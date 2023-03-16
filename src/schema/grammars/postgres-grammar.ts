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
import { escapeQuoteForSql } from '../../utils';
import ColumnDefinition from '../definitions/column-definition';
import CommandDefinition from '../definitions/commands/command-definition';
import CommandForeignKeyDefinition from '../definitions/commands/command-foreign-key-definition';
import CommandIndexDefinition from '../definitions/commands/command-index-definition';
import Grammar from './grammar';

class PostgresGrammar extends Grammar {
    /**
     * The possible column modifiers.
     */
    protected modifiers: ModifiersType[] = [
        'collate',
        'nullable',
        'default',
        'virtualAs',
        'storedAs',
        'generatedAs',
        'increment'
    ];

    /**
     * The possible column serials.
     */
    protected serials: ColumnType[] = ['bigInteger', 'integer', 'mediumInteger', 'smallInteger', 'tinyInteger'];

    /**
     * The commands to be executed outside of create or alter command.
     */
    protected commands: CommandType[] = ['autoIncrementStartingValues', 'comment'];

    /**
     * Compile a create database command.
     */
    public compileCreateDatabase(name: string, connection: ConnectionSessionI): string {
        let sql = `create database ${this.wrapValue(name)}`;
        const charset = connection.getConfig<string>('charset');
        if (charset) {
            sql += ` encoding ${this.wrapValue(charset)}`;
        }
        return sql;
    }

    /**
     * Compile the SQL needed to retrieve all table names.
     */
    public compileGetAllTables(searchPath: string[]): string {
        return `select tablename, concat('"', schemaname, '"."', tablename, '"') as qualifiedname from pg_catalog.pg_tables where schemaname in ('${searchPath.join(
            "','"
        )}')`;
    }

    /**
     * Compile the SQL needed to retrieve all table views.
     */
    public compileGetAllViews(searchPath: string[]): string {
        return `select viewname, concat('"', schemaname, '"."', viewname, '"') as qualifiedname from pg_catalog.pg_views where schemaname in ('${searchPath.join(
            "','"
        )}')`;
    }

    /**
     * Compile the SQL needed to retrieve all type names.
     */
    public compileGetAllTypes(): string {
        return 'select distinct pg_type.typname from pg_type inner join pg_enum on pg_enum.enumtypid = pg_type.oid';
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
        return `drop table ${this.escapeNames(tables).join(',')} cascade`;
    }

    /**
     * Compile the SQL needed to drop all views.
     */
    public compileDropAllViews(views: Stringable[]): string {
        return `drop view ${this.escapeNames(views).join(',')} cascade`;
    }

    /**
     * Compile the SQL needed to drop all types.
     */
    public compileDropAllTypes(types: Stringable[]): string {
        return `drop type ${this.escapeNames(types).join(',')} cascade`;
    }

    /**
     * Compile a create table command.
     */
    public compileCreate(blueprint: BlueprintI): string {
        return `${blueprint.getRegistry().temporary ? 'create temporary' : 'create'} table ${this.wrapTable(
            blueprint
        )} (${this.getColumns(blueprint).join(', ')})`;
    }

    /**
     * Compile the query to determine the list of tables.
     */
    public compileTableExists(): string {
        return "select * from information_schema.tables where table_catalog = ? and table_schema = ? and table_name = ? and table_type = 'BASE TABLE'";
    }

    /**
     * Compile the query to determine the data type of column.
     */
    public compileColumnType(): string {
        return 'select column_name, data_type from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ? and column_name = ?';
    }

    /**
     * Compile the query to determine the list of columns.
     */
    public compileColumnListing(): string {
        return 'select column_name from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ?';
    }

    /**
     * Compile the command to enable foreign key constraints.
     */
    public compileEnableForeignKeyConstraints(): string {
        return 'SET CONSTRAINTS ALL IMMEDIATE;';
    }

    /**
     * Compile the command to disable foreign key constraints.
     */
    public compileDisableForeignKeyConstraints(): string {
        return 'SET CONSTRAINTS ALL DEFERRED;';
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
    public compileAdd(blueprint: BlueprintI): string {
        const columns = this.prefixArray('add column', this.getColumns(blueprint));

        return `alter table ${this.wrapTable(blueprint)} ${columns.join(', ')}`;
    }

    /**
     * Compile a change column command into a series of SQL statements.
     */
    public compileChange(blueprint: BlueprintI): string {
        const columns = [];

        for (const column of blueprint.getChangedColumns()) {
            const changes = [`type ${this.getType(column)}${this.compileModifyCollate(blueprint, column)}`];
            for (const modifier of this.modifiers) {
                if (modifier === 'collate') {
                    continue;
                }
                const sql = this.compileModifier(modifier, blueprint, column);

                if (modifier === 'generatedAs') {
                    changes.push('drop identity if exists');
                    if (sql) {
                        changes.push(`add ${sql}`);
                    }
                    continue;
                }

                if (sql) {
                    changes.push(sql);
                }
            }

            columns.push(this.prefixArray(`alter column ${this.wrap(column)}`, changes).join(', '));
        }

        return `alter table ${this.wrapTable(blueprint)} ${columns.join(', ')}`;
    }

    /**
     * Compile a drop column command.
     */
    public compileDropColumn(blueprint: BlueprintI, command: CommandDefinition<ColumnsRegistryI>): string {
        const columns = this.prefixArray('drop column', this.wrapArray(command.getRegistry().columns));

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
        const table = this.getValue(blueprint.getTable()).toString();

        if (column.autoIncrement && value !== undefined) {
            return `alter sequence ${table}_${columnDefinition.name}_seq restart with ${value.toString()}`;
        }

        return '';
    }

    /**
     * Compile a comment command.
     */
    public compileComment(blueprint: BlueprintI, command: CommandDefinition<ColumnDefinitionRegistryI>): string {
        const column = command.getRegistry().column;
        const comment = column.getRegistry().comment;
        const change = column.getRegistry().change;

        if (comment || change) {
            return `comment on column ${this.wrapTable(blueprint)}.${this.wrap(column.name)} is ${
                comment ? "'" + escapeQuoteForSql(comment) + "'" : 'NULL'
            }`;
        }

        return '';
    }

    /**
     * Compile a primary key command.
     */
    public compilePrimary(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `alter table ${this.wrapTable(blueprint)} add primary key (${this.columnize(
            command.getRegistry().columns
        )})`;
    }

    /**
     * Compile a drop primary key command.
     */
    public compileDropPrimary(blueprint: BlueprintI): string {
        const index = this.wrap(`${this.getValue(blueprint.getTable()).toString()}_pkey`);
        return `alter table ${this.wrapTable(blueprint)} drop constraint ${index}`;
    }

    /**
     * Compile a unique key command.
     */
    public compileUnique(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        const registry = command.getRegistry();
        let sql = `alter table ${this.wrapTable(blueprint)} add constraint ${this.wrap(
            registry.index
        )} unique (${this.columnize(registry.columns)})`;

        if (registry.deferrable !== undefined) {
            sql += registry.deferrable ? ' deferrable' : ' not deferrable';
        }

        if (registry.deferrable && registry.initiallyImmediate !== undefined) {
            sql += registry.initiallyImmediate ? ' initially immediate' : ' initially deferred';
        }

        return sql;
    }

    /**
     * Compile a drop unique key command.
     */
    public compileDropUnique(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `alter table ${this.wrapTable(blueprint)} drop constraint ${this.wrap(command.getRegistry().index)}`;
    }

    /**
     * Compile a index command.
     */
    public compileIndex(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        const registry = command.getRegistry();
        return `create index ${this.wrap(registry.index)} on ${this.wrapTable(blueprint)}${
            registry.algorithm ? ' using ' + registry.algorithm : ''
        } (${this.columnize(registry.columns)})`;
    }

    /**
     * Compile a drop index command.
     */
    public compileDropIndex(_blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return `drop index ${this.wrap(command.getRegistry().index)}`;
    }

    /**
     * Compile a fulltext index key command.
     */
    public compileFulltext(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        const registry = command.getRegistry();
        const language = registry.language || 'english';
        const columns = registry.columns.map(column => {
            return `to_tsvector(${this.quoteString(this.getValue(language).toString())}, ${this.wrap(column)})`;
        });

        return `create index ${this.wrap(registry.index)} on ${this.wrapTable(blueprint)} using gin ((${columns.join(
            ' || '
        )}))`;
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
        command.algorithm('gist');
        return this.compileIndex(blueprint, command);
    }

    /**
     * Compile a drop spatial index command.
     */
    public compileDropSpatialIndex(blueprint: BlueprintI, command: CommandIndexDefinition): string {
        return this.compileDropIndex(blueprint, command);
    }

    /**
     * Compile a foreign key command.
     */
    public compileForeign(blueprint: BlueprintI, command: CommandForeignKeyDefinition): string {
        const registry = command.getRegistry();
        let sql = super.compileForeign(blueprint, command);

        if (registry.deferrable !== undefined) {
            sql += registry.deferrable ? ' deferrable' : ' not deferrable';
        }

        if (registry.deferrable && registry.initiallyImmediate !== undefined) {
            sql += registry.initiallyImmediate ? ' initially immediate' : ' initially deferred';
        }

        if (registry.notValid) {
            sql += ' not valid';
        }

        return sql;
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
        return `drop table if exists ${this.wrapTable(blueprint)}`;
    }

    /**
     * Compile a table comment command.
     */
    public compileTableComment(blueprint: BlueprintI, command: CommandDefinition<CommentRegistryI>): string {
        return `comment on table ${this.wrapTable(blueprint)} is '${escapeQuoteForSql(command.getRegistry().comment)}'`;
    }

    /**
     * Compile a rename index command.
     */
    public compileRenameIndex(_blueprint: BlueprintI, command: CommandDefinition<RenameFullRegistryI>): string {
        const registry = command.getRegistry();
        return `alter index ${this.wrap(registry.from)} rename to ${this.wrap(registry.to)}`;
    }

    /**
     * Compile Column TinyText
     */
    protected compileTypeTinyText(): string {
        return 'varchar(255)';
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
    protected compileTypeBigInteger(column: ColumnDefinition): string {
        return column.getRegistry().autoIncrement && !column.getRegistry().generatedAs ? 'bigserial' : 'bigint';
    }

    /**
     * Compile Column Integer
     */
    protected compileTypeInteger(column: ColumnDefinition): string {
        return column.getRegistry().autoIncrement && !column.getRegistry().generatedAs ? 'serial' : 'integer';
    }

    /**
     * Compile Column MediumInteger
     */
    protected compileTypeMediumInteger(column: ColumnDefinition): string {
        return this.compileTypeInteger(column);
    }

    /**
     * Compile Column TinyInteger
     */
    protected compileTypeTinyInteger(column: ColumnDefinition): string {
        return this.compileTypeSmallInteger(column);
    }

    /**
     * Compile Column SmallInteger
     */
    protected compileTypeSmallInteger(column: ColumnDefinition): string {
        return column.getRegistry().autoIncrement && !column.getRegistry().generatedAs ? 'smallserial' : 'smallint';
    }

    /**
     * Compile Column Float
     */
    protected compileTypeFloat(): string {
        return this.compileTypeDouble();
    }

    /**
     * Compile Column Double
     */
    protected compileTypeDouble(): string {
        return 'double precision';
    }

    /**
     * Compile Column Enum
     */
    protected compileTypeEnum(column: ColumnDefinition): string {
        return `varchar(255) check ("${this.getValue(column.name).toString()}" in (${this.quoteString(
            column.getRegistry().allowed!
        )}))`;
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
     * Compile Column Time
     */
    protected compileTypeTime(column: ColumnDefinition): string {
        return `${super.compileTypeTime(column)} without time zone`;
    }

    /**
     * Compile Column TimeTz
     */
    protected compileTypeTimeTz(column: ColumnDefinition): string {
        return `${super.compileTypeTimeTz(column)} with time zone`;
    }

    /**
     * Compile Column Timestamp
     */
    protected compileTypeTimestamp(column: ColumnDefinition): string {
        const registry = column.getRegistry();

        if (registry.useCurrent) {
            column.default(new Expression('CURRENT_TIMESTAMP'));
        }

        return `${super.compileTypeTimestamp(column)} without time zone`;
    }

    /**
     * Compile Column TimestampTz
     */
    protected compileTypeTimestampTz(column: ColumnDefinition): string {
        const registry = column.getRegistry();

        if (registry.useCurrent) {
            column.default(new Expression('CURRENT_TIMESTAMP'));
        }

        return `${super.compileTypeTimestampTz(column)} with time zone`;
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
        return 'bytea';
    }

    /**
     * Compile Column Geometry
     */
    protected compileTypeGeometry(column: ColumnDefinition): string {
        return this.formatPostGisType('geometry', column);
    }

    /**
     * Compile Column Point
     */
    protected compileTypePoint(column: ColumnDefinition): string {
        return this.formatPostGisType('point', column);
    }

    /**
     * Compile Column LineString
     */
    protected compileTypeLineString(column: ColumnDefinition): string {
        return this.formatPostGisType('linestring', column);
    }

    /**
     * Compile Column Polygon
     */
    protected compileTypePolygon(column: ColumnDefinition): string {
        return this.formatPostGisType('polygon', column);
    }

    /**
     * Compile Column GeometryCollection
     */
    protected compileTypeGeometryCollection(column: ColumnDefinition): string {
        return this.formatPostGisType('geometrycollection', column);
    }

    /**
     * Compile Column MultiPoint
     */
    protected compileTypeMultiPoint(column: ColumnDefinition): string {
        return this.formatPostGisType('multipoint', column);
    }

    /**
     * Compile Column MultiLineString
     */
    protected compileTypeMultiLineString(column: ColumnDefinition): string {
        return this.formatPostGisType('multilinestring', column);
    }

    /**
     * Compile Column MultiPolygon
     */
    protected compileTypeMultiPolygon(column: ColumnDefinition): string {
        return this.formatPostGisType('multipolygon', column);
    }

    /**
     * Compile Column MultiPolygonZ
     */
    protected compileTypeMultiPolygonZ(column: ColumnDefinition): string {
        return this.formatPostGisType('multipolygonz', column);
    }

    /**
     * Format the column definition for a PostGIS spatial type.
     */
    protected formatPostGisType(type: string, column: ColumnDefinition): string {
        const registry = column.getRegistry();
        if (!registry.isGeometry) {
            return `geography(${type}, ${registry.projection ?? 4326})`;
        }

        if (registry.projection !== undefined) {
            return `geometry(${type}, ${registry.projection})`;
        }

        return `geometry(${type})`;
    }

    /**
     * Get the SQL for a collate column modifier.
     */
    protected compileModifyCollate(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const collation = column.getRegistry().collation;
        if (collation) {
            return ` collate ${this.wrapValue(this.getValue(collation).toString())}`;
        }

        return '';
    }

    /**
     * Get the SQL for a default column modifier.
     */
    protected compileModifyDefault(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const defaultVal = column.getRegistry().default;
        const change = column.getRegistry().change;
        if (change) {
            return defaultVal === undefined ? 'drop default' : `set default ${this.getDefaultValue(defaultVal)}`;
        }

        if (defaultVal !== undefined) {
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
        const generatedAs = column.getRegistry().generatedAs;
        const autoIncrement = column.getRegistry().autoIncrement;

        if (!change && autoIncrement && (this.serials.includes(type) || generatedAs)) {
            return ' primary key';
        }

        return '';
    }

    /**
     * Get the SQL for a nullable column modifier.
     */
    protected compileModifyNullable(_blueprint: BlueprintI, column: ColumnDefinition): string {
        if (column.getRegistry().change) {
            return column.getRegistry().nullable ? 'drop not null' : 'set not null';
        }

        return column.getRegistry().nullable ? ' null' : ' not null';
    }

    /**
     * Get the SQL for a stored as column modifier.
     */
    protected compileModifyStoredAs(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const storedAs = column.getRegistry().storedAs;
        const change = column.getRegistry().change;
        if (change) {
            if (storedAs) {
                throw new Error('This database driver does not support modifying generated columns.');
            }
            return storedAs === null ? 'drop expression if exists' : '';
        }

        if (storedAs) {
            return ` generated always as (${storedAs}) stored`;
        }

        return '';
    }

    /**
     * Get the SQL for a virtual as column modifier.
     */
    protected compileModifyVirtualAs(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const virtualAs = column.getRegistry().virtualAs;
        const change = column.getRegistry().change;
        if (change) {
            if (virtualAs) {
                throw new Error('This database driver does not support modifying generated columns.');
            }
            return virtualAs === null ? 'drop expression if exists' : '';
        }

        if (virtualAs) {
            return ` generated always as (${virtualAs})`;
        }

        return '';
    }

    /**
     * Get the SQL for a generated as column modifier.
     */
    protected compileModifyGeneratedAs(_blueprint: BlueprintI, column: ColumnDefinition): string {
        const generatedAs = column.getRegistry().generatedAs;
        if (generatedAs !== undefined) {
            return ` generated ${column.getRegistry().always ? 'always' : 'by default'} as identity${
                typeof generatedAs !== 'boolean' && generatedAs !== ''
                    ? ' (' + this.getValue(generatedAs).toString() + ')'
                    : ''
            }`;
        }

        return '';
    }
}

export default PostgresGrammar;

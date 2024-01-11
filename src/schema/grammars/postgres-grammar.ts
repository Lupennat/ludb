import PostgresConnection from '../../connections/postgres-connection';
import Expression from '../../query/expression';
import { ConnectionSessionI } from '../../types/connection';
import { Stringable } from '../../types/generics';
import BlueprintI from '../../types/schema/blueprint';
import {
    PostgresArrayType,
    PostgresDomainType,
    PostgresFunctionType,
    PostgresRangeType
} from '../../types/schema/generics';
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
import { escapeQuoteForSql } from '../../utils';
import ColumnDefinition from '../definitions/column-definition';
import CommandDefinition from '../definitions/commands/command-definition';
import CommandForeignKeyDefinition from '../definitions/commands/command-foreign-key-definition';
import CommandIndexDefinition from '../definitions/commands/command-index-definition';
import CommandViewDefinition from '../definitions/commands/command-view-definition';
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
    public compileCreateDatabase(name: string, connection: ConnectionSessionI<PostgresConnection>): string {
        let sql = `create database ${this.wrapValue(name)}`;
        const charset = connection.getConfig<string>('charset');
        if (charset) {
            sql += ` encoding ${this.wrapValue(charset)}`;
        }
        return sql;
    }

    /**
     * Compile a create user-defined type.
     */
    public compileCreateType(name: Stringable): string;
    public compileCreateType(name: Stringable, type: 'range', definition: PostgresRangeType): string;
    public compileCreateType(name: Stringable, type: 'array', definition: PostgresArrayType[]): string;
    public compileCreateType(name: Stringable, type: 'fn', definition: PostgresFunctionType): string;
    public compileCreateType(name: Stringable, type: 'domain', definition: PostgresDomainType): string;
    public compileCreateType(
        name: Stringable,
        type?: 'enum' | 'range' | 'array' | 'fn' | 'domain',
        definition?: string[] | PostgresRangeType | PostgresArrayType[] | PostgresFunctionType | PostgresDomainType
    ): string;
    public compileCreateType(
        name: Stringable,
        type?: 'enum' | 'range' | 'array' | 'fn' | 'domain',
        definition?: string[] | PostgresRangeType | PostgresArrayType[] | PostgresFunctionType | PostgresDomainType
    ): string {
        if (!type) {
            return `create type ${this.getValue(name).toString()}`;
        }
        switch (type) {
            case 'fn':
                return this.createTypeFunction(name, definition as PostgresFunctionType);
            case 'domain':
                return this.createTypeDomain(name, definition as PostgresDomainType);
            case 'range':
                return this.createTypeRange(name, definition as PostgresRangeType);
            case 'array':
                return this.createTypeArray(name, definition as PostgresArrayType[]);
            default:
                return `create type ${this.getValue(name).toString()} as enum (${this.quoteString(
                    definition as string[]
                )})`;
        }
    }

    protected createTypeDomain(name: Stringable, definition: PostgresDomainType): string {
        let sql = `create domain ${this.getValue(name).toString()} as ${definition.type}`;

        if (definition.collate) {
            sql += ` collate ${this.wrap(definition.collate)}`;
        }
        if (definition.default) {
            sql += ` default ${definition.default}`;
        }

        if (definition.constraint) {
            sql += ` constraint ${definition.constraint}`;
        }

        if (definition.nullable !== undefined) {
            sql += definition.nullable ? ' NULL' : ' NOT NULL';
        }

        if (definition.check) {
            sql += ` check(${definition.check})`;
        }

        return sql;
    }

    protected createTypeRange(name: Stringable, definition: PostgresRangeType): string {
        const rangeOptions = [];
        for (const [key, value] of Object.entries(definition)) {
            if (value) {
                if (key === 'collation') {
                    rangeOptions.push(`${key} = ${this.wrap(value)}`);
                } else {
                    rangeOptions.push(`${key} = ${value}`);
                }
            }
        }

        return `create type ${this.getValue(name).toString()} as range (${rangeOptions.join(', ')})`;
    }

    protected createTypeArray(name: Stringable, definition: PostgresArrayType[]): string {
        const arrayOptions = [];
        for (const element of definition) {
            arrayOptions.push(
                `${element.name} ${element.type}${element.collation ? ' collate ' + this.wrap(element.collation) : ''}`
            );
        }

        return `create type ${this.getValue(name).toString()} as (${arrayOptions.join(', ')})`;
    }

    protected createTypeFunction(name: Stringable, definition: PostgresFunctionType): string {
        const fnOptions = [];
        for (const [key, value] of Object.entries(definition)) {
            if (typeof value === 'boolean') {
                if (key === 'passedbyvalue') {
                    if (value) {
                        fnOptions.push(key.toUpperCase());
                    } else {
                        continue;
                    }
                } else {
                    fnOptions.push(`${key.toUpperCase()} = ${value ? 'true' : 'false'}`);
                }
            } else if (value) {
                switch (key) {
                    case 'default':
                        if (value) {
                            fnOptions.push(`${key.toUpperCase()} = ${value}`);
                        }
                        break;
                    case 'delimiter':
                        if (value) {
                            fnOptions.push(`${key.toUpperCase()} = ${this.quoteString(value)}`);
                        }
                        break;
                    default:
                        fnOptions.push(`${key.toUpperCase()} = ${value}`);
                }
            }
        }

        return `create type ${this.getValue(name).toString()} (${fnOptions.join(', ')})`;
    }

    /**
     * Compile a create view command;
     */
    public compileCreateView(name: Stringable, command?: CommandViewDefinition<ViewRegistryI>): string {
        if (!command) {
            return this.getValue(name).toString();
        }

        const registry = command.getRegistry();
        let sql = `create${registry.temporary ? ' temporary' : ''}${
            registry.recursive ? ' recursive' : ''
        } view ${this.wrapTable(name)}`;

        const columns = registry.columnNames ? registry.columnNames : [];

        if (columns.length) {
            sql += ` (${this.columnize(columns)})`;
        }

        const viewAttribute = registry.viewAttribute ? this.getValue(registry.viewAttribute).toString() : '';

        if (viewAttribute) {
            sql += ` with(${viewAttribute}=true)`;
        }

        sql += ` as ${registry.as.toRawSql()}`;

        if (registry.check) {
            const checkType = registry.checkType ? registry.checkType : '';
            sql += ` with${checkType ? ` ${checkType}` : ''} check option`;
        }

        return sql;
    }

    /**
     * Compile the query to determine the tables.
     */
    public compileTables(): string {
        return (
            'select c.relname as name, n.nspname as schema, pg_total_relation_size(c.oid) as size, ' +
            "obj_description(c.oid, 'pg_class') as comment from pg_class c, pg_namespace n " +
            "where c.relkind in ('r', 'p') and n.oid = c.relnamespace and n.nspname not in ('pg_catalog', 'information_schema')" +
            'order by c.relname'
        );
    }

    /**
     * Compile the query to determine the views.
     */
    public compileViews(): string {
        return "select viewname as name, schemaname as schema, definition from pg_views where schemaname not in ('pg_catalog', 'information_schema') order by viewname";
    }

    /**
     * Compile the query to determine the user-defined types.
     */
    public compileTypes(): string {
        return (
            'select t.typname as name, n.nspname as schema, t.typtype as type, t.typcategory as category, ' +
            "((t.typinput = 'array_in'::regproc and t.typoutput = 'array_out'::regproc) or t.typtype = 'm') as implicit " +
            'from pg_type t join pg_namespace n on n.oid = t.typnamespace ' +
            'left join pg_class c on c.oid = t.typrelid ' +
            'left join pg_type el on el.oid = t.typelem ' +
            'left join pg_class ce on ce.oid = el.typrelid ' +
            "where ((t.typrelid = 0 and (ce.relkind = 'c' or ce.relkind is null)) or c.relkind = 'c') " +
            "and not exists (select 1 from pg_depend d where d.objid in (t.oid, t.typelem) and d.deptype = 'e') " +
            "and n.nspname not in ('pg_catalog', 'information_schema')"
        );
    }

    /**
     * Compile the query to determine the columns.
     */
    public compileColumns(table: string, schema: string): string {
        return (
            'select a.attname as name, t.typname as type_name, format_type(a.atttypid, a.atttypmod) as type, ' +
            '(select tc.collcollate from pg_catalog.pg_collation tc where tc.oid = a.attcollation) as collation, ' +
            'not a.attnotnull as nullable, ' +
            '(select pg_get_expr(adbin, adrelid) from pg_attrdef where c.oid = pg_attrdef.adrelid and pg_attrdef.adnum = a.attnum) as default, ' +
            'col_description(c.oid, a.attnum) as comment ' +
            'from pg_attribute a, pg_class c, pg_type t, pg_namespace n ' +
            'where c.relname = ' +
            this.quoteString(table) +
            ' and n.nspname = ' +
            this.quoteString(schema) +
            ' and a.attnum > 0 and a.attrelid = c.oid and a.atttypid = t.oid and n.oid = c.relnamespace ' +
            'order by a.attnum'
        );
    }

    /**
     * Compile the query to determine the indexes.
     */
    public compileIndexes(table: string, schema: string): string {
        return (
            "select ic.relname as name, string_agg(a.attname, ',' order by indseq.ord) as columns, " +
            'am.amname as "type", i.indisunique as "unique", i.indisprimary as "primary" ' +
            'from pg_index i ' +
            'join pg_class tc on tc.oid = i.indrelid ' +
            'join pg_namespace tn on tn.oid = tc.relnamespace ' +
            'join pg_class ic on ic.oid = i.indexrelid ' +
            'join pg_am am on am.oid = ic.relam ' +
            'join lateral unnest(i.indkey) with ordinality as indseq(num, ord) on true ' +
            'left join pg_attribute a on a.attrelid = i.indrelid and a.attnum = indseq.num ' +
            'where tc.relname = ' +
            this.quoteString(table) +
            ' and tn.nspname = ' +
            this.quoteString(schema) +
            ' group by ic.relname, am.amname, i.indisunique, i.indisprimary'
        );
    }

    /**
     * Compile the query to determine the foreign keys.
     */
    public compileForeignKeys(table: string, schema: string): string {
        return (
            'select c.conname as name, ' +
            "string_agg(la.attname, ',' order by conseq.ord) as columns, " +
            'fn.nspname as foreign_schema, fc.relname as foreign_table, ' +
            "string_agg(fa.attname, ',' order by conseq.ord) as foreign_columns, " +
            'c.confupdtype as on_update, c.confdeltype as on_delete ' +
            'from pg_constraint c ' +
            'join pg_class tc on c.conrelid = tc.oid ' +
            'join pg_namespace tn on tn.oid = tc.relnamespace ' +
            'join pg_class fc on c.confrelid = fc.oid ' +
            'join pg_namespace fn on fn.oid = fc.relnamespace ' +
            'join lateral unnest(c.conkey) with ordinality as conseq(num, ord) on true ' +
            'join pg_attribute la on la.attrelid = c.conrelid and la.attnum = conseq.num ' +
            'join pg_attribute fa on fa.attrelid = c.confrelid and fa.attnum = c.confkey[conseq.ord] ' +
            "where c.contype = 'f' and tc.relname = " +
            this.quoteString(table) +
            ' and tn.nspname = ' +
            this.quoteString(schema) +
            ' group by c.conname, fn.nspname, fc.relname, c.confupdtype, c.confdeltype'
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
        return `drop table ${this.escapeNames(tables).join(',')} cascade`;
    }

    /**
     * Compile the SQL needed to drop all views.
     */
    public compileDropViews(views: Stringable[]): string {
        return `drop view ${this.escapeNames(views).join(',')} cascade`;
    }

    /**
     * Compile the SQL needed to drop all types.
     */
    public compileDropTypes(types: Stringable[]): string {
        return `drop type ${this.escapeNames(types).join(',')} cascade`;
    }

    /**
     * Compile a drop type command.
     */
    public compileDropType(name: Stringable): string {
        return `drop type ${this.wrapTable(name)} cascade`;
    }

    /**
     * Compile a drop type (if exists) command.
     */
    public compileDropTypeIfExists(name: Stringable): string {
        return `drop type if exists ${this.wrapTable(name)} cascade`;
    }

    /**
     * Compile a drop domain command.
     */
    public compileDropDomain(name: Stringable): string {
        return `drop domain ${this.wrapTable(name)} cascade`;
    }

    /**
     * Compile a drop domain (if exists) command.
     */
    public compileDropDomainIfExists(name: Stringable): string {
        return `drop domain if exists ${this.wrapTable(name)} cascade`;
    }

    /**
     * Compile the SQL needed to drop all domains.
     */
    public compileDropDomains(domains: Stringable[]): string {
        return `drop domain ${this.escapeNames(domains).join(',')} cascade`;
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
        const index = this.wrap(
            `${this.getValue(blueprint.getPrefix()).toString()}${this.getValue(blueprint.getTable()).toString()}_pkey`
        );
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
        const algorithm = registry.algorithm ? this.getValue(registry.algorithm).toString() : '';

        return `create index ${this.wrap(registry.index)} on ${this.wrapTable(blueprint)}${
            algorithm ? ' using ' + algorithm : ''
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
    public compileForeign(
        blueprint: BlueprintI,
        command: CommandForeignKeyDefinition,
        connection: ConnectionSessionI<PostgresConnection>
    ): string {
        const registry = command.getRegistry();
        let sql = super.compileForeign(blueprint, command, connection);

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
    public compileDropTableIfExists(blueprint: BlueprintI): string {
        return `drop table if exists ${this.wrapTable(blueprint)}`;
    }

    /**
     * Compile a drop view command.
     */
    public compileDropView(name: Stringable): string {
        return `drop view ${this.wrapTable(name)}`;
    }

    /**
     * Compile a drop view (if exists) command.
     */
    public compileDropViewIfExists(name: Stringable): string {
        return `drop view if exists ${this.wrapTable(name)}`;
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
            return ` generated always as (${this.getValue(storedAs).toString()}) stored`;
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
            return ` generated always as (${this.getValue(virtualAs).toString()})`;
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

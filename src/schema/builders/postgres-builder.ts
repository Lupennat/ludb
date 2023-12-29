import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import {
    PostgresColumnDictionary,
    PostgresForeignKeyDictionary,
    PostgresIndexDictionary,
    PostgresTableDictionary,
    PostgresTypeDictionary,
    PostgresViewDictionary
} from '../../types/schema/generics';
import { parseSearchPath } from '../../utils';
import Builder from './builder';

type PostgresTypeDefinition = {
    name: string;
    schema: string;
    implicit: number;
    type: string;
    category: string;
};

type PostgresColumnDefinition = {
    name: string;
    type_name: string;
    type: string;
    collation: string | null;
    nullable: number;
    default: PdoColumnValue;
    comment: string | null;
};

type PostgresIndexDefinition = {
    name: string;
    columns: string;
    type: string;
    unique: number;
    primary: number;
};

type PostgresForeignKeyDefinition = {
    name: string;
    columns: string;
    foreign_schema: string;
    foreign_table: string;
    foreign_columns: string;
    on_update: string;
    on_delete: string;
};

class PostgresBuilder extends Builder {
    /**
     * Create a database in the schema.
     */
    public async createDatabase(name: string): Promise<boolean> {
        return await this.connection.statement(this.grammar.compileCreateDatabase(name, this.connection));
    }

    /**
     * Get the tables that belong to the database.
     */
    public async getTables(): Promise<PostgresTableDictionary[]> {
        return await this.getTablesFromDatabase<PostgresTableDictionary>(this.connection.getDatabaseName());
    }

    /**
     * Get the views that belong to the database.
     */
    public async getViews(): Promise<PostgresViewDictionary[]> {
        return await this.getViewsFromDatabase<PostgresViewDictionary>(this.connection.getDatabaseName());
    }

    /**
     * Get the user-defined types that belong to the database.
     */
    public async getTypes(): Promise<PostgresTypeDictionary[]> {
        const types = await this.getTypesFromDatabase<PostgresTypeDefinition>(this.connection.getDatabaseName());

        return types.map<PostgresTypeDictionary>((typeObj: PostgresTypeDefinition) => {
            const { implicit, type, category, ...keys } = typeObj;
            const calculatedType =
                {
                    b: 'base',
                    c: 'composite',
                    d: 'domain',
                    e: 'enum',
                    p: 'pseudo',
                    r: 'range',
                    m: 'multirange'
                }[type] ?? null;

            const calculatedCategory =
                {
                    a: 'array',
                    b: 'boolean',
                    c: 'composite',
                    d: 'date_time',
                    e: 'enum',
                    g: 'geometric',
                    i: 'network_address',
                    n: 'numeric',
                    p: 'pseudo',
                    r: 'range',
                    s: 'string',
                    t: 'timespan',
                    u: 'user_defined',
                    v: 'bit_string',
                    x: 'unknown',
                    z: 'internal_use'
                }[category] ?? null;

            return { ...keys, implicit: Boolean(implicit), type: calculatedType, category: calculatedCategory };
        });
    }

    /**
     * Determine if the given table exists.
     */
    public async hasTable(table: string): Promise<boolean> {
        const [schema, realTable] = this.parseSchemaAndTable(table);

        table = `${this.connection.getTablePrefix()}${realTable}`;
        const tables = await this.getTables();

        for (const value of tables) {
            if (
                table.toLowerCase() === value.name.toLowerCase() &&
                schema.toLowerCase() === value.schema.toLowerCase()
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Determine if the given view exists.
     */
    public async hasView(view: string): Promise<boolean> {
        const [schema, realView] = this.parseSchemaAndTable(view);
        view = `${this.connection.getTablePrefix()}${realView}`;
        const views = await this.getViews();

        for (const value of views) {
            if (
                view.toLowerCase() === value.name.toLowerCase() &&
                schema.toLowerCase() === value.schema.toLowerCase()
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Drop a database from the schema if the database exists.
     */
    public async dropDatabaseIfExists(name: string): Promise<boolean> {
        return await this.connection.statement(this.grammar.compileDropDatabaseIfExists(name));
    }

    /**
     * Drop a view from the schema if it exists.
     */
    public async dropViewIfExists(name: string): Promise<boolean> {
        return await this.connection.statement(this.grammar.compileDropViewIfExists(name));
    }

    /**
     * Drop all tables from the database.
     */
    public async dropTables(): Promise<void> {
        const tables: string[] = [];
        const dbTables = await this.getTables();
        const excludedTables = this.grammar.escapeNames(this.connection.getConfig('dont_drop', ['spatial_ref_sys']));
        const schemas = this.grammar.escapeNames(this.getSchemas());
        for (const dbTable of dbTables) {
            const qualifiedname = `${dbTable.schema}.${dbTable.name}`;
            const tablesToMatch = this.grammar.escapeNames([dbTable.name, qualifiedname]);

            if (
                tablesToMatch.filter(value => excludedTables.includes(value)).length === 0 &&
                schemas.includes(this.grammar.escapeNames([dbTable.schema])[0])
            ) {
                tables.push(qualifiedname);
            }
        }

        if (tables.length > 0) {
            this.connection.statement(this.grammar.compileDropTables(tables));
        }
    }

    /**
     * Drop all views from the database.
     */
    public async dropViews(): Promise<void> {
        const views: string[] = [];
        const dbViews = await this.getViews();
        const excludedViews = this.grammar.escapeNames(
            this.connection.getConfig('dont_drop', ['geography_columns', 'geometry_columns'])
        );
        const schemas = this.grammar.escapeNames(this.getSchemas());

        for (const dbView of dbViews) {
            const qualifiedname = `${dbView.schema}.${dbView.name}`;
            const viewsToMatch = this.grammar.escapeNames([dbView.name, qualifiedname]);

            if (
                viewsToMatch.filter(value => excludedViews.includes(value)).length === 0 &&
                schemas.includes(this.grammar.escapeNames([dbView.schema])[0])
            ) {
                views.push(qualifiedname);
            }
        }

        if (views.length > 0) {
            this.connection.statement(this.grammar.compileDropViews(views));
        }
    }

    /**
     * Drop all types from the database.
     */
    public async dropTypes(): Promise<void> {
        const types: string[] = [];
        const domains: string[] = [];

        const dbTypes = await this.getTypes();
        const schemas = this.grammar.escapeNames(this.getSchemas());

        for (const dbType of dbTypes) {
            if (!dbType.implicit && schemas.includes(this.grammar.escapeNames([dbType.schema])[0])) {
                if (dbType.type === 'domain') {
                    domains.push(`${dbType.schema}.${dbType.name}`);
                } else {
                    types.push(`${dbType.schema}.${dbType.name}`);
                }
            }
        }

        if (types.length > 0) {
            await this.connection.statement(this.grammar.compileDropTypes(types));
        }

        if (domains.length > 0) {
            await this.connection.statement(this.grammar.compileDropDomains(domains));
        }
    }

    /**
     * Get the schemas for the connection.
     */
    protected getSchemas(): string[] {
        return this.parseSearchPath(
            this.connection.getConfig<string | string[]>('search_path') ||
                this.connection.getConfig<string>('schema') ||
                'public'
        );
    }

    /**
     * Get the columns for a given table.
     */
    public async getColumns(table: string): Promise<PostgresColumnDictionary[]> {
        const [schema, realTable] = this.parseSchemaAndTable(table);

        const columns = await this.getColumnsFromDatabase<PostgresColumnDefinition>(realTable, schema);

        return columns.map<PostgresColumnDictionary>((column: PostgresColumnDefinition) => {
            const { nullable, collation, comment, ...keys } = column;
            const autoincrement =
                keys.default !== null && typeof keys.default === 'string' && keys.default.startsWith('nextval(');

            return {
                ...keys,
                nullable: Boolean(nullable),
                collation: collation ?? '',
                comment: comment ?? '',
                auto_increment: autoincrement
            };
        });
    }

    /**
     * Get the indexes for a given table.
     */
    public async getIndexes(table: string): Promise<PostgresIndexDictionary[]> {
        const [schema, realTable] = this.parseSchemaAndTable(table);

        const indexes = await this.getIndexesFromDatabase<PostgresIndexDefinition>(realTable, schema);

        return indexes.map<PostgresIndexDictionary>((index: PostgresIndexDefinition) => {
            return {
                name: index.name.toLowerCase(),
                type: index.type.toLowerCase(),
                columns: index.columns.split(','),
                unique: Boolean(index.unique),
                primary: Boolean(index.primary)
            };
        });
    }

    /**
     * Get the foreign keys for a given table.
     */
    public async getForeignKeys(table: string): Promise<PostgresForeignKeyDictionary[]> {
        const [schema, realTable] = this.parseSchemaAndTable(table);

        const foreignKeys = await this.getForeignKeysFromDatabase<PostgresForeignKeyDefinition>(realTable, schema);

        return foreignKeys.map<PostgresForeignKeyDictionary>((foreignKey: PostgresForeignKeyDefinition) => {
            const { columns, foreign_columns, on_update, on_delete, ...keys } = foreignKey;
            const onUpdate =
                {
                    a: 'no action',
                    r: 'restrict',
                    c: 'cascade',
                    n: 'set null',
                    d: 'set default'
                }[on_update.toLowerCase()] ?? '';
            const onDelete =
                {
                    a: 'no action',
                    r: 'restrict',
                    c: 'cascade',
                    n: 'set null',
                    d: 'set default'
                }[on_delete.toLowerCase()] ?? '';

            return {
                ...keys,
                columns: columns.split(','),
                foreign_columns: foreign_columns.split(','),
                on_delete: onDelete,
                on_update: onUpdate
            };
        });
    }

    /**
     * Parse the database object reference and extract the database, schema, and table.
     */
    protected parseSchemaAndTable(reference: string): [string, string] {
        const parts = reference.split('.');

        // We will use the default schema unless the schema has been specified in the
        // query. If the schema has been specified in the query then we can use it
        // instead of a default schema configured in the connection search path.
        let schema = this.getSchemas()[0];

        if (parts.length === 2) {
            schema = parts.shift() as string;
        }

        return [schema, parts[0]];
    }

    /**
     * Parse the "search_path" configuration value into an array.
     */
    protected parseSearchPath(searchPath: string | string[]): string[] {
        searchPath = parseSearchPath(searchPath);

        return searchPath.map(schema => {
            return schema === '$user' ? this.connection.getConfig('username', '') : schema;
        });
    }
}

export default PostgresBuilder;

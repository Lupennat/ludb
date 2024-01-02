import SqlserverConnection from '../../../connections/sqlserver-connection';
import { ConnectionSessionI } from '../../connection';
import { Stringable } from '../../generics';
import {
    SqlserverColumnDictionary,
    SqlserverForeignKeyDictionary,
    SqlserverIndexDictionary,
    SqlserverTableDictionary,
    SqlserverTypeDictionary,
    SqlserverViewDictionary
} from '../generics';
import SchemaBuilder from './schema-builder';

export interface SimpleType {
    from: Stringable;
    nullable?: boolean;
}

export default interface SqlserverSchemaBuilderI extends SchemaBuilder<ConnectionSessionI<SqlserverConnection>> {
    /**
     * Get the tables that belong to the database.
     */
    getTables(): Promise<SqlserverTableDictionary[]>;
    /**
     * Get the views that belong to the database.
     */
    getViews(): Promise<SqlserverViewDictionary[]>;
    /**
     * Get the user-defined types that belong to the database.
     */
    getTypes(): Promise<SqlserverTypeDictionary[]>;
    /**
     * Get the columns for a given table.
     */
    getColumns(table: string): Promise<SqlserverColumnDictionary[]>;
    /**
     * Get the indexes for a given table.
     */
    getIndexes(table: string): Promise<SqlserverIndexDictionary[]>;
    /**
     * Get the foreign keys for a given table.
     */
    getForeignKeys(table: string): Promise<SqlserverForeignKeyDictionary[]>;

    /**
     * create user-defined type.
     */
    createType(name: Stringable, type: 'simple', definition: SimpleType): Promise<boolean>;
    createType(name: Stringable, type: 'external', definition: string): Promise<boolean>;
    createType(name: Stringable, type: 'simple' | 'external', definition: SimpleType | Stringable): Promise<boolean>;
}

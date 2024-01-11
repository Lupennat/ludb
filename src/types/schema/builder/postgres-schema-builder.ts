import PostgresConnection from '../../../connections/postgres-connection';
import { ConnectionSessionI } from '../../connection';
import { Stringable } from '../../generics';
import {
    PostgresArrayType,
    PostgresColumnDictionary,
    PostgresDomainType,
    PostgresForeignKeyDictionary,
    PostgresFunctionType,
    PostgresIndexDictionary,
    PostgresRangeType,
    PostgresTableDictionary,
    PostgresTypeDictionary,
    PostgresViewDictionary
} from '../generics';
import SchemaBuilder from './schema-builder';

export default interface PostgresSchemaBuilderI extends SchemaBuilder<ConnectionSessionI<PostgresConnection>> {
    /**
     * Get the tables that belong to the database.
     */
    getTables(): Promise<PostgresTableDictionary[]>;
    /**
     * Get the views that belong to the database.
     */
    getViews(): Promise<PostgresViewDictionary[]>;
    /**
     * Get the user-defined types that belong to the database.
     */
    getTypes(): Promise<PostgresTypeDictionary[]>;
    /**
     * Get the columns for a given table.
     */
    getColumns(table: string): Promise<PostgresColumnDictionary[]>;
    /**
     * Get the indexes for a given table.
     */
    getIndexes(table: string): Promise<PostgresIndexDictionary[]>;
    /**
     * Get the foreign keys for a given table.
     */
    getForeignKeys(table: string): Promise<PostgresForeignKeyDictionary[]>;
    /**
     * create user-defined type.
     */
    createType(name: Stringable, type: 'enum', definition: string[]): Promise<boolean>;
    createType(name: Stringable, type: 'range', definition: PostgresRangeType): Promise<boolean>;
    createType(name: Stringable, type: 'array', definition: PostgresArrayType[]): Promise<boolean>;
    createType(name: Stringable, type: 'fn', definition: PostgresFunctionType): Promise<boolean>;
    createType(name: Stringable, type: 'domain', definition: PostgresDomainType): Promise<boolean>;
}

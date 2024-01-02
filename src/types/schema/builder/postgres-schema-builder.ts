import PostgresConnection from '../../../connections/postgres-connection';
import { ConnectionSessionI } from '../../connection';
import { Stringable } from '../../generics';
import {
    PostgresColumnDictionary,
    PostgresForeignKeyDictionary,
    PostgresIndexDictionary,
    PostgresTableDictionary,
    PostgresTypeDictionary,
    PostgresViewDictionary
} from '../generics';
import SchemaBuilder from './schema-builder';

export interface RangeType {
    subtype: string;
    subtype_opclass?: string;
    collation?: string;
    canonical?: string;
    subtype_diff?: string;
    multirange_type_name?: string;
}

export interface ArrayType {
    name: string;
    type: string;
    collation?: string;
}

export interface FunctionType {
    input: string;
    output: string;
    receive?: string;
    send?: string;
    typmod_in?: string;
    typmod_out?: string;
    analyze?: string;
    subscript?: string;
    internallength?: number | string;
    precision: string;
    alignement?: 'char' | 'int2' | 'int4' | 'double';
    storage?: 'plain' | 'external' | 'extended' | 'main';
    like_type?: string;
    category?: string;
    preferred?: boolean;
    default?: string;
    element?: string;
    delimiter?: string;
    collatable?: boolean;
}

export interface DomainType {
    type: string;
    default?: string;
    collate?: string;
    constraint?: string;
    nullable?: boolean;
    check?: string;
}

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
    createType(name: Stringable, type: 'range', definition: RangeType): Promise<boolean>;
    createType(name: Stringable, type: 'array', definition: ArrayType[]): Promise<boolean>;
    createType(name: Stringable, type: 'fn', definition: FunctionType): Promise<boolean>;
    createType(name: Stringable, type: 'domain', definition: DomainType): Promise<boolean>;
    createType(
        name: Stringable,
        type: 'enum' | 'range' | 'array' | 'fn' | 'domain',
        definition: string[] | RangeType | ArrayType[] | FunctionType | DomainType
    ): Promise<boolean>;
}

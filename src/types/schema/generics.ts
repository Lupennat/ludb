import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import { Stringable } from '../generics';

type BaseTableDictionary = {
    name: string;
    size?: number;
};

export type MysqlTableDictionary = BaseTableDictionary & {
    comment: string;
    collation: string;
    engine: string;
};

export type PostgresTableDictionary = BaseTableDictionary & {
    schema: string;
    comment: string;
};

export type SqliteTableDictionary = BaseTableDictionary;

export type SqlserverTableDictionary = BaseTableDictionary & {
    schema: string;
};

export type TableDictionary =
    | MysqlTableDictionary
    | PostgresTableDictionary
    | SqliteTableDictionary
    | SqlserverTableDictionary;

type BaseViewDictionary = {
    name: string;
    definition: string;
};

export type MysqlViewDictionary = BaseViewDictionary;

export type PostgresViewDictionary = BaseViewDictionary & {
    schema: string;
};

export type SqliteViewDictionary = BaseViewDictionary;

export type SqlserverViewDictionary = BaseViewDictionary & {
    schema: string;
};

export type ViewDictionary =
    | MysqlViewDictionary
    | PostgresViewDictionary
    | SqliteViewDictionary
    | SqlserverViewDictionary;

type BaseTypeDictionary = {
    name: string;
};

export type PostgresTypeDictionary = BaseTypeDictionary & {
    schema: string;
    implicit: boolean;
    type: string | null;
    category: string | null;
};

export type SqlserverTypeDictionary = BaseTypeDictionary & {
    schema: string;
    type: string;
};

export type TypeDictionary = PostgresTypeDictionary | SqlserverTypeDictionary;

type BaseColumnDictionary = {
    name: string;
    type_name: string;
    type: string;
    nullable: boolean;
    default: PdoColumnValue;
    auto_increment: boolean;
};

export type MysqlColumnDictionary = BaseColumnDictionary & {
    collation: string;
    comment: string;
};

export type PostgresColumnDictionary = BaseColumnDictionary & {
    collation: string;
    comment: string;
};

export type SqliteColumnDictionary = BaseColumnDictionary;

export type SqlserverColumnDictionary = BaseColumnDictionary & {
    collation: string;
    comment: string;
};

export type ColumnDictionary =
    | MysqlColumnDictionary
    | PostgresColumnDictionary
    | SqliteColumnDictionary
    | SqlserverColumnDictionary;

type BaseIndexDictionary = {
    name: string;
    columns: string[];
    unique: boolean;
    primary: boolean;
};

export type MysqlIndexDictionary = BaseIndexDictionary & {
    type: string;
};

export type PostgresIndexDictionary = BaseIndexDictionary & {
    type: string;
};

export type SqliteIndexDictionary = BaseIndexDictionary;

export type SqlserverIndexDictionary = BaseIndexDictionary & {
    type: string;
};

export type IndexDictionary =
    | MysqlIndexDictionary
    | PostgresIndexDictionary
    | SqliteIndexDictionary
    | SqlserverIndexDictionary;

type BaseForeignKeyDictionary = {
    name: string;
    columns: string[];
    foreign_table: string;
    foreign_columns: string[];
    on_update: string;
    on_delete: string;
};

export type MysqlForeignKeyDictionary = BaseForeignKeyDictionary & {
    foreign_schema: string;
};

export type PostgresForeignKeyDictionary = BaseForeignKeyDictionary & {
    foreign_schema: string;
};

export type SqliteForeignKeyDictionary = BaseForeignKeyDictionary;

export type SqlserverForeignKeyDictionary = BaseForeignKeyDictionary & {
    foreign_schema: string;
};

export type ForeignKeyDictionary =
    | MysqlForeignKeyDictionary
    | PostgresForeignKeyDictionary
    | SqliteForeignKeyDictionary
    | SqlserverForeignKeyDictionary;

export interface SqlserverSimpleType {
    from: Stringable;
    nullable?: boolean;
}

export type SqlserverTypeMap = {
    simple: SqlserverSimpleType;
    external: string;
};

export interface PostgresRangeType {
    subtype: string;
    subtype_opclass?: string;
    collation?: string;
    canonical?: string;
    subtype_diff?: string;
    multirange_type_name?: string;
}

export interface PostgresArrayType {
    name: string;
    type: string;
    collation?: string;
}

export interface PostgresFunctionType {
    input: string;
    output: string;
    receive?: string;
    send?: string;
    typmod_in?: string;
    typmod_out?: string;
    analyze?: string;
    subscript?: string;
    internallength?: number | string;
    passedbyvalue?: boolean;
    precision?: string;
    alignment?: 'char' | 'int2' | 'int4' | 'double';
    storage?: 'plain' | 'external' | 'extended' | 'main';
    like?: string;
    category?: string;
    preferred?: boolean;
    default?: string;
    element?: string;
    delimiter?: string;
    collatable?: boolean;
}

export interface PostgresDomainType {
    type: string;
    default?: string;
    collate?: string;
    constraint?: string;
    nullable?: boolean;
    check?: string;
}

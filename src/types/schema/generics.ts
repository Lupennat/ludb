import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';

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

export type SQLiteTableDictionary = BaseTableDictionary;

export type SqlServerTableDictionary = BaseTableDictionary & {
    schema: string;
};

export type TableDictionary =
    | MysqlTableDictionary
    | PostgresTableDictionary
    | SQLiteTableDictionary
    | SqlServerTableDictionary;

type BaseViewDictionary = {
    name: string;
    definition: string;
};

export type MysqlViewDictionary = BaseViewDictionary;

export type PostgresViewDictionary = BaseViewDictionary & {
    schema: string;
};

export type SQLiteViewDictionary = BaseViewDictionary;

export type SqlServerViewDictionary = BaseViewDictionary & {
    schema: string;
};

export type ViewDictionary =
    | MysqlViewDictionary
    | PostgresViewDictionary
    | SQLiteViewDictionary
    | SqlServerViewDictionary;

type BaseTypeDictionary = {
    name: string;
};

export type PostgresTypeDictionary = BaseTypeDictionary & {
    schema: string;
    implicit: boolean;
    type: string | null;
    category: string | null;
};

export type TypeDictionary = PostgresTypeDictionary;

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

export type SQLiteColumnDictionary = BaseColumnDictionary;

export type SqlServerColumnDictionary = BaseColumnDictionary & {
    collation: string;
    comment: string;
};

export type ColumnDictionary =
    | MysqlColumnDictionary
    | PostgresColumnDictionary
    | SQLiteColumnDictionary
    | SqlServerColumnDictionary;

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

export type SQLiteIndexDictionary = BaseIndexDictionary;

export type SqlServerIndexDictionary = BaseIndexDictionary & {
    type: string;
};

export type IndexDictionary =
    | MysqlIndexDictionary
    | PostgresIndexDictionary
    | SQLiteIndexDictionary
    | SqlServerIndexDictionary;

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

export type SQLiteForeignKeyDictionary = BaseForeignKeyDictionary;

export type SqlServerForeignKeyDictionary = BaseForeignKeyDictionary & {
    foreign_schema: string;
};

export type ForeignKeyDictionary =
    | MysqlForeignKeyDictionary
    | PostgresForeignKeyDictionary
    | SQLiteForeignKeyDictionary
    | SqlServerForeignKeyDictionary;

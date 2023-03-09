import ColumnDefinition from '../../schema/definitions/column-definition';
import CommandDefinition from '../../schema/definitions/commands/command-definition';
import { Stringable } from '../query/builder';

export interface CommandRegistryI {
    [key: string]: any;
}

export interface CommentRegistryI extends CommandRegistryI {
    comment: string;
}

export interface RenameRegistryI extends CommandRegistryI {
    to: Stringable;
}

export interface RenameFullRegistryI extends RenameRegistryI {
    from: Stringable;
    to: Stringable;
}

export interface ColumnDefinitionRegistryI extends CommandRegistryI {
    column: ColumnDefinition;
}

export interface ColumnsRegistryI extends CommandRegistryI {
    columns: Stringable[];
}

export interface IndexRegistryI extends ColumnsRegistryI {
    index: Stringable;
    algorithm?: Stringable;
    language?: Stringable;
    deferrable?: boolean;
    initiallyImmediate?: boolean;
}

export interface ForeignKeyRegistryI extends IndexRegistryI {
    on: Stringable;
    onDelete?: Stringable;
    onUpdate?: Stringable;
    references: Stringable | Stringable[];
    notValid?: Boolean;
}

export type CommandType =
    | 'add'
    | 'autoIncrementStartingValues'
    | 'change'
    | 'comment'
    | 'create'
    | 'default'
    | 'drop'
    | 'dropColumn'
    | 'dropPrimary'
    | 'dropUnique'
    | 'dropIndex'
    | 'dropFulltext'
    | 'dropSpatialIndex'
    | 'dropForeign'
    | 'dropIfExists'
    | 'primary'
    | 'unique'
    | 'index'
    | 'fulltext'
    | 'spatialIndex'
    | 'foreign'
    | 'tableComment'
    | 'rename'
    | 'renameColumn'
    | 'renameIndex';

export type ColumnType =
    | 'bigInteger'
    | 'binary'
    | 'boolean'
    | 'char'
    | 'computed'
    | 'date'
    | 'dateTime'
    | 'dateTimeTz'
    | 'decimal'
    | 'double'
    | 'enum'
    | 'float'
    | 'geometry'
    | 'geometryCollection'
    | 'integer'
    | 'ipAddress'
    | 'json'
    | 'jsonb'
    | 'lineString'
    | 'longText'
    | 'macAddress'
    | 'mediumInteger'
    | 'mediumText'
    | 'multiLineString'
    | 'multiPoint'
    | 'multiPolygon'
    | 'multiPolygonZ'
    | 'point'
    | 'polygon'
    | 'set'
    | 'smallInteger'
    | 'string'
    | 'text'
    | 'time'
    | 'timestamp'
    | 'timestampTz'
    | 'timeTz'
    | 'tinyInteger'
    | 'tinyText'
    | 'uuid'
    | 'year';

export type ModifiersType =
    | 'after'
    | 'charset'
    | 'collate'
    | 'comment'
    | 'default'
    | 'first'
    | 'generatedAs'
    | 'increment'
    | 'invisible'
    | 'nullable'
    | 'onUpdate'
    | 'persisted'
    | 'srid'
    | 'storedAs'
    | 'unsigned'
    | 'virtualAs';

export type ColumnIndex = 'primary' | 'unique' | 'index' | 'fulltext' | 'spatialIndex';

export interface ColumnRegistryI {
    /**
     *  Place the column "after" another column (MySQL)
     */
    after?: Stringable;
    /**
     * Enum Allowed
     */
    allowed?: string[];
    /**
     *  Used as a modifier for generatedAs() (PostgreSQL)
     */
    always?: boolean;
    /**
     * Set INTEGER columns as auto-increment (primary key)
     */
    autoIncrement?: boolean;
    /**
     * Change the column
     */
    change?: boolean;
    /**
     * Specify a character set for the column (MySQL)
     */
    charset?: Stringable;
    /**
     * Specify a collation for the column (MySQL/PostgreSQL/SQL Server)
     */
    collation?: Stringable;
    /**
     * Add a comment to the column (MySQL/PostgreSQL)
     */
    comment?: string;
    /**
     * Specify a "default" value for the column
     */
    default?: Stringable | boolean | number | bigint;
    /**
     * Computed Expression
     */
    expression?: Stringable;
    /**
     * Place the column "first" in the table (MySQL)
     */
    first?: boolean;
    /**
     * Set the starting value of an auto-incrementing field (MySQL / PostgreSQL)
     */
    from?: number | bigint;
    /**
     * Create a SQL compliant identity column (PostgreSQL)
     */
    generatedAs?: Stringable | boolean;
    /**
     * Add an index
     */
    index?: boolean | Stringable;
    /**
     * Specify that the column should be invisible to "SELECT *" (MySQL)
     */
    invisible?: boolean;
    /**
     * switch geography to geometry
     */
    isGeometry?: boolean;
    /**
     * Specify Char Length
     */
    length?: number;
    /**
     * Allow NULL values to be inserted into the column
     */
    nullable?: boolean;
    /**
     * Specify a "on update" value for the column
     */
    onUpdate?: Stringable | boolean | number | bigint;
    /**
     * Mark the computed generated column as persistent (SQL Server)
     */
    persisted?: boolean;
    /**
     * Add a primary index
     */
    primary?: boolean | Stringable;
    /**
     * Add a fulltext index
     */
    fulltext?: boolean | Stringable;
    /**
     * Specify numeric places
     */
    places?: number;
    /**
     * add geometry/geography projection
     */
    projection?: number;
    /**
     * Specify rename Column
     */
    renameTo?: Stringable;
    /**
     * Specify Date/Time precision
     */
    precision?: number;
    /**
     * Add a spatial index
     */
    spatialIndex?: boolean | Stringable;
    /**
     * Point Srid
     */
    srid?: number;
    /**
     * Set the starting value of an auto-incrementing field (MySQL/PostgreSQL)
     */
    startingValue?: number | bigint;
    /**
     * Create a stored generated column (MySQL/PostgreSQL/SQLite)
     */
    storedAs?: Stringable | null;
    /**
     * Specify numeric total digit
     */
    total?: number;
    /**
     * Specify a type for the column
     */
    type: ColumnType;
    /**
     * Add a unique index
     */
    unique?: boolean | Stringable;
    /**
     * Set the INTEGER column as UNSIGNED (MySQL)
     */
    unsigned?: boolean;
    /**
     * Set the TIMESTAMP column to use CURRENT_TIMESTAMP as default value
     */
    useCurrent?: boolean;
    /**
     * Set the TIMESTAMP column to use CURRENT_TIMESTAMP when updating (MySQL)
     */
    useCurrentOnUpdate?: boolean;
    /**
     * Create a virtual generated column (MySQL/PostgreSQL/SQLite)
     */
    virtualAs?: Stringable | null;
}

export default interface RegistryI {
    /**
     * The table the blueprint describes.
     */
    table: Stringable;

    /**
     * Whether to make the table temporary.
     */
    temporary: boolean;

    /**
     * The prefix of the table.
     */
    prefix: Stringable;

    /**
     * The columns that should be added to the table.
     */
    columns: ColumnDefinition[];

    /**
     * The commands that should be run for the table.
     */
    commands: CommandDefinition[];

    /**
     * The storage engine that should be used for the table.
     */
    engine?: Stringable;

    /**
     * The default character set that should be used for the table.
     */
    charset?: Stringable;

    /**
     * The collation that should be used for the table.
     */
    collation?: Stringable;

    /**
     * The column to add new columns after.
     */
    after?: Stringable;
}

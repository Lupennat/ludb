import { ConnectionSessionI } from '..';
import ColumnDefinition from '../../schema/definitions/column-definition';
import CommandDefinition from '../../schema/definitions/commands/command-definition';
import CommandForeignKeyDefinition from '../../schema/definitions/commands/command-foreign-key-definition';
import CommandIndexDefinition from '../../schema/definitions/commands/command-index-definition';
import ForeignIdColumnDefinition from '../../schema/definitions/foreign-id-column-definition';
import { Stringable } from '../generics';
import { BlueprintCallback } from './builder/schema-builder';
import GrammarI from './grammar';
import RegistryI, {
    ColumnRegistryI,
    ColumnType,
    ColumnsRegistryI,
    CommentRegistryI,
    ForeignKeyRegistryI,
    IndexRegistryI,
    RenameFullRegistryI,
    RenameRegistryI
} from './registry';

export type RelatableConstructor = new () => Relatable;

export interface Relatable {
    /**
     * Get the default foreign key name for the model.
     */
    getForeignKey(): string;
    /**
     * Get the auto-incrementing key type.
     */
    getKeyType(): string;
    /**
     * Get the value indicating whether the IDs are incrementing.
     */
    getIncrementing(): boolean;
}

export default interface BlueprintI {
    /**
     * Get BluePrint Registry
     */
    getRegistry(): RegistryI;

    /**
     * The storage engine that should be used for the table.
     */
    engine(engine: Stringable): this;

    /**
     * The default character set that should be used for the table.
     */
    charset(charset: Stringable): this;

    /**
     * The collation that should be used for the table.
     */
    collation(collation: Stringable): this;

    /**
     * Indicate that the table needs to be temporary.
     */
    temporary(): this;

    /*
     * Execute the blueprint against the database.
     */
    build(connection: ConnectionSessionI): Promise<void>;

    /**
     * Get the raw SQL statements for the blueprint.
     */
    toSql(connection: ConnectionSessionI): string[];

    /**
     * Add the commands specified on any columns.
     */
    addCommands(): void;

    /**
     * Determine if the blueprint has a create command.
     */
    creating(): boolean;

    /**
     * Indicate that the table needs to be created.
     */
    create(): CommandDefinition;

    /**
     * Add a comment to the table.
     */
    comment(comment: string): CommandDefinition<CommentRegistryI>;

    /**
     * Indicate that the table should be dropped.
     */
    drop(): CommandDefinition;

    /**
     * Indicate that the table should be dropped if it exists.
     */
    dropTableIfExists(): CommandDefinition;

    /**
     * Indicate that the given columns should be dropped.
     */
    dropColumn(columns: Stringable | Stringable[], ...otherColumns: Stringable[]): CommandDefinition<ColumnsRegistryI>;

    /**
     * Indicate that the given columns should be renamed.
     */
    renameColumn(from: Stringable, to: Stringable): CommandDefinition<RenameFullRegistryI>;

    /**
     * Indicate that the given primary key should be dropped.
     */
    dropPrimary(index?: Stringable[] | Stringable): CommandIndexDefinition;

    /**
     * Indicate that the given unique key should be dropped.
     */
    dropUnique(index: Stringable[] | Stringable): CommandIndexDefinition;

    /**
     * Indicate that the given index should be dropped.
     */
    dropIndex(index: Stringable[] | Stringable): CommandIndexDefinition;

    /**
     * Indicate that the given fulltext index should be dropped.
     */
    dropFulltext(index: Stringable | Stringable[]): CommandIndexDefinition;

    /**
     * Indicate that the given spatial index should be dropped.
     */
    dropSpatialIndex(index: Stringable | Stringable[]): CommandIndexDefinition;

    /**
     * Indicate that the given foreign key should be dropped.
     */
    dropForeign(index: Stringable | Stringable[]): CommandForeignKeyDefinition;

    /**
     * Indicate that the given foreign key should be dropped.
     */
    dropForeignIdFor(model: RelatableConstructor | Relatable, column?: string): CommandForeignKeyDefinition;

    /**
     * Indicate that the given column and foreign key should be dropped.
     */
    dropConstrainedForeignId(column: Stringable): void;

    /**
     * Indicate that the given foreign key should be dropped.
     */
    dropConstrainedForeignIdFor(model: RelatableConstructor | Relatable, column?: string): void;

    /**
     * Indicate that the given indexes should be renamed.
     */
    renameIndex(from: Stringable, to: Stringable): CommandDefinition<RenameFullRegistryI>;

    /**
     * Indicate that the timestamp columns should be dropped.
     */
    dropTimestamps(): CommandDefinition<ColumnsRegistryI>;

    /**
     * Indicate that the timestamp columns should be dropped.
     */
    dropTimestampsTz(): CommandDefinition<ColumnsRegistryI>;

    /**
     * Indicate that the soft delete column should be dropped.
     */
    dropSoftDeletes(column?: string): CommandDefinition<ColumnsRegistryI>;

    /**
     * Indicate that the soft delete column should be dropped.
     */
    dropSoftDeletesTz(column?: string): CommandDefinition<ColumnsRegistryI>;

    /**
     * Indicate that the polymorphic columns should be dropped.
     */
    dropMorphs(name: Stringable, indexName?: Stringable): void;

    /**
     * Rename the table to a given name.
     */
    rename(to: Stringable): CommandDefinition<RenameRegistryI>;

    /**
     * Specify the primary key(s) for the table.
     */
    primary(
        columns: Stringable | Stringable[],
        name?: Stringable,
        algorithm?: Stringable
    ): CommandIndexDefinition<IndexRegistryI>;

    /**
     * Specify a unique index for the table.
     */
    unique(
        columns: Stringable | Stringable[],
        name?: Stringable,
        algorithm?: Stringable
    ): CommandIndexDefinition<IndexRegistryI>;

    /**
     * Specify an index for the table.
     */
    index(
        columns: Stringable | Stringable[],
        name?: Stringable,
        algorithm?: Stringable
    ): CommandIndexDefinition<IndexRegistryI>;

    /**
     * Specify an fulltext for the table.
     */
    fulltext(
        columns: Stringable | Stringable[],
        name?: Stringable,
        algorithm?: Stringable
    ): CommandIndexDefinition<IndexRegistryI>;

    /**
     * Specify a spatial index for the table.
     */
    spatialIndex(columns: Stringable | Stringable[], name?: Stringable): CommandIndexDefinition<IndexRegistryI>;

    /**
     * Specify a raw index for the table.
     */
    rawIndex(expression: string, name: Stringable): CommandIndexDefinition<IndexRegistryI>;

    /**
     * Specify a foreign key for the table.
     */
    foreign(columns: Stringable | Stringable[], name?: Stringable): CommandForeignKeyDefinition<ForeignKeyRegistryI>;

    /**
     * Create a new auto-incrementing big integer (8-byte) column on the table.
     */
    id(column?: Stringable): ColumnDefinition;

    /**
     * Create a new auto-incrementing integer (4-byte) column on the table.
     */
    increments(column: Stringable): ColumnDefinition;

    /**
     * Create a new auto-incrementing integer (4-byte) column on the table.
     */
    integerIncrements(column: Stringable): ColumnDefinition;

    /**
     * Create a new auto-incrementing tiny integer (1-byte) column on the table.
     */
    tinyIncrements(column: Stringable): ColumnDefinition;

    /**
     * Create a new auto-incrementing small integer (2-byte) column on the table.
     */
    smallIncrements(column: Stringable): ColumnDefinition;

    /**
     * Create a new auto-incrementing medium integer (3-byte) column on the table.
     */
    mediumIncrements(column: Stringable): ColumnDefinition;

    /**
     * Create a new auto-incrementing big integer (8-byte) column on the table.
     */
    bigIncrements(column: Stringable): ColumnDefinition;

    /**
     * Create a new char column on the table.
     */
    char(column: Stringable, length?: number): ColumnDefinition;

    /**
     * Create a new string column on the table.
     */
    string(column: Stringable, length?: number): ColumnDefinition;

    /**
     * Create a new tiny text column on the table.
     */
    tinyText(column: Stringable): ColumnDefinition;

    /**
     * Create a new text column on the table.
     */
    text(column: Stringable): ColumnDefinition;

    /**
     * Create a new medium text column on the table.
     */
    mediumText(column: Stringable): ColumnDefinition;

    /**
     * Create a new long text column on the table.
     */
    longText(column: Stringable): ColumnDefinition;

    /**
     * Create a new integer (4-byte) column on the table.
     */
    integer(column: Stringable, autoIncrement?: boolean, unsigned?: boolean): ColumnDefinition;

    /**
     * Create a new tiny integer (1-byte) column on the table.
     */
    tinyInteger(column: Stringable, autoIncrement?: boolean, unsigned?: boolean): ColumnDefinition;

    /**
     * Create a new small integer (2-byte) column on the table.
     */
    smallInteger(column: Stringable, autoIncrement?: boolean, unsigned?: boolean): ColumnDefinition;

    /**
     * Create a new medium integer (3-byte) column on the table.
     */
    mediumInteger(column: Stringable, autoIncrement?: boolean, unsigned?: boolean): ColumnDefinition;

    /**
     * Create a new big integer (8-byte) column on the table.
     */
    bigInteger(column: Stringable, autoIncrement?: boolean, unsigned?: boolean): ColumnDefinition;

    /**
     * Create a new unsigned integer (4-byte) column on the table.
     */
    unsignedInteger(column: Stringable, autoIncrement?: boolean): ColumnDefinition;

    /**
     * Create a new unsigned tiny integer (1-byte) column on the table.
     */
    unsignedTinyInteger(column: Stringable, autoIncrement?: boolean): ColumnDefinition;

    /**
     * Create a new unsigned small integer (2-byte) column on the table.
     */
    unsignedSmallInteger(column: Stringable, autoIncrement?: boolean): ColumnDefinition;

    /**
     * Create a new unsigned medium integer (3-byte) column on the table.
     */
    unsignedMediumInteger(column: Stringable, autoIncrement?: boolean): ColumnDefinition;

    /**
     * Create a new unsigned big integer (8-byte) column on the table.
     */
    unsignedBigInteger(column: Stringable, autoIncrement?: boolean): ColumnDefinition;

    /**
     * Create a new unsigned big integer (8-byte) column on the table.
     */
    foreignId(column: Stringable): ForeignIdColumnDefinition;

    /**
     * Create a foreign ID column for the given model.
     */
    foreignIdFor(model: RelatableConstructor | Relatable, column?: string): ForeignIdColumnDefinition;

    /**
     * Create a new float column on the table.
     */
    float(column: Stringable, total?: number, places?: number, unsigned?: boolean): ColumnDefinition;

    /**
     * Create a new double column on the table.
     */
    double(column: Stringable, total?: number, places?: number, unsigned?: boolean): ColumnDefinition;

    /**
     * Create a new decimal column on the table.
     */
    decimal(column: Stringable, total?: number, places?: number, unsigned?: boolean): ColumnDefinition;

    /**
     * Create a new unsigned float column on the table.
     */
    unsignedFloat(column: Stringable, total?: number, places?: number): ColumnDefinition;

    /**
     * Create a new unsigned double column on the table.
     */
    unsignedDouble(column: Stringable, total?: number, places?: number): ColumnDefinition;

    /**
     * Create a new unsigned decimal column on the table.
     */
    unsignedDecimal(column: Stringable, total?: number, places?: number): ColumnDefinition;

    /**
     * Create a new boolean column on the table.
     */
    boolean(column: Stringable): ColumnDefinition;

    /**
     * Create a new enum column on the table.
     */
    enum(column: Stringable, allowed: string[]): ColumnDefinition;

    /**
     * Create a new set column on the table.
     */
    set(column: Stringable, allowed: string[]): ColumnDefinition;

    /**
     * Create a new json column on the table.
     */
    json(column: Stringable): ColumnDefinition;

    /**
     * Create a new jsonb column on the table.
     */
    jsonb(column: Stringable): ColumnDefinition;

    /**
     * Create a new date column on the table.
     */
    date(column: Stringable): ColumnDefinition;

    /**
     * Create a new date-time column on the table.
     */
    dateTime(column: Stringable, precision?: number | null): ColumnDefinition;

    /**
     * Create a new date-time column (with time zone) on the table.
     */
    dateTimeTz(column: Stringable, precision?: number | null): ColumnDefinition;

    /**
     * Create a new time column on the table.
     */
    time(column: Stringable, precision?: number | null): ColumnDefinition;

    /**
     * Create a new time column (with time zone) on the table.
     */
    timeTz(column: Stringable, precision?: number | null): ColumnDefinition;

    /**
     * Create a new timestamp column on the table.
     */
    timestamp(column: Stringable, precision?: number | null): ColumnDefinition;

    /**
     * Create a new timestamp (with time zone) column on the table.
     */
    timestampTz(column: Stringable, precision?: number | null): ColumnDefinition;

    /**
     * Add nullable creation and update timestamps to the table.
     */
    timestamps(precision?: number | null): void;

    /**
     * Add creation and update timestampTz columns to the table.
     */
    timestampsTz(precision?: number | null): void;

    /**
     * Add creation and update datetime columns to the table.
     */
    datetimes(precision?: number | null): void;

    /**
     * Add a "deleted at" timestamp for the table.
     */
    softDeletes(column?: Stringable, precision?: number | null): ColumnDefinition;

    /**
     * Add a "deleted at" timestampTz for the table.
     */
    softDeletesTz(column?: Stringable, precision?: number | null): ColumnDefinition;

    /**
     * Add a "deleted at" datetime column to the table.
     */
    softDeletesDatetime(column?: Stringable, precision?: number | null): ColumnDefinition;

    /**
     * Create a new year column on the table.
     */
    year(column: Stringable): ColumnDefinition;

    /**
     * Create a new binary column on the table.
     */
    binary(column: Stringable): ColumnDefinition;

    /**
     * Create a new UUID column on the table.
     */
    uuid(column?: Stringable): ColumnDefinition;

    /**
     * Create a new UUID column on the table with a foreign key constraint.
     */
    foreignUuid(column: Stringable): ForeignIdColumnDefinition;

    /**
     * Create a new ULID column on the table.
     */
    ulid(column?: Stringable, length?: number): ColumnDefinition;

    /**
     * Create a new ULID column on the table with a foreign key constraint.
     */
    foreignUlid(column: Stringable, length?: number): ForeignIdColumnDefinition;

    /**
     * Create a new IP address column on the table.
     */
    ipAddress(column?: Stringable): ColumnDefinition;

    /**
     * Create a new MAC address column on the table.
     */
    macAddress(column?: Stringable): ColumnDefinition;

    /**
     * Create a new geometry column on the table.
     */
    geometry(column: Stringable): ColumnDefinition;

    /**
     * Create a new point column on the table.
     */
    point(column: Stringable, srid?: number): ColumnDefinition;

    /**
     * Create a new linestring column on the table.
     */
    lineString(column: Stringable): ColumnDefinition;

    /**
     * Create a new polygon column on the table.
     */
    polygon(column: Stringable): ColumnDefinition;

    /**
     * Create a new geometrycollection column on the table.
     */
    geometryCollection(column: Stringable): ColumnDefinition;

    /**
     * Create a new multipoint column on the table.
     */
    multiPoint(column: Stringable): ColumnDefinition;

    /**
     * Create a new multilinestring column on the table.
     */
    multiLineString(column: Stringable): ColumnDefinition;

    /**
     * Create a new multipolygon column on the table.
     */
    multiPolygon(column: Stringable): ColumnDefinition;

    /**
     * Create a new multipolygon column on the table.
     */
    multiPolygonZ(column: Stringable): ColumnDefinition;

    /**
     * Create a new generated, computed column on the table.
     */
    computed(column: Stringable, expression: Stringable): ColumnDefinition;

    /**
     * Add the proper columns for a polymorphic table.
     */
    morphs(name: Stringable, indexName?: Stringable): void;

    /**
     * Add nullable columns for a polymorphic table.
     */
    nullableMorphs(name: Stringable, indexName?: Stringable): void;

    /**
     * Add the proper columns for a polymorphic table using numeric IDs (incremental).
     */
    numericMorphs(name: Stringable, indexName?: Stringable): void;

    /**
     * Add nullable columns for a polymorphic table using numeric IDs (incremental).
     */
    nullableNumericMorphs(name: Stringable, indexName?: Stringable): void;

    /**
     * Add the proper columns for a polymorphic table using UUIDs.
     */
    uuidMorphs(name: Stringable, indexName?: Stringable): void;

    /**
     * Add nullable columns for a polymorphic table using UUIDs.
     */
    nullableUuidMorphs(name: Stringable, indexName?: Stringable): void;

    /**
     * Add the proper columns for a polymorphic table using ULIDs.
     */
    ulidMorphs(name: Stringable, indexName?: Stringable): void;

    /**
     * Add nullable columns for a polymorphic table using ULIDs.
     */
    nullableUlidMorphs(name: Stringable, indexName?: Stringable): void;

    /**
     * Add a new column to the blueprint.
     */
    addColumn(type: ColumnType, name: Stringable, parameters?: Partial<ColumnRegistryI>): ColumnDefinition;

    /**
     * Add the columns from the callback after the given column.
     */
    after(column: Stringable, callback: BlueprintCallback): void;

    /**
     * Remove a column from the schema blueprint.
     */
    removeColumn(name: Stringable): this;

    /**
     * Get the blueprint grammar.
     */
    getGrammar(): GrammarI;

    /**
     * Get the table the blueprint describes.
     */
    getTable(): Stringable;

    /**
     * Get the table prefix.
     */
    getPrefix(): Stringable;

    /**
     * Get the columns on the blueprint.
     */
    getColumns(): ColumnDefinition[];

    /**
     * Get the commands on the blueprint.
     */
    getCommands<T extends CommandDefinition = CommandDefinition>(): T[];

    /**
     * Get the columns on the blueprint that should be added.
     */
    getAddedColumns(): ColumnDefinition[];

    /**
     * Get the columns on the blueprint that should be changed.
     */
    getChangedColumns(): ColumnDefinition[];
}

import ColumnDefinition from '../../schema/definitions/column-definition';
import CommandDefinition from '../../schema/definitions/commands/command-definition';
import CommandForeignKeyDefinition from '../../schema/definitions/commands/command-foreign-key-definition';
import CommandIndexDefinition from '../../schema/definitions/commands/command-index-definition';
import BaseGrammarI from '../base-grammar';
import { ConnectionSessionI } from '../connection';
import { Stringable } from '../query/builder';
import BlueprintI from './blueprint';
import {
    ColumnDefinitionRegistryI,
    ColumnsRegistryI,
    CommandType,
    CommentRegistryI,
    RenameFullRegistryI,
    RenameRegistryI
} from './registry';

export default interface GrammarI extends Omit<BaseGrammarI, 'wrapTable'> {
    /**
     * Compile a create database command.
     */
    compileCreateDatabase(name: string, connection: ConnectionSessionI): string;

    /**
     * Compile the SQL needed to retrieve all table names.
     */
    compileGetAllTables(searchPath?: string | string[]): string;

    /**
     * Compile the SQL needed to retrieve all table views.
     */
    compileGetAllViews(searchPath?: string | string[]): string;

    /**
     * Compile the SQL needed to retrieve all type names.
     */
    compileGetAllTypes(): string;

    /**
     * Compile a drop database if exists command.
     */
    compileDropDatabaseIfExists(name: string): string;

    /**
     * Compile a drop table command.
     */
    compileDrop(blueprint: BlueprintI, command: CommandDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile the SQL needed to drop all tables.
     */
    compileDropAllTables(tables?: Stringable[]): string;

    /**
     * Compile the SQL needed to drop all views.
     */
    compileDropAllViews(views?: Stringable[]): string;

    /**
     * Compile the SQL needed to drop all types.
     */
    compileDropAllTypes(types?: Stringable[]): string;

    /**
     * Compile the command to drop all foreign keys.
     */
    compileDropAllForeignKeys(): string;

    /**
     * Compile the SQL needed to rebuild the database.
     */
    compileRebuild(): string;

    /**
     * Compile a create table command.
     */
    compileCreate(blueprint: BlueprintI, command: CommandDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile the query to determine the list of tables.
     */
    compileTableExists(): string;

    /**
     * Compile the query to determine the type of column.
     */
    compileColumnType(table?: string, column?: string): string;

    /**
     * Compile the query to determine the list of columns.
     */
    compileColumnListing(table?: string): string;

    /**
     * Compile the command to enable foreign key constraints.
     */
    compileEnableForeignKeyConstraints(): string;

    /**
     * Compile the command to disable foreign key constraints.
     */
    compileDisableForeignKeyConstraints(): string;

    /**
     * Compile the SQL needed to enable a writable schema.
     */
    compileEnableWriteableSchema(): string;

    /**
     * Compile the SQL needed to disable a writable schema.
     */
    compileDisableWriteableSchema(): string;

    /**
     * Compile a rename table command.
     */
    compileRename(
        blueprint: BlueprintI,
        command: CommandDefinition<RenameRegistryI>,
        connection: ConnectionSessionI
    ): string;

    /**
     * Compile an add column command.
     */
    compileAdd(blueprint: BlueprintI, command: CommandDefinition, connection: ConnectionSessionI): string | string[];

    /**
     * Compile a change column command into a series of SQL statements.
     */
    compileChange(blueprint: BlueprintI, command: CommandDefinition, connection: ConnectionSessionI): string | string[];

    /**
     * Compile a drop column command.
     */
    compileDropColumn(
        blueprint: BlueprintI,
        command: CommandDefinition<ColumnsRegistryI>,
        connection: ConnectionSessionI
    ): string | string[];

    /**
     * Compile a rename column command.
     */
    compileRenameColumn(
        blueprint: BlueprintI,
        command: CommandDefinition<RenameFullRegistryI>,
        connection: ConnectionSessionI
    ): string;

    /**
     * Compile the auto-incrementing column starting values.
     */
    compileAutoIncrementStartingValues(
        blueprint: BlueprintI,
        command: CommandDefinition<ColumnDefinitionRegistryI>,
        connection: ConnectionSessionI
    ): string;

    /**
     * Compile a comment command.
     */
    compileComment(
        blueprint: BlueprintI,
        command: CommandDefinition<ColumnDefinitionRegistryI>,
        connection: ConnectionSessionI
    ): string;

    /**
     * Compile a default command.
     */
    compileDefault(
        blueprint: BlueprintI,
        command: CommandDefinition<ColumnDefinitionRegistryI>,
        connection: ConnectionSessionI
    ): string;

    /**
     * Compile a primary key command.
     */
    compilePrimary(blueprint: BlueprintI, command: CommandIndexDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile a drop primary key command.
     */
    compileDropPrimary(blueprint: BlueprintI, command: CommandIndexDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile a unique key command.
     */
    compileUnique(blueprint: BlueprintI, command: CommandIndexDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile a drop unique key command.
     */
    compileDropUnique(blueprint: BlueprintI, command: CommandIndexDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile a index command.
     */
    compileIndex(blueprint: BlueprintI, command: CommandIndexDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile a drop index command.
     */
    compileDropIndex(blueprint: BlueprintI, command: CommandIndexDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile a fulltext index key command.
     */
    compileFulltext(blueprint: BlueprintI, command: CommandIndexDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile a drop fulltext index command.
     */
    compileDropFulltext(blueprint: BlueprintI, command: CommandIndexDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile a spatial index command.
     */
    compileSpatialIndex(blueprint: BlueprintI, command: CommandIndexDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile a drop spatial index command.
     */
    compileDropSpatialIndex(
        blueprint: BlueprintI,
        command: CommandIndexDefinition,
        connection: ConnectionSessionI
    ): string;

    /**
     * Compile a foreign key command.
     */
    compileForeign(blueprint: BlueprintI, command: CommandForeignKeyDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile a drop foreign key command.
     */
    compileDropForeign(
        blueprint: BlueprintI,
        command: CommandForeignKeyDefinition,
        connection: ConnectionSessionI
    ): string;

    /**
     * Compile a drop table (if exists) command.
     */
    compileDropIfExists(blueprint: BlueprintI, command: CommandDefinition, connection: ConnectionSessionI): string;

    /**
     * Compile a table comment command.
     */
    compileTableComment(
        blueprint: BlueprintI,
        command: CommandDefinition<CommentRegistryI>,
        connection: ConnectionSessionI
    ): string;

    /**
     * Compile a rename index command.
     */
    compileRenameIndex(
        blueprint: BlueprintI,
        command: CommandDefinition<RenameFullRegistryI>,
        connection: ConnectionSessionI
    ): string;

    /**
     * Add a prefix to an array of values.
     */
    prefixArray(prefix: string, values: string[]): string[];

    /**
     * Wrap a table in keyword identifiers.
     */
    wrapTable(table: Stringable | BlueprintI): string;

    /**
     * Wrap a value in keyword identifiers.
     */
    wrap(value: Stringable | CommandDefinition | ColumnDefinition, prefixAlias?: boolean): string;

    /**
     * Quote-escape the given tables, views, or types.
     */
    escapeNames(names: Stringable[]): string[];

    /**
     * Get the commands for the grammar.
     */
    getCommands(): CommandType[];

    /**
     * Check if this Grammar supports schema changes wrapped in a transaction.
     */
    supportsSchemaTransactions(): boolean;
}

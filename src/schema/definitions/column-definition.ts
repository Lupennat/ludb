import { Stringable } from '../../types/generics';
import { ColumnIndex, ColumnRegistryI, ColumnType } from '../../types/schema/registry';
import { createColumnRegistry } from '../registries';

class ColumnDefinition {
    protected registry: ColumnRegistryI;

    constructor(type: ColumnType, public name: Stringable, parameters: Partial<ColumnRegistryI>) {
        this.registry = createColumnRegistry(type);
        Object.assign(this.registry, parameters);
    }

    /**
     * Add key Value to Registry
     */
    protected addToRegistry<K extends keyof ColumnRegistryI>(key: K, value: ColumnRegistryI[K]): this {
        this.registry[key] = value;
        return this;
    }

    /**
     * Remove Index from Registry
     */
    public resetIndex(key: ColumnIndex): void {
        this.registry[key] = undefined;
    }

    /**
     * Get Column Registry
     */
    public getRegistry(): ColumnRegistryI {
        return this.registry;
    }

    /**
     * Place the column "after" another column (MySQL)
     */
    public after(column: Stringable): this {
        return this.addToRegistry('after', column);
    }

    /**
     * Used as a modifier for generatedAs() (PostgreSQL)
     */
    public always(value = true): this {
        return this.addToRegistry('always', value);
    }

    /**
     * Set INTEGER columns as auto-increment (primary key)
     */
    public autoIncrement(value = true): this {
        return this.addToRegistry('autoIncrement', value);
    }

    /**
     * Change the column
     */
    public change(): this {
        return this.addToRegistry('change', true);
    }

    /**
     * Specify a character set for the column (MySQL)
     */
    public charset(charset: Stringable): this {
        return this.addToRegistry('charset', charset);
    }

    /**
     *  Specify a collation for the column (MySQL/PostgreSQL/SQL Server)
     */
    public collation(collation: Stringable): this {
        return this.addToRegistry('collation', collation);
    }

    /**
     * Add a comment to the column (MySQL/PostgreSQL)
     */
    public comment(comment: string): this {
        return this.addToRegistry('comment', comment);
    }

    /**
     * Specify a "default" value for the column
     */
    public default(value: Stringable | boolean | number | bigint): this {
        return this.addToRegistry('default', value);
    }

    /**
     * Place the column "first" in the table (MySQL)
     */
    public first(): this {
        return this.addToRegistry('first', true);
    }

    /**
     *  Set the starting value of an auto-incrementing field (MySQL / PostgreSQL)
     */
    public from(startingValue: number | bigint): this {
        return this.addToRegistry('from', startingValue);
    }

    /**
     * Create a SQL compliant identity column (PostgreSQL)
     */
    public generatedAs(expression: Stringable | boolean = true): this {
        return this.addToRegistry('generatedAs', expression);
    }

    /**
     * Add an index
     */
    public index(indexName?: Stringable | boolean): this {
        return this.addToRegistry('index', indexName ?? true);
    }

    /**
     * Specify that the column should be invisible to "SELECT *" (MySQL)
     */
    public invisible(value = true): this {
        return this.addToRegistry('invisible', value);
    }

    /**
     * switch geography to geometry
     */
    public isGeometry(value = true): this {
        return this.addToRegistry('isGeometry', value);
    }

    /**
     * Allow NULL values to be inserted into the column
     */
    public nullable(value = true): this {
        return this.addToRegistry('nullable', value);
    }

    /**
     * Specify a "on update" value for the column
     */
    public onUpdate(value: Stringable | boolean | number | bigint): this {
        return this.addToRegistry('onUpdate', value);
    }

    /**
     * Mark the computed generated column as persistent (SQL Server)
     */
    public persisted(value = true): this {
        return this.addToRegistry('persisted', value);
    }

    /**
     * Add a primary index
     */
    public primary(value: Stringable | boolean = true): this {
        return this.addToRegistry('primary', value);
    }

    /**
     * add geometry/geography projection
     */
    public projection(number: number): this {
        return this.addToRegistry('projection', number);
    }

    /**
     *  Add a fulltext index
     */
    public fulltext(indexName?: Stringable | boolean): this {
        return this.addToRegistry('fulltext', indexName ?? true);
    }

    /**
     *  Rename Column To
     */
    public renameTo(column: Stringable): this {
        return this.addToRegistry('renameTo', column);
    }

    /**
     * Add a spatial index
     */
    public spatialIndex(indexName?: Stringable | boolean): this {
        return this.addToRegistry('spatialIndex', indexName ?? true);
    }

    /**
     * Point Srid
     */
    public srid(srid: number): this {
        return this.addToRegistry('srid', srid);
    }

    /**
     *  Set the starting value of an auto-incrementing field (MySQL/PostgreSQL)
     */
    public startingValue(startingValue: number | bigint): this {
        return this.addToRegistry('startingValue', startingValue);
    }

    /**
     *  Create a stored generated column (MySQL/PostgreSQL/SQLite)
     */
    public storedAs(expression: Stringable): this {
        return this.addToRegistry('storedAs', expression);
    }

    /**
     * Add a unique index
     */
    public unique(indexName?: Stringable | boolean): this {
        return this.addToRegistry('unique', indexName ?? true);
    }

    /**
     *  Remove a stored generated column (MySQL/PostgreSQL/SQLite)
     */
    public unsetStoredAs(): this {
        return this.addToRegistry('storedAs', null);
    }

    /**
     * Unset a virtual generated column (MySQL/PostgreSQL/SQLite)
     */
    public unsetVirtualAs(): this {
        return this.addToRegistry('virtualAs', null);
    }

    /**
     * Set the INTEGER column as UNSIGNED (MySQL)
     */
    public unsigned(value = true): this {
        return this.addToRegistry('unsigned', value);
    }

    /**
     * Set the TIMESTAMP column to use CURRENT_TIMESTAMP as default value
     */
    public useCurrent(value = true): this {
        return this.addToRegistry('useCurrent', value);
    }

    /**
     * Set the TIMESTAMP column to use CURRENT_TIMESTAMP when updating (MySQL)
     */
    public useCurrentOnUpdate(value = true): this {
        return this.addToRegistry('useCurrentOnUpdate', value);
    }

    /**
     * Create a virtual generated column (MySQL/PostgreSQL/SQLite)
     */
    public virtualAs(expression: Stringable): this {
        return this.addToRegistry('virtualAs', expression);
    }
}

export default ColumnDefinition;

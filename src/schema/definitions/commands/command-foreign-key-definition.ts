import { Stringable } from '../../../types/generics';
import { ForeignKeyRegistryI } from '../../../types/schema/registry';
import CommandIndexDefinition from './command-index-definition';

class CommandForeignKeyDefinition<
    Registry extends ForeignKeyRegistryI = ForeignKeyRegistryI
> extends CommandIndexDefinition<Registry> {
    /**
     * Set the foreign key as deferrable (PostgreSQL)
     */
    public on(table: Stringable): this {
        return this.addToRegistry('on', table);
    }

    /**
     * Add an ON DELETE action
     */
    public onDelete(action: Stringable): this {
        return this.addToRegistry('onDelete', action);
    }

    /**
     * Add an ON UPDATE action
     */
    public onUpdate(action: Stringable): this {
        return this.addToRegistry('onUpdate', action);
    }

    /**
     * Specify the referenced column(s)
     */
    public references(columns: Stringable | Stringable[]): this {
        return this.addToRegistry('references', columns);
    }

    /**
     * Add NOT VALID constraint
     */
    public notValid(value = true): this {
        return this.addToRegistry('notValid', value);
    }

    /**
     * Indicate that updates should cascade.
     */
    public cascadeOnUpdate(): this {
        return this.onUpdate('cascade');
    }

    /**
     * Indicate that updates should be restricted.
     */
    public restrictOnUpdate(): this {
        return this.onUpdate('restrict');
    }

    /**
     * Indicate that updates should have "no action".
     */
    public noActionOnUpdate(): this {
        return this.onUpdate('no action');
    }

    /**
     * Indicate that deletes should cascade.
     */
    public cascadeOnDelete(): this {
        return this.onDelete('cascade');
    }

    /**
     * Indicate that deletes should be restricted.
     */
    public restrictOnDelete(): this {
        return this.onDelete('restrict');
    }

    /**
     * Indicate that deletes should set the foreign key value to null.
     */
    public nullOnDelete(): this {
        return this.onDelete('set null');
    }

    /**
     * Indicate that deletes should have "no action".
     */
    public noActionOnDelete(): this {
        return this.onDelete('no action');
    }
}

export default CommandForeignKeyDefinition;

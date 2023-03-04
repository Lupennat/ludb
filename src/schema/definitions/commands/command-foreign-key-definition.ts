import { Stringable } from '../../../types/query/builder';
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
}

export default CommandForeignKeyDefinition;

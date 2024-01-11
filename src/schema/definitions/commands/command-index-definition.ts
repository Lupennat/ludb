import { Stringable } from '../../../types/generics';
import { IndexRegistryI } from '../../../types/schema/registry';
import CommandDefinition from './command-definition';

class CommandIndexDefinition<Registry extends IndexRegistryI = IndexRegistryI> extends CommandDefinition<Registry> {
    /**
     * Specify an algorithm for the index (MySQL/PostgreSQL)
     */
    public algorithm(algorithm: Stringable): this {
        return this.addToRegistry('algorithm', algorithm);
    }

    /**
     * Specify a language for the full text index (PostgreSQL)
     */
    public language(language: Stringable): this {
        return this.addToRegistry('language', language);
    }

    /**
     * Specify that the unique index is deferrable (PostgreSQL)
     */
    public deferrable(value = true): this {
        return this.addToRegistry('deferrable', value);
    }

    /**
     * Specify the default time to check the unique index constraint (PostgreSQL)
     */
    public initiallyImmediate(value = true): this {
        return this.addToRegistry('initiallyImmediate', value);
    }
}

export default CommandIndexDefinition;

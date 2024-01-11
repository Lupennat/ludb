import { CommandRegistryI, CommandType } from '../../../types/schema/registry';

class CommandDefinition<Registry extends CommandRegistryI = CommandRegistryI> {
    public shouldBeSkipped = false;

    constructor(
        public readonly name: CommandType,
        protected registry: Registry
    ) {}

    /**
     * Add key Value to Registry
     */
    protected addToRegistry<K extends keyof Registry>(key: K, value: Registry[K]): this {
        this.registry[key] = value;
        return this;
    }

    /**
     * Get Column Registry
     */
    public getRegistry(): Registry {
        return this.registry;
    }
}

export default CommandDefinition;

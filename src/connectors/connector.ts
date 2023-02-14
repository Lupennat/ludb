import deepmerge from 'deepmerge';
import { ATTR_CASE, ATTR_DEBUG, ATTR_NULLS, CASE_NATURAL, DEBUG_DISABLED, NULL_NATURAL, Pdo } from 'lupdo';
import PdoAttributes from 'lupdo/dist/typings/types/pdo-attributes';
import { PoolOptions } from 'lupdo/dist/typings/types/pdo-pool';
import { DriverFLattedConfig } from '../types/config';
import { ConnectorResolver } from '../types/connector';

class Connector {
    /**
     * The connection resolvers.
     */
    protected static resolvers: { [key: string]: ConnectorResolver } = {};

    /**
     * The default PDO connection attributes.
     */
    protected attributes: PdoAttributes = {
        [ATTR_CASE]: CASE_NATURAL,
        [ATTR_DEBUG]: DEBUG_DISABLED,
        [ATTR_NULLS]: NULL_NATURAL
    };

    /**
     * The default PDO pool options.
     */
    protected poolOptions: PoolOptions = {
        min: 1,
        max: 5
    };

    /**
     * Create a new PDO connection.
     */
    protected createConnection<T = any>(
        driver: string,
        options: T,
        poolOptions: PoolOptions,
        attributes: PdoAttributes
    ): Pdo {
        return new Pdo(driver, options, poolOptions, attributes);
    }

    /**
     * Get the PDO attributes based on the configuration.
     */
    protected getAttributes<T extends DriverFLattedConfig>(config: T): PdoAttributes {
        const attributes = config.attributes ?? {};

        return deepmerge(this.attributes, attributes);
    }

    /**
     * Get the PDO pool options based on the configuration.
     */
    protected getPoolOptions<T extends DriverFLattedConfig>(config: T): PoolOptions {
        const poolOptions = config.pool ?? {};

        return deepmerge(this.poolOptions, poolOptions);
    }

    /**
     * Get the default PDO attributes.
     */
    public getDefaultAttributes(): PdoAttributes {
        return this.attributes;
    }

    /**
     * Set the default PDO connection attributes.
     */
    public setDefaultAttributes(attributes: PdoAttributes): void {
        this.attributes = attributes;
    }

    /**
     * Get the default PDO pool options.
     */
    public getDefaultPoolOptions(): PoolOptions {
        return this.poolOptions;
    }

    /**
     * Set the default PDO pool options.
     */
    public setDefaultPoolOptions(poolOptions: PoolOptions): void {
        this.poolOptions = poolOptions;
    }

    /**
     * Register a connection resolver.
     */
    public static resolverFor(driver: string, callback: ConnectorResolver): void {
        Connector.resolvers[driver] = callback;
    }

    /**
     * Get the connection resolver for the given driver.
     */
    public static getResolver(driver: string): ConnectorResolver | null {
        return driver in Connector.resolvers ? Connector.resolvers[driver] : null;
    }
}

export default Connector;

import { ATTR_CASE, ATTR_DEBUG, ATTR_NULLS, CASE_NATURAL, DEBUG_DISABLED, NULL_NATURAL, Pdo } from 'lupdo';
import PdoAttributes from 'lupdo/dist/typings/types/pdo-attributes';
import { PoolOptions } from 'lupdo/dist/typings/types/pdo-pool';
import ConnectionConfig, { FlattedConnectionConfig } from '../types/config';
import ConnectorI from '../types/connector';
import { merge } from '../utils';

abstract class Connector implements ConnectorI {
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
        min: 0,
        max: 5
    };

    /**
     * Create a new PDO connection.
     */
    public createConnection<T = any>(
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
    protected getAttributes<T extends FlattedConnectionConfig<ConnectionConfig>>(config: T): PdoAttributes {
        const attributes = config.attributes ?? {};

        return merge(this.attributes, attributes);
    }

    /**
     * Get the PDO pool options based on the configuration.
     */
    protected getPoolOptions<T extends FlattedConnectionConfig<ConnectionConfig>>(config: T): PoolOptions {
        const poolOptions = config.pool ?? {};

        return merge(this.poolOptions, poolOptions);
    }

    public abstract connect(config: FlattedConnectionConfig<ConnectionConfig>): Pdo;
}

export default Connector;

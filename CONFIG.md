# Config

> Ludb offers an (almost) identical Laravel Database Configuration.

## Differences With Laravel

-   you can not define connection `url`
-   you can not define connection `options`; use `attributes` or `lupdo_options` to define Lupdo options and attributes.
-   every connection can define Lupdo [`attributes`](https://www.npmjs.com/package/lupdo#pdo-constants--attributes), defaults:

    -   ATTR_CASE: CASE_NATURAL
    -   ATTR_DEBUG: DEBUG_DISABLED
    -   ATTR_NULLS: NULL_NATURAL

-   every connection can define Lupdo [`pool`](https://www.npmjs.com/package/lupdo#pool-options) options, defaults:

    -   min: 0
    -   max: 5

-   every connection can define [`lupdo_options`](https://github.com/Lupennat/lupdo/blob/HEAD/DRIVER.md) to define custom Lupdo driver options.

## Example

```ts
import { DatabaseConfig } from 'ludb';
import { ATTR_CASE, CASE_LOWER } from 'lupdo';

const config: DatabaseConfig = {
    default: 'mysql',
    connections: {
        sqlite: {
            driver: 'sqlite',
            database: 'DB_DATABASE',
            prefix: '',
            prefix_indexes: true,
            foreign_key_constraints: false,
            attributes: {
                [ATTR_CASE]: CASE_LOWER
            }
        },

        mysql: {
            driver: 'mysql',
            host: 'DB_HOST',
            port: 'DB_PORT',
            database: 'DB_DATABASE',
            username: 'DB_USERNAME',
            password: 'DB_PASSWORD',
            unix_socket: 'DB_SOCKET',
            charset: 'utf8mb4',
            collation: 'utf8mb4_unicode_ci',
            prefix: '',
            strict: 'new',
            prefix_indexes: true,
            engine: 'InnoDB',
            attributes: {},
            pool: {
                min: 0,
                max: 15,
                created: async (uuid, connection) => {
                    await connection.query('SET SESSION wait_timeout=30');
                }
            }
        },

        pgsql: {
            driver: 'pgsql',
            host: 'DB_HOST',
            port: 'DB_PORT',
            database: 'DB_DATABASE',
            username: 'DB_USERNAME',
            password: 'DB_PASSWORD',
            charset: 'utf8',
            prefix: '',
            prefix_indexes: true,
            search_path: 'public',
            sslmode: 'prefer',
            attributes: {}
        },

        sqlsrv: {
            driver: 'sqlsrv',
            host: 'DB_HOST',
            port: 'DB_PORT',
            database: 'DB_DATABASE',
            charset: 'utf8',
            prefix: '',
            prefix_indexes: true,
            encrypt: true,
            trust_server_certificate: true,
            attributes: {},
            lupdo_options: {
                authentication: {
                    type: 'azure-active-directory-service-principal-secret',
                    options: {
                        clientId: "value",
                        clientSecret: "value",
                        tenantId: "(Optional)"
                    }
                }
            }
        }
    }
};
```

### SQLite Configuration

To enable foreign key constraints for SQLite connections, you should set the `foreign_key_constraints` config variable to `true`

### MySql and MariaDB Configuration

To enable strict modes you need to define `strict: 'new' | 'old'`. Mysql Databases prior to version `8.0.11` must use `old` mode, MariaDB Databases must use `new` mode.

## Read & Write Connections

Sometimes you may wish to use one database connection for SELECT statements, and another for INSERT, UPDATE, and DELETE statements. Ludb makes this a breeze, and the proper connections will always be used whether you are using raw queries and the query builder.

To see how read / write connections should be configured, let's look at this example:

```ts
    'mysql': {
        read: {
            host: [
                '192.168.1.1',
                '196.168.1.2',
            ],
        },
        write: {
            host: [
                '196.168.1.3',
            ],
        },
        driver: 'mysql',
        database: 'database',
        username: 'root',
        password: '',
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
        prefix: '',
    }
```

Note that three keys have been added to the configuration object: `read`, `write`. The `read` and `write` keys have object values containing a single key: `host`. The rest of the database options for the `read` and `write` connections will be merged from the main `mysql` configuration object.

You only need to place items in the `read` and `write` objects if you wish to override the values from the main `mysql` object. So, in this case, `192.168.1.1` will be used as the host for the "read" connection, while `192.168.1.3` will be used for the "write" connection. The database credentials, prefix, character set, and all other options in the main `mysql` object will be shared across both connections. When multiple values exist in the `host` configuration array, a database host will be randomly chosen for each pool connection.

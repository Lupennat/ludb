# Cache Manager

Ludb support caching queries for select operations, every connection-session can use a different strategy to get and store object in cache.

Ludb uses a cache manager service to enable the implementation of a cache driver, this service takes care of proxying methods to the instantiated driver of each connection.

Ludb gives the ability to share the same cache driver for all connections if needed by specifying it in the top-level `cache` configuration key.

Alternatively, it is possible to specify or overidde the shared driver by adding the `cache` configuration at the connection level.

When a select query need to be executed against database, ludb follow this pattern.

**select method** -> **cache manager get** -> **driver get** -> **QueryCache**

**if `QueryCache` is undefined** -> **run db query** -> **return result from db**

**if `QueryCache.result` is undefined** -> **run db query** -> **cache manager store** -> **driver store** -> **return result from db**

**if `QueryCache.result` is defined** -> **cache manager isExpire** -> **driver is Expire** -> **boolean**

**if `Expire` is false** -> **return result from cache**

**if `Expire` is true** -> **run db query** -> **cache manager store** -> **driver store** -> **return result from db**

> When `get` method return `undefined` Ludb suppose no cache driver can be used for cache and it skip other operations against cache manager for current connection-session.

## Cache Manager Proxy

Cache Manager do not cath any error, if you need to suppress error you should catch errors on your driver methods, otherwise every error will be thrown.

You can adopt any strategy you want to temporary lock/unlock cache.

## Cache Manager Driver

Cache manager Driver must implements [`CacheDriverI`](https://ludb.lupennat.com/api/interfaces/CacheDriverI.html) interface.

## Working with Json

Ludb expose two utilities function `jsonStringify` and `jsonParse`. You should use theese two function to manage `QueryCache` object because Lupdo can return from database `Buffer` and `BigInt` that are not fully supported by native JSON methods.

## Cache Driver Using Ioredis Example

```ts
import Redis, { Cluster, ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';
import {
    CacheDriverI,
    DatabaseManager,
    QueryCache,
    QueryCacheResponse,
    QueryCacheStore,
    jsonParse,
    jsonStringify
} from 'ludb';

type RedisManagerClusterOptions = {
    cluster: true;
    nodes: ClusterNode[];
    options?: ClusterOptions;
};

type RedisManagerNodeOptions = {
    cluster?: false;
    options: RedisOptions;
};

type RedisCacheOptions = RedisManagerClusterOptions | RedisManagerNodeOptions;

type CustomOptions = { renewBeforeMs?: number };

export class MockedCacheDriver implements CacheDriverI {
    protected client: Redis | Cluster | undefined;

    protected lockedTimeout: NodeJS.Timeout | undefined;

    protected locked: boolean = false;

    protected errorCounter: number = 0;

    protected errorCounterTimeout: NodeJS.Timeout | undefined;

    constructor(protected redisCacheOptions: RedisCacheOptions) {}

    protected async getClient(): Promise<Redis | Cluster | undefined> {
        if (this.locked) {
            return;
        }

        if (!this.client) {
            try {
                this.client = this.createClient();
            } catch (error) {
                this.applyLockStrategy(true);
            }
        }

        return this.client;
    }

    protected applyLockStrategy(forceLock = false) {
        if (this.errorCounter > 30 || forceLock) {
            this.locked = true;
            this.lockedTimeout = setTimeout(() => {
                this.resetErrorCounterTimeout();
                this.errorCounter = 0;
                this.lockedTimeout = undefined;
                this.locked = false;
            }, 60000);
        } else {
            this.resetErrorCounterTimeout();
            this.errorCounterTimeout = setTimeout(() => {
                this.errorCounter = 0;
            }, 15000);
            this.errorCounter++;
        }
    }

    protected resetErrorCounterTimeout(): void {
        clearTimeout(this.errorCounterTimeout);
        this.errorCounterTimeout = undefined;
    }

    protected createClient() {
        if (this.redisCacheOptions.cluster) {
            return new Redis.Cluster(this.redisCacheOptions.nodes, {
                ...this.redisCacheOptions.options,
                lazyConnect: true
            });
        } else {
            return new Redis({ ...this.redisCacheOptions.options, lazyConnect: true });
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
        }
    }

    async isExpired(time: number, duration: number, options: CustomOptions): Promise<boolean> {
        return time + duration < Date.now() - (options.renewBeforeMs ?? 0);
    }

    async get<T = any>(queryCache: QueryCache, options: CustomOptions): Promise<QueryCacheResponse<T> | undefined> {
        const client = await this.getClient();
        if (!client) {
            return;
        }
        try {
            const content = await client.get(queryCache.key);
            if (content === null) {
                return undefined;
            }
            return jsonParse<QueryCacheResponse<T>>(content);
        } catch (error) {
            this.applyLockStrategy();
            return undefined;
        }
    }

    async store<T = any>(queryCacheStore: QueryCacheStore<T>, options: CustomOptions): Promise<void> {
        const client = await this.getClient();
        if (client) {
            try {
                await client.set(queryCacheStore.key, jsonStringify(queryCacheStore), 'PX', queryCacheStore.duration);
            } catch (error) {
                this.applyLockStrategy();
            }
        }
    }
}

const DB = new DatabaseManager({
    cache: {
        resolver: () => {
            return new RedisCacheDriver({
                options: {
                    host: 'localhost',
                    db: 2
                }
            });
        },
        always: true,
        duration: 60 * 60 * 1000
    },
    connections: {
        db: { driver: 'sqlite', database: ':memory:' }
    }
});

const res = await DB.connection('db')
    .table('test')
    .cache({ options: { renewBeforeMs: 10000 } })
    .get();
```

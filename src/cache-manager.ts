import { createHash } from 'crypto';
import ExpressionContract from './query/expression-contract';
import { DBConfig } from './types';
import {
    CacheConfiguration,
    CacheDriverI,
    QueryCacheConnection,
    QueryCacheManager,
    QueryCacheManagerResponse,
    QueryCacheManagerStore
} from './types/cache';
import { BindingExclude, BindingExcludeObject } from './types/generics';
import { jsonStringify, merge } from './utils';

export default class CacheManager {
    /**
     * map connection with cache driver instances
     */
    protected cacheMap: Record<string, string> = {};

    /**
     * map connection cache config
     */
    protected cacheConfig: Record<string, Omit<CacheConfiguration, 'resolver'>> = {};

    /**
     * cache driver instances
     */
    protected caches: Record<string, CacheDriverI> = {};

    constructor(config: DBConfig) {
        this.createCaches(config);
    }

    /**
     * Generate cache driver instances for connections
     */
    protected createCaches(config: DBConfig): void {
        const allCache = config.cache || {};
        let hasAll = false;
        if (allCache.resolver) {
            hasAll = true;
            this.caches.all = allCache.resolver();

            delete allCache.resolver;
        }

        for (const name in config.connections) {
            const localCache = config.connections[name].cache || {};

            if (localCache.resolver) {
                this.caches[name] = localCache.resolver();
                delete localCache.resolver;
                this.cacheMap[name] = name;
            } else if (hasAll) {
                this.cacheMap[name] = 'all';
            }

            this.cacheConfig[name] = merge<Omit<CacheConfiguration, 'resolver'>>(allCache, localCache);
        }
    }

    /**
     * Generate Query Cache Object for current connection
     */
    protected generateQueryCache(
        connectionName: string,
        queryCacheConnection: QueryCacheConnection
    ): QueryCacheManager | undefined {
        const config = this.getCacheConfig(connectionName);
        const prefix = config.prefix;
        let duration: number;

        switch (true) {
            case queryCacheConnection.cache === false:
                return undefined;
            case queryCacheConnection.cache === undefined:
                if (!config.always) {
                    return undefined;
                }
                queryCacheConnection.cache = true;
            case queryCacheConnection.cache === true:
                queryCacheConnection.cache =
                    config.duration === undefined
                        ? 60000
                        : typeof config.duration === 'function'
                          ? config.duration()
                          : config.duration;
            default:
                duration =
                    typeof queryCacheConnection.cache === 'function'
                        ? queryCacheConnection.cache()
                        : queryCacheConnection.cache;
        }

        return {
            duration,
            key: `${connectionName}:${prefix ? prefix + ':' : ''}${
                queryCacheConnection.key ? queryCacheConnection.key + ':' : ''
            }${this.generateHash(queryCacheConnection.query, queryCacheConnection.bindings)}`,
            options: merge<Record<string, any>>(config.options ?? {}, queryCacheConnection.options ?? {}),
            time: Date.now()
        };
    }

    /**
     * Generate Hash from query and Bindings
     */
    protected generateHash(
        query: string,
        bindings: BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract>
    ): string {
        return createHash('md5')
            .update(`${query}${jsonStringify(bindings)}`)
            .digest('hex');
    }

    /**
     * Get cache config for connection
     */
    protected getCacheConfig(connectionName: string): Omit<CacheConfiguration, 'resolver'> {
        return this.cacheConfig[connectionName] ?? {};
    }

    /**
     * Get cache name for connection
     */
    protected getCacheName(connectionName: string): string | undefined {
        return this.cacheMap[connectionName];
    }

    /**
     * Get cache object for connection
     */
    protected getCache(connectionName: string): CacheDriverI | undefined {
        const cacheName = this.getCacheName(connectionName);
        if (!cacheName || !(cacheName in this.caches)) {
            return undefined;
        }

        return this.caches[cacheName];
    }

    /**
     * Checks if cache is expired or not.
     */
    public async isExpired(
        connectionName: string,
        time: number,
        duration: number,
        options: Record<string, any>
    ): Promise<boolean> {
        const cache = await this.getCache(connectionName);

        if (!cache) {
            return true;
        }

        return await cache.isExpired(time, duration, options);
    }

    /**
     * Get cached given query result.
     */
    public async get<T = any>(
        connectionName: string,
        queryCacheConnection: QueryCacheConnection
    ): Promise<QueryCacheManagerResponse<T> | undefined> {
        const queryCacheManager = this.generateQueryCache(connectionName, queryCacheConnection);

        if (!queryCacheManager) {
            return undefined;
        }

        const cache = this.getCache(connectionName);

        if (!cache) {
            return undefined;
        }

        const { options, ...queryCache } = queryCacheManager;
        const res = await cache.get<T>(queryCache, options);

        if (res) {
            return { ...res, options };
        }

        return queryCacheManager;
    }

    /**
     * Stores given query result in the cache.
     */
    public async store<T = any>(
        connectionName: string,
        queryCacheManagerStore: QueryCacheManagerStore<T>
    ): Promise<void> {
        const cache = this.getCache(connectionName);

        if (cache) {
            const { options, ...queryCache } = queryCacheManagerStore;
            await cache.store(queryCache, options);
        }
    }

    /**
     * Terminate cache manager
     */
    public async terminate(): Promise<void> {
        const promises = [];
        for (const name in this.caches) {
            if (this.caches[name]) {
                promises.push(this.caches[name].disconnect());
            }
        }
        await Promise.allSettled(promises);
    }
}

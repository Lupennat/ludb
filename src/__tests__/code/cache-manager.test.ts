import { MockedCacheDriver, MockedCacheManager } from './fixtures/mocked';

describe('Cache Manager', () => {
    it('Works Cache Merge Cache Config', () => {
        let cache = new MockedCacheManager({
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' },
                mysql: { driver: 'mysql', database: 'localhost' },
                sqlsrv: { driver: 'sqlsrv', database: 'localhost' },
                pgsql: { driver: 'pgsql', database: 'localhost' }
            }
        });

        expect(cache.getCacheConfigs()).toEqual({
            sqlite: {},
            mysql: {},
            sqlsrv: {},
            pgsql: {}
        });

        cache = new MockedCacheManager({
            cache: {
                duration: 10,
                always: true,
                prefix: 'perfix',
                options: { preserve: true }
            },
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' },
                mysql: { driver: 'mysql', database: 'localhost' },
                sqlsrv: {
                    driver: 'sqlsrv',
                    cache: {
                        options: { preserve: false }
                    },
                    database: 'localhost'
                },
                pgsql: {
                    driver: 'pgsql',
                    cache: {
                        options: { key: 'a' }
                    },
                    database: 'localhost'
                }
            }
        });

        expect(cache.getCacheConfigs()).toEqual({
            sqlite: {
                duration: 10,
                always: true,
                prefix: 'perfix',
                options: { preserve: true }
            },
            mysql: {
                duration: 10,
                always: true,
                prefix: 'perfix',
                options: { preserve: true }
            },
            sqlsrv: {
                duration: 10,
                always: true,
                prefix: 'perfix',
                options: { preserve: false }
            },
            pgsql: {
                duration: 10,
                always: true,
                prefix: 'perfix',
                options: { preserve: true, key: 'a' }
            }
        });
    });

    it('Works Cache Driver will be shared', () => {
        let cache = new MockedCacheManager({
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });

        expect(cache.getCachemap()).toEqual({});

        cache = new MockedCacheManager({
            cache: {
                resolver: () => {
                    return new MockedCacheDriver();
                }
            },
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' },
                mysql: { driver: 'mysql', database: 'localhost' },
                sqlsrv: {
                    cache: {
                        resolver: () => {
                            return new MockedCacheDriver();
                        }
                    },
                    driver: 'sqlsrv',
                    database: 'localhost'
                },
                pgsql: { driver: 'pgsql', database: 'localhost' }
            }
        });

        expect(cache.getCachemap()).toEqual({
            sqlite: 'all',
            mysql: 'all',
            sqlsrv: 'sqlsrv',
            pgsql: 'all'
        });

        expect(Object.keys(cache.getCaches())).toEqual(['all', 'sqlsrv']);
        expect(cache.getCaches().all).toBeInstanceOf(MockedCacheDriver);
        expect(cache.getCaches().sqlsrv).toBeInstanceOf(MockedCacheDriver);
    });

    it('Works get Cache Name', () => {
        const cache = new MockedCacheManager({
            cache: {
                resolver: () => {
                    return new MockedCacheDriver();
                }
            },
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });

        expect(cache.getCacheName('test')).toBeUndefined();
        expect(cache.getCacheName('sqlite')).toEqual('all');
    });

    it('Works get Cache Config', () => {
        const cache = new MockedCacheManager({
            cache: {
                resolver: () => {
                    return new MockedCacheDriver();
                }
            },
            connections: {
                sqlite: {
                    cache: {
                        options: { preserve: false }
                    },
                    driver: 'sqlite',
                    database: ':memory:'
                }
            }
        });

        expect(cache.getCacheConfig('test')).toEqual({});
        expect(cache.getCacheConfig('sqlite')).toEqual({ options: { preserve: false } });
    });

    it('Works get Cache', () => {
        const cache = new MockedCacheManager({
            cache: {
                resolver: () => {
                    return new MockedCacheDriver();
                }
            },
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });

        expect(cache.getCache('test')).toBeUndefined();
        expect(cache.getCache('sqlite')).toBeInstanceOf(MockedCacheDriver);
    });

    it('Works Generate Query Cache Duration', async () => {
        const cache = new MockedCacheManager({
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });

        jest.spyOn(cache, 'generateHash').mockReturnValue('hashed');

        jest.spyOn(cache, 'getCacheConfig')
            .mockReturnValueOnce({})
            .mockReturnValueOnce({ duration: 5000 })
            .mockReturnValueOnce({ always: true })
            .mockReturnValueOnce({ duration: 5000, always: true })
            .mockReturnValueOnce({ duration: () => 5000, always: true })
            .mockReturnValueOnce({ always: true })
            .mockReturnValueOnce({ always: true })
            .mockReturnValueOnce({})
            .mockReturnValueOnce({})
            .mockReturnValueOnce({});

        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                bindings: []
            })
        ).toBeUndefined();
        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                bindings: []
            })
        ).toBeUndefined();
        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                bindings: []
            })
        ).toEqual({
            duration: 60000,
            time: expect.any(Number),
            key: 'sqlite:hashed',
            options: {}
        });
        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                bindings: []
            })
        ).toEqual({
            duration: 5000,
            time: expect.any(Number),
            key: 'sqlite:hashed',
            options: {}
        });
        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                bindings: []
            })
        ).toEqual({
            duration: 5000,
            time: expect.any(Number),
            key: 'sqlite:hashed',
            options: {}
        });

        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                bindings: [],
                cache: false
            })
        ).toBeUndefined();

        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                bindings: [],
                cache: true
            })
        ).toEqual({
            duration: 60000,
            time: expect.any(Number),
            key: 'sqlite:hashed',
            options: {}
        });

        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                bindings: [],
                cache: 3000
            })
        ).toEqual({
            duration: 3000,
            time: expect.any(Number),
            key: 'sqlite:hashed',
            options: {}
        });

        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                bindings: [],
                cache: () => 2000
            })
        ).toEqual({
            duration: 2000,
            time: expect.any(Number),
            key: 'sqlite:hashed',
            options: {}
        });
    });

    it('Works Generate Query Cache Key', async () => {
        const cache = new MockedCacheManager({
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });

        jest.spyOn(cache, 'generateHash').mockReturnValue('hashed');

        jest.spyOn(cache, 'getCacheConfig')
            .mockReturnValueOnce({ always: true })
            .mockReturnValueOnce({ prefix: 'test_prefix', always: true });

        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                key: 'test_key',
                bindings: []
            })
        ).toEqual({
            duration: 60000,
            time: expect.any(Number),
            key: 'sqlite:test_key:hashed',
            options: {}
        });

        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                key: 'test_key',
                bindings: []
            })
        ).toEqual({
            duration: 60000,
            time: expect.any(Number),
            key: 'sqlite:test_prefix:test_key:hashed',
            options: {}
        });
    });

    it('Works Generate Hash', async () => {
        const cache = new MockedCacheManager({
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });

        jest.spyOn(cache, 'getCacheConfig').mockReturnValue({ always: true });

        expect(
            cache.generateQueryCache('sqlite', {
                query: 'sql',
                key: 'test_key',
                bindings: []
            })
        ).toEqual({
            duration: 60000,
            time: expect.any(Number),
            key: expect.any(String),
            options: {}
        });
    });

    it('Works Get Call Generate Query Cache', async () => {
        const cache = new MockedCacheManager({
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });

        const spiedGenerate = jest
            .spyOn(cache, 'generateQueryCache')
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce({
                duration: 60000,
                time: 10,
                key: 'test',
                options: {}
            });

        const spiedGet = jest.spyOn(cache, 'getCache').mockReturnValueOnce(undefined);

        expect(
            await cache.get('sqlite', {
                query: 'sql',
                key: 'test_key',
                bindings: []
            })
        ).toBeUndefined();

        expect(
            await cache.get('sqlite', {
                query: 'sql',
                key: 'test_key',
                bindings: []
            })
        ).toBeUndefined();

        expect(spiedGenerate).toHaveBeenCalledTimes(2);
        expect(spiedGet).toHaveBeenCalledTimes(1);
    });

    it('Works Get Call Driver Cache Get', async () => {
        const driver = new MockedCacheDriver();

        const spiedGet = jest
            .spyOn(driver, 'get')
            .mockImplementationOnce(async () => {
                return undefined;
            })
            .mockImplementationOnce(async obj => {
                return {
                    ...obj,
                    result: undefined
                };
            })
            .mockImplementationOnce(async obj => {
                return {
                    ...obj,
                    result: ''
                };
            })
            .mockImplementationOnce(async obj => {
                return {
                    ...obj,
                    result: [1, 2, 3, 4]
                };
            })
            .mockImplementationOnce(async () => {
                return {
                    time: 15,
                    key: 'test_modified',
                    duration: 5000,
                    options: {},
                    result: [1, 2, 3, 4]
                };
            });

        const cache = new MockedCacheManager({
            cache: {
                resolver: () => {
                    return driver;
                }
            },
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });

        jest.spyOn(cache, 'generateQueryCache').mockReturnValue({
            duration: 60000,
            time: 10,
            key: 'test',
            options: {}
        });

        expect(
            await cache.get('sqlite', {
                query: 'sql',
                key: 'test_key',
                bindings: []
            })
        ).toEqual({
            duration: 60000,
            time: 10,
            key: 'test',
            options: {}
        });

        expect(
            await cache.get('sqlite', {
                query: 'sql',
                key: 'test_key',
                bindings: []
            })
        ).toEqual({
            duration: 60000,
            time: 10,
            key: 'test',
            options: {}
        });

        expect(
            await cache.get('sqlite', {
                query: 'sql',
                key: 'test_key',
                bindings: []
            })
        ).toEqual({
            duration: 60000,
            time: 10,
            key: 'test',
            result: '',
            options: {}
        });

        expect(
            await cache.get('sqlite', {
                query: 'sql',
                key: 'test_key',
                bindings: []
            })
        ).toEqual({
            duration: 60000,
            result: [1, 2, 3, 4],
            time: 10,
            key: 'test',
            options: {}
        });

        expect(
            await cache.get('sqlite', {
                query: 'sql',
                key: 'test_key',
                bindings: []
            })
        ).toEqual({
            duration: 5000,
            time: 15,
            key: 'test_modified',
            options: {},
            result: [1, 2, 3, 4]
        });

        expect(spiedGet).toHaveBeenCalledTimes(5);
        expect(spiedGet).toHaveBeenNthCalledWith(1, { duration: 60000, key: 'test', time: 10 }, {});
        expect(spiedGet).toHaveBeenNthCalledWith(2, { duration: 60000, key: 'test', time: 10 }, {});
        expect(spiedGet).toHaveBeenNthCalledWith(3, { duration: 60000, key: 'test', time: 10 }, {});
        expect(spiedGet).toHaveBeenNthCalledWith(4, { duration: 60000, key: 'test', time: 10 }, {});
        expect(spiedGet).toHaveBeenNthCalledWith(5, { duration: 60000, key: 'test', time: 10 }, {});
    });

    it('Works Is Expired Call Driver Is Expired', async () => {
        const driver = new MockedCacheDriver();

        jest.spyOn(driver, 'isExpired')
            .mockImplementationOnce(async () => {
                return false;
            })
            .mockImplementationOnce(async () => {
                return true;
            });

        const cache = new MockedCacheManager({
            cache: {
                resolver: () => {
                    return driver;
                }
            },
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });

        jest.spyOn(cache, 'getCache').mockReturnValueOnce(undefined);

        expect(await cache.isExpired('sqlite', 15, 5000, {})).toBeTruthy();
        expect(await cache.isExpired('sqlite', 15, 5000, {})).toBeFalsy();
        expect(await cache.isExpired('sqlite', 15, 5000, {})).toBeTruthy();
    });

    it('Works Store Call Driver Cache Store', async () => {
        const driver = new MockedCacheDriver();

        const spiedStore = jest.spyOn(driver, 'store');

        const cache = new MockedCacheManager({
            cache: {
                resolver: () => {
                    return driver;
                }
            },
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });

        jest.spyOn(cache, 'getCache').mockReturnValueOnce(undefined);

        await cache.store('sqlite', { duration: 60000, result: [1, 2, 3, 4], time: 10, key: 'test', options: {} });
        await cache.store('sqlite', { duration: 60000, result: [1, 2, 3, 4], time: 10, key: 'test', options: {} });

        expect(spiedStore).toHaveBeenCalledTimes(1);
        expect(spiedStore).toHaveBeenCalledWith(
            {
                duration: 60000,
                result: [1, 2, 3, 4],
                time: 10,
                key: 'test'
            },
            {}
        );
    });

    it('Works Terminate', async () => {
        const driver = new MockedCacheDriver();

        const spiedDisconnect = jest.spyOn(driver, 'disconnect');

        const cache = new MockedCacheManager({
            cache: {
                resolver: () => {
                    return driver;
                }
            },
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });

        await cache.terminate();
        expect(spiedDisconnect).toHaveBeenCalledTimes(1);
    });
});

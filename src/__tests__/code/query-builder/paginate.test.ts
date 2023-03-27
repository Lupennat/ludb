import Cursor from '../../../paginations/cursor';
import CursorPaginator from '../../../paginations/cursor-paginator';
import LengthAwarePaginator from '../../../paginations/length-aware-paginator';
import Paginator from '../../../paginations/paginator';
import { Builder } from '../../../query';
import { getBuilder, pdo } from '../fixtures/mocked';

describe('Query Builder Paginate', () => {
    const path = 'http://foo.bar?page=3';

    beforeAll(() => {
        Paginator.currentPathResolver(() => {
            return path;
        });
    });

    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Get Count For Pagination', async () => {
        const builder = getBuilder();
        builder.orderBy('test').limit(10).offset(20);

        jest.spyOn(builder.getConnection(), 'select')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('select count(*) as aggregate');
                expect(bindings).toEqual([]);
                return [{ aggregate: 2 }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('select count(*) as aggregate');
                expect(bindings).toEqual([]);
                return [];
            });

        expect(await builder.getCountForPagination()).toBe(2);
        expect(await builder.getCountForPagination()).toBe(0);
    });

    it('Works Get Count For Pagination With Union', async () => {
        const builder = getBuilder();
        builder.select('id', 'start_time as created_at').selectRaw("'video' as type").from('videos');
        builder.orderBy('test').limit(10).offset(20);
        builder.union(getBuilder().select('id', 'created_at').selectRaw("'news' as type").from('news'));
        jest.spyOn(builder.getConnection(), 'select')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select count("test") as aggregate from ((select "id", "start_time" as "created_at", \'video\' as type from "videos") union (select "id", "created_at", \'news\' as type from "news")) as "temp_table"'
                );
                expect(bindings).toEqual([]);
                return [{ aggregate: 2 }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select count("test") as aggregate from ((select "id", "start_time" as "created_at", \'video\' as type from "videos") union (select "id", "created_at", \'news\' as type from "news")) as "temp_table"'
                );
                expect(bindings).toEqual([]);
                return [];
            });

        expect(await builder.getCountForPagination('test')).toBe(2);
        expect(await builder.getCountForPagination('test as special')).toBe(0);
    });

    it('Works Get Count For Pagination With Group By', async () => {
        const builder = getBuilder();
        builder.select('id', 'start_time as created_at').selectRaw("'video' as type").from('videos');
        builder.orderBy('test').limit(10).offset(20).groupBy('type');
        builder.union(getBuilder().select('id', 'created_at').selectRaw("'news' as type").from('news'));
        jest.spyOn(builder.getConnection(), 'select')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select count("test") as aggregate from ((select "id", "start_time" as "created_at", \'video\' as type from "videos" group by "type") union (select "id", "created_at", \'news\' as type from "news")) as "aggregate_table"'
                );
                expect(bindings).toEqual([]);
                return [{ aggregate: 2 }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select count("test") as aggregate from ((select "id", "start_time" as "created_at", \'video\' as type from "videos" group by "type") union (select "id", "created_at", \'news\' as type from "news")) as "aggregate_table"'
                );
                expect(bindings).toEqual([]);
                return [];
            });

        expect(await builder.getCountForPagination('test')).toBe(2);
        expect(await builder.getCountForPagination('test as special')).toBe(0);
    });

    it('Works Get Count For Pagination With Group By And Joins', async () => {
        const builder = getBuilder();
        builder.from('videos').join('user', 'user_id', 'id').orderBy('test').limit(10).offset(20).groupBy('type');
        jest.spyOn(builder.getConnection(), 'select')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select count("test") as aggregate from (select "videos".* from "videos" inner join "user" on "user_id" = "id" group by "type") as "aggregate_table"'
                );
                expect(bindings).toEqual([]);
                return [{ aggregate: 2 }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select count("test") as aggregate from (select "videos".* from "videos" inner join "user" on "user_id" = "id" group by "type") as "aggregate_table"'
                );
                expect(bindings).toEqual([]);
                return [];
            });

        expect(await builder.getCountForPagination('test')).toBe(2);
        expect(await builder.getCountForPagination('test as special')).toBe(0);
    });

    it('Works Paginate', async () => {
        const perPage = 16;
        const columns = ['test'];
        const name = 'page-name';
        const page = -1;
        const builder = getBuilder();
        const results = [{ test: 'foo' }, { test: 'bar' }];

        jest.spyOn(builder, 'getCountForPagination').mockResolvedValueOnce(2);
        const spiedForPage = jest.spyOn(builder, 'forPage');
        const spiedGet = jest.spyOn(builder, 'get').mockResolvedValueOnce(results);

        const res = await builder.paginate(perPage, columns, name, page);

        expect(spiedForPage).toHaveBeenCalledWith(1, perPage);
        expect(spiedForPage).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);
        expect(res).toBeInstanceOf(LengthAwarePaginator);
        expect(res.toObject()).toEqual(
            new LengthAwarePaginator(results, 2, perPage, 1, {
                path: path,
                name: name
            }).toObject()
        );
    });

    it('Works Paginate With Default Arguments', async () => {
        const perPage = 15;
        const name = 'page';
        const page = 1;
        const builder = getBuilder();
        const results = [{ test: 'foo' }, { test: 'bar' }];

        jest.spyOn(builder, 'getCountForPagination').mockResolvedValueOnce(2);
        const spiedForPage = jest.spyOn(builder, 'forPage');
        const spiedGet = jest.spyOn(builder, 'get').mockResolvedValueOnce(results);

        const res = await builder.paginate();

        expect(spiedForPage).toHaveBeenCalledWith(page, perPage);
        expect(spiedForPage).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);
        expect(res.toObject()).toEqual(
            new LengthAwarePaginator(results, 2, perPage, page, {
                path: path,
                name: name
            }).toObject()
        );
    });

    it('Works Paginate With No Results', async () => {
        const perPage = 15;
        const name = 'page';
        const page = 1;
        const path = 'http://foo.bar?page=3';
        const builder = getBuilder();
        const results: any[] = [];

        jest.spyOn(builder, 'getCountForPagination').mockResolvedValueOnce(0);
        const spiedForPage = jest.spyOn(builder, 'forPage');
        const spiedGet = jest.spyOn(builder, 'get');

        const res = await builder.paginate();

        expect(spiedForPage).not.toBeCalled();
        expect(spiedGet).not.toBeCalled();
        expect(res.toObject()).toEqual(
            new LengthAwarePaginator(results, 0, perPage, page, {
                path: path,
                name: name
            }).toObject()
        );
    });

    it('Works Paginate With Specific Columns', async () => {
        const perPage = 16;
        const columns = ['id', 'name'];
        const name = 'page-name';
        const page = 1;
        const builder = getBuilder();
        const results = [
            { id: 3, name: 'Taylor' },
            { id: 5, name: 'Mohamed' }
        ];

        jest.spyOn(builder, 'getCountForPagination').mockResolvedValueOnce(2);
        const spiedForPage = jest.spyOn(builder, 'forPage');
        const spiedGet = jest.spyOn(builder, 'get').mockResolvedValueOnce(results);

        const res = await builder.paginate(perPage, columns, name, page);

        expect(spiedForPage).toHaveBeenCalledWith(page, perPage);
        expect(spiedForPage).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);
        expect(res.toObject()).toEqual(
            new LengthAwarePaginator(results, 2, perPage, page, {
                path: path,
                name: name
            }).toObject()
        );
    });

    it('Works Paginate With Page Callback', async () => {
        const perPage = (total: number): number => {
            expect(total).toBe(2);
            return 16;
        };
        const columns = ['id', 'name'];
        const name = 'page-name';
        const page = -1;
        const builder = getBuilder();
        const results = [
            { id: 3, name: 'Taylor' },
            { id: 5, name: 'Mohamed' }
        ];

        jest.spyOn(builder, 'getCountForPagination').mockResolvedValueOnce(2);
        const spiedForPage = jest.spyOn(builder, 'forPage');
        const spiedGet = jest.spyOn(builder, 'get').mockResolvedValueOnce(results);

        const res = await builder.paginate(perPage, columns, name, page);

        expect(spiedForPage).toHaveBeenCalledWith(1, 16);
        expect(spiedForPage).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);
        expect(res.toObject()).toEqual(
            new LengthAwarePaginator(results, 2, 16, 1, {
                path: path,
                name: name
            }).toObject()
        );
    });

    it('Works Simple Paginate', async () => {
        const perPage = 16;
        const columns = ['test'];
        const name = 'page-name';
        const page = 1;
        const builder = getBuilder();
        const results = [{ test: 'foo' }, { test: 'bar' }];

        const spiedCount = jest.spyOn(builder, 'getCountForPagination');
        const spiedForPage = jest.spyOn(builder, 'forPage');
        const spiedOffset = jest.spyOn(builder, 'offset');
        const spiedLimit = jest.spyOn(builder, 'limit');
        const spiedGet = jest.spyOn(builder, 'get').mockResolvedValueOnce(results);

        const res = await builder.simplePaginate(perPage, columns, name, page);

        expect(spiedOffset).toHaveBeenCalledWith((page - 1) * perPage);
        expect(spiedOffset).toBeCalledTimes(1);
        expect(spiedLimit).toHaveBeenCalledWith(perPage + 1);
        expect(spiedLimit).toBeCalledTimes(1);
        expect(spiedCount).not.toBeCalled();
        expect(spiedForPage).not.toBeCalled();

        expect(spiedGet).toBeCalledTimes(1);
        expect(res).toBeInstanceOf(Paginator);
        expect(res.toObject()).toEqual(
            new Paginator(results, perPage, page, {
                path: path,
                name: name
            }).toObject()
        );
    });

    it('Works Simple Paginate With Default Arguments', async () => {
        const perPage = 15;
        const name = 'page';
        const page = 1;
        const builder = getBuilder();
        const results = [{ test: 'foo' }, { test: 'bar' }];

        const spiedCount = jest.spyOn(builder, 'getCountForPagination');
        const spiedForPage = jest.spyOn(builder, 'forPage');
        const spiedOffset = jest.spyOn(builder, 'offset');
        const spiedLimit = jest.spyOn(builder, 'limit');
        const spiedGet = jest.spyOn(builder, 'get').mockResolvedValueOnce(results);

        const res = await builder.simplePaginate();

        expect(spiedOffset).toHaveBeenCalledWith((page - 1) * perPage);
        expect(spiedOffset).toBeCalledTimes(1);
        expect(spiedLimit).toHaveBeenCalledWith(perPage + 1);
        expect(spiedLimit).toBeCalledTimes(1);
        expect(spiedCount).not.toBeCalled();
        expect(spiedForPage).not.toBeCalled();

        expect(spiedGet).toBeCalledTimes(1);
        expect(res).toBeInstanceOf(Paginator);
        expect(res.toObject()).toEqual(
            new Paginator(results, perPage, page, {
                path: path,
                name: name
            }).toObject()
        );
    });

    it('Works Simple Paginate With No Results', async () => {
        const perPage = 15;
        const name = 'page';
        const page = 1;
        const builder = getBuilder();
        const results: any[] = [];

        const spiedCount = jest.spyOn(builder, 'getCountForPagination');
        const spiedForPage = jest.spyOn(builder, 'forPage');
        const spiedOffset = jest.spyOn(builder, 'offset');
        const spiedLimit = jest.spyOn(builder, 'limit');
        const spiedGet = jest.spyOn(builder, 'get').mockResolvedValueOnce(results);

        const res = await builder.simplePaginate();

        expect(spiedOffset).toHaveBeenCalledWith((page - 1) * perPage);
        expect(spiedOffset).toBeCalledTimes(1);
        expect(spiedLimit).toHaveBeenCalledWith(perPage + 1);
        expect(spiedLimit).toBeCalledTimes(1);
        expect(spiedCount).not.toBeCalled();
        expect(spiedForPage).not.toBeCalled();

        expect(spiedGet).toBeCalledTimes(1);
        expect(res).toBeInstanceOf(Paginator);
        expect(res.toObject()).toEqual(
            new Paginator(results, perPage, page, {
                path: path,
                name: name
            }).toObject()
        );
    });

    it('Works Simple Paginate With Specific Columns', async () => {
        const perPage = 16;
        const columns = ['id', 'name'];
        const name = 'page-name';
        const page = -1;
        const builder = getBuilder();
        const results = [
            { id: 3, name: 'Taylor' },
            { id: 5, name: 'Mohamed' }
        ];

        const spiedCount = jest.spyOn(builder, 'getCountForPagination');
        const spiedForPage = jest.spyOn(builder, 'forPage');
        const spiedOffset = jest.spyOn(builder, 'offset');
        const spiedLimit = jest.spyOn(builder, 'limit');
        const spiedGet = jest.spyOn(builder, 'get').mockResolvedValueOnce(results);

        const res = await builder.simplePaginate(perPage, columns, name, page);

        expect(spiedOffset).toHaveBeenCalledWith(0);
        expect(spiedOffset).toBeCalledTimes(1);
        expect(spiedLimit).toHaveBeenCalledWith(perPage + 1);
        expect(spiedLimit).toBeCalledTimes(1);
        expect(spiedCount).not.toBeCalled();
        expect(spiedForPage).not.toBeCalled();

        expect(spiedGet).toBeCalledTimes(1);
        expect(res).toBeInstanceOf(Paginator);
        expect(res.toObject()).toEqual(
            new Paginator(results, perPage, 1, {
                path: path,
                name: name
            }).toObject()
        );
    });

    it('Works Cursor Paginate', async () => {
        const perPage = 16;
        const columns = ['test'];
        const name = 'cursor-name';
        const cursor = new Cursor({ test: 'bar' });
        const builder = getBuilder();
        builder.from('foobar').orderBy('test');

        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        const results = [{ test: 'foo' }, { test: 'bar' }];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect('select * from "foobar" where ("test" > ?) order by "test" asc limit 17').toBe(builder.toSql());
            expect(['bar']).toEqual(builder.getRegistry().bindings.where);
            return results;
        });

        const res = await builder.cursorPaginate(perPage, columns, name, cursor);

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['test']
            }).toObject()
        );
    });

    it('Works Cursor Paginate With String', async () => {
        const perPage = 16;
        const columns = ['test'];
        const name = 'cursor-name';
        const cursor = new Cursor({ test: 'bar' });
        const builder = getBuilder();
        builder.from('foobar').orderBy('test');

        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        const results = [{ test: 'foo' }, { test: 'bar' }];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect('select * from "foobar" where ("test" > ?) order by "test" asc limit 17').toBe(builder.toSql());
            expect(['bar']).toEqual(builder.getRegistry().bindings.where);
            return results;
        });

        const res = await builder.cursorPaginate(perPage, columns, name, cursor.encode());

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['test']
            }).toObject()
        );
    });

    it('Works Cursor Paginate Multiple Order Columns', async () => {
        const perPage = 16;
        const columns = ['test', 'another'];
        const name = 'cursor-name';
        const cursor = new Cursor({ test: 'bar', another: 'foo' });
        const builder = getBuilder();
        builder.from('foobar').orderBy('test').orderBy('another');

        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        const results = [
            { test: 'foo', another: 1 },
            { test: 'bar', another: 2 }
        ];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect(
                'select * from "foobar" where ("test" > ? or ("test" = ? and ("another" > ?))) order by "test" asc, "another" asc limit 17'
            ).toBe(builder.toSql());
            expect(['bar', 'bar', 'foo']).toEqual(builder.getRegistry().bindings.where);
            return results;
        });

        const res = await builder.cursorPaginate(perPage, columns, name, cursor);

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['test', 'another']
            }).toObject()
        );
    });

    it('Works Cursor Paginate With Default Arguments', async () => {
        const perPage = 15;
        const name = 'cursor';
        const cursor = new Cursor({ test: 'bar' });
        const builder = getBuilder();
        builder.from('foobar').orderBy('test');

        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        CursorPaginator.currentCursorResolver(() => {
            return cursor;
        });

        const results = [{ test: 'foo' }, { test: 'bar' }];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect('select * from "foobar" where ("test" > ?) order by "test" asc limit 16').toBe(builder.toSql());
            expect(['bar']).toEqual(builder.getRegistry().bindings.where);
            return results;
        });

        const res = await builder.cursorPaginate();

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['test']
            }).toObject()
        );
    });

    it('Works Cursor Paginate When No Results', async () => {
        const perPage = 15;
        const name = 'cursor';
        const cursor = new Cursor({ test: 'bar' });
        const builder = getBuilder();
        builder.from('foobar').orderBy('test');

        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        CursorPaginator.currentCursorResolver(() => {
            return cursor;
        });

        const results: any[] = [];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            return results;
        });

        const res = await builder.cursorPaginate();

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['test']
            }).toObject()
        );
    });

    it('Works Cursor Paginate With Specific Columns', async () => {
        const perPage = 16;
        const columns = ['id', 'name'];
        const name = 'cursor';
        const cursor = new Cursor({ id: 2 });
        const builder = getBuilder();
        builder.from('foobar').orderBy('id');

        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        const results = [
            { id: 3, name: 'Claudio' },
            { id: 5, name: 'Taylor' }
        ];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect('select * from "foobar" where ("id" > ?) order by "id" asc limit 17').toBe(builder.toSql());
            expect([2]).toEqual(builder.getRegistry().bindings.where);
            return results;
        });

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        const res = await builder.cursorPaginate(perPage, columns, name, cursor);

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['id']
            }).toObject()
        );
    });

    it('Works Cursor Paginate With Mixed Orders', async () => {
        const perPage = 16;
        const columns = ['foo', 'bar', 'baz'];
        const name = 'cursor';
        const cursor = new Cursor({ foo: 1, bar: 2, baz: 3 });
        const builder = getBuilder();
        builder
            .from('foobar')
            .selectRaw("(CONCAT(bar, ' ', baz)) as foo")
            .orderBy('foo')
            .orderByDesc('bar')
            .orderBy('baz');

        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        const results = [
            { foo: 1, bar: 2, baz: 4 },
            { foo: 1, bar: 1, baz: 1 }
        ];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect(
                'select (CONCAT(bar, \' \', baz)) as foo from "foobar" where ((CONCAT(bar, \' \', baz)) > ? or ((CONCAT(bar, \' \', baz)) = ? and ("bar" < ? or ("bar" = ? and ("baz" > ?))))) order by "foo" asc, "bar" desc, "baz" asc limit 17'
            ).toBe(builder.toSql());
            expect([1, 1, 2, 2, 3]).toEqual(builder.getRegistry().bindings.where);
            return results;
        });

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        const res = await builder.cursorPaginate(perPage, columns, name, cursor);

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['foo', 'bar', 'baz']
            }).toObject()
        );
    });

    it('Works Cursor Paginate With Dynamic Column In Select Raw', async () => {
        const perPage = 15;
        const name = 'cursor';
        const cursor = new Cursor({ test: 'bar' });
        const builder = getBuilder();
        builder.from('foobar').select('*').selectRaw("(CONCAT(firstname, ' ', lastname)) as test").orderBy('test');

        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        const results = [{ test: 'foo' }, { test: 'bar' }];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect(
                'select *, (CONCAT(firstname, \' \', lastname)) as test from "foobar" where ((CONCAT(firstname, \' \', lastname)) > ?) order by "test" asc limit 16'
            ).toBe(builder.toSql());
            expect(['bar']).toEqual(builder.getRegistry().bindings.where);
            return results;
        });

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        CursorPaginator.currentCursorResolver(() => {
            return cursor;
        });

        const res = await builder.cursorPaginate();

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['test']
            }).toObject()
        );
    });

    it('Works Cursor Paginate With Dynamic Column With Cast In Select Raw', async () => {
        const perPage = 15;
        const name = 'cursor';
        const cursor = new Cursor({ test: 'bar' });
        const builder = getBuilder();
        builder
            .from('foobar')
            .select('*')
            .selectRaw("(CAST(CONCAT(firstname, ' ', lastname) as VARCHAR)) as test")
            .orderBy('test');

        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        const results = [{ test: 'foo' }, { test: 'bar' }];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect(
                'select *, (CAST(CONCAT(firstname, \' \', lastname) as VARCHAR)) as test from "foobar" where ((CAST(CONCAT(firstname, \' \', lastname) as VARCHAR)) > ?) order by "test" asc limit 16'
            ).toBe(builder.toSql());
            expect(['bar']).toEqual(builder.getRegistry().bindings.where);
            return results;
        });

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        CursorPaginator.currentCursorResolver(() => {
            return cursor;
        });

        const res = await builder.cursorPaginate();

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['test']
            }).toObject()
        );
    });

    it('Works Cursor Paginate With Dynamic Column In Sub Select', async () => {
        const perPage = 15;
        const name = 'cursor';
        const cursor = new Cursor({ test: 'bar' });
        const builder = getBuilder();
        builder.from('foobar').select('*').selectSub("CONCAT(firstname, ' ', lastname)", 'test').orderBy('test');

        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        const results = [{ test: 'foo' }, { test: 'bar' }];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect(
                'select *, (CONCAT(firstname, \' \', lastname)) as "test" from "foobar" where ((CONCAT(firstname, \' \', lastname)) > ?) order by "test" asc limit 16'
            ).toBe(builder.toSql());
            expect(['bar']).toEqual(builder.getRegistry().bindings.where);
            return results;
        });

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        CursorPaginator.currentCursorResolver(() => {
            return cursor;
        });

        const res = await builder.cursorPaginate();

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['test']
            }).toObject()
        );
    });

    it('Works Cursor Paginate With Union Wheres', async () => {
        const ts = '2023-03-25 15:00:00';
        const perPage = 16;
        const columns = ['test'];
        const name = 'cursor-name';
        const cursor = new Cursor({ created_at: ts });
        const builder = getBuilder();
        builder.select('id', 'start_time as created_at').selectRaw("'video' as type").from('videos');
        builder.union(getBuilder().select('id', 'created_at').selectRaw("'news' as type").from('news'));
        builder.orderBy('created_at');
        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        const results = [
            { id: 1, created_at: '2023-03-25 15:10:00', type: 'video' },
            { id: 2, created_at: '2023-03-25 15:11:00', type: 'news' }
        ];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect(
                '(select "id", "start_time" as "created_at", \'video\' as type from "videos" where ("start_time" > ?)) union (select "id", "created_at", \'news\' as type from "news" where ("start_time" > ?)) order by "created_at" asc limit 17'
            ).toBe(builder.toSql());
            expect([ts]).toEqual(builder.getRegistry().bindings.where);
            expect([ts]).toEqual(builder.getRegistry().bindings.union);
            return results;
        });

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        const res = await builder.cursorPaginate(perPage, columns, name, cursor);

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['created_at']
            }).toObject()
        );
    });

    it('Works Cursor Paginate With Union Wheres With Raw Order Expression', async () => {
        const ts = '2023-03-25 15:00:00';
        const perPage = 16;
        const columns = ['test'];
        const name = 'cursor-name';
        const cursor = new Cursor({ created_at: ts });
        const builder = getBuilder();
        builder
            .select('id', 'is_published', 'start_time as created_at')
            .selectRaw("'video' as type")
            .where('is_published', true)
            .from('videos');
        builder.union(
            getBuilder()
                .select('id', 'is_published', 'created_at')
                .selectRaw("'news' as type")
                .where('is_published', true)
                .from('news')
        );
        builder.orderByRaw('case when (id = 3 and type="news" then 0 else 1 end)').orderBy('created_at');
        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        const results = [
            { id: 1, created_at: '2023-03-25 15:10:00', type: 'video', is_published: true },
            { id: 2, created_at: '2023-03-25 15:11:00', type: 'news', is_published: true }
        ];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect(
                '(select "id", "is_published", "start_time" as "created_at", \'video\' as type from "videos" where "is_published" = ? and ("start_time" > ?)) union (select "id", "is_published", "created_at", \'news\' as type from "news" where "is_published" = ? and ("start_time" > ?)) order by case when (id = 3 and type="news" then 0 else 1 end), "created_at" asc limit 17'
            ).toBe(builder.toSql());
            expect([true, ts]).toEqual(builder.getRegistry().bindings.where);
            expect([true, ts]).toEqual(builder.getRegistry().bindings.union);
            return results;
        });

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        const res = await builder.cursorPaginate(perPage, columns, name, cursor);

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['created_at']
            }).toObject()
        );
    });

    it('Works Cursor Paginate With Union Wheres Reverse Order', async () => {
        const ts = '2023-03-25 15:00:00';
        const perPage = 16;
        const columns = ['test'];
        const name = 'cursor-name';
        const cursor = new Cursor({ created_at: ts, id: 1 }, false);
        const builder = getBuilder();
        builder.select('id', 'start_time as created_at').selectRaw("'video' as type").from('videos');
        builder.union(getBuilder().select('id', 'created_at').selectRaw("'news' as type").from('news'));
        builder.orderBy('created_at').orderByDesc('id');
        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        const results = [
            { id: 1, created_at: '2023-03-25 15:10:00', type: 'video' },
            { id: 2, created_at: '2023-03-25 15:11:00', type: 'news' }
        ];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect(
                '(select "id", "start_time" as "created_at", \'video\' as type from "videos" where ("start_time" < ? or ("start_time" = ? and ("id" > ?)))) union (select "id", "created_at", \'news\' as type from "news" where ("start_time" < ? or ("start_time" = ? and ("id" > ?)))) order by "created_at" asc, "id" desc limit 17'
            ).toBe(builder.toSql());
            expect([ts, ts, 1]).toEqual(builder.getRegistry().bindings.where);
            expect([ts, ts, 1]).toEqual(builder.getRegistry().bindings.union);
            return results;
        });

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        const res = await builder.cursorPaginate(perPage, columns, name, cursor);

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);
        expect(res.toObject()).toEqual(
            new CursorPaginator(results.reverse(), perPage, cursor, {
                path,
                name,
                parameters: ['created_at', 'id']
            }).toObject()
        );
    });

    it('Works Cursor Paginate With Union Wheres Multiple Orders', async () => {
        const ts = '2023-03-25 15:00:00';
        const perPage = 16;
        const columns = ['test'];
        const name = 'cursor-name';
        const cursor = new Cursor({ created_at: ts, id: 1 });
        const builder = getBuilder();
        builder.select('id', 'start_time as created_at').selectRaw("'video' as type").from('videos');
        builder.union(getBuilder().select('id', 'created_at').selectRaw("'news' as type").from('news'));
        builder.orderByDesc('created_at').orderBy('id');

        const spiedNewQuery = jest.spyOn(builder, 'newQuery').mockImplementation(() => {
            return new Builder(builder.getConnection(), builder.getGrammar());
        });

        const path = `http://foo.bar?cursor=${cursor.encode()}`;

        const results = [
            { id: 1, created_at: '2023-03-25 15:10:00', type: 'video' },
            { id: 2, created_at: '2023-03-25 15:11:00', type: 'news' }
        ];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            expect(
                '(select "id", "start_time" as "created_at", \'video\' as type from "videos" where ("start_time" < ? or ("start_time" = ? and ("id" > ?)))) union (select "id", "created_at", \'news\' as type from "news" where ("start_time" < ? or ("start_time" = ? and ("id" > ?)))) order by "created_at" desc, "id" asc limit 17'
            ).toBe(builder.toSql());
            expect([ts, ts, 1]).toEqual(builder.getRegistry().bindings.where);
            expect([ts, ts, 1]).toEqual(builder.getRegistry().bindings.union);
            return results;
        });

        CursorPaginator.currentPathResolver(() => {
            return path;
        });

        const res = await builder.cursorPaginate(perPage, columns, name, cursor);

        expect(spiedNewQuery).toBeCalledTimes(1);
        expect(spiedGet).toBeCalledTimes(1);

        expect(res.toObject()).toEqual(
            new CursorPaginator(results, perPage, cursor, {
                path,
                name,
                parameters: ['created_at', 'id']
            }).toObject()
        );
    });
});

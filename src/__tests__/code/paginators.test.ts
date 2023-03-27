import Cursor from '../../paginations/cursor';
import CursorPaginator from '../../paginations/cursor-paginator';
import LengthAwarePaginator from '../../paginations/length-aware-paginator';
import Paginator from '../../paginations/paginator';
import { Objectable } from '../../types/query/builder';

describe('Paginators', () => {
    it('Works Length Aware Paginator', async () => {
        let paginator = new LengthAwarePaginator([{ test: 1 }, { test: 2 }, { test: 3 }, { test: 4 }], 10, 4, 1, {
            name: 'name',
            path: '/path'
        });
        expect(paginator.url(-1)).toBe('/path?name=1');
        paginator.appends('param1', 'value1');
        paginator.appends({ param2: 'value2', param3: 'value3' });
        paginator.appends('name', 'forbidden');
        expect(paginator.currentPage()).toBe(1);
        expect(paginator.firstItem()).toBe(1);
        expect(paginator.fragment()).toBeUndefined();
        paginator.fragment('test');
        expect(paginator.fragment()).toBe('test');
        expect(paginator.hasMorePages()).toBeTruthy();
        expect(paginator.hasPages()).toBeTruthy();
        expect(paginator.isEmpty()).toBeFalsy();
        expect(paginator.isNotEmpty()).toBeTruthy();
        expect(paginator.items()).toEqual([{ test: 1 }, { test: 2 }, { test: 3 }, { test: 4 }]);
        expect(paginator.lastItem()).toBe(4);
        expect(paginator.lastPage()).toBe(3);
        expect(paginator.nextPageUrl()).toBe('/path?name=2&param1=value1&param2=value2&param3=value3#test');
        expect(paginator.path()).toBe('/path');
        expect(paginator.perPage()).toBe(4);
        expect(paginator.previousPageUrl()).toBeNull();
        expect(paginator.toObject()).toEqual({
            current_page: 1,
            data: [{ test: 1 }, { test: 2 }, { test: 3 }, { test: 4 }],
            first_page_url: '/path?name=1&param1=value1&param2=value2&param3=value3#test',
            from: 1,
            prev_page_url: null,
            path: '/path',
            per_page: 4,
            to: 4,
            next_page_url: '/path?name=2&param1=value1&param2=value2&param3=value3#test',
            last_page: 3,
            last_page_url: '/path?name=3&param1=value1&param2=value2&param3=value3#test',
            total: 10
        });
        expect(JSON.stringify(paginator)).toEqual(JSON.stringify(paginator.toObject()));
        expect(paginator.total()).toBe(10);
        expect(paginator.url(2)).toBe('/path?name=2&param1=value1&param2=value2&param3=value3#test');

        paginator = new LengthAwarePaginator([{ test: 5 }, { test: 6 }, { test: 7 }, { test: 8 }], 10, 4, 2, {
            name: 'name',
            path: '/path?paramExists=1'
        });

        expect(paginator.toObject()).toEqual({
            current_page: 2,
            data: [{ test: 5 }, { test: 6 }, { test: 7 }, { test: 8 }],
            first_page_url: '/path?paramExists=1&name=1',
            from: 5,
            prev_page_url: '/path?paramExists=1&name=1',
            path: '/path?paramExists=1',
            per_page: 4,
            to: 8,
            next_page_url: '/path?paramExists=1&name=3',
            last_page: 3,
            last_page_url: '/path?paramExists=1&name=3',
            total: 10
        });

        paginator = new LengthAwarePaginator([{ test: 9 }, { test: 10 }], 10, 4, 3, {
            name: 'name',
            path: '/path'
        });

        expect(paginator.toObject()).toEqual({
            current_page: 3,
            data: [{ test: 9 }, { test: 10 }],
            first_page_url: '/path?name=1',
            from: 9,
            prev_page_url: '/path?name=2',
            path: '/path',
            per_page: 4,
            to: 10,
            next_page_url: null,
            last_page: 3,
            last_page_url: '/path?name=3',
            total: 10
        });
    });

    it('Works Simple Paginator', async () => {
        expect(Paginator.resolveCurrentPath()).toBe('/');
        expect(Paginator.resolveCurrentPath('/path')).toBe('/path');
        expect(Paginator.resolveCurrentPage()).toBe(1);
        expect(Paginator.resolveCurrentPage('param')).toBe(1);
        Paginator.currentPageResolver((name: string) => {
            expect(name).toBe('param');
            return 2;
        });
        expect(Paginator.resolveCurrentPage('param')).toBe(2);

        let items = [
            { test: 1 },
            { test: 2 },
            { test: 3 },
            { test: 4 },
            { test: 5 },
            { test: 6 },
            { test: 7 },
            { test: 8 },
            { test: 9 },
            { test: 10 }
        ];
        let paginator = new Paginator(items, 4, -1, {
            name: 'name',
            path: '/path'
        });

        expect(paginator.toObject()).toEqual({
            current_page: 1,
            data: [{ test: 1 }, { test: 2 }, { test: 3 }, { test: 4 }],
            first_page_url: '/path?name=1',
            from: 1,
            prev_page_url: null,
            path: '/path',
            per_page: 4,
            to: 4,
            next_page_url: '/path?name=2'
        });

        paginator = new Paginator(items, 4, 'a', {
            name: 'name',
            path: '/path'
        });

        expect(paginator.toObject()).toEqual({
            current_page: 1,
            data: [{ test: 1 }, { test: 2 }, { test: 3 }, { test: 4 }],
            first_page_url: '/path?name=1',
            from: 1,
            prev_page_url: null,
            path: '/path',
            per_page: 4,
            to: 4,
            next_page_url: '/path?name=2'
        });

        items = [{ test: 5 }, { test: 6 }, { test: 7 }, { test: 8 }, { test: 9 }, { test: 10 }];

        paginator = new Paginator(items, 4, 2, {
            name: 'name',
            path: '/path'
        });

        expect(paginator.toObject()).toEqual({
            current_page: 2,
            data: [{ test: 5 }, { test: 6 }, { test: 7 }, { test: 8 }],
            first_page_url: '/path?name=1',
            from: 5,
            prev_page_url: '/path?name=1',
            path: '/path',
            per_page: 4,
            to: 8,
            next_page_url: '/path?name=3'
        });

        items = [{ test: 9 }, { test: 10 }];

        paginator = new Paginator(items, 4, 3, {
            name: 'name',
            path: '/path'
        });

        expect(paginator.toObject()).toEqual({
            current_page: 3,
            data: [{ test: 9 }, { test: 10 }],
            first_page_url: '/path?name=1',
            from: 9,
            prev_page_url: '/path?name=2',
            path: '/path',
            per_page: 4,
            to: 10,
            next_page_url: null
        });

        paginator = new Paginator([], 4, 2, {
            name: 'name',
            path: '/path'
        });

        expect(paginator.toObject()).toEqual({
            current_page: 2,
            data: [],
            first_page_url: '/path?name=1',
            from: null,
            prev_page_url: '/path?name=1',
            path: '/path',
            per_page: 4,
            to: null,
            next_page_url: null
        });
    });

    it('Works Cursor', async () => {
        const cursor = new Cursor(
            {
                id: '422',
                created_at: '2023-03-25 10:00:00'
            },
            true
        );

        expect(cursor).toEqual(Cursor.fromEncoded(cursor.encode()));

        expect(['2023-03-25 10:00:00', '422']).toEqual(cursor.parameters(['created_at', 'id']));
        expect('2023-03-25 10:00:00').toEqual(cursor.parameter('created_at'));

        expect(() => {
            cursor.parameter('test');
        }).toThrowError('Unable to find parameter [test] in pagination item.');

        expect(Cursor.fromEncoded('wrongencoded')).toBeNull();
    });

    it('Works Cursor Paginator', async () => {
        expect(CursorPaginator.resolveCurrentCursor()).toBeNull();
        const results = [{ id: 1 }, { id: 2 }, { id: 3 }];

        let paginator = new CursorPaginator(results, 2, null, {
            name: 'cursor',
            path: '/',
            parameters: ['id']
        });

        paginator.appends('param1', 'value1');
        paginator.fragment('test');

        expect(paginator.url()).toBe('/?param1=value1#test');

        expect(paginator.hasPages()).toBeTruthy();
        expect(paginator.hasMorePages()).toBeTruthy();
        expect(paginator.toObject()).toEqual({
            data: [{ id: 1 }, { id: 2 }],
            path: '/',
            per_page: 2,
            next_cursor: new Cursor({ id: '2' }).encode(),
            next_page_url: `/?cursor=${new Cursor({ id: '2' }).encode()}&param1=value1#test`,
            prev_cursor: null,
            prev_page_url: null
        });

        expect(JSON.stringify(paginator)).toEqual(JSON.stringify(paginator.toObject()));

        paginator = new CursorPaginator([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }], 2, null, {
            name: 'cursor',
            path: '/',
            parameters: ['id']
        });
        expect(paginator.onFirstPage()).toBeTruthy();
        expect(paginator.onLastPage()).toBeFalsy();

        let cursor = new Cursor({ id: '3' });
        paginator = new CursorPaginator([{ id: 3 }, { id: 4 }], 2, cursor, {
            name: 'cursor',
            path: '/',
            parameters: ['id']
        });

        expect(paginator.onFirstPage()).toBeFalsy();
        expect(paginator.onLastPage()).toBeTruthy();

        paginator = new CursorPaginator([], 1, cursor, {
            name: 'cursor',
            path: '/',
            parameters: ['test.id']
        });

        expect(paginator.previousCursor()).toBeNull();
        expect(paginator.nextCursor()).toBeNull();
        // @ts-expect-error simulate id null
        expect(paginator.getCursorForItem({ id: null })).toEqual(new Cursor({ 'test.id': '' }, true));

        class Test {
            id = null;
        }

        expect(() => {
            // @ts-expect-error simulate not object value
            paginator.getCursorForItem(new Test());
        }).toThrowError('Only plain objects are supported when cursor paginating items.');

        class Test2 implements Objectable<{ id: number }> {
            id = 2;
            toObject(): { id: number } {
                return { id: this.id };
            }
        }

        expect(paginator.getCursorForItem(new Test2())).toEqual(new Cursor({ 'test.id': '2' }, true));

        cursor = new Cursor({ id: '3' }, false);
        paginator = new CursorPaginator([{ id: 3 }, { id: 4 }], 2, cursor, {
            name: 'cursor',
            path: '/',
            parameters: ['id']
        });

        expect(paginator.onFirstPage()).toBeTruthy();
        expect(paginator.onLastPage()).toBeFalsy();

        expect(paginator.toObject()).toEqual({
            data: [{ id: 4 }, { id: 3 }],
            path: '/',
            per_page: 2,
            next_cursor: new Cursor({ id: '3' }, true).encode(),
            next_page_url: `/?cursor=${new Cursor({ id: '3' }, true).encode()}`,
            prev_cursor: null,
            prev_page_url: null
        });

        cursor = new Cursor({ id: '3' }, false);
        paginator = new CursorPaginator([], 2, cursor, {
            name: 'cursor',
            path: '/',
            parameters: ['id']
        });

        expect(paginator.toObject()).toEqual({
            data: [],
            path: '/',
            per_page: 2,
            next_cursor: null,
            next_page_url: null,
            prev_cursor: null,
            prev_page_url: null
        });
    });
});

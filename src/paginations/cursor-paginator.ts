import { isPlainObject } from 'is-plain-object';
import { CursorPaginatorI, CursorPaginatorObject, CursorPaginatorOptions } from '../types/paginations';
import { Objectable } from '../types/query/grammar-builder';
import { afterLast, isObjectable } from '../utils';
import AbstractPaginator from './abstract-paginator';
import Cursor from './cursor';

class CursorPaginator<T> extends AbstractPaginator<T, CursorPaginatorOptions> implements CursorPaginatorI<T> {
    protected static currentCursorResolverCallback: ((name: string) => Cursor | null) | undefined;

    protected hasMore: boolean;

    constructor(results: T[], perPageNumber: number, protected cursor: Cursor | null, options: CursorPaginatorOptions) {
        super(results, perPageNumber, options);
        this.results =
            this.cursor !== null && this.cursor.pointsToPreviousItems() ? this.results.reverse() : this.results;

        this.hasMore = this.results.length > this.perPageNumber;
        this.results = this.results.slice(0, this.perPageNumber);
    }

    /**
     * Determine if there are more items in the data source.
     */
    public hasMorePages(): boolean {
        return (
            (this.cursor === null && this.hasMore) ||
            (this.cursor !== null && this.cursor.pointsToNextItems() && this.hasMore) ||
            (this.cursor !== null && this.cursor.pointsToPreviousItems())
        );
    }

    /**
     * Determine if there are enough items to split into multiple pages.
     */
    public hasPages(): boolean {
        return !this.onFirstPage() || this.hasMorePages();
    }

    /**
     * Determine if the paginator is on the first page.
     */
    public onFirstPage(): boolean {
        return this.cursor === null || (this.cursor.pointsToPreviousItems() && !this.hasMore);
    }

    /**
     * Determine if the paginator is on the last page.
     */
    public onLastPage(): boolean {
        return !this.hasMorePages();
    }

    /**
     * Get the URL for a given cursor.
     */
    public url(cursor?: Cursor): string {
        // If we have any extra query string key / value pairs that need to be added
        // onto the URL, we will put them in query string form and then attach it
        // to the URL. This allows for extra information like sortings storage.
        return this.generateUrl(cursor === undefined ? {} : { [this.options.name]: cursor.encode() });
    }

    /**
     * Get the URL for the previous page.
     */
    public previousPageUrl(): string | null {
        const previousCursor = this.previousCursor();
        if (previousCursor === null) {
            return null;
        }

        return this.url(previousCursor);
    }

    /**
     * The URL for the next page, or null.
     */
    public nextPageUrl(): string | null {
        const nextCursor = this.nextCursor();
        if (nextCursor === null) {
            return null;
        }

        return this.url(nextCursor);
    }

    /**
     * Get the "cursor" that points to the previous set of items.
     */
    public previousCursor(): Cursor | null {
        if (this.cursor === null || (this.cursor.pointsToPreviousItems() && !this.hasMore)) {
            return null;
        }

        if (this.results.length === 0) {
            return null;
        }

        return this.getCursorForItem(this.results[0], false);
    }

    /**
     * Get the "cursor" that points to the next set of items.
     */
    public nextCursor(): Cursor | null {
        if (
            (this.cursor === null && !this.hasMore) ||
            (this.cursor !== null && this.cursor.pointsToNextItems() && !this.hasMore)
        ) {
            return null;
        }

        if (this.results.length === 0) {
            return null;
        }

        return this.getCursorForItem(this.results[this.results.length - 1], true);
    }

    /**
     * Get a cursor instance for the given item.
     */
    public getCursorForItem(item: T, isNext = true): Cursor {
        return new Cursor(this.getParametersForItem(item), isNext);
    }

    /**
     * Get the cursor parameters for a given object.
     */
    public getParametersForItem(item: T | Objectable<T>): { [key: string]: string } {
        return this.options.parameters.reduce((carry, parameter) => {
            if (isObjectable(item)) {
                item = item.toObject();
            }

            if (!isPlainObject(item)) {
                throw new Error('Only plain objects are supported when cursor paginating items.');
            }

            carry[parameter] = this.ensureParameterIsPrimitive(
                parameter in (item as any) ? (item as any)[parameter] : (item as any)[afterLast(parameter, '.')]
            );

            return carry;
        }, Object.create({}));
    }

    /**
     * Ensure the parameter is a primitive type.
     *
     * This can resolve issues that arise the developer uses a value object for an attribute.
     */
    protected ensureParameterIsPrimitive(parameter: any): string {
        return parameter == null ? '' : parameter.toString();
    }

    /**
     * Get the instance as a dictionary.
     */
    public toObject(): CursorPaginatorObject<T> {
        const nextCursor = this.nextCursor();
        const previousCursor = this.previousCursor();
        return {
            data: this.items(),
            path: this.path(),
            per_page: this.perPage(),
            next_cursor: nextCursor === null ? null : nextCursor.encode(),
            next_page_url: this.nextPageUrl(),
            prev_cursor: previousCursor === null ? null : previousCursor.encode(),
            prev_page_url: this.previousPageUrl()
        };
    }

    public toJSON(): any {
        return this.toObject();
    }

    /**
     * Resolve the current cursor or return the default value.
     */
    public static resolveCurrentCursor(name = 'cursor', defaultCursor: Cursor | null = null): Cursor | null {
        if (this.currentCursorResolverCallback != null) {
            return this.currentCursorResolverCallback(name);
        }

        return defaultCursor;
    }

    /**
     * Set the current cursor resolver callback.
     */
    public static currentCursorResolver(resolver: (name: string) => Cursor | null): void {
        this.currentCursorResolverCallback = resolver;
    }
}

export default CursorPaginator;

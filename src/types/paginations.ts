import Cursor from '../paginations/cursor';

export interface CursorPaginatorI<T> {
    /**
     * Get all of the items being paginated.
     */
    items(): T[];

    /**
     * Determine how many items are being shown per page.
     */
    perPage(): number;

    /**
     * Determine if the list of items is empty or not.
     */
    isEmpty(): boolean;

    /**
     * Determine if the list of items is not empty.
     */
    isNotEmpty(): boolean;

    /**
     * Get the base path for paginator generated URLs.
     */
    path(): string;

    /**
     * Determine if there are enough items to split into multiple pages.
     */
    hasPages(): boolean;

    /**
     * Determine if there are more items in the data store.
     */
    hasMorePages(): boolean;

    /**
     * Get the URL for a given page.
     */
    url(cursor?: Cursor): string;

    /**
     * The URL for the next page, or null.
     */
    nextPageUrl(): string | null;

    /**
     * Get the URL for the previous page, or null.
     */
    previousPageUrl(): string | null;

    /**
     * Add a set of query string values to the paginator.
     */
    appends(values: { [key: string]: string }): this;
    appends(key: string, value: string): this;
    appends(keyValue: { [key: string]: string } | string, value?: string): this;

    /**
     * Get / set the URL fragment to be appended to URLs.
     */
    fragment(): string | undefined;
    fragment(fragment: string): this;
    fragment(fragment?: string): string | undefined | this;

    /**
     * Determine if the paginator is on the first page.
     */
    onFirstPage(): boolean;

    /**
     * Determine if the paginator is on the last page.
     */
    onLastPage(): boolean;

    /**
     * Get the "cursor" that points to the previous set of items.
     */
    previousCursor(): Cursor | null;

    /**
     * Get the "cursor" that points to the next set of items.
     */
    nextCursor(): Cursor | null;

    /**
     * Get a cursor instance for the given item.
     */
    getCursorForItem(item: T, isNext?: boolean): Cursor;

    /**
     * Get the cursor parameters for a given object.
     */
    getParametersForItem(item: T): { [key: string]: string };

    /**
     * Get the instance as a dictionary.
     */
    toObject(): CursorPaginatorObject<T>;
}

export default interface PaginatorI<T> {
    /**
     * Get all of the items being paginated.
     */
    items(): T[];

    /**
     * Get the "index" of the first item being paginated.
     */
    firstItem(): number | null;

    /**
     * Get the "index" of the last item being paginated.
     */
    lastItem(): number | null;

    /**
     * Determine how many items are being shown per page.
     */
    perPage(): number;

    /**
     * Determine the current page being paginated.
     */
    currentPage(): number;

    /**
     * Determine if the list of items is empty or not.
     */
    isEmpty(): boolean;

    /**
     * Determine if the list of items is not empty.
     */
    isNotEmpty(): boolean;

    /**
     * Get the base path for paginator generated URLs.
     */
    path(): string;

    /**
     * Determine if there are enough items to split into multiple pages.
     */
    hasPages(): boolean;

    /**
     * Determine if there are more items in the data store.
     */
    hasMorePages(): boolean;

    /**
     * Get the URL for a given page.
     */
    url(page: number): string;

    /**
     * The URL for the next page, or null.
     */
    nextPageUrl(): string | null;

    /**
     * Get the URL for the previous page, or null.
     */
    previousPageUrl(): string | null;

    /**
     * Add a set of query string values to the paginator.
     */
    appends(values: { [key: string]: string }): this;
    appends(key: string, value: string): this;
    appends(keyValue: { [key: string]: string } | string, value?: string): this;

    /**
     * Get / set the URL fragment to be appended to URLs.
     */
    fragment(): string | undefined;
    fragment(fragment: string): this;
    fragment(fragment?: string): string | undefined | this;

    /**
     * Get the instance as a dictionary.
     */
    toObject(): PaginatorObject<T>;
}

export interface LengthAwarePaginatorI<T> extends PaginatorI<T> {
    /**
     * Determine the total number of items in the data store.
     */
    total(): number;

    /**
     * Get the page number of the last available page.
     */
    lastPage(): number;

    /**
     * Get the instance as a dictionary.
     */
    toObject(): LengthAwarePaginatorObject<T>;
}

export interface PaginatorObject<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number | null;
    prev_page_url: string | null;
    path: string;
    per_page: number;
    to: number | null;
    next_page_url: string | null;
}

export interface LengthAwarePaginatorObject<T> extends PaginatorObject<T> {
    last_page: number;
    last_page_url: string;
    total: number;
}

export interface CursorPaginatorObject<T> {
    data: T[];
    path: string;
    per_page: number;
    next_cursor: string | null;
    next_page_url: string | null;
    prev_cursor: string | null;
    prev_page_url: string | null;
}

export interface PaginatorOptions {
    path: string;
    name: string;
}

export interface CursorPaginatorOptions extends PaginatorOptions {
    parameters: string[];
}

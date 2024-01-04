import { PaginatorOptions } from '../types/paginations';

abstract class AbstractPaginator<T, U extends PaginatorOptions = PaginatorOptions> {
    protected customFragment: undefined | string;
    protected query: { [key: string]: string } = {};

    /**
     * The current path resolver callback.
     */
    protected static currentPathResolverCallback: (() => string) | undefined;

    constructor(
        protected results: T[],
        protected perPageNumber: number,
        protected options: U
    ) {}

    /**
     * Get all of the items being paginated.
     */
    public items(): T[] {
        return this.results;
    }

    /**
     * Determine how many items are being shown per page.
     */
    public perPage(): number {
        return this.perPageNumber;
    }

    /**
     * Determine if the list of items is empty or not.
     */
    public isEmpty(): boolean {
        return this.items().length === 0;
    }

    /**
     * Determine if the list of items is not empty.
     */
    public isNotEmpty(): boolean {
        return !this.isEmpty();
    }

    /**
     * Get the base path for paginator generated URLs.
     */
    public path(): string {
        return this.options.path;
    }

    /**
     * Add a set of query string values to the paginator.
     */
    public appends(values: { [key: string]: string }): this;
    public appends(key: string, value: string): this;
    public appends(keyValue: { [key: string]: string } | string, value?: string): this;
    public appends(keyValue: { [key: string]: string } | string, value?: string): this {
        if (typeof keyValue === 'string') {
            return this.addQuery(keyValue, value!);
        }

        return this.appendObject(keyValue);
    }

    /**
     * Add an object of query string values.
     */
    protected appendObject(values: { [key: string]: string }): this {
        for (const key in values) {
            this.addQuery(key, values[key]);
        }

        return this;
    }

    /**
     * Add a query string value to the paginator.
     */
    protected addQuery(key: string, value: string): this {
        if (key !== this.options.name) {
            this.query[key] = value;
        }

        return this;
    }

    /**
     * Get / set the URL fragment to be appended to URLs.
     */
    public fragment(): string | undefined;
    public fragment(fragment: string): this;
    public fragment(fragment?: string): string | undefined | this;
    public fragment(fragment?: string): string | undefined | this {
        if (fragment === undefined) {
            return this.customFragment;
        }

        this.customFragment = fragment;

        return this;
    }

    /**
     * Build the full fragment portion of a URL.
     */
    protected buildFragment(): string {
        return this.customFragment ? `#${this.customFragment}` : '';
    }

    /**
     * Resolve the current request path or return the default value.
     */
    public static resolveCurrentPath(defaultPath = '/'): string {
        if (this.currentPathResolverCallback != null) {
            return this.currentPathResolverCallback();
        }

        return defaultPath;
    }

    /**
     * Set the current request path resolver callback.
     */
    public static currentPathResolver(resolver: () => string): void {
        this.currentPathResolverCallback = resolver;
    }

    /**
     * Get the URL with params.
     */
    protected generateUrl(params: { [key: string]: string }): string {
        let path = this.path();
        const regex = new RegExp('^(?:[a-z+]+:)?//', 'i');
        const isAbsolute = regex.test(path);
        // URL only works with absolute url
        const url = new URL(path, isAbsolute ? undefined : 'https://localhost.test');
        path = url.origin + url.pathname;

        let parameters = Object.fromEntries(url.searchParams);

        // If we have any extra query string key / value pairs that need to be added
        // onto the URL, we will put them in query string form and then attach it
        // to the URL. This allows for extra information like sortings storage.
        parameters = Object.assign(parameters, params);

        if (Object.keys(this.query).length > 0) {
            parameters = Object.assign(parameters, this.query);
        }

        return `${isAbsolute ? path : path.replace('https://localhost.test', '')}?${new URLSearchParams(
            parameters
        ).toString()}${this.buildFragment()}`;
    }
}

export default AbstractPaginator;

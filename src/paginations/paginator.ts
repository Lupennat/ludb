import PaginatorI, { PaginatorObject, PaginatorOptions } from '../types/paginations';
import AbstractPaginator from './abstract-paginator';

class Paginator<T> extends AbstractPaginator<T> implements PaginatorI<T> {
    protected hasMore: boolean;
    protected currentPageNumber: number;

    /**
     * The current page resolver callback.
     */
    protected static currentPageResolverCallback: ((name: string) => number) | undefined;

    constructor(results: T[], perPageNumber: number, currentPageNumber: number | string, options: PaginatorOptions) {
        super(results, perPageNumber, options);
        this.currentPageNumber = this.isValidPageNumber(currentPageNumber) ? Number(currentPageNumber) : 1;
        this.hasMore = this.results.length > this.perPageNumber;
        this.results = this.results.slice(0, this.perPageNumber);
    }

    /**
     * Determine if the given value is a valid page number.
     */
    protected isValidPageNumber(page: string | number): boolean {
        page = Number(page);
        return Number.isInteger(page) && page >= 1;
    }

    /**
     * Get the "index" of the first item being paginated.
     */
    public firstItem(): number | null {
        return this.items().length > 0 ? (this.currentPage() - 1) * this.perPage() + 1 : null;
    }

    /**
     * Get the "index" of the last item being paginated.
     */
    public lastItem(): number | null {
        return this.items().length > 0 ? (this.firstItem() as number) + this.items().length - 1 : null;
    }

    /**
     * Get the instance as a dictionary.
     */
    public toObject(): PaginatorObject<T> {
        return {
            current_page: this.currentPage(),
            data: this.items(),
            first_page_url: this.url(1),
            from: this.firstItem(),
            prev_page_url: this.previousPageUrl(),
            path: this.path(),
            per_page: this.perPage(),
            to: this.lastItem(),
            next_page_url: this.nextPageUrl()
        };
    }

    /**
     * Get the URL for a given page.
     */
    public url(page: number): string {
        if (page <= 0) {
            page = 1;
        }

        return this.generateUrl({ [this.options.name]: page.toString() });
    }

    /**
     * Determine the current page being paginated.
     */
    public currentPage(): number {
        return this.currentPageNumber;
    }

    /**
     * Determine if there are enough items to split into multiple pages.
     */
    public hasPages(): boolean {
        return this.currentPage() != 1 || this.hasMorePages();
    }

    /**
     * Determine if there are more items in the data source.
     */
    public hasMorePages(): boolean {
        return this.hasMore;
    }

    /**
     * The URL for the next page, or null.
     */
    public nextPageUrl(): string | null {
        if (this.hasMorePages()) {
            return this.url(this.currentPage() + 1);
        }

        return null;
    }

    /**
     * Get the URL for the previous page, or null.
     */
    public previousPageUrl(): string | null {
        if (this.currentPage() > 1) {
            return this.url(this.currentPage() - 1);
        }

        return null;
    }

    public toJSON(): any {
        return this.toObject();
    }

    /**
     * Resolve the current page or return the default value.
     */
    public static resolveCurrentPage(name = 'page', defaultPage = 1): number {
        if (this.currentPageResolverCallback != null) {
            return this.currentPageResolverCallback(name);
        }

        return defaultPage;
    }

    /**
     * Set the current page resolver callback.
     */
    public static currentPageResolver(resolver: (name: string) => number): void {
        this.currentPageResolverCallback = resolver;
    }
}

export default Paginator;

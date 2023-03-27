import { LengthAwarePaginatorI, LengthAwarePaginatorObject, PaginatorOptions } from '../types/paginations';
import Paginator from './paginator';

class LengthAwarePaginator<T> extends Paginator<T> implements LengthAwarePaginatorI<T> {
    constructor(
        results: T[],
        protected totalResults: number,
        perPageNumber: number,
        currentPageNumber: number,
        options: PaginatorOptions
    ) {
        super(results, perPageNumber, currentPageNumber, options);
        this.hasMore = this.currentPage() < this.lastPage();
    }

    /**
     * Get the instance as a dictionary.
     */
    public toObject(): LengthAwarePaginatorObject<T> {
        return Object.assign({}, super.toObject(), {
            last_page: this.lastPage(),
            last_page_url: this.url(this.lastPage()),
            total: this.total()
        });
    }

    /**
     * Determine the total number of items in the data store.
     */
    public total(): number {
        return this.totalResults;
    }

    /**
     * Get the page number of the last available page.
     */
    public lastPage(): number {
        return Math.max(Math.ceil(this.total() / this.perPage()), 1);
    }
}

export default LengthAwarePaginator;

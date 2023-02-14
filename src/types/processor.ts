import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import BuilderContract from '../query/builder-contract';

export default interface ProcessorI {
    /**
     * Process the results of a "select" query.
     */
    processSelect<T = Dictionary>(query: BuilderContract, results: T[]): T[];

    /**
     * Process the results of a column listing query.
     */
    processColumnListing(results: unknown[]): unknown[];
}

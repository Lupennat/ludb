import ProcessorI from '../../types/processor';
import BuilderContract from '../builder-contract';

class Processor implements ProcessorI {
    /**
     * Process the results of a "select" query.
     */
    public processSelect<T>(_query: BuilderContract, results: T[]): T[] {
        return results;
    }

    /**
     * Process the results of a column listing query.
     */
    public processColumnListing<T>(results: T[]): T[] {
        return results;
    }
}

export default Processor;

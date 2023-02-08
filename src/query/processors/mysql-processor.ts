import Processor from './processor';

class MySqlProcessor extends Processor {
    /**
     * Process the results of a column listing query.
     */
    public processColumnListing<T>(results: T[]): T[] {
        return results;
    }
}

export default MySqlProcessor;

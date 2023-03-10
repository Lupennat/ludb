import { PdoError } from 'lupdo';

class DeadlockError extends PdoError {}

export default DeadlockError;

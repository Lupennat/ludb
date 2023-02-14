import { PARAM_DECIMAL, TypedBinding } from 'lupdo';
import { TypeBindingOptions } from 'lupdo/dist/typings/typed-binding';

import { ValidBindingsPrimitive } from 'lupdo/dist/typings/types/pdo-prepared-statement';

class DecimalBinding extends TypedBinding {
    constructor(value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined) {
        super(PARAM_DECIMAL, value, options);
    }
}

export default DecimalBinding;

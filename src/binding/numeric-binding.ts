import { PARAM_NUMERIC, TypedBinding } from 'lupdo';
import { TypeBindingOptions } from 'lupdo/dist/typings/typed-binding';

import { ValidBindingsPrimitive } from 'lupdo/dist/typings/types/pdo-prepared-statement';

class NumericBinding extends TypedBinding {
    constructor(value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined) {
        super(PARAM_NUMERIC, value, options);
    }
}

export default NumericBinding;

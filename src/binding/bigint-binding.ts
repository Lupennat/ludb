import { PARAM_BIGINT, TypedBinding } from 'lupdo';
import { TypeBindingOptions } from 'lupdo/dist/typings/typed-binding';

import { ValidBindingsPrimitive } from 'lupdo/dist/typings/types/pdo-prepared-statement';

class BigintBinding extends TypedBinding {
    constructor(value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined) {
        super(PARAM_BIGINT, value, options);
    }
}

export default BigintBinding;

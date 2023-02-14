import { PARAM_VARCHAR, TypedBinding } from 'lupdo';
import { TypeBindingOptions } from 'lupdo/dist/typings/typed-binding';

import { ValidBindingsPrimitive } from 'lupdo/dist/typings/types/pdo-prepared-statement';

class StringBinding extends TypedBinding {
    constructor(value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined) {
        super(PARAM_VARCHAR, value, options);
    }
}

export default StringBinding;

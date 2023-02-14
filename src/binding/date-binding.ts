import { PARAM_DATE, TypedBinding } from 'lupdo';
import { TypeBindingOptions } from 'lupdo/dist/typings/typed-binding';

import { ValidBindingsPrimitive } from 'lupdo/dist/typings/types/pdo-prepared-statement';

class DateBinding extends TypedBinding {
    constructor(value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined) {
        super(PARAM_DATE, value, options);
    }
}

export default DateBinding;

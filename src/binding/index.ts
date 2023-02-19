import { PARAM_BIGINT, PARAM_DATE, PARAM_DECIMAL, PARAM_INTEGER, PARAM_TEXT, TypedBinding } from 'lupdo';
import { TypeBindingOptions } from 'lupdo/dist/typings/typed-binding';

import { ValidBindingsPrimitive } from 'lupdo/dist/typings/types/pdo-prepared-statement';

export const bindTo = {
    bigint: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_BIGINT, value, options);
    },

    decimal: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_DECIMAL, value, options);
    },

    integer: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_INTEGER, value, options);
    },

    text: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_TEXT, value, options);
    },

    date: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_DATE, value, options);
    }
};

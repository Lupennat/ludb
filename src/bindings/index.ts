import {
    PARAM_BIGINT,
    PARAM_BINARY,
    PARAM_BOOLEAN,
    PARAM_CHAR,
    PARAM_DATE,
    PARAM_DATETIME,
    PARAM_DATETIMEZONE,
    PARAM_DECIMAL,
    PARAM_FLOAT,
    PARAM_GEOMETRY,
    PARAM_INTEGER,
    PARAM_NUMERIC,
    PARAM_TEXT,
    PARAM_TIME,
    PARAM_TIMESTAMP,
    PARAM_VARBINARY,
    PARAM_VARCHAR,
    TypedBinding
} from 'lupdo';
import { TypeBindingOptions } from 'lupdo/dist/typings/typed-binding';

import { ValidBindingsPrimitive } from 'lupdo/dist/typings/types/pdo-prepared-statement';

export const bindTo = {
    bigint: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_BIGINT, value, options);
    },
    decimal: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_DECIMAL, value, options);
    },
    numeric: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_NUMERIC, value, options);
    },
    float: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_FLOAT, value, options);
    },
    integer: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_INTEGER, value, options);
    },
    boolean: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_BOOLEAN, Boolean(value), options);
    },
    text: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_TEXT, value, options);
    },
    char: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_CHAR, value, options);
    },
    varchar: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    geomtery: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_GEOMETRY, value, options);
    },
    date: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_DATE, value, options);
    },
    datetime: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_DATETIME, value, options);
    },
    datetimeZone: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_DATETIMEZONE, value, options);
    },
    timestamp: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_TIMESTAMP, value, options);
    },
    time: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_TIME, value, options);
    },
    binary: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_BINARY, value, options);
    },
    varbinary: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARBINARY, value, options);
    }
};

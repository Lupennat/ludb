import {
    PARAM_BIGINT,
    PARAM_BINARY,
    PARAM_BOOLEAN,
    PARAM_CHAR,
    PARAM_DATE,
    PARAM_DATETIMEZONE,
    PARAM_DECIMAL,
    PARAM_FLOAT,
    PARAM_GEOMETRY,
    PARAM_INTEGER,
    PARAM_TIME,
    PARAM_TIMESTAMP,
    PARAM_VARCHAR,
    TypedBinding
} from 'lupdo';
import { TypeBindingOptions } from 'lupdo/dist/typings/typed-binding';

import { ValidBindingsPrimitive } from 'lupdo/dist/typings/types/pdo-prepared-statement';
import BindToI from '../types/bind-to';

export const bindTo: BindToI = {
    bigInteger: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_BIGINT, value, options);
    },
    binary: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_BINARY, value, options);
    },
    boolean: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_BOOLEAN, value, options);
    },
    char: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_CHAR, value, options);
    },
    dateTime: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_TIMESTAMP, value, options);
    },
    dateTimeTz: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_DATETIMEZONE, value, options);
    },
    date: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_DATE, value, options);
    },
    decimal: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_DECIMAL, value, options);
    },
    double: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_FLOAT, value, options);
    },
    enum: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    float: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_FLOAT, value, options);
    },
    geometryCollection: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_GEOMETRY, value, options);
    },
    geometry: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_GEOMETRY, value, options);
    },
    id: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_BIGINT, value, options);
    },
    integer: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_INTEGER, value, options);
    },
    ipAddress: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    json: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    jsonb: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    lineString: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_GEOMETRY, value, options);
    },
    longText: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    macAddress: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    mediumInteger: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_INTEGER, value, options);
    },
    mediumText: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    multiLineString: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_GEOMETRY, value, options);
    },
    multiPoint: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_GEOMETRY, value, options);
    },
    multiPolygon: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_GEOMETRY, value, options);
    },
    point: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_GEOMETRY, value, options);
    },
    polygon: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_GEOMETRY, value, options);
    },
    smallInteger: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_INTEGER, value, options);
    },
    string: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    text: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    time: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_TIME, value, options);
    },
    timestamp: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_TIMESTAMP, value, options);
    },
    timestampTZ: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_DATETIMEZONE, value, options);
    },
    tinyInteger: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_INTEGER, value, options);
    },
    tinyText: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    ulid: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    uuid: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_VARCHAR, value, options);
    },
    year: (value: ValidBindingsPrimitive, options?: TypeBindingOptions | undefined): TypedBinding => {
        return TypedBinding.create(PARAM_INTEGER, value, options);
    }
};

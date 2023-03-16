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
import ExpressionContract from '../query/expression-contract';
import BindToI from '../types/bind-to';
import { BindingExclude } from '../types/query/builder';

export const bindTo: BindToI = {
    bigInteger: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_BIGINT, value, options);
    },
    binary: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_BINARY, value, options);
    },
    boolean: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_BOOLEAN, value, options);
    },
    char: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_CHAR, value, options);
    },
    dateTime: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_TIMESTAMP, value, options);
    },
    dateTimeTz: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_DATETIMEZONE, value, options);
    },
    date: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_DATE, value, options);
    },
    decimal: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_DECIMAL, value, options);
    },
    double: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_FLOAT, value, options);
    },
    enum: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    float: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_FLOAT, value, options);
    },
    geometryCollection: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_GEOMETRY, value, options);
    },
    geometry: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_GEOMETRY, value, options);
    },
    id: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_BIGINT, value, options);
    },
    integer: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_INTEGER, value, options);
    },
    ipAddress: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    json: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    jsonb: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    lineString: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_GEOMETRY, value, options);
    },
    longText: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    macAddress: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    mediumInteger: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_INTEGER, value, options);
    },
    mediumText: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    multiLineString: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_GEOMETRY, value, options);
    },
    multiPoint: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_GEOMETRY, value, options);
    },
    multiPolygon: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_GEOMETRY, value, options);
    },
    point: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_GEOMETRY, value, options);
    },
    polygon: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_GEOMETRY, value, options);
    },
    smallInteger: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_INTEGER, value, options);
    },
    string: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    text: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    time: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_TIME, value, options);
    },
    timestamp: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_TIMESTAMP, value, options);
    },
    timestampTZ: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_DATETIMEZONE, value, options);
    },
    tinyInteger: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_INTEGER, value, options);
    },
    tinyText: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    ulid: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    uuid: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_VARCHAR, value, options);
    },
    year: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions | undefined
    ): TypedBinding => {
        return new TypedBinding(PARAM_INTEGER, value, options);
    }
};

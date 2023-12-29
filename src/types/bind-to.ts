import TypedBinding, { TypeBindingOptions } from 'lupdo/dist/typings/typed-binding';
import ExpressionContract from '../query/expression-contract';
import { BindingExclude } from './generics';

export default interface BindToI {
    bigInteger: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    binary: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    boolean: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    char: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    dateTime: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    dateTimeTz: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    date: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    decimal: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    double: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    enum: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    float: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    geometryCollection: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    geometry: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    id: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    integer: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    ipAddress: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    json: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    jsonb: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    lineString: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    longText: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    macAddress: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    mediumInteger: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    mediumText: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    multiLineString: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    multiPoint: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    multiPolygon: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    point: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    polygon: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    smallInteger: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    string: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    text: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    time: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    timestamp: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    timestampTZ: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    tinyInteger: (
        value: BindingExclude<TypedBinding | ExpressionContract>,
        options?: TypeBindingOptions
    ) => TypedBinding;
    tinyText: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    ulid: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    uuid: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
    year: (value: BindingExclude<TypedBinding | ExpressionContract>, options?: TypeBindingOptions) => TypedBinding;
}

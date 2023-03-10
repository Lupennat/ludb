import RegistryI, { ColumnRegistryI, ColumnType } from '../types/schema/registry';

export default function createRegistry(): RegistryI {
    return {
        table: '',
        temporary: false,
        prefix: '',
        columns: [],
        commands: [],
        engine: undefined,
        charset: undefined,
        collation: undefined,
        after: undefined
    };
}

export function createColumnRegistry(type: ColumnType): ColumnRegistryI {
    return {
        after: undefined,
        always: undefined,
        autoIncrement: undefined,
        change: undefined,
        charset: undefined,
        collation: undefined,
        comment: undefined,
        default: undefined,
        first: undefined,
        from: undefined,
        generatedAs: undefined,
        index: undefined,
        invisible: undefined,
        nullable: undefined,
        onUpdate: undefined,
        persisted: undefined,
        primary: undefined,
        fulltext: undefined,
        spatialIndex: undefined,
        startingValue: undefined,
        storedAs: undefined,
        type: type,
        unique: undefined,
        unsigned: undefined,
        useCurrent: undefined,
        useCurrentOnUpdate: undefined,
        virtualAs: undefined
    };
}

import { plural } from 'pluralize';
import { Stringable } from '../../types/query/builder';
import BlueprintI from '../../types/schema/blueprint';
import { ColumnRegistryI, ColumnType } from '../../types/schema/registry';
import { beforeLast } from '../../utils';
import ColumnDefinition from './column-definition';
import CommandForeignKeyDefinition from './commands/command-foreign-key-definition';

class ForeignIdColumnDefinition extends ColumnDefinition {
    /**
     * Create a new foreign ID column definition.
     */
    constructor(
        protected blueprint: BlueprintI,
        type: ColumnType,
        name: Stringable,
        parameters: Partial<ColumnRegistryI> = {}
    ) {
        super(type, name, parameters);
    }

    /**
     * Create a foreign key constraint on this column referencing the "id" column of the conventionally related table.
     */
    public constrained(table?: Stringable, column?: Stringable): CommandForeignKeyDefinition {
        column = column ?? 'id';

        return this.references(column).on(
            table ??
                plural(
                    beforeLast(
                        this.blueprint.getGrammar().getValue(this.name).toString(),
                        `_${this.blueprint.getGrammar().getValue(column).toString()}`
                    )
                )
        );
    }

    /**
     * Specify which column this foreign ID references on another table.
     */
    public references(column: Stringable): CommandForeignKeyDefinition {
        return this.blueprint.foreign(this.name).references(column);
    }
}

export default ForeignIdColumnDefinition;

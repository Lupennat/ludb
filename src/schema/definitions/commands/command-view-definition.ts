import { Stringable } from '../../../types/generics';
import QueryBuilderI from '../../../types/query/query-builder';
import { CommandType, ViewRegistryI } from '../../../types/schema/registry';
import CommandDefinition from './command-definition';

type ViewAsCallback = (query: QueryBuilderI) => QueryBuilderI;

class CommandViewDefinition<Registry extends ViewRegistryI = ViewRegistryI> extends CommandDefinition<Registry> {
    constructor(public readonly name: CommandType, protected registry: Registry) {
        super(name, registry);
    }
    /**
     * Specify an algorithm for the view (MySQL)
     */
    public algorithm(algorithm: Stringable): this {
        return this.addToRegistry('algorithm', algorithm);
    }

    /**
     * Specify select statement for as
     */
    public as(as: ViewAsCallback): this {
        return this.addToRegistry('as', as(this.getRegistry().as));
    }

    /**
     * Specify view definer (MySql)
     */
    public definer(definer: Stringable): this {
        return this.addToRegistry('definer', definer);
    }

    /**
     * Specify if is temporary view (PostgreSql, SQLite)
     */
    public temporary(temporary = true): this {
        return this.addToRegistry('temporary', temporary);
    }

    /**
     * Add With Check Option (MySql,PostgreSQL)
     */
    public withCheck(check: Stringable): this {
        return this.addToRegistry('check', check);
    }

    /**
     * with Check Cascade Option (MySql,PostgreSQL)
     */
    public withCheckCascade(): this {
        return this.withCheck('cascade');
    }

    /**
     * with Check Local Option (MySql)
     */
    public withCheckLocal(): this {
        return this.withCheck('local');
    }

    /**
     * enable Recursive (PostgreSQL)
     */
    public withRecursive(recursive = true): this {
        return this.addToRegistry('recursive', recursive);
    }

    /**
     * enable security_barrier option (PostgresSQL, SqlServer)
     */
    public withViewAttribute(attribute: Stringable): this {
        return this.addToRegistry('viewAttribute', attribute);
    }

    /**
     * enable security_barrier option (PostgresSQL)
     */
    public withSecurityBarrier(): this {
        return this.withViewAttribute('security_barrier');
    }

    /**
     * enable security_invoker option (PostgresSQL)
     */
    public withSecurityInvoker(): this {
        return this.withViewAttribute('security_invoker');
    }

    /*
     * enable ENCRYPTION option (SqlServer)
     */
    public withEncryption(): this {
        return this.withViewAttribute('encryption');
    }

    /*
     * enable SCHEMABINDING option (SqlServer)
     */
    public withSchemabinding(): this {
        return this.withViewAttribute('schemabinding');
    }

    /*
     * enable VIEW_METADATA option (SqlServer)
     */
    public withViewMetadata(): this {
        return this.withViewAttribute('view_metadata');
    }

    /**
     * Specify column names for view
     */
    public columnNames(columnNames: Stringable[]): this {
        return this.addToRegistry('columnNames', columnNames);
    }
}

export default CommandViewDefinition;

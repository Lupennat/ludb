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
     * Specify view definer (Mysql)
     */
    public definer(definer: Stringable): this {
        return this.addToRegistry('definer', definer);
    }

    /**
     * Specify if is temporary view (PostgreSql, Sqlite)
     */
    public temporary(temporary = true): this {
        return this.addToRegistry('temporary', temporary);
    }

    /**
     * Enable Check Option (Mysql,PostgreSQL,Sqlserver)
     */
    public check(check = true): this {
        return this.addToRegistry('check', check);
    }

    /**
     * Add With Check Option Type (Mysql,PostgreSQL)
     */
    public withCheckType(type: Stringable): this {
        return this.check().addToRegistry('checkType', type);
    }

    /**
     * with Check Cascade Option (Mysql,PostgreSQL)
     */
    public withCheckCascaded(): this {
        return this.check().withCheckType('cascaded');
    }

    /**
     * with Check Local Option (Mysql)
     */
    public withCheckLocal(): this {
        return this.check().withCheckType('local');
    }

    /**
     * enable Recursive (PostgreSQL)
     */
    public withRecursive(recursive = true): this {
        return this.addToRegistry('recursive', recursive);
    }

    /**
     * enable security_barrier option (PostgresSQL, Sqlserver)
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
     * enable ENCRYPTION option (Sqlserver)
     */
    public withEncryption(): this {
        return this.withViewAttribute('encryption');
    }

    /*
     * enable SCHEMABINDING option (Sqlserver)
     */
    public withSchemabinding(): this {
        return this.withViewAttribute('schemabinding');
    }

    /*
     * enable VIEW_METADATA option (Sqlserver)
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

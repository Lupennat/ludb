import Expression from '../query/expression';
import { ConnectionSessionI } from '../types/connection';
import { Stringable } from '../types/generics';
import { Relatable, RelatableConstructor } from '../types/schema/blueprint';
import { BlueprintCallback } from '../types/schema/builder/schema-builder';
import RegistryI, {
    ColumnDefinitionRegistryI,
    ColumnIndex,
    ColumnRegistryI,
    ColumnType,
    ColumnsRegistryI,
    CommandRegistryI,
    CommandType,
    CommentRegistryI,
    ForeignKeyRegistryI,
    IndexRegistryI,
    RenameFullRegistryI,
    RenameRegistryI
} from '../types/schema/registry';
import QueryBuilder from './builders/builder';
import ColumnDefinition from './definitions/column-definition';
import CommandDefinition from './definitions/commands/command-definition';
import CommandForeignKeyDefinition from './definitions/commands/command-foreign-key-definition';
import CommandIndexDefinition from './definitions/commands/command-index-definition';
import ForeignIdColumnDefinition from './definitions/foreign-id-column-definition';
import Grammar from './grammars/grammar';
import createRegistry from './registries';

class Blueprint {
    protected registry: RegistryI;

    /**
     * Create a new schema blueprint.
     */
    public constructor(
        table: Stringable,
        protected grammar: Grammar,
        callback?: BlueprintCallback,
        prefix?: string
    ) {
        this.registry = createRegistry();
        this.registry.table = table;
        this.registry.prefix = prefix ?? '';
        if (callback != null) {
            callback(this);
        }
    }

    /**
     * Get BluePrint Registry
     */
    public getRegistry(): RegistryI {
        return this.registry;
    }

    /**
     * The storage engine that should be used for the table.
     */
    public engine(engine: Stringable): this {
        this.registry.engine = engine;
        return this;
    }

    /**
     * The default character set that should be used for the table.
     */
    public charset(charset: Stringable): this {
        this.registry.charset = charset;
        return this;
    }

    /**
     * The collation that should be used for the table.
     */
    public collation(collation: Stringable): this {
        this.registry.collation = collation;
        return this;
    }

    /**
     * Indicate that the table needs to be temporary.
     */
    public temporary(): this {
        this.registry.temporary = true;
        return this;
    }

    /*
     * Execute the blueprint against the database.
     */
    public async build(connection: ConnectionSessionI): Promise<void> {
        for (const statement of this.toSql(connection)) {
            await connection.statement(statement);
        }
    }

    /**
     * Get the raw SQL statements for the blueprint.
     */
    public toSql(connection: ConnectionSessionI): string[] {
        this.addImpliedCommands();

        const statements: string[] = [];

        // Each type of command has a corresponding compiler function on the schema
        // grammar which is used to build the necessary SQL statements to build
        // the blueprint element, so we'll just call that compilers function.
        this.ensureCommandsAreValid();

        for (const command of this.registry.commands) {
            if (command.shouldBeSkipped) {
                continue;
            }

            switch (command.name) {
                case 'add':
                    const adds = this.grammar.compileAdd(this, command, connection);
                    statements.push(...(Array.isArray(adds) ? adds : [adds]));
                    break;
                case 'autoIncrementStartingValues':
                    statements.push(
                        this.grammar.compileAutoIncrementStartingValues(
                            this,
                            command as CommandDefinition<ColumnDefinitionRegistryI>,
                            connection
                        )
                    );
                    break;
                case 'change':
                    const changes = this.grammar.compileChange(this, command, connection);
                    statements.push(...(Array.isArray(changes) ? changes : [changes]));
                    break;
                case 'comment':
                    statements.push(
                        this.grammar.compileComment(
                            this,
                            command as CommandDefinition<ColumnDefinitionRegistryI>,
                            connection
                        )
                    );
                    break;
                case 'create':
                    statements.push(this.grammar.compileCreate(this, command, connection));
                    break;
                case 'default':
                    statements.push(
                        this.grammar.compileDefault(
                            this,
                            command as CommandDefinition<ColumnDefinitionRegistryI>,
                            connection
                        )
                    );
                    break;
                case 'drop':
                    statements.push(this.grammar.compileDrop(this, command, connection));
                    break;
                case 'dropColumn':
                    const dropcolumns = this.grammar.compileDropColumn(
                        this,
                        command as CommandDefinition<ColumnsRegistryI>,
                        connection
                    );
                    statements.push(...(Array.isArray(dropcolumns) ? dropcolumns : [dropcolumns]));
                    break;
                case 'dropPrimary':
                    statements.push(
                        this.grammar.compileDropPrimary(this, command as CommandIndexDefinition, connection)
                    );
                    break;
                case 'dropUnique':
                    statements.push(
                        this.grammar.compileDropUnique(this, command as CommandIndexDefinition, connection)
                    );
                    break;
                case 'dropIndex':
                    statements.push(this.grammar.compileDropIndex(this, command as CommandIndexDefinition, connection));
                    break;
                case 'dropFulltext':
                    statements.push(
                        this.grammar.compileDropFulltext(this, command as CommandIndexDefinition, connection)
                    );
                    break;
                case 'dropSpatialIndex':
                    statements.push(
                        this.grammar.compileDropSpatialIndex(this, command as CommandIndexDefinition, connection)
                    );
                    break;
                case 'dropForeign':
                    statements.push(
                        this.grammar.compileDropForeign(this, command as CommandForeignKeyDefinition, connection)
                    );
                    break;
                case 'dropTableIfExists':
                    statements.push(this.grammar.compileDropTableIfExists(this, command, connection));
                    break;
                case 'primary':
                    statements.push(this.grammar.compilePrimary(this, command as CommandIndexDefinition, connection));
                    break;
                case 'unique':
                    statements.push(this.grammar.compileUnique(this, command as CommandIndexDefinition, connection));
                    break;
                case 'index':
                    statements.push(this.grammar.compileIndex(this, command as CommandIndexDefinition, connection));
                    break;
                case 'fulltext':
                    statements.push(this.grammar.compileFulltext(this, command as CommandIndexDefinition, connection));
                    break;
                case 'spatialIndex':
                    statements.push(
                        this.grammar.compileSpatialIndex(this, command as CommandIndexDefinition, connection)
                    );
                    break;
                case 'foreign':
                    statements.push(
                        this.grammar.compileForeign(this, command as CommandForeignKeyDefinition, connection)
                    );
                    break;
                case 'tableComment':
                    statements.push(
                        this.grammar.compileTableComment(
                            this,
                            command as CommandDefinition<CommentRegistryI>,
                            connection
                        )
                    );
                    break;
                case 'rename':
                    statements.push(
                        this.grammar.compileRename(this, command as CommandDefinition<RenameRegistryI>, connection)
                    );
                    break;
                case 'renameColumn':
                    statements.push(
                        this.grammar.compileRenameColumn(
                            this,
                            command as CommandDefinition<RenameFullRegistryI>,
                            connection
                        )
                    );
                    break;
                case 'renameIndex':
                    statements.push(
                        this.grammar.compileRenameIndex(
                            this,
                            command as CommandDefinition<RenameFullRegistryI>,
                            connection
                        )
                    );
            }
        }
        return statements.filter(Boolean);
    }

    /**
     * Ensure the commands on the blueprint are valid for the connection type.
     */
    protected ensureCommandsAreValid(): void {
        if (!this.grammar.supportsDropForeign()) {
            if (this.commandsNamed(['dropForeign']).length > 0) {
                throw new Error(
                    "Sqlite doesn't support dropping foreign keys (you would need to re-create the table)."
                );
            }
        }
    }

    /**
     * Get all of the commands matching the given names.
     */
    protected commandsNamed(names: string[]): CommandDefinition<CommandRegistryI>[] {
        return this.registry.commands.filter(command => names.includes(command.name));
    }

    /**
     * Add the commands that are implied by the blueprint's state.
     */
    protected addImpliedCommands(): void {
        if (this.getAddedColumns().length > 0 && !this.creating()) {
            this.registry.commands.unshift(this.createCommand('add', {}));
        }

        if (this.getChangedColumns().length > 0 && !this.creating()) {
            this.registry.commands.unshift(this.createCommand('change', {}));
        }

        this.addIndexes();

        this.addCommands();
    }

    /**
     * Add the index commands specified on columns.
     */
    protected addIndexes(): void {
        loop1: for (const column of this.registry.columns) {
            const types: ColumnIndex[] = ['primary', 'unique', 'index', 'fulltext', 'spatialIndex'];
            for (const type of types) {
                const value = column.getRegistry()[type];
                if (value === true) {
                    this.addIndexByType(type, column.name);
                    column.resetIndex(type);
                    continue loop1;
                } else if (value === false && column.getRegistry().change) {
                    this.dropIndexByType(type, column.name);
                    column.resetIndex(type);
                    continue loop1;
                } else if (value) {
                    this.addIndexByType(type, column.name, value);
                    column.resetIndex(type);
                    continue loop1;
                }
            }
        }
    }

    /**
     * Add the index
     */
    protected addIndexByType(type: string, column: Stringable, name?: Stringable): void {
        switch (type) {
            case 'primary':
                this.primary(column, name);
                break;
            case 'unique':
                this.unique(column, name);
                break;
            case 'index':
                this.index(column, name);
                break;
            case 'fulltext':
                this.fulltext(column, name);
                break;
            case 'spatialIndex':
                this.spatialIndex(column, name);
                break;
        }
    }

    /**
     * Drop the index
     */
    protected dropIndexByType(type: string, name: Stringable): void {
        switch (type) {
            case 'primary':
                this.dropPrimary([name]);
                break;
            case 'unique':
                this.dropUnique([name]);
                break;
            case 'index':
                this.dropIndex([name]);
                break;
            case 'fulltext':
                this.dropFulltext([name]);
                break;
            case 'spatialIndex':
                this.dropSpatialIndex([name]);
                break;
        }
    }

    /**
     * Add the commands specified on any columns.
     */
    public addCommands(): void {
        for (const column of this.registry.columns) {
            for (const command of this.grammar.getCommands()) {
                this.addCommand(this.createCommand<ColumnDefinitionRegistryI>(command, { column }));
            }
        }
    }

    /**
     * Determine if the blueprint has a create command.
     */
    public creating(): boolean {
        return this.registry.commands.find(command => command.name === 'create') !== undefined;
    }

    /**
     * Indicate that the table needs to be created.
     */
    public create(): CommandDefinition {
        return this.addCommand(this.createCommand('create', {}));
    }

    /**
     * Add a comment to the table.
     */
    public comment(comment: string): CommandDefinition<CommentRegistryI> {
        return this.addCommand(this.createCommand<CommentRegistryI>('tableComment', { comment }));
    }

    /**
     * Indicate that the table should be dropped.
     */
    public drop(): CommandDefinition {
        return this.addCommand(this.createCommand('drop', {}));
    }

    /**
     * Indicate that the table should be dropped if it exists.
     */
    public dropTableIfExists(): CommandDefinition {
        return this.addCommand(this.createCommand('dropTableIfExists', {}));
    }

    /**
     * Indicate that the given columns should be dropped.
     */
    public dropColumn(
        columns: Stringable | Stringable[],
        ...otherColumns: Stringable[]
    ): CommandDefinition<ColumnsRegistryI> {
        columns = (Array.isArray(columns) ? columns : [columns]).concat(otherColumns);
        return this.addCommand(this.createCommand<ColumnsRegistryI>('dropColumn', { columns }));
    }

    /**
     * Indicate that the given columns should be renamed.
     */
    public renameColumn(from: Stringable, to: Stringable): CommandDefinition<RenameFullRegistryI> {
        return this.addCommand(this.createCommand<RenameFullRegistryI>('renameColumn', { from, to }));
    }

    /**
     * Indicate that the given primary key should be dropped.
     */
    public dropPrimary(index?: Stringable[] | Stringable): CommandIndexDefinition {
        return this.addCommand(this.dropIndexCommand('dropPrimary', 'primary', index));
    }

    /**
     * Indicate that the given unique key should be dropped.
     */
    public dropUnique(index: Stringable[] | Stringable): CommandIndexDefinition {
        return this.addCommand(this.dropIndexCommand('dropUnique', 'unique', index));
    }

    /**
     * Indicate that the given index should be dropped.
     */
    public dropIndex(index: Stringable[] | Stringable): CommandIndexDefinition {
        return this.addCommand(this.dropIndexCommand('dropIndex', 'index', index));
    }

    /**
     * Indicate that the given fulltext index should be dropped.
     */
    public dropFulltext(index: Stringable | Stringable[]): CommandIndexDefinition {
        return this.addCommand(this.dropIndexCommand('dropFulltext', 'fulltext', index));
    }

    /**
     * Indicate that the given spatial index should be dropped.
     */
    public dropSpatialIndex(index: Stringable | Stringable[]): CommandIndexDefinition {
        return this.addCommand(this.dropIndexCommand('dropSpatialIndex', 'spatialIndex', index));
    }

    /**
     * Indicate that the given foreign key should be dropped.
     */
    public dropForeign(index: Stringable | Stringable[]): CommandForeignKeyDefinition {
        return this.addCommand(this.dropForeignKeyCommand('dropForeign', 'foreign', index));
    }

    /**
     * Indicate that the given foreign key should be dropped.
     */
    public dropForeignIdFor(model: RelatableConstructor | Relatable, column?: string): CommandForeignKeyDefinition {
        if (typeof model === 'function') {
            model = new model();
        }

        return this.dropForeign([column || model.getForeignKey()]);
    }

    /**
     * Indicate that the given column and foreign key should be dropped.
     */
    public dropConstrainedForeignId(column: Stringable): void {
        this.dropForeign([column]);

        this.dropColumn(column);
    }

    /**
     * Indicate that the given foreign key should be dropped.
     */
    public dropConstrainedForeignIdFor(model: RelatableConstructor | Relatable, column?: string): void {
        if (typeof model === 'function') {
            model = new model();
        }

        return this.dropConstrainedForeignId(column || model.getForeignKey());
    }

    /**
     * Indicate that the given indexes should be renamed.
     */
    public renameIndex(from: Stringable, to: Stringable): CommandDefinition<RenameFullRegistryI> {
        return this.addCommand(this.createCommand<RenameFullRegistryI>('renameIndex', { from, to }));
    }

    /**
     * Indicate that the timestamp columns should be dropped.
     */
    public dropTimestamps(): CommandDefinition<ColumnsRegistryI> {
        return this.dropColumn('created_at', 'updated_at');
    }

    /**
     * Indicate that the timestamp columns should be dropped.
     */
    public dropTimestampsTz(): CommandDefinition<ColumnsRegistryI> {
        return this.dropTimestamps();
    }

    /**
     * Indicate that the soft delete column should be dropped.
     */
    public dropSoftDeletes(column = 'deleted_at'): CommandDefinition<ColumnsRegistryI> {
        return this.dropColumn(column);
    }

    /**
     * Indicate that the soft delete column should be dropped.
     */
    public dropSoftDeletesTz(column = 'deleted_at'): CommandDefinition<ColumnsRegistryI> {
        return this.dropSoftDeletes(column);
    }

    /**
     * Indicate that the polymorphic columns should be dropped.
     */
    public dropMorphs(name: Stringable, indexName?: Stringable): void {
        name = this.grammar.getValue(name).toString();
        this.dropIndex(indexName ?? this.createIndexName('index', [`${name}_type`, `${name}_id`]));

        this.dropColumn(`${name}_type`, `${name}_id`);
    }

    /**
     * Rename the table to a given name.
     */
    public rename(to: Stringable): CommandDefinition<RenameRegistryI> {
        return this.addCommand(this.createCommand<RenameRegistryI>('rename', { to }));
    }

    /**
     * Specify the primary key(s) for the table.
     */
    public primary(
        columns: Stringable | Stringable[],
        name?: Stringable,
        algorithm?: Stringable
    ): CommandIndexDefinition<IndexRegistryI> {
        return this.addCommand(this.indexCommand('primary', columns, name, algorithm));
    }

    /**
     * Specify a unique index for the table.
     */
    public unique(
        columns: Stringable | Stringable[],
        name?: Stringable,
        algorithm?: Stringable
    ): CommandIndexDefinition<IndexRegistryI> {
        return this.addCommand(this.indexCommand('unique', columns, name, algorithm));
    }

    /**
     * Specify an index for the table.
     */
    public index(
        columns: Stringable | Stringable[],
        name?: Stringable,
        algorithm?: Stringable
    ): CommandIndexDefinition<IndexRegistryI> {
        return this.addCommand(this.indexCommand('index', columns, name, algorithm));
    }

    /**
     * Specify an fulltext for the table.
     */
    public fulltext(
        columns: Stringable | Stringable[],
        name?: Stringable,
        algorithm?: Stringable
    ): CommandIndexDefinition<IndexRegistryI> {
        return this.addCommand(this.indexCommand('fulltext', columns, name, algorithm));
    }

    /**
     * Specify a spatial index for the table.
     */
    public spatialIndex(columns: Stringable | Stringable[], name?: Stringable): CommandIndexDefinition<IndexRegistryI> {
        return this.addCommand(this.indexCommand('spatialIndex', columns, name));
    }
    /**
     * Specify a raw index for the table.
     */
    public rawIndex(expression: string, name: Stringable): CommandIndexDefinition<IndexRegistryI> {
        return this.index([new Expression(expression)], name);
    }

    /**
     * Specify a foreign key for the table.
     */
    public foreign(
        columns: Stringable | Stringable[],
        name?: Stringable
    ): CommandForeignKeyDefinition<ForeignKeyRegistryI> {
        const command = this.addCommand(this.foreignKeyCommand('foreign', columns, name));
        this.registry.commands[this.registry.commands.length - 1] = command;

        return command;
    }

    /**
     * Create a new auto-incrementing big integer (8-byte) column on the table.
     */
    public id(column: Stringable = 'id'): ColumnDefinition {
        return this.bigIncrements(column);
    }

    /**
     * Create a new auto-incrementing integer (4-byte) column on the table.
     */
    public increments(column: Stringable): ColumnDefinition {
        return this.unsignedInteger(column, true);
    }

    /**
     * Create a new auto-incrementing integer (4-byte) column on the table.
     */
    public integerIncrements(column: Stringable): ColumnDefinition {
        return this.unsignedInteger(column, true);
    }

    /**
     * Create a new auto-incrementing tiny integer (1-byte) column on the table.
     */
    public tinyIncrements(column: Stringable): ColumnDefinition {
        return this.unsignedTinyInteger(column, true);
    }

    /**
     * Create a new auto-incrementing small integer (2-byte) column on the table.
     */
    public smallIncrements(column: Stringable): ColumnDefinition {
        return this.unsignedSmallInteger(column, true);
    }

    /**
     * Create a new auto-incrementing medium integer (3-byte) column on the table.
     */
    public mediumIncrements(column: Stringable): ColumnDefinition {
        return this.unsignedMediumInteger(column, true);
    }

    /**
     * Create a new auto-incrementing big integer (8-byte) column on the table.
     */
    public bigIncrements(column: Stringable): ColumnDefinition {
        return this.unsignedBigInteger(column, true);
    }

    /**
     * Create a new char column on the table.
     */
    public char(column: Stringable, length?: number): ColumnDefinition {
        return this.addColumn('char', column, { length: length ?? QueryBuilder.defaultStringLength });
    }

    /**
     * Create a new string column on the table.
     */
    public string(column: Stringable, length?: number): ColumnDefinition {
        return this.addColumn('string', column, { length: length ?? QueryBuilder.defaultStringLength });
    }

    /**
     * Create a new tiny text column on the table.
     */
    public tinyText(column: Stringable): ColumnDefinition {
        return this.addColumn('tinyText', column);
    }

    /**
     * Create a new text column on the table.
     */
    public text(column: Stringable): ColumnDefinition {
        return this.addColumn('text', column);
    }

    /**
     * Create a new medium text column on the table.
     */
    public mediumText(column: Stringable): ColumnDefinition {
        return this.addColumn('mediumText', column);
    }

    /**
     * Create a new long text column on the table.
     */
    public longText(column: Stringable): ColumnDefinition {
        return this.addColumn('longText', column);
    }

    /**
     * Create a new integer (4-byte) column on the table.
     */
    public integer(column: Stringable, autoIncrement = false, unsigned = false): ColumnDefinition {
        return this.addColumn('integer', column, { autoIncrement, unsigned });
    }

    /**
     * Create a new tiny integer (1-byte) column on the table.
     */
    public tinyInteger(column: Stringable, autoIncrement = false, unsigned = false): ColumnDefinition {
        return this.addColumn('tinyInteger', column, { autoIncrement, unsigned });
    }

    /**
     * Create a new small integer (2-byte) column on the table.
     */
    public smallInteger(column: Stringable, autoIncrement = false, unsigned = false): ColumnDefinition {
        return this.addColumn('smallInteger', column, { autoIncrement, unsigned });
    }

    /**
     * Create a new medium integer (3-byte) column on the table.
     */
    public mediumInteger(column: Stringable, autoIncrement = false, unsigned = false): ColumnDefinition {
        return this.addColumn('mediumInteger', column, { autoIncrement, unsigned });
    }

    /**
     * Create a new big integer (8-byte) column on the table.
     */
    public bigInteger(column: Stringable, autoIncrement = false, unsigned = false): ColumnDefinition {
        return this.addColumn('bigInteger', column, { autoIncrement, unsigned });
    }

    /**
     * Create a new unsigned integer (4-byte) column on the table.
     */
    public unsignedInteger(column: Stringable, autoIncrement = false): ColumnDefinition {
        return this.integer(column, autoIncrement, true);
    }

    /**
     * Create a new unsigned tiny integer (1-byte) column on the table.
     */
    public unsignedTinyInteger(column: Stringable, autoIncrement = false): ColumnDefinition {
        return this.tinyInteger(column, autoIncrement, true);
    }

    /**
     * Create a new unsigned small integer (2-byte) column on the table.
     */
    public unsignedSmallInteger(column: Stringable, autoIncrement = false): ColumnDefinition {
        return this.smallInteger(column, autoIncrement, true);
    }

    /**
     * Create a new unsigned medium integer (3-byte) column on the table.
     */
    public unsignedMediumInteger(column: Stringable, autoIncrement = false): ColumnDefinition {
        return this.mediumInteger(column, autoIncrement, true);
    }

    /**
     * Create a new unsigned big integer (8-byte) column on the table.
     */
    public unsignedBigInteger(column: Stringable, autoIncrement = false): ColumnDefinition {
        return this.bigInteger(column, autoIncrement, true);
    }

    /**
     * Create a new unsigned big integer (8-byte) column on the table.
     */
    public foreignId(column: Stringable): ForeignIdColumnDefinition {
        const definition = new ForeignIdColumnDefinition(this, 'bigInteger', column, {
            autoIncrement: false,
            unsigned: true
        });
        this.addColumnDefinition(definition);
        return definition;
    }

    /**
     * Create a foreign ID column for the given model.
     */
    public foreignIdFor(model: RelatableConstructor | Relatable, column?: string): ForeignIdColumnDefinition {
        if (typeof model === 'function') {
            model = new model();
        }

        return model.getKeyType() === 'int' && model.getIncrementing()
            ? this.foreignId(column || model.getForeignKey())
            : this.foreignUuid(column || model.getForeignKey());
    }

    /**
     * Create a new float column on the table.
     */
    public float(column: Stringable, total = 8, places = 2, unsigned?: boolean): ColumnDefinition {
        return this.addColumn('float', column, { total, places, unsigned });
    }

    /**
     * Create a new double column on the table.
     */
    public double(column: Stringable, total?: number, places?: number, unsigned?: boolean): ColumnDefinition {
        return this.addColumn('double', column, { total, places, unsigned });
    }

    /**
     * Create a new decimal column on the table.
     */
    public decimal(column: Stringable, total = 8, places = 2, unsigned?: boolean): ColumnDefinition {
        return this.addColumn('decimal', column, { total, places, unsigned });
    }

    /**
     * Create a new unsigned float column on the table.
     */
    public unsignedFloat(column: Stringable, total = 8, places = 2): ColumnDefinition {
        return this.float(column, total, places, true);
    }

    /**
     * Create a new unsigned double column on the table.
     */
    public unsignedDouble(column: Stringable, total?: number, places?: number): ColumnDefinition {
        return this.double(column, total, places, true);
    }

    /**
     * Create a new unsigned decimal column on the table.
     */
    public unsignedDecimal(column: Stringable, total = 8, places = 2): ColumnDefinition {
        return this.decimal(column, total, places, true);
    }

    /**
     * Create a new boolean column on the table.
     */
    public boolean(column: Stringable): ColumnDefinition {
        return this.addColumn('boolean', column);
    }

    /**
     * Create a new enum column on the table.
     */
    public enum(column: Stringable, allowed: string[]): ColumnDefinition {
        return this.addColumn('enum', column, { allowed });
    }

    /**
     * Create a new set column on the table.
     */
    public set(column: Stringable, allowed: string[]): ColumnDefinition {
        return this.addColumn('set', column, { allowed });
    }

    /**
     * Create a new json column on the table.
     */
    public json(column: Stringable): ColumnDefinition {
        return this.addColumn('json', column);
    }

    /**
     * Create a new jsonb column on the table.
     */
    public jsonb(column: Stringable): ColumnDefinition {
        return this.addColumn('jsonb', column);
    }

    /**
     * Create a new date column on the table.
     */
    public date(column: Stringable): ColumnDefinition {
        return this.addColumn('date', column);
    }

    /**
     * Create a new date-time column on the table.
     */
    public dateTime(column: Stringable, precision = 0): ColumnDefinition {
        return this.addColumn('dateTime', column, { precision });
    }

    /**
     * Create a new date-time column (with time zone) on the table.
     */
    public dateTimeTz(column: Stringable, precision = 0): ColumnDefinition {
        return this.addColumn('dateTimeTz', column, { precision });
    }

    /**
     * Create a new time column on the table.
     */
    public time(column: Stringable, precision = 0): ColumnDefinition {
        return this.addColumn('time', column, { precision });
    }

    /**
     * Create a new time column (with time zone) on the table.
     */
    public timeTz(column: Stringable, precision = 0): ColumnDefinition {
        return this.addColumn('timeTz', column, { precision });
    }

    /**
     * Create a new timestamp column on the table.
     */
    public timestamp(column: Stringable, precision = 0): ColumnDefinition {
        return this.addColumn('timestamp', column, { precision });
    }

    /**
     * Create a new timestamp (with time zone) column on the table.
     */
    public timestampTz(column: Stringable, precision = 0): ColumnDefinition {
        return this.addColumn('timestampTz', column, { precision });
    }

    /**
     * Add nullable creation and update timestamps to the table.
     */
    public timestamps(precision = 0): void {
        this.timestamp('created_at', precision).nullable();

        this.timestamp('updated_at', precision).nullable();
    }

    /**
     * Add creation and update timestampTz columns to the table.
     */
    public timestampsTz(precision = 0): void {
        this.timestampTz('created_at', precision).nullable();

        this.timestampTz('updated_at', precision).nullable();
    }

    /**
     * Add creation and update datetime columns to the table.
     */
    public datetimes(precision = 0): void {
        this.dateTime('created_at', precision).nullable();

        this.dateTime('updated_at', precision).nullable();
    }

    /**
     * Add a "deleted at" timestamp for the table.
     */
    public softDeletes(column: Stringable = 'deleted_at', precision = 0): ColumnDefinition {
        return this.timestamp(column, precision).nullable();
    }

    /**
     * Add a "deleted at" timestampTz for the table.
     */
    public softDeletesTz(column: Stringable = 'deleted_at', precision = 0): ColumnDefinition {
        return this.timestampTz(column, precision).nullable();
    }

    /**
     * Add a "deleted at" datetime column to the table.
     */
    public softDeletesDatetime(column: Stringable = 'deleted_at', precision = 0): ColumnDefinition {
        return this.dateTime(column, precision).nullable();
    }

    /**
     * Create a new year column on the table.
     */
    public year(column: Stringable): ColumnDefinition {
        return this.addColumn('year', column);
    }

    /**
     * Create a new binary column on the table.
     */
    public binary(column: Stringable): ColumnDefinition {
        return this.addColumn('binary', column);
    }

    /**
     * Create a new UUID column on the table.
     */
    public uuid(column: Stringable = 'uuid'): ColumnDefinition {
        return this.addColumn('uuid', column);
    }

    /**
     * Create a new UUID column on the table with a foreign key constraint.
     */
    public foreignUuid(column: Stringable): ForeignIdColumnDefinition {
        return this.addColumnDefinition(new ForeignIdColumnDefinition(this, 'uuid', column));
    }

    /**
     * Create a new ULID column on the table.
     */
    public ulid(column: Stringable = 'ulid', length = 26): ColumnDefinition {
        return this.char(column, length);
    }

    /**
     * Create a new ULID column on the table with a foreign key constraint.
     */
    public foreignUlid(column: Stringable, length = 26): ForeignIdColumnDefinition {
        return this.addColumnDefinition(new ForeignIdColumnDefinition(this, 'char', column, { length }));
    }

    /**
     * Create a new IP address column on the table.
     */
    public ipAddress(column: Stringable = 'ip_address'): ColumnDefinition {
        return this.addColumn('ipAddress', column);
    }

    /**
     * Create a new MAC address column on the table.
     */
    public macAddress(column: Stringable = 'mac_address'): ColumnDefinition {
        return this.addColumn('macAddress', column);
    }

    /**
     * Create a new geometry column on the table.
     */
    public geometry(column: Stringable): ColumnDefinition {
        return this.addColumn('geometry', column);
    }

    /**
     * Create a new point column on the table.
     */
    public point(column: Stringable, srid?: number): ColumnDefinition {
        return this.addColumn('point', column, { srid });
    }

    /**
     * Create a new linestring column on the table.
     */
    public lineString(column: Stringable): ColumnDefinition {
        return this.addColumn('lineString', column);
    }

    /**
     * Create a new polygon column on the table.
     */
    public polygon(column: Stringable): ColumnDefinition {
        return this.addColumn('polygon', column);
    }

    /**
     * Create a new geometrycollection column on the table.
     */
    public geometryCollection(column: Stringable): ColumnDefinition {
        return this.addColumn('geometryCollection', column);
    }

    /**
     * Create a new multipoint column on the table.
     */
    public multiPoint(column: Stringable): ColumnDefinition {
        return this.addColumn('multiPoint', column);
    }

    /**
     * Create a new multilinestring column on the table.
     */
    public multiLineString(column: Stringable): ColumnDefinition {
        return this.addColumn('multiLineString', column);
    }

    /**
     * Create a new multipolygon column on the table.
     */
    public multiPolygon(column: Stringable): ColumnDefinition {
        return this.addColumn('multiPolygon', column);
    }

    /**
     * Create a new multipolygon column on the table.
     */
    public multiPolygonZ(column: Stringable): ColumnDefinition {
        return this.addColumn('multiPolygonZ', column);
    }

    /**
     * Create a new generated, computed column on the table.
     */
    public computed(column: Stringable, expression: Stringable): ColumnDefinition {
        return this.addColumn('computed', column, { expression });
    }

    /**
     * Add the proper columns for a polymorphic table.
     */
    public morphs(name: Stringable, indexName?: Stringable): void {
        if (QueryBuilder.defaultMorphKeyType === 'uuid') {
            this.uuidMorphs(name, indexName);
        } else if (QueryBuilder.defaultMorphKeyType === 'ulid') {
            this.ulidMorphs(name, indexName);
        } else {
            this.numericMorphs(name, indexName);
        }
    }

    /**
     * Add nullable columns for a polymorphic table.
     */
    public nullableMorphs(name: Stringable, indexName?: Stringable): void {
        if (QueryBuilder.defaultMorphKeyType === 'uuid') {
            this.nullableUuidMorphs(name, indexName);
        } else if (QueryBuilder.defaultMorphKeyType === 'ulid') {
            this.nullableUlidMorphs(name, indexName);
        } else {
            this.nullableNumericMorphs(name, indexName);
        }
    }

    /**
     * Add the proper columns for a polymorphic table using numeric IDs (incremental).
     */
    public numericMorphs(name: Stringable, indexName?: Stringable): void {
        name = this.grammar.getValue(name).toString();

        this.string(`${name}_type`);

        this.unsignedBigInteger(`${name}_id`);

        this.index([`${name}_type`, `${name}_id`], indexName);
    }

    /**
     * Add nullable columns for a polymorphic table using numeric IDs (incremental).
     */
    public nullableNumericMorphs(name: Stringable, indexName?: Stringable): void {
        name = this.grammar.getValue(name).toString();

        this.string(`${name}_type`).nullable();

        this.unsignedBigInteger(`${name}_id`).nullable();

        this.index([`${name}_type`, `${name}_id`], indexName);
    }

    /**
     * Add the proper columns for a polymorphic table using UUIDs.
     */
    public uuidMorphs(name: Stringable, indexName?: Stringable): void {
        name = this.grammar.getValue(name).toString();

        this.string(`${name}_type`);

        this.uuid(`${name}_id`);

        this.index([`${name}_type`, `${name}_id`], indexName);
    }

    /**
     * Add nullable columns for a polymorphic table using UUIDs.
     */
    public nullableUuidMorphs(name: Stringable, indexName?: Stringable): void {
        name = this.grammar.getValue(name).toString();

        this.string(`${name}_type`).nullable();

        this.uuid(`${name}_id`).nullable();

        this.index([`${name}_type`, `${name}_id`], indexName);
    }

    /**
     * Add the proper columns for a polymorphic table using ULIDs.
     */
    public ulidMorphs(name: Stringable, indexName?: Stringable): void {
        name = this.grammar.getValue(name).toString();

        this.string(`${name}_type`);

        this.ulid(`${name}_id`);

        this.index([`${name}_type`, `${name}_id`], indexName);
    }

    /**
     * Add nullable columns for a polymorphic table using ULIDs.
     */
    public nullableUlidMorphs(name: Stringable, indexName?: Stringable): void {
        name = this.grammar.getValue(name).toString();

        this.string(`${name}_type`).nullable();

        this.ulid(`${name}_id`).nullable();

        this.index([`${name}_type`, `${name}_id`], indexName);
    }

    /**
     * Create a new index command.
     */
    protected createIndexCommand<T extends IndexRegistryI = IndexRegistryI>(
        name: CommandType,
        parameters: T
    ): CommandIndexDefinition<T> {
        return new CommandIndexDefinition(name, parameters);
    }

    /**
     * Create a new foreign command.
     */
    protected createForeignCommand<T extends ForeignKeyRegistryI = ForeignKeyRegistryI>(
        name: CommandType,
        parameters: T
    ): CommandForeignKeyDefinition<T> {
        return new CommandForeignKeyDefinition(name, parameters);
    }

    /**
     * Add a new index command to the blueprint.
     */
    protected indexCommand(
        type: CommandType,
        columns: Stringable | Stringable[],
        index?: Stringable,
        algorithm?: Stringable
    ): CommandIndexDefinition<IndexRegistryI> {
        columns = Array.isArray(columns) ? columns : [columns];

        // If no name was specified for this index, we will create one using a basic
        // convention of the table name, followed by the columns, followed by an
        // index type, such as primary or index, which makes the index unique.
        index = index ?? this.createIndexName(type, columns);

        return this.createIndexCommand(type, { index, columns, algorithm });
    }

    /**
     * Create a new drop index command on the blueprint.
     */
    protected dropIndexCommand(
        command: CommandType,
        type: string,
        index?: Stringable | Stringable[]
    ): CommandIndexDefinition<IndexRegistryI> {
        let columns: Stringable[] = [];

        // If the given "index" is actually an array of columns, the developer means
        // to drop an index merely by specifying the columns involved without the
        // conventional name, so we will build the index name from the columns.
        if (Array.isArray(index)) {
            columns = index;
            index = this.createIndexName(type, columns);
        }

        return this.indexCommand(command, columns, index);
    }

    /**
     * Add a new index command to the blueprint.
     */
    protected foreignKeyCommand(
        type: CommandType,
        columns: Stringable | Stringable[],
        index?: Stringable,
        algorithm?: Stringable
    ): CommandForeignKeyDefinition<ForeignKeyRegistryI> {
        columns = Array.isArray(columns) ? columns : [columns];

        // If no name was specified for this index, we will create one using a basic
        // convention of the table name, followed by the columns, followed by an
        // index type, such as primary or index, which makes the index unique.
        index = index ?? this.createIndexName(type, columns);

        return this.createForeignCommand(type, { on: '', references: '', index, columns, algorithm });
    }

    /**
     * Create a new drop foreign key command on the blueprint.
     */
    protected dropForeignKeyCommand(
        command: CommandType,
        type: string,
        index?: Stringable | Stringable[]
    ): CommandForeignKeyDefinition<ForeignKeyRegistryI> {
        let columns: Stringable[] = [];

        // If the given "index" is actually an array of columns, the developer means
        // to drop an index merely by specifying the columns involved without the
        // conventional name, so we will build the index name from the columns.
        if (Array.isArray(index)) {
            columns = index;
            index = this.createIndexName(type, columns);
        }

        return this.foreignKeyCommand(command, columns, index);
    }

    /**
     * Create a default index name for the table.
     */
    protected createIndexName(type: string, columns: Stringable[]): string {
        const index = `${this.registry.prefix}${this.registry.table}_${columns
            .map(column => this.grammar.getValue(column).toString())
            .join('_')}_${type}`.toLowerCase();

        return index.replace(/\-/g, '_').replace(/\./g, '_');
    }

    /**
     * Add a new column to the blueprint.
     */
    public addColumn(type: ColumnType, name: Stringable, parameters: Partial<ColumnRegistryI> = {}): ColumnDefinition {
        return this.addColumnDefinition(new ColumnDefinition(type, name, parameters));
    }

    /**
     * Add a new column definition to the blueprint.
     */
    protected addColumnDefinition<T extends ColumnDefinition = ColumnDefinition>(definition: T): T {
        this.registry.columns.push(definition);

        if (this.registry.after) {
            definition.after(this.registry.after);

            this.registry.after = definition.name;
        }

        return definition;
    }

    /**
     * Add the columns from the callback after the given column.
     */
    public after(column: Stringable, callback: BlueprintCallback): void {
        this.registry.after = column;

        callback(this);

        this.registry.after = undefined;
    }

    /**
     * Remove a column from the schema blueprint.
     */
    public removeColumn(name: Stringable): this {
        this.registry.columns = this.registry.columns.filter(
            definition => this.grammar.getValue(definition.name).toString() !== this.grammar.getValue(name).toString()
        );

        return this;
    }

    /**
     * Add a new command to the blueprint.
     */
    protected addCommand<T extends CommandDefinition = CommandDefinition>(command: T): T {
        this.registry.commands.push(command);
        return command;
    }

    /**
     * Create a new command.
     */
    protected createCommand<T extends CommandRegistryI = CommandRegistryI>(
        name: CommandType,
        parameters: T
    ): CommandDefinition<T> {
        return new CommandDefinition(name, parameters);
    }

    /**
     * Get the blueprint grammar.
     */
    public getGrammar(): Grammar {
        return this.grammar;
    }

    /**
     * Get the table the blueprint describes.
     */
    public getTable(): Stringable {
        return this.registry.table;
    }

    /**
     * Get the table prefix.
     */
    public getPrefix(): Stringable {
        return this.registry.prefix;
    }

    /**
     * Get the columns on the blueprint.
     */
    public getColumns(): ColumnDefinition[] {
        return this.registry.columns;
    }

    /**
     * Get the commands on the blueprint.
     */
    public getCommands<T extends CommandDefinition = CommandDefinition>(): T[] {
        return this.registry.commands as T[];
    }

    /**
     * Get the columns on the blueprint that should be added.
     */
    public getAddedColumns(): ColumnDefinition[] {
        return this.registry.columns.filter(definition => !Boolean(definition.getRegistry().change));
    }

    /**
     * Get the columns on the blueprint that should be changed.
     */
    public getChangedColumns(): ColumnDefinition[] {
        return this.registry.columns.filter(definition => Boolean(definition.getRegistry().change));
    }
}
export default Blueprint;

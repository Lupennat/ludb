import { DB, currentGenericDB, currentSqliteDB, isSqlite } from '../fixtures/config';

const maybe = isSqlite() ? describe : describe.skip;

maybe('Column Types', () => {
    const currentDB = currentGenericDB as currentSqliteDB;
    const Schema = DB.connection(currentDB).getSchemaBuilder();

    beforeAll(async () => {
        await Schema.create('test_column_type_table', table => {
            table.id('id');
            table.bigInteger('biginteger');
            table.binary('binary');
            table.boolean('boolean');
            table.char('char');
            table.dateTimeTz('datetimetz');
            table.dateTime('datetime');
            table.date('date');
            table.decimal('decimal');
            table.double('double');
            table.enum('enum', ['test']);
            table.float('float');
            table.foreignId('foreignid');
            table.foreignUlid('foreignulid');
            table.foreignUuid('foreignuuid');
            table.geometryCollection('geographycollection');
            table.geometryCollection('geometrycollection').isGeometry();
            table.geometry('geography');
            table.geometry('geometry').isGeometry();
            table.integer('integer');
            table.ipAddress('ipaddress');
            table.json('json');
            table.jsonb('jsonb');
            table.lineString('geographylinestring');
            table.lineString('linestring').isGeometry();
            table.longText('longtext');
            table.macAddress('macaddress');
            table.mediumInteger('mediuminteger');
            table.mediumText('mediumtext');
            table.morphs('morphs');
            table.multiLineString('geographymultilinestring');
            table.multiLineString('multilinestring').isGeometry();
            table.multiPoint('geographymultipoint');
            table.multiPoint('multipoint').isGeometry();
            table.multiPolygon('geographymultipolygon');
            table.multiPolygon('multipolygon').isGeometry();
            table.nullableMorphs('nullablemorphs');
            table.point('geographypoint');
            table.point('point').isGeometry();
            table.polygon('geographypolygon');
            table.polygon('polygon').isGeometry();
            table.smallInteger('smallinteger');
            table.softDeletesTz('softdeletestz');
            table.softDeletes('softdeletes');
            table.string('string');
            table.text('text');
            table.timeTz('timetz');
            table.time('time');
            table.timestampTz('timestamptz');
            table.timestamp('timestamp');
            table.tinyInteger('tinyinteger');
            table.tinyText('tinytext');
            table.unsignedBigInteger('unsignedbiginteger');
            table.unsignedDecimal('unsigneddecimal');
            table.unsignedInteger('unsignedinteger');
            table.unsignedMediumInteger('unsignedmediuminteger');
            table.unsignedSmallInteger('unsignedsmallinteger');
            table.unsignedTinyInteger('unsignedtinyinteger');
            table.ulidMorphs('ulidmorphs');
            table.uuidMorphs('uuidmorphs');
            table.ulid('ulid');
            table.uuid('uuid');
            table.year('year');
        });
    });

    afterAll(async () => {
        await Schema.drop('test_column_type_table');
        await DB.connection(currentDB).disconnect();
    });

    it('Works Get Column Type', async () => {
        expect(await Schema.getColumnType('test_column_type_table', 'id')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'biginteger')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'binary')).toBe('blob');
        expect(await Schema.getColumnType('test_column_type_table', 'boolean')).toBe('tinyint');
        expect(await Schema.getColumnType('test_column_type_table', 'char')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'datetimetz')).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'datetime')).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'date')).toBe('date');
        expect(await Schema.getColumnType('test_column_type_table', 'decimal')).toBe('numeric');
        expect(await Schema.getColumnType('test_column_type_table', 'double')).toBe('float');
        expect(await Schema.getColumnType('test_column_type_table', 'enum')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignid')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignulid')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignuuid')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'geographycollection')).toBe('geometrycollection');
        expect(await Schema.getColumnType('test_column_type_table', 'geometrycollection')).toBe('geometrycollection');
        expect(await Schema.getColumnType('test_column_type_table', 'geography')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'geometry')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'integer')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'ipaddress')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'json')).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'jsonb')).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'geographylinestring')).toBe('linestring');
        expect(await Schema.getColumnType('test_column_type_table', 'linestring')).toBe('linestring');
        expect(await Schema.getColumnType('test_column_type_table', 'longtext')).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'macaddress')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'mediuminteger')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'mediumtext')).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_id')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultilinestring')).toBe(
            'multilinestring'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'multilinestring')).toBe('multilinestring');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipoint')).toBe('multipoint');
        expect(await Schema.getColumnType('test_column_type_table', 'multipoint')).toBe('multipoint');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipolygon')).toBe('multipolygon');
        expect(await Schema.getColumnType('test_column_type_table', 'multipolygon')).toBe('multipolygon');
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_id')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypoint')).toBe('point');
        expect(await Schema.getColumnType('test_column_type_table', 'point')).toBe('point');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypolygon')).toBe('polygon');
        expect(await Schema.getColumnType('test_column_type_table', 'polygon')).toBe('polygon');
        expect(await Schema.getColumnType('test_column_type_table', 'smallinteger')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletestz')).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletes')).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'string')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'text')).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'timetz')).toBe('time');
        expect(await Schema.getColumnType('test_column_type_table', 'time')).toBe('time');
        expect(await Schema.getColumnType('test_column_type_table', 'timestamptz')).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'timestamp')).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'tinyinteger')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'tinytext')).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedbiginteger')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'unsigneddecimal')).toBe('numeric');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedinteger')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedmediuminteger')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedsmallinteger')).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_id')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_id')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'ulid')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuid')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'year')).toBe('integer');
    });

    it('Works Get Column Type Full Definition', async () => {
        expect(await Schema.getColumnType('test_column_type_table', 'id', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'biginteger', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'binary', true)).toBe('blob');
        expect(await Schema.getColumnType('test_column_type_table', 'boolean', true)).toBe('tinyint(1)');
        expect(await Schema.getColumnType('test_column_type_table', 'char', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'datetimetz', true)).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'datetime', true)).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'date', true)).toBe('date');
        expect(await Schema.getColumnType('test_column_type_table', 'decimal', true)).toBe('numeric');
        expect(await Schema.getColumnType('test_column_type_table', 'double', true)).toBe('float');
        expect(await Schema.getColumnType('test_column_type_table', 'enum', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignid', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignulid', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignuuid', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'geographycollection', true)).toBe(
            'geometrycollection'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'geometrycollection', true)).toBe(
            'geometrycollection'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'geography', true)).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'geometry', true)).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'integer', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'ipaddress', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'json', true)).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'jsonb', true)).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'geographylinestring', true)).toBe('linestring');
        expect(await Schema.getColumnType('test_column_type_table', 'linestring', true)).toBe('linestring');
        expect(await Schema.getColumnType('test_column_type_table', 'longtext', true)).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'macaddress', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'mediuminteger', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'mediumtext', true)).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_type', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_id', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultilinestring', true)).toBe(
            'multilinestring'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'multilinestring', true)).toBe('multilinestring');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipoint', true)).toBe('multipoint');
        expect(await Schema.getColumnType('test_column_type_table', 'multipoint', true)).toBe('multipoint');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipolygon', true)).toBe(
            'multipolygon'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'multipolygon', true)).toBe('multipolygon');
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_type', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_id', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypoint', true)).toBe('point');
        expect(await Schema.getColumnType('test_column_type_table', 'point', true)).toBe('point');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypolygon', true)).toBe('polygon');
        expect(await Schema.getColumnType('test_column_type_table', 'polygon', true)).toBe('polygon');
        expect(await Schema.getColumnType('test_column_type_table', 'smallinteger', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletestz', true)).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletes', true)).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'string', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'text', true)).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'timetz', true)).toBe('time');
        expect(await Schema.getColumnType('test_column_type_table', 'time', true)).toBe('time');
        expect(await Schema.getColumnType('test_column_type_table', 'timestamptz', true)).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'timestamp', true)).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'tinyinteger', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'tinytext', true)).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedbiginteger', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'unsigneddecimal', true)).toBe('numeric');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedinteger', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedmediuminteger', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedsmallinteger', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_type', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_id', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_type', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_id', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'ulid', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuid', true)).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'year', true)).toBe('integer');
    });
});

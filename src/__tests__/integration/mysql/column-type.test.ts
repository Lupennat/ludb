import { DB, isMySql } from '../fixtures/config';

const maybe = isMySql() ? describe : describe.skip;

maybe('Column Types', () => {
    const Schema = DB.connection().getSchemaBuilder();

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
            table.nullableMorphs('nullablemorphs', 'nullablemorphs');
            table.point('geographypoint');
            table.point('point').isGeometry();
            table.polygon('geographypolygon');
            table.polygon('polygon').isGeometry();
            table.set('set', ['test']);
            table.smallInteger('smallinteger');
            table.softDeletesTz('softdeletestz');
            table.softDeletes('softdeletes');
            table.string('string');
            table.text('text');
            table.timeTz('timetz');
            table.time('time');
            table.timestampTz('timestamptz').useCurrent();
            table.timestamp('timestamp').useCurrent();
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
        await DB.disconnect();
    });

    it('Works Get Column Type', async () => {
        expect(await Schema.getColumnType('test_column_type_table', 'id')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'biginteger')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'binary')).toBe('blob');
        expect(await Schema.getColumnType('test_column_type_table', 'boolean')).toBe('tinyint');
        expect(await Schema.getColumnType('test_column_type_table', 'char')).toBe('char');
        expect(await Schema.getColumnType('test_column_type_table', 'datetimetz')).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'datetime')).toBe('datetime');
        expect(await Schema.getColumnType('test_column_type_table', 'date')).toBe('date');
        expect(await Schema.getColumnType('test_column_type_table', 'decimal')).toBe('decimal');
        expect(await Schema.getColumnType('test_column_type_table', 'double')).toBe('double');
        expect(await Schema.getColumnType('test_column_type_table', 'enum')).toBe('enum');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignid')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignulid')).toBe('char');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignuuid')).toBe('char');
        expect(
            ['geomcollection', 'geometrycollection'].includes(
                await Schema.getColumnType('test_column_type_table', 'geographycollection')
            )
        ).toBeTruthy();
        expect(
            ['geomcollection', 'geometrycollection'].includes(
                await Schema.getColumnType('test_column_type_table', 'geometrycollection')
            )
        ).toBeTruthy();
        expect(await Schema.getColumnType('test_column_type_table', 'geography')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'geometry')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'integer')).toBe('int');
        expect(await Schema.getColumnType('test_column_type_table', 'ipaddress')).toBe('varchar');
        expect(
            ['json', 'longtext'].includes(await Schema.getColumnType('test_column_type_table', 'json'))
        ).toBeTruthy();
        expect(
            ['json', 'longtext'].includes(await Schema.getColumnType('test_column_type_table', 'jsonb'))
        ).toBeTruthy();
        expect(await Schema.getColumnType('test_column_type_table', 'geographylinestring')).toBe('linestring');
        expect(await Schema.getColumnType('test_column_type_table', 'linestring')).toBe('linestring');
        expect(await Schema.getColumnType('test_column_type_table', 'longtext')).toBe('longtext');
        expect(await Schema.getColumnType('test_column_type_table', 'macaddress')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'mediuminteger')).toBe('mediumint');
        expect(await Schema.getColumnType('test_column_type_table', 'mediumtext')).toBe('mediumtext');
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_id')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultilinestring')).toBe(
            'multilinestring'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'multilinestring')).toBe('multilinestring');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipoint')).toBe('multipoint');
        expect(await Schema.getColumnType('test_column_type_table', 'multipoint')).toBe('multipoint');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipolygon')).toBe('multipolygon');
        expect(await Schema.getColumnType('test_column_type_table', 'multipolygon')).toBe('multipolygon');
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_id')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypoint')).toBe('point');
        expect(await Schema.getColumnType('test_column_type_table', 'point')).toBe('point');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypolygon')).toBe('polygon');
        expect(await Schema.getColumnType('test_column_type_table', 'polygon')).toBe('polygon');
        expect(await Schema.getColumnType('test_column_type_table', 'smallinteger')).toBe('smallint');
        expect(await Schema.getColumnType('test_column_type_table', 'set')).toBe('set');
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletestz')).toBe('timestamp');
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletes')).toBe('timestamp');
        expect(await Schema.getColumnType('test_column_type_table', 'string')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'text')).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'timetz')).toBe('time');
        expect(await Schema.getColumnType('test_column_type_table', 'time')).toBe('time');
        expect(await Schema.getColumnType('test_column_type_table', 'timestamptz')).toBe('timestamp');
        expect(await Schema.getColumnType('test_column_type_table', 'timestamp')).toBe('timestamp');
        expect(await Schema.getColumnType('test_column_type_table', 'tinyinteger')).toBe('tinyint');
        expect(await Schema.getColumnType('test_column_type_table', 'tinytext')).toBe('tinytext');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedbiginteger')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'unsigneddecimal')).toBe('decimal');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedinteger')).toBe('int');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedmediuminteger')).toBe('mediumint');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedsmallinteger')).toBe('smallint');
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_id')).toBe('char');
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_id')).toBe('char');
        expect(await Schema.getColumnType('test_column_type_table', 'ulid')).toBe('char');
        expect(await Schema.getColumnType('test_column_type_table', 'uuid')).toBe('char');
        expect(await Schema.getColumnType('test_column_type_table', 'year')).toBe('year');
    });
});

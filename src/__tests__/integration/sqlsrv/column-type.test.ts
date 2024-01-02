import { DB, currentDB, isSqlserver } from '../fixtures/config';

const maybe = isSqlserver() ? describe : describe.skip;

maybe('Column Types', () => {
    const Schema = DB.connections[currentDB].getSchemaBuilder();

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
        await DB.connections[currentDB].disconnect();
    });

    it('Works Get Column Type', async () => {
        expect(await Schema.getColumnType('test_column_type_table', 'id')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'biginteger')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'binary')).toBe('varbinary');
        expect(await Schema.getColumnType('test_column_type_table', 'boolean')).toBe('bit');
        expect(await Schema.getColumnType('test_column_type_table', 'char')).toBe('nchar');
        expect(await Schema.getColumnType('test_column_type_table', 'datetimetz')).toBe('datetimeoffset');
        expect(await Schema.getColumnType('test_column_type_table', 'datetime')).toBe('datetime2');
        expect(await Schema.getColumnType('test_column_type_table', 'date')).toBe('date');
        expect(await Schema.getColumnType('test_column_type_table', 'decimal')).toBe('decimal');
        expect(await Schema.getColumnType('test_column_type_table', 'double')).toBe('float');
        expect(await Schema.getColumnType('test_column_type_table', 'enum')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignid')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignulid')).toBe('nchar');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignuuid')).toBe('uniqueidentifier');
        expect(await Schema.getColumnType('test_column_type_table', 'geographycollection')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'geometrycollection')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'geography')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'geometry')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'integer')).toBe('int');
        expect(await Schema.getColumnType('test_column_type_table', 'ipaddress')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'json')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'jsonb')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'geographylinestring')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'linestring')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'longtext')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'macaddress')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'mediuminteger')).toBe('int');
        expect(await Schema.getColumnType('test_column_type_table', 'mediumtext')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_type')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_id')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultilinestring')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'multilinestring')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipoint')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'multipoint')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipolygon')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'multipolygon')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_type')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_id')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypoint')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'point')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypolygon')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'polygon')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'smallinteger')).toBe('smallint');
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletestz')).toBe('datetimeoffset');
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletes')).toBe('datetime2');
        expect(await Schema.getColumnType('test_column_type_table', 'string')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'text')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'timetz')).toBe('time');
        expect(await Schema.getColumnType('test_column_type_table', 'time')).toBe('time');
        expect(await Schema.getColumnType('test_column_type_table', 'timestamptz')).toBe('datetimeoffset');
        expect(await Schema.getColumnType('test_column_type_table', 'timestamp')).toBe('datetime2');
        expect(await Schema.getColumnType('test_column_type_table', 'tinyinteger')).toBe('tinyint');
        expect(await Schema.getColumnType('test_column_type_table', 'tinytext')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedbiginteger')).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'unsigneddecimal')).toBe('decimal');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedinteger')).toBe('int');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedmediuminteger')).toBe('int');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedsmallinteger')).toBe('smallint');
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_type')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_id')).toBe('nchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_type')).toBe('nvarchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_id')).toBe('uniqueidentifier');
        expect(await Schema.getColumnType('test_column_type_table', 'ulid')).toBe('nchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuid')).toBe('uniqueidentifier');
        expect(await Schema.getColumnType('test_column_type_table', 'year')).toBe('int');
    });
});

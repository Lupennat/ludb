import { DB, currentGenericDB, currentPostgresDB, isPostgres } from '../fixtures/config';

const maybe = isPostgres() ? describe : describe.skip;

maybe('Column Types', () => {
    const currentDB = currentGenericDB as currentPostgresDB;
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
            table.multiPolygonZ('geographymultipolygonz');
            table.multiPolygonZ('multipolygonz').isGeometry();
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
        expect(await Schema.getColumnType('test_column_type_table', 'id')).toBe('int8');
        expect(await Schema.getColumnType('test_column_type_table', 'biginteger')).toBe('int8');
        expect(await Schema.getColumnType('test_column_type_table', 'binary')).toBe('bytea');
        expect(await Schema.getColumnType('test_column_type_table', 'boolean')).toBe('bool');
        expect(await Schema.getColumnType('test_column_type_table', 'char')).toBe('bpchar');
        expect(await Schema.getColumnType('test_column_type_table', 'datetimetz')).toBe('timestamptz');
        expect(await Schema.getColumnType('test_column_type_table', 'datetime')).toBe('timestamp');
        expect(await Schema.getColumnType('test_column_type_table', 'date')).toBe('date');
        expect(await Schema.getColumnType('test_column_type_table', 'decimal')).toBe('numeric');
        expect(await Schema.getColumnType('test_column_type_table', 'double')).toBe('float8');
        expect(await Schema.getColumnType('test_column_type_table', 'enum')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignid')).toBe('int8');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignulid')).toBe('bpchar');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignuuid')).toBe('uuid');
        expect(await Schema.getColumnType('test_column_type_table', 'geographycollection')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'geometrycollection')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'geography')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'geometry')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'integer')).toBe('int4');
        expect(await Schema.getColumnType('test_column_type_table', 'ipaddress')).toBe('inet');
        expect(await Schema.getColumnType('test_column_type_table', 'json')).toBe('json');
        expect(await Schema.getColumnType('test_column_type_table', 'jsonb')).toBe('jsonb');
        expect(await Schema.getColumnType('test_column_type_table', 'geographylinestring')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'linestring')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'longtext')).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'macaddress')).toBe('macaddr');
        expect(await Schema.getColumnType('test_column_type_table', 'mediuminteger')).toBe('int4');
        expect(await Schema.getColumnType('test_column_type_table', 'mediumtext')).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_id')).toBe('int8');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultilinestring')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'multilinestring')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipoint')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'multipoint')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipolygon')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'multipolygon')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipolygonz')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'multipolygonz')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_id')).toBe('int8');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypoint')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'point')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypolygon')).toBe('geography');
        expect(await Schema.getColumnType('test_column_type_table', 'polygon')).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'smallinteger')).toBe('int2');
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletestz')).toBe('timestamptz');
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletes')).toBe('timestamp');
        expect(await Schema.getColumnType('test_column_type_table', 'string')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'text')).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'timetz')).toBe('timetz');
        expect(await Schema.getColumnType('test_column_type_table', 'time')).toBe('time');
        expect(await Schema.getColumnType('test_column_type_table', 'timestamptz')).toBe('timestamptz');
        expect(await Schema.getColumnType('test_column_type_table', 'timestamp')).toBe('timestamp');
        expect(await Schema.getColumnType('test_column_type_table', 'tinyinteger')).toBe('int2');
        expect(await Schema.getColumnType('test_column_type_table', 'tinytext')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedbiginteger')).toBe('int8');
        expect(await Schema.getColumnType('test_column_type_table', 'unsigneddecimal')).toBe('numeric');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedinteger')).toBe('int4');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedmediuminteger')).toBe('int4');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedsmallinteger')).toBe('int2');
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_id')).toBe('bpchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_type')).toBe('varchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_id')).toBe('uuid');
        expect(await Schema.getColumnType('test_column_type_table', 'ulid')).toBe('bpchar');
        expect(await Schema.getColumnType('test_column_type_table', 'uuid')).toBe('uuid');
        expect(await Schema.getColumnType('test_column_type_table', 'year')).toBe('int4');
    });

    it('Works Get Column Type Full Definition', async () => {
        expect(await Schema.getColumnType('test_column_type_table', 'id', true)).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'biginteger', true)).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'binary', true)).toBe('bytea');
        expect(await Schema.getColumnType('test_column_type_table', 'boolean', true)).toBe('boolean');
        expect(await Schema.getColumnType('test_column_type_table', 'char', true)).toBe('character(255)');
        expect(await Schema.getColumnType('test_column_type_table', 'datetimetz', true)).toBe(
            'timestamp(0) with time zone'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'datetime', true)).toBe(
            'timestamp(0) without time zone'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'date', true)).toBe('date');
        expect(await Schema.getColumnType('test_column_type_table', 'decimal', true)).toBe('numeric(8,2)');
        expect(await Schema.getColumnType('test_column_type_table', 'double', true)).toBe('double precision');
        expect(await Schema.getColumnType('test_column_type_table', 'enum', true)).toBe('character varying(255)');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignid', true)).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignulid', true)).toBe('character(26)');
        expect(await Schema.getColumnType('test_column_type_table', 'foreignuuid', true)).toBe('uuid');
        expect(await Schema.getColumnType('test_column_type_table', 'geographycollection', true)).toBe(
            'geography(GeometryCollection,4326)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'geometrycollection', true)).toBe(
            'geometry(GeometryCollection)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'geography', true)).toBe(
            'geography(Geometry,4326)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'geometry', true)).toBe('geometry');
        expect(await Schema.getColumnType('test_column_type_table', 'integer', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'ipaddress', true)).toBe('inet');
        expect(await Schema.getColumnType('test_column_type_table', 'json', true)).toBe('json');
        expect(await Schema.getColumnType('test_column_type_table', 'jsonb', true)).toBe('jsonb');
        expect(await Schema.getColumnType('test_column_type_table', 'geographylinestring', true)).toBe(
            'geography(LineString,4326)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'linestring', true)).toBe('geometry(LineString)');
        expect(await Schema.getColumnType('test_column_type_table', 'longtext', true)).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'macaddress', true)).toBe('macaddr');
        expect(await Schema.getColumnType('test_column_type_table', 'mediuminteger', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'mediumtext', true)).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_type', true)).toBe(
            'character varying(255)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'morphs_id', true)).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultilinestring', true)).toBe(
            'geography(MultiLineString,4326)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'multilinestring', true)).toBe(
            'geometry(MultiLineString)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipoint', true)).toBe(
            'geography(MultiPoint,4326)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'multipoint', true)).toBe('geometry(MultiPoint)');
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipolygon', true)).toBe(
            'geography(MultiPolygon,4326)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'multipolygon', true)).toBe(
            'geometry(MultiPolygon)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'geographymultipolygonz', true)).toBe(
            'geography(MultiPolygonZ,4326)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'multipolygonz', true)).toBe(
            'geometry(MultiPolygonZ)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_type', true)).toBe(
            'character varying(255)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'nullablemorphs_id', true)).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypoint', true)).toBe(
            'geography(Point,4326)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'point', true)).toBe('geometry(Point)');
        expect(await Schema.getColumnType('test_column_type_table', 'geographypolygon', true)).toBe(
            'geography(Polygon,4326)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'polygon', true)).toBe('geometry(Polygon)');
        expect(await Schema.getColumnType('test_column_type_table', 'smallinteger', true)).toBe('smallint');
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletestz', true)).toBe(
            'timestamp(0) with time zone'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'softdeletes', true)).toBe(
            'timestamp(0) without time zone'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'string', true)).toBe('character varying(255)');
        expect(await Schema.getColumnType('test_column_type_table', 'text', true)).toBe('text');
        expect(await Schema.getColumnType('test_column_type_table', 'timetz', true)).toBe('time(0) with time zone');
        expect(await Schema.getColumnType('test_column_type_table', 'time', true)).toBe('time(0) without time zone');
        expect(await Schema.getColumnType('test_column_type_table', 'timestamptz', true)).toBe(
            'timestamp(0) with time zone'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'timestamp', true)).toBe(
            'timestamp(0) without time zone'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'tinyinteger', true)).toBe('smallint');
        expect(await Schema.getColumnType('test_column_type_table', 'tinytext', true)).toBe('character varying(255)');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedbiginteger', true)).toBe('bigint');
        expect(await Schema.getColumnType('test_column_type_table', 'unsigneddecimal', true)).toBe('numeric(8,2)');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedinteger', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedmediuminteger', true)).toBe('integer');
        expect(await Schema.getColumnType('test_column_type_table', 'unsignedsmallinteger', true)).toBe('smallint');
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_type', true)).toBe(
            'character varying(255)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'ulidmorphs_id', true)).toBe('character(26)');
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_type', true)).toBe(
            'character varying(255)'
        );
        expect(await Schema.getColumnType('test_column_type_table', 'uuidmorphs_id', true)).toBe('uuid');
        expect(await Schema.getColumnType('test_column_type_table', 'ulid', true)).toBe('character(26)');
        expect(await Schema.getColumnType('test_column_type_table', 'uuid', true)).toBe('uuid');
        expect(await Schema.getColumnType('test_column_type_table', 'year', true)).toBe('integer');
    });
});

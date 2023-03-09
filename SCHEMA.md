# Schema

> Ludb offers an (almost) identical api to [Laravel Schema](https://laravel.com/docs/migrations).

-   [Introduction](#introduction)
-   [Tables](#tables)
    -   [Creating Tables](#creating-tables)
    -   [Updating Tables](#updating-tables)
    -   [Renaming / Dropping Tables](#renaming-and-dropping-tables)
-   [Columns](#columns)
    -   [Creating Columns](#creating-columns)
    -   [Available Column Types](#available-column-types)
    -   [Column Modifiers](#column-modifiers)
    -   [Modifying Columns](#modifying-columns)
    -   [Renaming Columns](#renaming-columns)
    -   [Dropping Columns](#dropping-columns)
-   [Indexes](#indexes)
    -   [Creating Indexes](#creating-indexes)
    -   [Renaming Indexes](#renaming-indexes)
    -   [Dropping Indexes](#dropping-indexes)
    -   [Foreign Key Constraints](#foreign-key-constraints)

## Introduction

The Ludb `Schema` provides database agnostic support for creating and manipulating tables across all of Ludb's supported database systems.

## Tables

### Creating Tables

To create a new database table, use the `create` method on the `Schema`. The `create` method accepts two arguments: the first is the name of the table, while the second is a closure which receives a `Blueprint` object that may be used to define the new table:

```ts
await Schema.create('users', table => {
    table.id();
    table.string('name');
    table.string('email');
    table.timestamps();
});
```

When creating the table, you may use any of the schema builder's [column methods](#creating-columns) to define the table's columns.

#### Checking For Table / Column Existence

You may check for the existence of a table or column using the `hasTable` and `hasColumn` methods:

```ts
if (await Schema.hasTable('users')) {
    // The "users" table exists...
}

if (await Schema.hasColumn('users', 'email')) {
    // The "users" table exists and has an "email" column...
}
```

#### Table Options

In addition, a few other properties and methods may be used to define other aspects of the table's creation. The `engine` method may be used to specify the table's storage engine when using MySQL:

```ts
await Schema.create('users', table => {
    table.engine('InnoDB');

    // ...
});
```

The `charset` and `collation` methods may be used to specify the character set and collation for the created table when using MySQL:

```ts
await Schema.create('users', table => {
    table.charset('utf8mb4');
    table.collation('utf8mb4_unicode_ci');

    // ...
});
```

The `temporary` method may be used to indicate that the table should be "temporary". Temporary tables are only visible to the current connection's database session and are dropped automatically when the connection is closed:

```ts
await Schema.create('calculations', table => {
    table.temporary();

    // ...
});
```

If you would like to add a "comment" to a database table, you may invoke the `comment` method on the table instance. Table comments are currently only supported by MySQL and Postgres:

```ts
await Schema.create('calculations', table => {
    table.comment('Business calculations');

    // ...
});
```

### Updating Tables

The `table` method on the `Schema` may be used to update existing tables. Like the `create` method, the `table` method accepts two arguments: the name of the table and a closure that receives a `Blueprint` instance you may use to add columns or indexes to the table:

```ts
await Schema.table('users', table => {
    table.integer('votes');
});
```

### Renaming / Dropping Tables

To rename an existing database table, use the `rename` method:

```ts
await Schema.rename(from, to);
```

To drop an existing table, you may use the `drop` or `dropIfExists` methods:

```ts
await Schema.drop('users');

await Schema.dropIfExists('users');
```

#### Renaming Tables With Foreign Keys

Before renaming a table, you should verify that any foreign key constraints on the table have an explicit name in your migration files instead of letting Ludb assign a convention based name. Otherwise, the foreign key constraint name will refer to the old table name.

## Columns

### Creating Columns

The `table` method on the `Schema` may be used to update existing tables. Like the `create` method, the `table` method accepts two arguments: the name of the table and a closure that receives a `Blueprint` instance you may use to add columns to the table:

```ts
await Schema.table('users', table => {
    table.integer('votes');
});
```

### Available Column Types

The schema builder blueprint offers a variety of methods that correspond to the different types of columns you can add to your database tables. Each of the available methods are listed in the table below:

-   [bigIncrements](#big-increments)
-   [bigInteger](#big-integer)
-   [binary](#binary)
-   [boolean](#boolean)
-   [char](#char)
-   [dateTimeTz](#date-time-tz)
-   [dateTime](#date-time)
-   [date](#date)
-   [decimal](#decimal)
-   [double](#double)
-   [enum](#enum)
-   [float](#float)
-   [foreignId](#foreign-id)
-   [foreignIdFor](#foreign-id-for)
-   [foreignUlid](#foreign-ulid)
-   [foreignUuid](#foreign-uuid)
-   [geometryCollection](#geometry-collection)
-   [geometry](#geometry)
-   [id](#id)
-   [increments](#increments)
-   [integer](#integer)
-   [ipAddress](#ip-address)
-   [json](#json)
-   [jsonb](#jsonb)
-   [lineString](#line-string)
-   [longText](#long-text)
-   [macAddress](#mac-address)
-   [mediumIncrements](#medium-increments)
-   [mediumInteger](#medium-integer)
-   [mediumText](#medium-text)
-   [morphs](#morphs)
-   [multiLineString](#multi-line-string)
-   [multiPoint](#multi-point)
-   [multiPolygon](#multi-polygon)
-   [nullableMorphs](#nullable-morphs)
-   [nullableTimestamps](#nullable-timestamps)
-   [nullableUlidMorphs](#nullable-ulid-morphs)
-   [nullableUuidMorphs](#nullable-uuid-morphs)
-   [point](#point)
-   [polygon](#polygon)
-   [set](#set)
-   [smallIncrements](#small-increments)
-   [smallInteger](#small-integer)
-   [softDeletesTz](#soft-deletes-tz)
-   [softDeletes](#soft-deletes)
-   [string](#string)
-   [text](#text)
-   [timeTz](#time-tz)
-   [time](#time)
-   [timestampTz](#timestamp-tz)
-   [timestamp](#timestamp)
-   [timestampsTz](#timestamps-tz)
-   [timestamps](#timestamps)
-   [tinyIncrements](#tiny-increments)
-   [tinyInteger](#tiny-integer)
-   [tinyText](#tiny-text)
-   [unsignedBigInteger](#unsigned-big-integer)
-   [unsignedDecimal](#unsigned-decimal)
-   [unsignedInteger](#unsigned-integer)
-   [unsignedMediumInteger](#unsigned-medium-integer)
-   [unsignedSmallInteger](#unsigned-small-integer)
-   [unsignedTinyInteger](#unsigned-tiny-integer)
-   [ulidMorphs](#ulid-morphs)
-   [uuidMorphs](#uuid-morphs)
-   [ulid](#ulid)
-   [uuid](#uuid)
-   [year](#year)

#### `bigIncrements()`

The `bigIncrements` method creates an auto-incrementing `UNSIGNED BIGINT` (primary key) equivalent column:

```ts
table.bigIncrements('id');
```

#### `bigInteger()`

The `bigInteger` method creates a `BIGINT` equivalent column:

```ts
table.bigInteger('votes');
```

#### `binary()`

The `binary` method creates a `BLOB` equivalent column:

```ts
table.binary('photo');
```

#### `boolean()`

The `boolean` method creates a `BOOLEAN` equivalent column:

```ts
table.boolean('confirmed');
```

#### `char()`

The `char` method creates a `CHAR` equivalent column with of a given length:

```ts
table.char('name', 100);
```

#### `dateTimeTz()`

The `dateTimeTz` method creates a `DATETIME` (with timezone) equivalent column with an optional precision (total digits):

```ts
    table.dateTimeTz('created_at', precision? :number);
```

#### `dateTime()`

The `dateTime` method creates a `DATETIME` equivalent column with an optional precision (total digits):

```ts
    table.dateTime('created_at', precision? :number);
```

#### `date()`

The `date` method creates a `DATE` equivalent column:

```ts
table.date('created_at');
```

#### `decimal()`

The `decimal` method creates a `DECIMAL` equivalent column with the given precision (total digits) and scale (decimal digits):

```ts
table.decimal('amount', (precision = 8), (scale = 2));
```

#### `double()`

The `double` method creates a `DOUBLE` equivalent column with the given precision (total digits) and scale (decimal digits):

```ts
table.double('amount', 8, 2);
```

#### `enum()`

The `enum` method creates a `ENUM` equivalent column with the given valid values:

```ts
table.enum('difficulty', ['easy', 'hard']);
```

#### `float()`

The `float` method creates a `FLOAT` equivalent column with the given precision (total digits) and scale (decimal digits):

```ts
table.float('amount', 8, 2);
```

#### `foreignId()`

The `foreignId` method creates an `UNSIGNED BIGINT` equivalent column:

```ts
table.foreignId('user_id');
```

#### `foreignIdFor()`

The `foreignIdFor` method adds a `{column}_id UNSIGNED BIGINT` equivalent column for a given model class:

```ts
    table.foreignIdFor(User::class);
```

#### `foreignUlid()`

The `foreignUlid` method creates a `ULID` equivalent column:

```ts
table.foreignUlid('user_id');
```

#### `foreignUuid()`

The `foreignUuid` method creates a `UUID` equivalent column:

```ts
table.foreignUuid('user_id');
```

#### `geometryCollection()`

The `geometryCollection` method creates a `GEOMETRYCOLLECTION` equivalent column:

```ts
table.geometryCollection('positions');
```

#### `geometry()`

The `geometry` method creates a `GEOMETRY` equivalent column:

```ts
table.geometry('positions');
```

#### `id()`

The `id` method is an alias of the `bigIncrements` method. By default, the method will create an `id` column; however, you may pass a column name if you would like to assign a different name to the column:

```ts
table.id();
```

#### `increments()`

The `increments` method creates an auto-incrementing `UNSIGNED INTEGER` equivalent column as a primary key:

```ts
table.increments('id');
```

#### `integer()`

The `integer` method creates an `INTEGER` equivalent column:

```ts
table.integer('votes');
```

#### `ipAddress()`

The `ipAddress` method creates a `VARCHAR` equivalent column:

```ts
table.ipAddress('visitor');
```

#### `json()`

The `json` method creates a `JSON` equivalent column:

```ts
table.json('options');
```

#### `jsonb()`

The `jsonb` method creates a `JSONB` equivalent column:

```ts
table.jsonb('options');
```

#### `lineString()`

The `lineString` method creates a `LINESTRING` equivalent column:

```ts
table.lineString('positions');
```

#### `longText()`

The `longText` method creates a `LONGTEXT` equivalent column:

```ts
table.longText('description');
```

#### `macAddress()`

The `macAddress` method creates a column that is intended to hold a MAC address. Some database systems, such as PostgreSQL, have a dedicated column type for this type of data. Other database systems will use a string equivalent column:

```ts
table.macAddress('device');
```

#### `mediumIncrements()`

The `mediumIncrements` method creates an auto-incrementing `UNSIGNED MEDIUMINT` equivalent column as a primary key:

```ts
table.mediumIncrements('id');
```

#### `mediumInteger()`

The `mediumInteger` method creates a `MEDIUMINT` equivalent column:

```ts
table.mediumInteger('votes');
```

#### `mediumText()`

The `mediumText` method creates a `MEDIUMTEXT` equivalent column:

```ts
table.mediumText('description');
```

#### `morphs()`

The `morphs` method is a convenience method that adds a `{column}_id` `UNSIGNED BIGINT` equivalent column and a `{column}_type` `VARCHAR` equivalent column.

This method is intended to be used when defining the columns necessary for a polymorphic Relationship. In the following example, `taggable_id` and `taggable_type` columns would be created:

```ts
table.morphs('taggable');
```

#### `multiLineString()`

The `multiLineString` method creates a `MULTILINESTRING` equivalent column:

```ts
table.multiLineString('positions');
```

#### `multiPoint()`

The `multiPoint` method creates a `MULTIPOINT` equivalent column:

```ts
table.multiPoint('positions');
```

#### `multiPolygon()`

The `multiPolygon` method creates a `MULTIPOLYGON` equivalent column:

```ts
table.multiPolygon('positions');
```

#### `nullableTimestamps()`

The `nullableTimestamps` method is an alias of the [timestamps](#timestamps) method:

```ts
table.nullableTimestamps(0);
```

#### `nullableMorphs()`

The method is similar to the [morphs](#morphs) method; however, the columns that are created will be "nullable":

```ts
table.nullableMorphs('taggable');
```

#### `nullableUlidMorphs()`

The method is similar to the [ulidMorphs](#ulid-morphs) method; however, the columns that are created will be "nullable":

```ts
table.nullableUlidMorphs('taggable');
```

#### `nullableUuidMorphs()`

The method is similar to the [uuidMorphs](#uuid-morphs) method; however, the columns that are created will be "nullable":

```ts
table.nullableUuidMorphs('taggable');
```

#### `point()`

The `point` method creates a `POINT` equivalent column:

```ts
table.point('position');
```

#### `polygon()`

The `polygon` method creates a `POLYGON` equivalent column:

```ts
table.polygon('position');
```

#### `set()`

The `set` method creates a `SET` equivalent column with the given list of valid values:

```ts
table.set('flavors', ['strawberry', 'vanilla']);
```

#### `smallIncrements()`

The `smallIncrements` method creates an auto-incrementing `UNSIGNED SMALLINT` equivalent column as a primary key:

```ts
table.smallIncrements('id');
```

#### `smallInteger()`

The `smallInteger` method creates a `SMALLINT` equivalent column:

```ts
table.smallInteger('votes');
```

#### `softDeletesTz()`

The `softDeletesTz` method adds a nullable `deleted_at` `TIMESTAMP` (with timezone) equivalent column with an optional precision (total digits). This column is intended to store the `deleted_at` timestamp needed for "soft delete" functionality:

```ts
table.softDeletesTz(($column = 'deleted_at'), (precision = 0));
```

#### `softDeletes()`

The `softDeletes` method adds a nullable `deleted_at` `TIMESTAMP` equivalent column with an optional precision (total digits). This column is intended to store the `deleted_at` timestamp needed for "soft delete" functionality:

```ts
table.softDeletes(($column = 'deleted_at'), (precision = 0));
```

#### `string()`

The `string` method creates a `VARCHAR` equivalent column of the given length:

```ts
table.string('name', 100);
```

#### `text()`

The `text` method creates a `TEXT` equivalent column:

```ts
table.text('description');
```

#### `timeTz()`

The `timeTz` method creates a `TIME` (with timezone) equivalent column with an optional precision (total digits):

```ts
table.timeTz('sunrise', (precision = 0));
```

#### `time()`

The `time` method creates a `TIME` equivalent column with an optional precision (total digits):

```ts
table.time('sunrise', (precision = 0));
```

#### `timestampTz()`

The `timestampTz` method creates a `TIMESTAMP` (with timezone) equivalent column with an optional precision (total digits):

```ts
table.timestampTz('added_at', (precision = 0));
```

#### `timestamp()`

The `timestamp` method creates a `TIMESTAMP` equivalent column with an optional precision (total digits):

```ts
table.timestamp('added_at', (precision = 0));
```

#### `timestampsTz()`

The `timestampsTz` method creates `created_at` and `updated_at` `TIMESTAMP` (with timezone) equivalent columns with an optional precision (total digits):

```ts
table.timestampsTz((precision = 0));
```

#### `timestamps()`

The `timestamps` method creates `created_at` and `updated_at` `TIMESTAMP` equivalent columns with an optional precision (total digits):

```ts
table.timestamps((precision = 0));
```

#### `tinyIncrements()`

The `tinyIncrements` method creates an auto-incrementing `UNSIGNED TINYINT` equivalent column as a primary key:

```ts
table.tinyIncrements('id');
```

#### `tinyInteger()`

The `tinyInteger` method creates a `TINYINT` equivalent column:

```ts
table.tinyInteger('votes');
```

#### `tinyText()`

The `tinyText` method creates a `TINYTEXT` equivalent column:

```ts
table.tinyText('notes');
```

#### `unsignedBigInteger()`

The `unsignedBigInteger` method creates an `UNSIGNED BIGINT` equivalent column:

```ts
table.unsignedBigInteger('votes');
```

#### `unsignedDecimal()`

The `unsignedDecimal` method creates an `UNSIGNED DECIMAL` equivalent column with an optional precision (total digits) and scale (decimal digits):

```ts
table.unsignedDecimal('amount', (precision = 8), (scale = 2));
```

#### `unsignedInteger()`

The `unsignedInteger` method creates an `UNSIGNED INTEGER` equivalent column:

```ts
table.unsignedInteger('votes');
```

#### `unsignedMediumInteger()`

The `unsignedMediumInteger` method creates an `UNSIGNED MEDIUMINT` equivalent column:

```ts
table.unsignedMediumInteger('votes');
```

#### `unsignedSmallInteger()`

The `unsignedSmallInteger` method creates an `UNSIGNED SMALLINT` equivalent column:

```ts
table.unsignedSmallInteger('votes');
```

#### `unsignedTinyInteger()`

The `unsignedTinyInteger` method creates an `UNSIGNED TINYINT` equivalent column:

```ts
table.unsignedTinyInteger('votes');
```

#### `ulidMorphs()`

The `ulidMorphs` method is a convenience method that adds a `{column}_id` `CHAR(26)` equivalent column and a `{column}_type` `VARCHAR` equivalent column.

This method is intended to be used when defining the columns necessary for a polymorphic relationship that use ULID identifiers. In the following example, `taggable_id` and `taggable_type` columns would be created:

```ts
table.ulidMorphs('taggable');
```

#### `uuidMorphs()`

The `uuidMorphs` method is a convenience method that adds a `{column}_id` `CHAR(36)` equivalent column and a `{column}_type` `VARCHAR` equivalent column.

This method is intended to be used when defining the columns necessary for a polymorphic relationship that use UUID identifiers. In the following example, `taggable_id` and `taggable_type` columns would be created:

```ts
table.uuidMorphs('taggable');
```

#### `ulid()`

The `ulid` method creates a `ULID` equivalent column:

```ts
table.ulid('id');
```

#### `uuid()`

The `uuid` method creates a `UUID` equivalent column:

```ts
table.uuid('id');
```

#### `year()`

The `year` method creates a `YEAR` equivalent column:

```ts
table.year('birth_year');
```

### Column Modifiers

In addition to the column types listed above, there are several column "modifiers" you may use when adding a column to a database table. For example, to make the column "nullable", you may use the `nullable` method:

```ts
await Schema.table('users', table => {
    table.string('email').nullable();
});
```

The following table contains all of the available column modifiers. This list does not include [index modifiers](#creating-indexes):

| Modifier                                            | Description                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `.after(string/Expression)`                         | Place the column "after" another column (MySQL).                                          |
| `.always(value = true)`                             | Defines the precedence of sequence values over input for an identity column (PostgreSQL). |
| `.autoIncrement(value = true)`                      | Set INTEGER columns as auto-incrementing (primary key).                                   |
| `.charset(string/Expression)`                       | Specify a character set for the column (MySQL).                                           |
| `.collation(string/Expression)`                     | Specify a collation for the column (MySQL/PostgreSQL/SQL Server).                         |
| `.comment(string)`                                  | Add a comment to a column (MySQL/PostgreSQL).                                             |
| `.default(string/Expression/boolean/number/bigint)` | Specify a "default" value for the column.                                                 |
| `.first()`                                          | Place the column "first" in the table (MySQL).                                            |
| `.from(number/bigint)`                              | Set the starting value of an auto-incrementing field (MySQL / PostgreSQL).                |
| `.generatedAs(string/Expression)`                   | Create an identity column with specified sequence options (PostgreSQL).                   |
| `.invisible()`                                      | Make the column "invisible" to `SELECT *` queries (MySQL).                                |
| `.isGeometry(value = true)`                         | Set spatial column type to `geometry` - the default type is `geography` (PostgreSQL).     |
| `.nullable(value = true)`                           | Allow NULL values to be inserted into the column.                                         |
| `.persisted(value = true)`                          | Mark the computed generated column as persistent (SQL Server).                            |
| `.projection(number)`                               | Add geometry/geography projection.                                                        |
| `.startingValue(number/bigint)`                     | Set the starting value of an auto-incrementing field (MySQL/PostgreSQL).                  |
| `.srid(number)`                                     | Define Geometry Point Srid.                                                               |
| `.storedAs(string/Expression)`                      | Create a stored generated column (MySQL/PostgreSQL/SQLite).                               |
| `.unsetStoredAs()`                                  | Remove a stored generated column (MySQL/PostgreSQL/SQLite).                               |
| `.unsetVirtualAs()`                                 | Unset a virtual generated column (MySQL/PostgreSQL/SQLite).                               |
| `.unsigned(value = true)`                           | Set INTEGER columns as UNSIGNED (MySQL).                                                  |
| `.useCurrent(value = true)`                         | Set TIMESTAMP columns to use CURRENT_TIMESTAMP as default value.                          |
| `.useCurrentOnUpdate(value = true)`                 | Set TIMESTAMP columns to use CURRENT_TIMESTAMP when a record is updated.                  |
| `.virtualAs(string/Expression)`                     | Create a virtual generated column (MySQL/PostgreSQL/SQLite).                              |

#### Default Expressions

The `default` modifier accepts a value or an `Expression` instance. Using an `Expression` instance will prevent Ludb from wrapping the value in quotes and allow you to use database specific functions. One situation where this is particularly useful is when you need to assign default values to JSON columns:

```ts
await Schema.create('flights', table => {
    table.id();
    table.json('movies').default(new Expression('(JSON_ARRAY())'));
    table.timestamps();
});
```

> **Warning**  
> Support for default expressions depends on your database driver, database version, and the field type. Please refer to your database's documentation.

#### Column Order

When using the MySQL database, the `after` method may be used to add columns after an existing column in the schema:

```ts
table.after('password', table => {
    table.string('address_line1');
    table.string('address_line2');
    table.string('city');
});
```

### Modifying Columns

The `change` method allows you to modify the type and attributes of existing columns. For example, you may wish to increase the size of a `string` column. To see the `change` method in action, let's increase the size of the `name` column from 25 to 50. To accomplish this, we simply define the new state of the column and then call the `change` method:

```ts
await Schema.table('users', table => {
    table.string('name', 50).change();
});
```

When modifying a column, you must explicitly include all of the modifiers you want to keep on the column definition - any missing attribute will be dropped. For example, to retain the `unsigned`, `default`, and `comment` attributes, you must call each modifier explicitly when changing the column:

```ts
await Schema.table('users', table => {
    table.integer('votes').unsigned().default(1).comment('my comment').change();
});
```

#### Modifying Columns On SQLite

If your application is utilizing an SQLite database, you will not be able to change columns.

### Renaming Columns

To rename a column, you may use the `renameColumn` method provided by the schema builder:

```ts
await Schema.table('users', table => {
    table.renameColumn('from', 'to');
});
```

#### Renaming Columns On Legacy Databases

If you are running a database installation older than one of the following releases, you will not be able to rename columns.

-   MySQL < `8.0.3`
-   MariaDB < `10.5.2`
-   SQLite < `3.25.0`

### Dropping Columns

To drop a column, you may use the `dropColumn` method on the schema builder:

```ts
await Schema.table('users', table => {
    table.dropColumn('votes');
});
```

You may drop multiple columns from a table by passing an array of column names to the `dropColumn` method:

```ts
await Schema.table('users', table => {
    table.dropColumn(['votes', 'avatar', 'location']);
});
```

#### Dropping Columns On Legacy Databases

If you are running a version of SQLite prior to `3.35.0`, you will not be able to drop columns.

#### Available Command Aliases

Ludb provides several convenient methods related to dropping common types of columns. Each of these methods is described in the table below:

| Command                          | Description                                           |
| -------------------------------- | ----------------------------------------------------- |
| `table.dropMorphs('morphable');` | Drop the `morphable_id` and `morphable_type` columns. |
| `table.dropSoftDeletes();`       | Drop the `deleted_at` column.                         |
| `table.dropSoftDeletesTz();`     | Alias of `dropSoftDeletes()` method.                  |
| `table.dropTimestamps();`        | Drop the `created_at` and `updated_at` columns.       |
| `table.dropTimestampsTz();`      | Alias of `dropTimestamps()` method.                   |

## Indexes

### Creating Indexes

The Ludb schema builder supports several types of indexes. The following example creates a new `email` column and specifies that its values should be unique. To create the index, we can chain the `unique` method onto the column definition:

```ts
Schema.table('users', table => {
    table.string('email').unique();
});
```

Alternatively, you may create the index after defining the column. To do so, you should call the `unique` method on the schema builder blueprint. This method accepts the name of the column that should receive a unique index:

```ts
table.unique('email');
```

You may even pass an array of columns to an index method to create a compound (or composite) index:

```ts
table.index(['account_id', 'created_at']);
```

When creating an index, Ludb will automatically generate an index name based on the table, column names, and the index type, but you may pass a second argument to the method to specify the index name yourself:

```ts
table.unique('email', 'unique_email');
```

#### Available Index Types

Ludb's schema builder blueprint class provides methods for creating each type of index supported by Ludb. Each index method accepts an optional second argument to specify the name of the index. If omitted, the name will be derived from the names of the table and column(s) used for the index, as well as the index type. Each of the available index methods is described in the table below:

| Command                                       | Description                                                    |
| --------------------------------------------- | -------------------------------------------------------------- |
| `table.primary('id');`                        | Adds a primary key.                                            |
| `table.primary(['id', 'parent_id']);`         | Adds composite keys.                                           |
| `table.unique('email');`                      | Adds a unique index.                                           |
| `table.index('state');`                       | Adds an index.                                                 |
| `table.fullText('body');`                     | Adds a full text index (MySQL/PostgreSQL).                     |
| `table.fullText('body').language('english');` | Adds a full text index of the specified language (PostgreSQL). |
| `table.spatialIndex('location');`             | Adds a spatial index (except SQLite).                          |

#### Index Lengths & MySQL / MariaDB

By default, Ludb uses the `utf8mb4` character set. If you are running a version of MySQL older than the 5.7.7 release or MariaDB older than the 10.2.2 release, you may need to manually configure the default string length generated by migrations in order for MySQL to create indexes for them. You may configure the default string length by calling the `Schema.withDefaultStringLength` method:

```ts
Schema.withDefaultStringLength(191);
```

Alternatively, you may enable the `innodb_large_prefix` option for your database. Refer to your database's documentation for instructions on how to properly enable this option.

### Renaming Indexes

To rename an index, you may use the `renameIndex` method provided by the schema builder blueprint. This method accepts the current index name as its first argument and the desired name as its second argument:

```ts
table.renameIndex('from', 'to');
```

> **Warning**  
> If your application is utilizing an SQLite database, you will not be able to rename indexes.

### Dropping Indexes

To drop an index, you must specify the index's name. By default, Ludb automatically assigns an index name based on the table name, the name of the indexed column, and the index type. Here are some examples:

| Command                                                | Description                                                |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| `table.dropPrimary('users_id_primary');`               | Drop a primary key from the "users" table.                 |
| `table.dropUnique('users_email_unique');`              | Drop a unique index from the "users" table.                |
| `table.dropIndex('geo_state_index');`                  | Drop a basic index from the "geo" table.                   |
| `table.dropFullText('posts_body_fulltext');`           | Drop a full text index from the "posts" table.             |
| `table.dropSpatialIndex('geo_location_spatialindex');` | Drop a spatial index from the "geo" table (except SQLite). |

If you pass an array of columns into a method that drops indexes, the conventional index name will be generated based on the table name, columns, and index type:

```ts
    await Schema::table('geo', (table) => {
        table.dropIndex(['state']); // Drops index 'geo_state_index'
    });
```

### Foreign Key Constraints

Ludb also provides support for creating foreign key constraints, which are used to force referential integrity at the database level. For example, let's define a `user_id` column on the `posts` table that references the `id` column on a `users` table:

```ts
await Schema.table('posts', table => {
    table.unsignedBigInteger('user_id');

    table.foreign('user_id').references('id').on('users');
});
```

Since this syntax is rather verbose, Ludb provides additional, terser methods that use conventions to provide a better developer experience. When using the `foreignId` method to create your column, the example above can be rewritten like so:

```ts
await Schema.table('posts', table => {
    table.foreignId('user_id').constrained();
});
```

The `foreignId` method creates an `UNSIGNED BIGINT` equivalent column, while the `constrained` method will use conventions to determine the table and column name being referenced. If your table name does not match Ludb's conventions, you may specify the table name by passing it as an argument to the `constrained` method:

```ts
await Schema.table('posts', table => {
    table.foreignId('user_id').constrained('users');
});
```

You may also specify the desired action for the "on delete" and "on update" properties of the constraint:

```ts
table.foreignId('user_id').constrained().onUpdate('cascade').onDelete('cascade');
```

An alternative, expressive syntax is also provided for these actions:

| Method                      | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `able.cascadeOnUpdate();`   | Updates should cascade.                                |
| `table.restrictOnUpdate();` | Updates should be restricted.                          |
| `table.cascadeOnDelete();`  | Deletes should cascade.                                |
| `table.restrictOnDelete();` | Deletes should be restricted.                          |
| `table.nullOnDelete();`     | Deletes should set the foreign key value to null.      |
| `table.noActionOnDelete();` | Deletes should set the foreign key value to no action. |

Any additional [column modifiers](#column-modifiers) must be called before the `constrained` method:

```ts
    table.foreignId('user_id')
          .nullable()
          .constrained();
```

#### Dropping Foreign Keys

To drop a foreign key, you may use the `dropForeign` method, passing the name of the foreign key constraint to be deleted as an argument. Foreign key constraints use the same naming convention as indexes. In other words, the foreign key constraint name is based on the name of the table and the columns in the constraint, followed by a "\_foreign" suffix:

```ts
    table.dropForeign('posts_user_id_foreign');
```

Alternatively, you may pass an array containing the column name that holds the foreign key to the `dropForeign` method. The array will be converted to a foreign key constraint name using Ludb's constraint naming conventions:

```ts
    table.dropForeign(['user_id']);
```

#### Toggling Foreign Key Constraints

You may enable or disable foreign key constraints within your migrations by using the following methods:

```ts
    Schema.enableForeignKeyConstraints();

    Schema.disableForeignKeyConstraints();

    Schema.withoutForeignKeyConstraints(() => {
        // Constraints disabled within this closure...
    });
```

> **Warning**  
> SQLite disables foreign key constraints by default. When using SQLite, make sure to [enable foreign key support](CONFIGURATION.md) in your database configuration before attempting to create them. In addition, SQLite only supports foreign keys upon creation of the table and [not when tables are altered](https://www.sqlite.org/omitted.html).

# Ludb

> Ludb offers an (almost) identical api to [Laravel Database](https://laravel.com/docs/database).

If you want to perform a schema operation on a database connection that is not your application's default connection, use the `connection` method:

```ts
    Schema.connection('sqlite').create('users', (query) {
        table.id();
    });
```

# Database: Getting Started

-   [Introduction](#introduction)
    -   [Configuration](#configuration)
    -   [Read & Write Connections](#read-and-write-connections)
-   [Query Builder](#query-builder)
-   [Running SQL Queries](#running-queries)
    -   [Using Multiple Database Connections](#using-multiple-database-connections)
    -   [Listening For Query Events](#listening-for-query-events)
    -   [Monitoring Cumulative Query Time](#monitoring-cumulative-query-time)
-   [Database Transactions](#database-transactions)
-   [Connecting To The Database CLI](#connecting-to-the-database-cli)
-   [Inspecting Your Databases](#inspecting-your-databases)
-   [Monitoring Your Databases](#monitoring-your-databases)

## Introduction

Almost every modern web application interacts with a database. Ludb makes interacting with databases extremely simple across a variety of supported databases using raw SQL, a [fluent query builder](BUILDER.md). Currently, Ludb provides first-party support for five databases:

-   MariaDB 10.3+ ([Version Policy](https://mariadb.org/about/#maintenance-policy))
-   MySQL 5.7+ ([Version Policy](https://en.wikipedia.org/wiki/MySQL#Release_history))
-   PostgreSQL 10.0+ ([Version Policy](https://www.postgresql.org/support/versioning/))
-   SQLite 3.8.8+
-   SQL Server 2017+ ([Version Policy](https://docs.microsoft.com/en-us/lifecycle/products/?products=sql-server))

### Configuration

In the configuration object, you may define all of your database connections, as well as specify which connection should be used by default.

#### SQLite Configuration

To enable foreign key constraints for SQLite connections, you should set the `DB_FOREIGN_KEYS` environment variable to `true`:

```ini
DB_FOREIGN_KEYS=true
```

### Read & Write Connections

Sometimes you may wish to use one database connection for SELECT statements, and another for INSERT, UPDATE, and DELETE statements. Ludb makes this a breeze, and the proper connections will always be used whether you are using raw queries, the query builder, or the Eloquent ORM.

To see how read / write connections should be configured, let's look at this example:

```ts
    'mysql': {
        read: {
            host: [
                '192.168.1.1',
                '196.168.1.2',
            ],
        },
        write: {
            host: [
                '196.168.1.3',
            ],
        },
        driver: 'mysql',
        database: 'database',
        username: 'root',
        password: '',
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
        prefix: '',
    }
```

Note that three keys have been added to the configuration object: `read`, `write`. The `read` and `write` keys have object values containing a single key: `host`. The rest of the database options for the `read` and `write` connections will be merged from the main `mysql` configuration object.

You only need to place items in the `read` and `write` arrays if you wish to override the values from the main `mysql` array. So, in this case, `192.168.1.1` will be used as the host for the "read" connection, while `192.168.1.3` will be used for the "write" connection. The database credentials, prefix, character set, and all other options in the main `mysql` array will be shared across both connections. When multiple values exist in the `host` configuration array, a database host will be randomly chosen for each request.

## Query Builder
Once you have configured your database connection, you may retrieve the [Query Builder](BUILDER.md) using the `DatabaseManager` connection.

```ts
import { DatabaseManager } from 'ludb';

const dbManager = new DatabaseManager(config);
const DB = dbManager.connection(connectionName); // without connectionName it will use default connection
const query = DB.table('users');
// or
const query = DB.query();
```

## Schema Builder
Once you have configured your database connection, you may retrieve the [Schema Builder](SCHEMA.md) using the `DatabaseManager` connection.

```ts
import { DatabaseManager } from 'ludb';

const dbManager = new DatabaseManager(config);
const DB = dbManager.connection(connectionName); // without connectionName it will use default connection
const Schema = DB.getSchemaBuilder();
```


## Running SQL Queries

Once you have configured your database connection, you may run queries using the `DatabaseManager` connection.

```ts
import { DatabaseManager } from 'ludb';

const dbManager = new DatabaseManager(config);
const DB = dbManager.connection(connectionName); // without connectionName it will use default connection
```

#### Running A Select Query

To run a basic SELECT query, you may use the `select` method on the `DB`:

```ts
users = await DB.select('select * from users where active = ?', [1]);
```

The first argument passed to the `select` method is the SQL query, while the second argument is any parameter bindings that need to be bound to the query. Typically, these are the values of the `where` clause constraints. Parameter binding provides protection against SQL injection.

The `select` method will always return an `array` of results. Each result within the array will be an object representing a record from the database:

```ts
interface User {
    name: string;
}
users = await DB.select<User>('select * from users where active = ?', [1]);
for (const user of users) {
    console.log(user.name);
}
```

#### Selecting Scalar Values

Sometimes your database query may result in a single, scalar value. Instead of being required to retrieve the query's scalar result from a record object, Ludb allows you to retrieve this value directly using the `scalar` method:

```ts
    burgers = await DB.scalar(
        "select count(case when food = 'burger' then 1 end) as burgers from menu"
    );
```

#### Using Named Bindings

Instead of using `?` to represent your parameter bindings, you may execute a query using named bindings:

```ts
    results = await DB.select('select * from users where id = :id', {id : 1});
```

#### Running An Insert Statement

To execute an `insert` statement, you may use the `insert` method on the `DB`. Like `select`, this method accepts the SQL query as its first argument and bindings as its second argument:


```ts
    await DB.insert('insert into users (id, name) values (?, ?)', [1, 'Marc']);
```

#### Running An Update Statement

The `update` method should be used to update existing records in the database. The number of rows affected by the statement is returned by the method:

```ts
    affected = await DB.update(
        'update users set votes = 100 where name = ?',
        ['Anita']
    );
```

#### Running A Delete Statement

The `delete` method should be used to delete records from the database. Like `update`, the number of rows affected will be returned by the method:

```ts
    deleted = await DB.delete('delete from users');
```

#### Running A General Statement

Some database statements do not return any value. For these types of operations, you may use the `statement` method on the `DB`:

```ts
    await DB.statement('drop table users');
```

#### Running An Unprepared Statement

Sometimes you may want to execute an SQL statement without binding any values. You may use the `DB` `unprepared` method to accomplish this:

```ts
    await DB.unprepared('update users set votes = 100 where name = "Dries"');
```

> **Warning**  
> Since unprepared statements do not bind parameters, they may be vulnerable to SQL injection. You should never allow user controlled values within an unprepared statement.

#### Implicit Commits

When using the `DB` `statement` and `unprepared` methods within transactions you must be careful to avoid statements that cause [implicit commits](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html). These statements will cause the database engine to indirectly commit the entire transaction, leaving Ludb unaware of the database's transaction level. An example of such a statement is creating a database table:

```ts
    await DB.unprepared('create table a (col varchar(1) null)');
```

Please refer to the MySQL manual for [a list of all statements](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html) that trigger implicit commits.

### Using Multiple Database Connections

If your application defines multiple connections in your `config/database.php` configuration file, you may access each connection via the `connection` method provided by the `DB`. The connection name passed to the `connection` method should correspond to one of the connections listed in your `config/database.php` configuration file or configured at runtime using the `config` helper:

```ts
import { DatabaseManager } from 'ludb';

const dbManager = new DatabaseManager(config);
const DB = dbManager.connection('sqlite').select(/* ... */);
```

You may access the raw, underlying PDO instance of a connection using the `getPdo` method on a connection instance:

```ts
    pdo = DB.connection().getPdo();
```

### Listening For Query Events

If you would like to specify a closure that is invoked for each SQL query executed by your application, you may use the `DB` `listen` method. This method can be useful for logging queries or debugging.

```ts
import { DatabaseManager } from 'ludb';

const dbManager = new DatabaseManager(config);
const DB = dbManager.connection('sqlite').listen((query) => {
    // query.sql;
    // query.bindings;
    // query.time;
})
```

By Default `DatabaseManager` will use an `EventEmitter` instance to manage events. You can provide a custom instance of EventEmitter through constructor.

```ts
import { DatabaseManager } from 'ludb';
import EventEmitter from 'node:events';

const emitter = new EventEmitter();

const dbManager = new DatabaseManager(config, emitter);
const DB = dbManager.connection('sqlite').listen((query) => {
    // query.sql;
    // query.bindings;
    // query.time;
})
```


### Monitoring Cumulative Query Time

A common performance bottleneck of modern web applications is the amount of time they spend querying databases. Thankfully, Ludb can invoke a closure or callback of your choice when it spends too much time querying the database during a single request. To get started, provide a query time threshold (in milliseconds) and closure to the `whenQueryingForLongerThan` method. You may invoke this method in the `boot` method of a [service provider](/docs/{{version}}/providers):

    <?php

    namespace App\Providers;

    use Illuminate\Database\Connection;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\ServiceProvider;
    use Illuminate\Database\Events\QueryExecuted;

    class AppServiceProvider extends ServiceProvider
    {
        /**
         * Register any application services.
         */
        public function register(): void
        {
            // ...
        }

        /**
         * Bootstrap any application services.
         */
        public function boot(): void
        {
            DB::whenQueryingForLongerThan(500, function (Connection $connection, QueryExecuted $event) {
                // Notify development team...
            });
        }
    }

## Database Transactions

You may use the `transaction` method provided by the `DB` to run a set of operations within a database transaction. If an exception is thrown within the transaction closure, the transaction will automatically be rolled back and the exception is re-thrown. If the closure executes successfully, the transaction will automatically be committed. You don't need to worry about manually rolling back or committing while using the `transaction` method:

```ts
    await DB.transaction(async (dbTrx) => {
        await dbTrx.update('update users set votes = 1');

        await dbTrx.delete('delete from posts');
    });
```
> **Warning**  
> Since Transaction will generate a new session you should always use the connection provided as first parameter of callback. Query executed on default connection will do not be exectued within the transaction.

#### Handling Deadlocks

The `transaction` method accepts an optional second argument which defines the number of times a transaction should be retried when a deadlock occurs. Once these attempts have been exhausted, an exception will be thrown:

```ts
    await DB.transaction(async (dbTrx) => {
        await dbTrx.update('update users set votes = 1');

        await dbTrx.delete('delete from posts');
    }, 5);
```

#### Manually Using Transactions

If you would like to begin a transaction manually and have complete control over rollbacks and commits, you may use the `beginTransaction` method provided by the `DB`:

```ts
    dbTrx = await DB.beginTransaction();
```

You can rollback the transaction via the `rollBack` method:

```ts
    dbTrx.rollBack();
```

Lastly, you can commit a transaction via the `commit` method:

```ts
    dbTrx.commit();
```

> **Warning**  
> Since Transaction will generate a new session you should always use the connection returned by `beginTransacion`. Query executed on default connection will do not be exectued within the transaction.


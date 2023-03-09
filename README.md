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
-   [Schema Builder](#schema-builder)
-   [Running SQL Queries](#running-queries)
    -   [Using Multiple Database Connections](#using-multiple-database-connections)
    -   [Listening For Query Events](#listening-for-query-events)
    -   [Monitoring Cumulative Query Time](#monitoring-cumulative-query-time)
-   [Database Transactions](#database-transactions)
-   [Differences With Laravel](#differences-with-laravel)

## Introduction

Almost every modern web application interacts with a database. Ludb makes interacting with databases extremely simple across a variety of supported databases using raw SQL, a [fluent query builder](BUILDER.md). Currently, Ludb provides first-party support for five databases:

-   MariaDB 10.3+ ([Version Policy](https://mariadb.org/about/#maintenance-policy))
-   MySQL 5.7+ ([Version Policy](https://en.wikipedia.org/wiki/MySQL#Release_history))
-   PostgreSQL 10.0+ ([Version Policy](https://www.postgresql.org/support/versioning/))
-   SQLite 3.8.8+
-   SQL Server 2017+ ([Version Policy](https://docs.microsoft.com/en-us/lifecycle/products/?products=sql-server))

### Configuration

In the [configuration object](CONFIG.md), you may define all of your database connections, as well as specify which connection should be used by default.

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
burgers = await DB.scalar("select count(case when food = 'burger' then 1 end) as burgers from menu");
```

#### Using Named Bindings

Instead of using `?` to represent your parameter bindings, you may execute a query using named bindings:

```ts
results = await DB.select('select * from users where id = :id', { id: 1 });
```

#### Running An Insert Statement

To execute an `insert` statement, you may use the `insert` method on the `DB`. Like `select`, this method accepts the SQL query as its first argument and bindings as its second argument:

```ts
await DB.insert('insert into users (id, name) values (?, ?)', [1, 'Marc']);
```

#### Running An Update Statement

The `update` method should be used to update existing records in the database. The number of rows affected by the statement is returned by the method:

```ts
affected = await DB.update('update users set votes = 100 where name = ?', ['Anita']);
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
const DB = dbManager.connection('sqlite').listen(query => {
    // query.sql;
    // query.bindings;
    // query.time;
});
```

You can also detach a listener using `DB` `unlisten` method:

```ts
import { DatabaseManager } from 'ludb';

const dbManager = new DatabaseManager(config);

const TempListener = query => {
    // query.sql;
    // query.bindings;
    // query.time;
    dbManager.connection('sqlite').unlisten(TempListener);
};

const DB = dbManager.connection('sqlite').listen(TempListener);
```

By Default `DatabaseManager` will use an `EventEmitter` instance to manage events. You can provide a custom instance of EventEmitter through constructor.

```ts
import { DatabaseManager } from 'ludb';
import EventEmitter from 'node:events';

const emitter = new EventEmitter();

const dbManager = new DatabaseManager(config, emitter);
const DB = dbManager.connection('sqlite').listen(query => {
    // query.sql;
    // query.bindings;
    // query.time;
});
```

### Monitoring Cumulative Query Time

A common performance bottleneck of modern web applications is the amount of time they spend querying databases.
The `DB` `listen` method can be helpful to make any kind of monitoring. An example of monitoring single query time execution:

```ts
const DB = dbManager.connection('sqlite').listen(query => {
    if (query.time > 500) {
        console.log('warning');
    }
});
```

An example of monitoring a session query time execution (all transaction queries are executed in a single session):

```ts
const DB = dbManager.connection('sqlite').listen(query => {
    if (query.sessionTime > 500) {
        console.log('warning');
    }
});
```

Sometimes you want to know when your application spends too much time querying the database during a single request. An example with Expressjs

```ts
import express, { Express, Request, Response, NextFunction } from 'express';
import { DatabaseManager, QueryExecuted } from 'ludb';

const dbManager = new DatabaseManager(config);
const app: Express = express();

const beforeMiddleware = (req: Request, res: Response, next: NextFunction) => {
    let totalTime = 0;
    let hasRun = false;
    const queryExecuted = [];
    req.queryLogListener = (query: QueryExecuted) => {
        if (!hasRun && query.inTransaction) {
            totalTime += query.time;
            queryExecuted.push(query);

            if (totalTime > 500) {
                hasRun = true;
                console.log('warning', queryExecuted);
            }
        }
    };
    dbManager.connection().listen(req.queryLogListener);
    next();
};

const responseHandler = (req: Request, res: Response, next: NextFunction) => {
    // do stuff with database
    res.status(200).send({ response: 'ok' });
    next();
};

const afterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    dbManager.connection().unlisten(req.queryLogListener);
    next();
};

app.get('/', beforeMiddleware, responseHandler, afterMiddleware);
```

## Database Transactions

You may use the `transaction` method provided by the `DB` to run a set of operations within a database transaction. If an exception is thrown within the transaction closure, the transaction will automatically be rolled back and the exception is re-thrown. If the closure executes successfully, the transaction will automatically be committed. You don't need to worry about manually rolling back or committing while using the `transaction` method:

```ts
await DB.transaction(async dbTrx => {
    await dbTrx.update('update users set votes = 1');

    await dbTrx.delete('delete from posts');
});
```

> **Warning**  
> Since Transaction will generate a new session you should always use the connection provided as first parameter of callback. Query executed on default connection will do not be exectued within the transaction.

#### Handling Deadlocks

The `transaction` method accepts an optional second argument which defines the number of times a transaction should be retried when a deadlock occurs. Once these attempts have been exhausted, an exception will be thrown:

```ts
await DB.transaction(async dbTrx => {
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
> Since Transaction will generate a new session you should always use the connection returned by `beginTransacion`. Query executed on default connection will do not be executed within the transaction.

## Differences With Laravel

-   The `DatabaseManager` instance do not proxy methods to default connection, you always need to call `connection(name)` method to access method of `Connection`.
-   Methods `whenQueryingForLongerThan` and `allowQueryDurationHandlersToRunAgain` do not exist, [Monitoring Cumulative Query Time](#monitoring-cumulative-query-time) offer a valid alternative.
-   Methods `getQueryLog` does not exists, logging query is used only internally for `pretend` method.
-   Methods `beginTransaction` and `useWriteConnectionWhenReading` return a `ConnectionSession` you must use the session instead the original connection for the queries you want to execute within the transaction or against the write pdo.
-   Callbacks for methods `transaction` and `pretend` are called with a `ConnectionSession` you must use the session instead the original connection inside the callback if you want to execute the queries within the transaction or to pretend the execution.
-   Event `QueryExecuted` contains new properties
    -   `sessionTime` cumulative session query time
    -   `inTransaction` query event is inside a transaction when true.

## Under the hood

Ludb use [Lupdo](https://www.npmjs.com/package/lupdo) an abstraction layer used for accessing databases.\
When the nodejs application start and a connection is required from `DatabaseManager` only the first time Ludb generate the pdo connection and it store internally the pdo required for the specific connection.\
EveryTime a method that require a builder is invoked within the connection by the user, a new `ConnectionSession` will be initialized and provided to the builder.\
The `ConnectionSession` expose almost all the api exposed by the original `Connection` and is completly "hidden" for the user the switch between sessions and connection.\
Ludb will require a connection from the pool only when a method of `ConnectionSession` require to comunicate with the database, everytime the request is completed the connection will be released to the pool, and the `ConnectionSession` is burned.\
For this reason when methods `transaction`, `beginTransaction`, `pretend` and `useWriteConnectionWhenReading` are called Ludb return the `ConnectionSession` to the user and the user must use the session provided to execute next queries.

Ludb will generate 1 or 2 pdo for [Query Builder](#query-bulder) (it depends on write/read configuration) and 1 pdo for [Schema Builder](#schema-builder).\
The Schema Builder Pdo force the Lupdo pool to have only 1 connection, this is necessary to ensure the proper functioning of the exposed Api (temporary tables, for instance, are only visible for the connection that generated them).

### Examples

An example of `transaction` method:

```ts
import { DatabaseManager } from 'ludb';

const dbManager = new DatabaseManager(config);
const DB = dbManager.connection(connectionName);

await DB.transaction(async session => {
    await session.update('update users set votes = 1');

    await session.delete('delete from posts');
});

const users = await DB.table('users').get();
```

An example of `beginTransaction` method:

```ts
import { DatabaseManager } from 'ludb';

const dbManager = new DatabaseManager(config);
const DB = dbManager.connection(connectionName);
const session = await DB.beginTransaction();
try {
    await session.update('update users set votes = 1');
    await session.delete('delete from posts');
    await session.commit();
} catch (error) {
    await session.rollBack();
}

const users = DB.table('users').get();
```

An example of `pretend` method:

```ts
import { DatabaseManager } from 'ludb';

const dbManager = new DatabaseManager(config);
const DB = dbManager.connection(connectionName);
const queries = await DB.pretend(async session => {
    await session.table('users').get();
    await session.table('posts').get();
});
console.log(queries);
const users = DB.table('users').get();
```

An example of `useWriteConnectionWhenReading` method:

```ts
import { DatabaseManager } from 'ludb';

const dbManager = new DatabaseManager(config);
const DB = dbManager.connection(connectionName);
await DB.table('users').where('id', 10).update({ name: 'Claudio' });
const session = DB.useWriteConnectionWhenReading();
const userFromWrite = session.table('users').find(10);
const userFromRead = DB.table('users').find(10);
```

An example of `temporary` with Schema:

```ts
import { DatabaseManager } from 'ludb';
// import * as crypto from 'crypto';

const dbManager = new DatabaseManager(config);
const DB = dbManager.connection(connectionName);
const Schema = DB.getSchemaBuilder();

await Schema.table('orders', table => {
    table.string('hash_id').index();
});

await Schema.create('temp_mappings', table => {
    table.temporary();
    table.integer('id').primary();
    table.string('hash_id');
});

const connection = Schema.getConnection();

// insert mappings in 10K chunks
await connection.table('orders').chunkById(1000, async orders => {
    const values = orders
        .map(order => {
            /* Prepare the value string for the SQL statement */
            return `(${order.id}, '${crypto.createHash('sha1').update(order.id).digest('hex')}')`;
        })
        .join(',');

    await connection.insert(DB.raw(`INSERT INTO temp_mappings(id, reference) VALUES ${values}`));
});

await connection
    .table('orders')
    .join('temp_mappings', 'temp_mappgings.id', 'orders.id')
    .update({ hash_id: DB.raw('temp_mappings.hash_id') });
```

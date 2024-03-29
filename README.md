<p align="center">
	<a href="https://www.npmjs.com/package/ludb" target="_blank">
        <img src="https://img.shields.io/npm/v/ludb?color=0476bc&label=" alt="NPM version">
    </a>
	<a href="https://www.npmjs.com/package/ludb" target="_blank">
        <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/ludb?color=3890aa&label=">
    </a>
    <a href="https://app.codecov.io/github/Lupennat/ludb" target="_blank">
        <img src="https://codecov.io/github/Lupennat/ludb/branch/main/graph/badge.svg?token=FOECLCWQ7F"/>
    </a>
    <a href="https://snyk.io/test/github/lupennat/ludb" target="_blank">
        <img src="https://snyk.io/test/github/lupennat/ludb/badge.svg">
    </a>
</p>

# Ludb (Beta Release)

> Ludb offers an (almost) identical api to [Laravel Database](https://laravel.com/docs/database).

# Installation

> npm install ludb

The Ludb type definitions are included in the lucontainer npm package.

You also need to install lupdo-drivers needed:

> npm install lupdo-mssql lupdo-mysql lupdo-postgres lupdo-sqlite

```ts
import { DatabaseManager } from 'ludb';
```

# Database: Getting Started

-   [Introduction](#introduction)
    -   [Configuration](#configuration)
    -   [Query Builder](#query-builder)
    -   [Schema Builder](#schema-builder)
-   [Running SQL Queries](#running-sql-queries)
    -   [Using Multiple Database Connections](#using-multiple-database-connections)
    -   [Events](#events)
    -   [Listening For Query Events](#listening-for-query-events)
    -   [Monitoring Cumulative Query Time](#monitoring-cumulative-query-time)
-   [Cache](#cache)
-   [Database Transactions](#database-transactions)
-   [Differences With Laravel](#differences-with-laravel)
-   [Under The Hood](#under-the-hood)
-   [Api](https://ludb.lupennat.com/api)

## Introduction

Almost every modern web application interacts with a database. Ludb makes interacting with databases extremely simple across a variety of supported databases using raw SQL, a [fluent query builder](BUILDER.md). Currently, Ludb provides first-party support for five databases:

-   MariaDB 10.3+ ([Version Policy](https://mariaconnection.org/about/#maintenance-policy))
-   MySQL 5.7+ ([Version Policy](https://en.wikipedia.org/wiki/MySQL#Release_history))
-   PostgreSQL 10.0+ ([Version Policy](https://www.postgresql.org/support/versioning/))
-   SQLite 3.8.8+
-   SQL Server 2017+ ([Version Policy](https://docs.microsoft.com/en-us/lifecycle/products/?products=sql-server))

### Configuration

In the [configuration object](CONFIG.md), you may define all of your database connections, as well as specify which connection should be used by default.

### Query Builder

Once you have configured your database connection, you may retrieve the [Query Builder](BUILDER.md) using the `DatabaseManager` connection.

```ts
import { DatabaseManager } from 'ludb';

const DB = new DatabaseManager(config);
const connection = DB.connection(connectionName);
const query = connection.table('users');
// or
const query = connection.query();
```

### Schema Builder

Once you have configured your database connection, you may retrieve the [Schema Builder](SCHEMA.md) using the `DatabaseManager` connection.

```ts
import { DatabaseManager } from 'ludb';

const DB = new DatabaseManager(config);
const connection = DB.connection(connectionName);
const Schema = connection.getSchemaBuilder();
```

## Running SQL Queries

Once you have configured your database connection, you may run queries using the `DatabaseManager` connection.

```ts
import { DatabaseManager } from 'ludb';

const DB = new DatabaseManager(config);
const connection = DB.connection(connectionName);
```

#### Running A Select Query

To run a basic SELECT query, you may use the `select` method on the `connecttion`:

```ts
users = await connection.select('select * from users where active = ?', [1]);
```

The first argument passed to the `select` method is the SQL query, while the second argument is any parameter bindings that need to be bound to the query. Typically, these are the values of the `where` clause constraints. Parameter binding provides protection against SQL injection.

The `select` method will always return an `array` of results. Each result within the array will be an object representing a record from the database:

```ts
interface User {
    name: string;
}
users = await connection.select<User>('select * from users where active = ?', [1]);
for (const user of users) {
    console.log(user.name);
}
```

#### Selecting Scalar Values

Sometimes your database query may result in a single, scalar value. Instead of being required to retrieve the query's scalar result from a record object, Ludb allows you to retrieve this value directly using the `scalar` method:

```ts
burgers = await connection.scalar("select count(case when food = 'burger' then 1 end) as burgers from menu");
```

#### Using Named Bindings

Instead of using `?` to represent your parameter bindings, you may execute a query using named bindings:

```ts
results = await connection.select('select * from users where id = :id', { id: 1 });
```

#### Running An Insert Statement

To execute an `insert` statement, you may use the `insert` method on the `connecttion`. Like `select`, this method accepts the SQL query as its first argument and bindings as its second argument:

```ts
await connection.insert('insert into users (id, name) values (?, ?)', [1, 'Marc']);
```

#### Running An Update Statement

The `update` method should be used to update existing records in the database. The number of rows affected by the statement is returned by the method:

```ts
affected = await connection.update('update users set votes = 100 where name = ?', ['Anita']);
```

#### Running A Delete Statement

The `delete` method should be used to delete records from the database. Like `update`, the number of rows affected will be returned by the method:

```ts
deleted = await connection.delete('delete from users');
```

#### Running A General Statement

Some database statements do not return any value. For these types of operations, you may use the `statement` method on the `connecttion`:

```ts
await connection.statement('drop table users');
```

#### Running An Unprepared Statement

Sometimes you may want to execute an SQL statement without binding any values. You may use the `connecttion` `unprepared` method to accomplish this:

```ts
await connection.unprepared('update users set votes = 100 where name = "Dries"');
```

> **Warning**  
> Since unprepared statements do not bind parameters, they may be vulnerable to SQL injection. You should never allow user controlled values within an unprepared statement.

#### Implicit Commits

When using the `connecttion` `statement` and `unprepared` methods within transactions you must be careful to avoid statements that cause [implicit commits](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html). These statements will cause the database engine to indirectly commit the entire transaction, leaving Ludb unaware of the database's transaction level. An example of such a statement is creating a database table:

```ts
await connection.unprepared('create table a (col varchar(1) null)');
```

Please refer to the MySQL manual for [a list of all statements](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html) that trigger implicit commits.

### Bindings Caveat

Ludb and Lupdo can detect the right type of binded value through the Javascript type of a variable, but SqlServer Ludpo driver need to know the exact type of the database column to make an insert or an update, and in some case it can fail (for instance when a binded value is `null`, or when you are working with time or date).\
You can bypass the problem using the `TypedBinding` object of Lupdo; Ludb make it super easy to implement it providing a complete set of TypedBinding through `bindTo` Api, an example:

```ts
await connection.insert('insert into users (id, name, nullablestring) values (?, ?)', [1, 'Marc', connection.bindTo.string(null)]);
```

### Using Multiple Database Connections

If your application defines multiple connections in your configuration object, you may access each connection via the `connection` method provided by the `connecttion`. The connection name passed to the `connection` method should correspond to one of the connections listed in your configuration:

```ts
import { DatabaseManager } from 'ludb';

const DB = new DatabaseManager(config);
const connection = DB.connection('sqlite').select(/* ... */);
```

You may access the raw, underlying Lupdo instance of a connection using the `getPdo` method on a connection instance:

```ts
pdo = connection.connection('connectionName').getPdo();
```

### Events

Ludb emit an event for each query executed, the `QueryExecuted` event instance expose 6 properties:

-   connection: the `ConnectionSession` instance who generate the query
-   sql: the sql executed
-   bindings: the bindings of the query executed
-   time: time of execution in milliseconds
-   sessionTime: total time of session execution in millisecond
-   inTransaction: the sql executed is in a transaction

When a query is executed in a transaction, all the query executed inside a committed transaction will generate two Event, the first one will have the property `inTransaction` true, the second will be emitted only after the commit will have property `inTransaction` false.

Ludb emit an event every time a Lupdo Statement is prepared, the `StatementPrepared` event instance expose 2 properties:

-   connection: the `ConnectionSession` instance who generate the query
-   statement: the Lupdo Statement

Lupdo emit 4 event when a transaction is used, every transaction event expose only the connection property.

-   TransactionBeginning
-   TransactionCommitted
-   TransactionCommitting
-   TransactionRolledBack

### Listening For Query Events

If you would like to specify a closure that is invoked for each SQL query executed by your application, you may use the `connecttion` `listen` method. This method can be useful for logging queries or debugging.

```ts
import { DatabaseManager } from 'ludb';

const DB = new DatabaseManager(config);
const connection = DB.connection('sqlite').listen(query => {
    // query.sql;
    // query.bindings;
    // query.time;
});
```

You can also detach a listener using `connecttion` `unlisten` method:

```ts
import { DatabaseManager } from 'ludb';

const DB = new DatabaseManager(config);

const TempListener = query => {
    // query.sql;
    // query.bindings;
    // query.time;
    DB.connection('sqlite').unlisten(TempListener);
};

const connection = DB.connection('sqlite').listen(TempListener);
```

By Default `DatabaseManager` will use an `EventEmitter` instance to manage events. You can provide a custom instance of EventEmitter through constructor.

```ts
import { DatabaseManager } from 'ludb';
import EventEmitter from 'node:events';

const emitter = new EventEmitter();

const DB = new DatabaseManager(config, emitter);
const connection = DB.connection('sqlite').listen(query => {
    // query.sql;
    // query.bindings;
    // query.time;
});
```

### Monitoring Cumulative Query Time

A common performance bottleneck of modern web applications is the amount of time they spend querying databases.
The `connecttion` `listen` method can be helpful to make any kind of monitoring. An example of monitoring single query time execution:

```ts
DB.connection('sqlite').listen(query => {
    if (query.time > 500 && !query.inTransaction) {
        console.log('warning');
    }
});
```

An example of monitoring a session query time execution (all transaction queries are executed in a single session):

```ts
DB.connection('sqlite').listen(query => {
    if (query.sessionTime > 500 && !query.inTransaction) {
        console.log('warning');
    }
});
```

Sometimes you want to know when your application spends too much time querying the database during a single request. An example with Expressjs

```ts
import express, { Express, Request, Response, NextFunction } from 'express';
import { DatabaseManager, QueryExecuted } from 'ludb';

const DB = new DatabaseManager(config);
const app: Express = express();

const beforeMiddleware = (req: Request, res: Response, next: NextFunction) => {
    let totalTime = 0;
    let hasRun = false;
    const queryExecuted = [];
    req.referenceQueryId = 'uniqueid-for-req';
    req.queryLogListener = (event: QueryExecuted) => {
        if (event.referenceId ===  req.referenceQueryId && !hasRun && !event.inTransaction) {
            totalTime += event.time;
            queryExecuted.push(event);

            if (totalTime > 500) {
                hasRun = true;
                console.log('warning', queryExecuted);
            }
        }
    };
    DB.connection('connectionName').listen(req.queryLogListener);
    next();
};

const responseHandler = (req: Request, res: Response, next: NextFunction) => {
    // do stuff with database using reference
    // DB.connection('connectionName').reference(req.referenceQueryId).select(...)
    res.status(200).send({ response: 'ok' });
    next();
};

const afterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    DB.connection('connectionName').unlisten(req.queryLogListener);
    next();
};

app.get('/', beforeMiddleware, responseHandler, afterMiddleware);
```


## Cache

Ludb support caching queries for select operations `selectOne`, `scalar`, `selectFromWriteConnection` and `select`, [here](CACHE.md) you can find more information about caching 

## Database Transactions

You may use the `transaction` method provided by the `connecttion` to run a set of operations within a database transaction. If an exception is thrown within the transaction closure, the transaction will automatically be rolled back and the exception is re-thrown. If the closure executes successfully, the transaction will automatically be committed. You don't need to worry about manually rolling back or committing while using the `transaction` method:

```ts
await connection.transaction(async session => {
    await session.update('update users set votes = 1');

    await session.delete('delete from posts');
});
```

> **Warning**  
> Since Transaction will generate a new session you should always use the ConnectioSession provided as first parameter of callback. Query executed on default connection will do not be exectued within the transaction.

#### Handling Deadlocks

The `transaction` method accepts an optional second argument which defines the number of times a transaction should be retried when a deadlock occurs. Once these attempts have been exhausted, an exception will be thrown:

```ts
await connection.transaction(async session => {
    await session.update('update users set votes = 1');

    await session.delete('delete from posts');
}, 5);
```

#### Manually Using Transactions

If you would like to begin a transaction manually and have complete control over rollbacks and commits, you may use the `beginTransaction` method provided by the `connecttion`:

```ts
session = await connection.beginTransaction();
```

You can rollback the transaction via the `rollBack` method:

```ts
session.rollBack();
```

Lastly, you can commit a transaction via the `commit` method:

```ts
session.commit();
```

> **Warning**  
> Since Transaction will generate a new session you should always use the ConnectioSession returned by `beginTransacion`. Query executed on default connection will do not be executed within the transaction.

## Differences With Laravel

-   The `DatabaseManager` instance do not proxy methods to default connection, you always need to call `connection(name)` method to access method of `Connection`.
-   The `DatabaseManager` do not expose functionality to extend registered drivers.
-   Methods `whenQueryingForLongerThan` and `allowQueryDurationHandlersToRunAgain` do not exist, [Monitoring Cumulative Query Time](#monitoring-cumulative-query-time) offer a valid alternative.
-   Methods `getQueryLog` and `getRawQueryLog` do not exist, logging query is used only internally for `pretend` method.
-   Methods `beginTransaction` and `useWriteConnectionWhenReading` return a `ConnectionSession` you must use the session instead the original connection for the queries you want to execute them within the transaction or against the write pdo.
-   Callbacks for methods `transaction` and `pretend` are called with a `ConnectionSession` you must use the session instead the original connection inside the callback if you want to execute the queries within the transaction or to pretend the execution.
-   Query Builder return `Array` instead of `Collection`
-   Connection Method `selectResultSets` is not supported.

## Under The Hood

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

const DB = new DatabaseManager(config);
const connection = DB.connection(connectionName);

await connection.transaction(async session => {
    await session.update('update users set votes = 1');

    await session.delete('delete from posts');
});

const users = await connection.table('users').get();
```

An example of `beginTransaction` method:

```ts
import { DatabaseManager } from 'ludb';

const DB = new DatabaseManager(config);
const connection = DB.connection(connectionName);
const session = await connection.beginTransaction();
try {
    await session.update('update users set votes = 1');
    await session.delete('delete from posts');
    await session.commit();
} catch (error) {
    await session.rollBack();
}

const users = connection.table('users').get();
```

An example of `pretend` method:

```ts
import { DatabaseManager } from 'ludb';

const DB = new DatabaseManager(config);
const connection = DB.connection(connectionName);
const queries = await connection.pretend(async session => {
    await session.table('users').get();
    await session.table('posts').get();
});
console.log(queries);
const users = connection.table('users').get();
```

An example of `useWriteConnectionWhenReading` method:

```ts
import { DatabaseManager } from 'ludb';

const DB = new DatabaseManager(config);
const connection = DB.connection(connectionName);
await connection.table('users').where('id', 10).update({ name: 'Claudio' });
const session = connection.useWriteConnectionWhenReading();
const userFromWrite = session.table('users').find(10);
const userFromRead = connection.table('users').find(10);
```

An example of `temporary` with Schema:

```ts
import { DatabaseManager } from 'ludb';
import * as crypto from 'crypto';

const DB = new DatabaseManager(config);
const connection = DB.connection(connectionName);
const Schema = connection.getSchemaBuilder();

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
            const hash = crypto.createHash('sha1').update(order.id).digest('hex');
            /* Prepare the value string for the SQL statement */
            return `(${order.id}, '${hash}')`;
        })
        .join(',');

    await connection.insert(connection.raw(`INSERT INTO temp_mappings(id, reference) VALUES ${values}`));
});

await connection
    .table('orders')
    .join('temp_mappings', 'temp_mappgings.id', 'orders.id')
    .update({ hash_id: connection.raw('temp_mappings.hash_id') });
```

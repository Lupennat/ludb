# Query Builder

> Ludb offers an (almost) identical api to [Laravel Query Builder](https://laravel.com/docs/queries).

-   [Introduction](#introduction)
-   [Running Database Queries](#running-database-queries)
    -   [Chunking Results](#chunking-results)
    -   [Streaming Results Lazily](#streaming-results-lazily)
    -   [Aggregates](#aggregates)
-   [Select Statements](#select-statements)
-   [Raw Expressions](#raw-expressions)
-   [Joins](#joins)
-   [Unions](#unions)
-   [Basic Where Clauses](#basic-where-clauses)
    -   [Where Clauses](#where-clauses)
    -   [Or Where Clauses](#or-where-clauses)
    -   [Where Not Clauses](#where-not-clauses)
    -   [JSON Where Clauses](#json-where-clauses)
    -   [Additional Where Clauses](#additional-where-clauses)
    -   [Logical Grouping](#logical-grouping)
-   [Advanced Where Clauses](#advanced-where-clauses)
    -   [Where Exists Clauses](#where-exists-clauses)
    -   [Subquery Where Clauses](#subquery-where-clauses)
    -   [Full Text Where Clauses](#full-text-where-clauses)
-   [Ordering, Grouping, Limit & Offset](#ordering-grouping-limit-and-offset)
    -   [Ordering](#ordering)
    -   [Grouping](#grouping)
    -   [Limit & Offset](#limit-and-offset)
-   [Conditional Clauses](#conditional-clauses)
-   [Insert Statements](#insert-statements)
    -   [Upserts](#upserts)
-   [Update Statements](#update-statements)
    -   [Updating JSON Columns](#updating-json-columns)
    -   [Increment & Decrement](#increment-and-decrement)
-   [Delete Statements](#delete-statements)
-   [Pessimistic Locking](#pessimistic-locking)
-   [Debugging](#debugging)

## Introduction

Ludb's database query builder provides a convenient, fluent interface to creating and running database queries. It can be used to perform most database operations in your application and works perfectly with all of Ludb's supported database systems.

The Ludb query builder uses Lupdo parameter binding to protect your application against SQL injection attacks. There is no need to clean or sanitize strings passed to the query builder as query bindings.

> **Warning**  
> Lupdo does not support binding column names. Therefore, you should never allow user input to dictate the column names referenced by your queries, including "order by" columns.

## Running Database Queries

#### Retrieving All Rows From A Table

You may use the `table` method provided by the `DB` to begin a query. The `table` method returns a fluent query builder instance for the given table, allowing you to chain more constraints onto the query and then finally retrieve the results of the query using the `get` method:

```ts
users = await DB.table('users').get();
```

The `get` method returns an `Array` containing the results of the query where each result is an object (you can define object through interface). You may access each column's value by accessing the column as a property of the object:

```ts
users = await DB.table('users').get<UserInterface>();

for (const user of users) {
    console.log(user.name);
}
```

#### Retrieving A Single Row / Column From A Table

If you just need to retrieve a single row from a database table, you may use the `first` method. This method will return a single object:

```ts
users = await DB.table('users').where('name', 'John').first<UserInterface>();

console.log(user.email);
```

If you don't need an entire row, you may extract a single value from a record using the `value` method. This method will return the value of the column directly:

```ts
email = await DB.table('users').where('name', 'John').value<string>('email');
```

To retrieve a single row by its `id` column value, use the `find` method:

```ts
email = await DB.table('users').where('name', 'John').value<string>('email');
```

#### Retrieving A List Of Column Values

If you would like to retrieve an `Array` containing the values of a single column, you may use the `pluck` method. In this example, we'll retrieve an array of user titles:

```ts
titles = await DB.table('users').pluck<string>('title');

for (const title of titles) {
    console.log(title);
}
```

You may specify the column that the should use as `Object` keys by providing a second argument to the `pluck` method:

```ts
titles = await DB.table('users').pluck<string>('title', 'name');

for (const [name, title] of Object.entries(titles)) {
    console.log(name, title);
}
```

### Chunking Results

If you need to work with thousands of database records, consider using the `chunk` method. This method retrieves a small chunk of results at a time and feeds each chunk into a closure for processing. For example, let's retrieve the entire `users` table in chunks of 100 records at a time:

```ts
await DB.table('users')
    .orderBy('id')
    .chunk<UserInterface>(100, users => {
        for (const user of users) {
            //
        }
    });
```

You may stop further chunks from being processed by returning `false` from the closure:

```ts
await DB.table('users')
    .orderBy('id')
    .chunk<UserInterface>(100, users => {
        // Process the records...

        return false;
    });
```

If you are updating database records while chunking results, your chunk results could change in unexpected ways. If you plan to update the retrieved records while chunking, it is always best to use the `chunkById` method instead. This method will automatically paginate the results based on the record's primary key:

```ts
await DB.table('users')
    .where('active', false)
    .chunkById<UserInterface>(100, async users => {
        for (const user of users) {
            await DB.table('users').where('id', user.id).update({ active: true });
        }
    });
```

> **Warning**  
> When updating or deleting records inside the chunk callback, any changes to the primary key or foreign keys could affect the chunk query. This could potentially result in records not being included in the chunked results.

### Streaming Results Lazily

The `lazy` method works similarly to [the `chunk` method](#chunking-results) in the sense that it executes the query in chunks. However, instead of passing each chunk into a callback, the `lazy()` method returns an `AsyncGenerator`, which lets you interact with the results as a single stream:

```ts
for await (const user of DB.table('users').orderBy('id').lazy<UserInterface>()) {
    // ...
}
```

Once again, if you plan to update the retrieved records while iterating over them, it is best to use the `lazyById` or `lazyByIdDesc` methods instead. These methods will automatically paginate the results based on the record's primary key:

```ts
for await (const item of DB.table('users').where('active', false).lazyById<UserInterface>()) {
    await DB.table('users').where('id', user.id).update({ active: true });
}
```

> **Warning**  
> When updating or deleting records while iterating over them, any changes to the primary key or foreign keys could affect the chunk query. This could potentially result in records not being included in the results.

### Aggregates

The query builder also provides a variety of methods for retrieving aggregate values like `count`, `max`, `min`, `avg`, and `sum`. You may call any of these methods after constructing your query:

```ts
users = await DB.table('users').count();
price = await DB.table('orders').max('price');
```

Of course, you may combine these methods with other clauses to fine-tune how your aggregate value is calculated:

```ts
price = await DB.table('orders').where('finalized', 1).avg('price');
```

#### Determining If Records Exist

Instead of using the `count` method to determine if any records exist that match your query's constraints, you may use the `exists` and `doesntExist` methods:

```ts
if (await DB.table('orders').where('finalized', 1).exists()) {
    // ...
}

if (await DB.table('orders').where('finalized', 1).doesntExist()) {
    // ...
}
```

## Select Statements

#### Specifying A Select Clause

You may not always want to select all columns from a database table. Using the `select` method, you can specify a custom "select" clause for the query:

```ts
interface UserNameEmail {
    name: string;
    user_email: string;
}

users = await DB.table('users').select('name', 'email as user_email').get<UserNameEmail>();
```

The `distinct` method allows you to force the query to return distinct results:

```ts
users = await DB.table('users').distinct().get();
```

If you already have a query builder instance and you wish to add a column to its existing select clause, you may use the `addSelect` method:

```ts
query = DB.table('users').select('name');

users = await query.addSelect('age').get();
```

## Raw Expressions

Sometimes you may need to insert an arbitrary string into a query. To create a raw string expression, you may use the `raw` method:

```ts
users = await DB.table('users')
    .select(DB.raw('count(*) as user_count, status'))
    .where('status', '<>', 1)
    .groupBy('status')
    .get();
```

> **Warning**  
> Raw statements will be injected into the query as strings, so you should be extremely careful to avoid creating SQL injection vulnerabilities.

### Raw Methods

Instead of using the `DB.raw` method, you may also use the following methods to insert a raw expression into various parts of your query. **Remember, Ludb can not guarantee that any query using raw expressions is protected against SQL injection vulnerabilities.**

#### `selectRaw`

The `selectRaw` method can be used in place of `addSelect(DB.raw(/* ... */))`. This method accepts an optional array of bindings as its second argument:

```ts
orders = await DB.table('orders').selectRaw('price * ? as price_with_tax', [1.0825]).get();
```

#### `whereRaw / orWhereRaw`

The `whereRaw` and `orWhereRaw` methods can be used to inject a raw "where" clause into your query. These methods accept an optional array of bindings as their second argument:

```ts
orders = await DB.table('orders').whereRaw('price > IF(state = "TX", ?, 100)', [200]).get();
```

#### `havingRaw / orHavingRaw`

The `havingRaw` and `orHavingRaw` methods may be used to provide a raw string as the value of the "having" clause. These methods accept an optional array of bindings as their second argument:

```ts
orders = await DB.table('orders')
    .select('department', DB.raw('SUM(price) as total_sales'))
    .groupBy('department')
    .havingRaw('SUM(price) > ?', [2500])
    .get();
```

#### `orderByRaw`

The `orderByRaw` method may be used to provide a raw string as the value of the "order by" clause:

```ts
orders = await DB.table('orders').orderByRaw('updated_at - created_at DESC').get();
```

### `groupByRaw`

The `groupByRaw` method may be used to provide a raw string as the value of the `group by` clause:

```ts
orders = await DB.table('orders').select('city', 'state').groupByRaw('city, state').get();
```

## Joins

#### Inner Join Clause

The query builder may also be used to add join clauses to your queries. To perform a basic "inner join", you may use the `join` method on a query builder instance. The first argument passed to the `join` method is the name of the table you need to join to, while the remaining arguments specify the column constraints for the join. You may even join multiple tables in a single query:

```ts
users = await DB.table('users')
    .join('contacts', 'users.id', '=', 'contacts.user_id')
    .join('orders', 'users.id', '=', 'orders.user_id')
    .select('users.*', 'contacts.phone', 'orders.price')
    .get();
```

#### Left Join / Right Join Clause

If you would like to perform a "left join" or "right join" instead of an "inner join", use the `leftJoin` or `rightJoin` methods. These methods have the same signature as the `join` method:

```ts
users = await DB.table('users').leftJoin('posts', 'users.id', '=', 'posts.user_id').get();

users = await DB.table('users').rightJoin('posts', 'users.id', '=', 'posts.user_id').get();
```

#### Cross Join Clause

You may use the `crossJoin` method to perform a "cross join". Cross joins generate a cartesian product between the first table and the joined table:

```ts
sizes = await DB.table('sizes').crossJoin('colors').get();
```

#### Advanced Join Clauses

You may also specify more advanced join clauses. To get started, pass a closure as the second argument to the `join` method. The closure will receive a `JoinClause` instance which allows you to specify constraints on the "join" clause:

```ts
sizes = await DB.table('sizes')
    .join('contacts', join => {
        join.on('users.id', '=', 'contacts.user_id').orOn(/* ... */);
    })
    .get();
```

If you would like to use a "where" clause on your joins, you may use the `where` and `orWhere` methods provided by the `JoinClause` instance. Instead of comparing two columns, these methods will compare the column against a value:

```ts
await DB.table('sizes')
    .join('contacts', join => {
        join.on('users.id', '=', 'contacts.user_id').where('contacts.user_id', '>', 5);
    })
    .get();
```

#### Subquery Joins

You may use the `joinSub`, `leftJoinSub`, and `rightJoinSub` methods to join a query to a subquery. Each of these methods receives three arguments: the subquery, its table alias, and a closure that defines the related columns. In this example, we will retrieve a collection of users where each user record also contains the `created_at` timestamp of the user's most recently published blog post:

```ts
latestPosts = DB.table('posts')
                       .select('user_id', DB.raw('MAX(created_at) as last_post_created_at'))
                       .where('is_published', true)
                       .groupBy('user_id');

users = await DB::table('users')
                .joinSub(latestPosts, 'latest_posts', (join) => {
                    join.on('users.id', '=', 'latest_posts.user_id');
                })
                .get();
```

## Unions

The query builder also provides a convenient method to "union" two or more queries together. For example, you may create an initial query and use the `union` method to union it with more queries:

```ts
first = DB.table('users').whereNull('first_name');

users = await DB.table('users').whereNull('last_name').union(first).get();
```

In addition to the `union` method, the query builder provides a `unionAll` method. Queries that are combined using the `unionAll` method will not have their duplicate results removed. The `unionAll` method has the same method signature as the `union` method.

## Basic Where Clauses

### Where Clauses

You may use the query builder's `where` method to add "where" clauses to the query. The most basic call to the `where` method requires three arguments. The first argument is the name of the column. The second argument is an operator, which can be any of the database's supported operators. The third argument is the value to compare against the column's value.

For example, the following query retrieves users where the value of the `votes` column is equal to `100` and the value of the `age` column is greater than `35`:

```ts
users = await DB.table('users').where('votes', '=', 100).where('age', '>', 35).get();
```

For convenience, if you want to verify that a column is `=` to a given value, you may pass the value as the second argument to the `where` method. Ludb will assume you would like to use the `=` operator:

```ts
users = await DB.table('users').where('votes', 100).get();
```

As previously mentioned, you may use any operator that is supported by your database system:

```ts
users = await DB.table('users')
                .where('votes', '>=', 100)
                .get();

users = await DB.table('users')
                .where('votes', '<>', 100)
                .get();

users = await DB.table('users')
                .where('name', 'like' 'T%')
                .get();
```

You may also pass an array of conditions to the `where` function. Each element of the array should be an array containing the three arguments typically passed to the `where` method:

```ts
users = await DB.table('users')
    .where([
        ['status', '=', '1'],
        ['subscribed', '<>', '1']
    ])
    .get();
```

> **Warning**  
> Lupdo does not support binding column names. Therefore, you should never allow user input to dictate the column names referenced by your queries, including "order by" columns.

### Or Where Clauses

When chaining together calls to the query builder's `where` method, the "where" clauses will be joined together using the `and` operator. However, you may use the `orWhere` method to join a clause to the query using the `or` operator. The `orWhere` method accepts the same arguments as the `where` method:

```ts
users = await DB.table('users').where('votes', '>', 100).orWhere('name', 'John').get();
```

If you need to group an "or" condition within parentheses, you may pass a closure as the first argument to the `orWhere` method:

```ts
users = await DB.table('users')
    .where('votes', '>', 100)
    .orWhere(query => {
        query.where('name', 'Abigail').where('votes', '>', 50);
    })
    .get();
```

The example above will produce the following SQL:

```sql
select * from users where votes > 100 or (name = 'Abigail' and votes > 50)
```

> **Warning**  
> You should always group `orWhere` calls in order to avoid unexpected behavior when global scopes are applied.

### Where Not Clauses

The `whereNot` and `orWhereNot` methods may be used to negate a given group of query constraints. For example, the following query excludes products that are on clearance or which have a price that is less than ten:

```ts
products = await DB.table('products')
    .whereNot(query => {
        query.where('clearance', true).orWhere('price', '<', 10);
    })
    .get();
```

### JSON Where Clauses

Ludb also supports querying JSON column types on databases that provide support for JSON column types. Currently, this includes MySQL 5.7+, PostgreSQL, SQL Server 2016, and SQLite 3.39.0 (with the [JSON1 extension](https://www.sqlite.org/json1.html)). To query a JSON column, use the `->` operator:

```ts
users = await DB.table('users').where('preferences->dining->meal', 'salad').get();
```

You may use `whereJsonContains` to query JSON arrays. This feature is not supported by SQLite database versions less than 3.38.0:

```ts
users = await DB.table('users').whereJsonContains('options->languages', 'en').get();
```

If your application uses the MySQL or PostgreSQL databases, you may pass an array of values to the `whereJsonContains` method:

```ts
users = await DB.table('users').whereJsonContains('options->languages', ['en', 'de']).get();
```

You may use `whereJsonLength` method to query JSON arrays by their length:

```ts
users = await DB.table('users').whereJsonLength('options->languages', 0).get();

users = await DB.table('users').whereJsonLength('options->languages', '>', 1).get();
```

### Additional Where Clauses

**whereBetween / orWhereBetween**

The `whereBetween` method verifies that a column's value is between two values:

```ts
users = await DB.table('users').whereBetween('votes', [1, 100]).get();
```

**whereNotBetween / orWhereNotBetween**

The `whereNotBetween` method verifies that a column's value lies outside of two values:

```ts
users = await DB.table('users').whereNotBetween('votes', [1, 100]).get();
```

**whereBetweenColumns / whereNotBetweenColumns / orWhereBetweenColumns / orWhereNotBetweenColumns**

The `whereBetweenColumns` method verifies that a column's value is between the two values of two columns in the same table row:

```ts
patients = await DB.table('patients')
    .whereBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
    .get();
```

The `whereNotBetweenColumns` method verifies that a column's value lies outside the two values of two columns in the same table row:

```ts
patients = await DB.table('patients')
    .whereNotBetweenColumns('weight', ['minimum_allowed_weight', 'maximum_allowed_weight'])
    .get();
```

**whereIn / whereNotIn / orWhereIn / orWhereNotIn**

The `whereIn` method verifies that a given column's value is contained within the given array:

```ts
users = await DB.table('users').whereIn('id', [1, 2, 3]).get();
```

The `whereNotIn` method verifies that the given column's value is not contained in the given array:

```ts
users = await DB.table('users').whereNotIn('id', [1, 2, 3]).get();
```

You may also provide a query object as the `whereIn` method's second argument:

```ts
activeUsers = DB.table('users').select('id').where('is_active', 1);

users = await DB.table('comments').whereIn('user_id', $activeUsers).get();
```

The example above will produce the following SQL:

```sql
select * from comments where user_id in (
    select id
    from users
    where is_active = 1
)
```

> **Warning**  
> If you are adding a large array of integer bindings to your query, the `whereIntegerInRaw` or `whereIntegerNotInRaw` methods may be used to greatly reduce your memory usage.

**whereNull / whereNotNull / orWhereNull / orWhereNotNull**

The `whereNull` method verifies that the value of the given column is `NULL`:

```ts
users = await DB.table('users').whereNull('updated_at').get();
```

The `whereNotNull` method verifies that the column's value is not `NULL`:

```ts
users = await DB.table('users').whereNotNull('updated_at').get();
```

**whereDate / whereMonth / whereDay / whereYear / whereTime**

The `whereDate` method may be used to compare a column's value against a date:

```ts
users = await DB.table('users').whereDate('created_at', '2016-12-31').get();
```

The `whereMonth` method may be used to compare a column's value against a specific month:

```ts
users = await DB.table('users').whereMonth('created_at', '12').get();
```

The `whereDay` method may be used to compare a column's value against a specific day of the month:

```ts
users = await DB.table('users').whereDay('created_at', '31').get();
```

The `whereYear` method may be used to compare a column's value against a specific year:

```ts
users = await DB.table('users').whereYear('created_at', '2016').get();
```

The `whereTime` method may be used to compare a column's value against a specific time:

```ts
users = await DB.table('users').whereTime('created_at', '=', '11:20:45').get();
```

**whereColumn / orWhereColumn**

The `whereColumn` method may be used to verify that two columns are equal:

```ts
users = await DB.table('users').whereColumn('first_name', 'last_name').get();
```

You may also pass a comparison operator to the `whereColumn` method:

```ts
users = await DB.table('users').whereColumn('updated_at', '>', 'created_at').get();
```

You may also pass an array of column comparisons to the `whereColumn` method. These conditions will be joined using the `and` operator:

```ts
users = await DB.table('users')
    .whereColumn([
        ['first_name', '=', 'last_name'],
        ['updated_at', '>', 'created_at']
    ])
    .get();
```

### Logical Grouping

Sometimes you may need to group several "where" clauses within parentheses in order to achieve your query's desired logical grouping. In fact, you should generally always group calls to the `orWhere` method in parentheses in order to avoid unexpected query behavior. To accomplish this, you may pass a closure to the `where` method:

```ts
users = await DB.table('users')
    .where('name', '=', 'John')
    .where(query => {
        query.where('votes', '>', 100).orWhere('title', '=', 'Admin');
    })
    .get();
```

As you can see, passing a closure into the `where` method instructs the query builder to begin a constraint group. The closure will receive a query builder instance which you can use to set the constraints that should be contained within the parenthesis group. The example above will produce the following SQL:

```sql
select * from users where name = 'John' and (votes > 100 or title = 'Admin')
```

> **Warning**  
> You should always group `orWhere` calls in order to avoid unexpected behavior when global scopes are applied.

### Advanced Where Clauses

### Where Exists Clauses

The `whereExists` method allows you to write "where exists" SQL clauses. The `whereExists` method accepts a closure which will receive a query builder instance, allowing you to define the query that should be placed inside of the "exists" clause:

```ts
users = await DB.table('users')
    .whereExists(query => {
        query.select(DB.raw(1)).from('orders').whereColumn('orders.user_id', 'users.id');
    })
    .get();
```

Alternatively, you may provide a query object to the `whereExists` method instead of a closure:

```ts
orders = DB.table('orders').select(DB.raw(1)).whereColumn('orders.user_id', 'users.id');

users = await DB.table('users').whereExists($orders).get();
```

Both of the examples above will produce the following SQL:

```sql
select * from users
where exists (
    select 1
    from orders
    where orders.user_id = users.id
)
```

### Subquery Where Clauses

Sometimes you may need to construct a "where" clause that compares the results of a subquery to a given value. You may accomplish this by passing a closure and a value to the `where` method. For example, the following query will retrieve all users who have a recent "membership" of a given type;

```ts
users = await DB.table('users')
    .where(query => {
        query
            .select('type')
            .from('membership')
            .whereColumn('membership.user_id', 'users.id')
            .orderByDesc('membership.start_date')
            .limit(1);
    }, 'Pro')
    .get();
```

Or, you may need to construct a "where" clause that compares a column to the results of a subquery. You may accomplish this by passing a column, operator, and closure to the `where` method. For example, the following query will retrieve all income records where the amount is less than average;

```ts
incomes = DB.table('incomes')
    .where('amount', '<', query => {
        query.selectRaw('avg(i.amount)').from('incomes as i');
    })
    .get();
```

### Full Text Where Clauses

> **Warning**  
> Full text where clauses are currently supported by MySQL and PostgreSQL.

The `whereFullText` and `orWhereFullText` methods may be used to add full text "where" clauses to a query for columns that have [full text indexes](SCHEMA.md#available-index-types). These methods will be transformed into the appropriate SQL for the underlying database system by Ludb. For example, a `MATCH AGAINST` clause will be generated for applications utilizing MySQL:

```ts
users = await DB.table('users').whereFullText('bio', 'web developer').get();
```

## Ordering, Grouping, Limit & Offset

### Ordering

#### The `orderBy` Method

The `orderBy` method allows you to sort the results of the query by a given column. The first argument accepted by the `orderBy` method should be the column you wish to sort by, while the second argument determines the direction of the sort and may be either `asc` or `desc`:

```ts
users = await DB.table('users').orderBy('name', 'desc').get();
```

To sort by multiple columns, you may simply invoke `orderBy` as many times as necessary:

```ts
users = await DB.table('users').orderBy('name', 'desc').orderBy('email', 'asc').get();
```

#### The `latest` & `oldest` Methods

The `latest` and `oldest` methods allow you to easily order results by date. By default, the result will be ordered by the table's `created_at` column. Or, you may pass the column name that you wish to sort by:

```ts
user = await DB.table('users').latest().first();
```

#### Random Ordering

The `inRandomOrder` method may be used to sort the query results randomly. For example, you may use this method to fetch a random user:

```ts
randomUser = await DB.table('users').inRandomOrder().first();
```

#### Removing Existing Orderings

The `reorder` method removes all of the "order by" clauses that have previously been applied to the query:

```ts
query = DB.table('users').orderBy('name');

unorderedUsers = await query.reorder().get();
```

You may pass a column and direction when calling the `reorder` method in order to remove all existing "order by" clauses and apply an entirely new order to the query:

```ts
query = DB.table('users').orderBy('name');

usersOrderedByEmail = await query.reorder('email', 'desc').get();
```

### Grouping

#### The `groupBy` & `having` Methods

As you might expect, the `groupBy` and `having` methods may be used to group the query results. The `having` method's signature is similar to that of the `where` method:

```ts
users = await DB.table('users').groupBy('account_id').having('account_id', '>', 100).get();
```

You can use the `havingBetween` method to filter the results within a given range:

```ts
report = await DB.table('orders')
    .selectRaw('count(id) as number_of_orders, customer_id')
    .groupBy('customer_id')
    .havingBetween('number_of_orders', [5, 15])
    .get();
```

You may pass multiple arguments to the `groupBy` method to group by multiple columns:

```ts
users = await DB.table('users').groupBy('first_name', 'status').having('account_id', '>', 100).get();
```

To build more advanced `having` statements, see the [`havingRaw`](#raw-methods) method.

### Limit & Offset

#### The `skip` & `take` Methods

You may use the `skip` and `take` methods to limit the number of results returned from the query or to skip a given number of results in the query:

```ts
users = await DB.table('users').skip(10).take(5).get();
```

Alternatively, you may use the `limit` and `offset` methods. These methods are functionally equivalent to the `take` and `skip` methods, respectively:

```ts
users = await DB.table('users').offset(10).limit(5).get();
```

## Conditional Clauses

Sometimes you may want certain query clauses to apply to a query based on another condition. For instance, you may only want to apply a `where` statement if a given input value is present on the incoming HTTP request. You may accomplish this using the `when` method:

```ts
    users = await DB.table('users')
                .when(getFromHttpRequest('role'), (query, role) {
                    query.where('role_id', role);
                })
                .get();
```

The `when` method only executes the given closure when the first argument is `true`. If the first argument is `false`, the closure will not be executed. So, in the example above, the closure given to the `when` method will only be invoked if the `role` field is present on the incoming request and evaluates to `true`.

You may pass another closure as the third argument to the `when` method. This closure will only execute if the first argument evaluates as `false`. To illustrate how this feature may be used, we will use it to configure the default ordering of a query:

```ts
users = await DB.table('users')
    .when(
        getFromHttpRequest('sort_by_votes'),
        (query, sortByVotes) => {
            query.orderBy('votes');
        },
        query => {
            query.orderBy('name');
        }
    )
    .get();
```

## Insert Statements

The query builder also provides an `insert` method that may be used to insert records into the database table. The `insert` method accepts an object of column names and values:

```ts
await DB.table('users').insert({
    email: 'kayla@example.com',
    votes: 0
});
```

You may insert several records at once by passing an array of objects. Each object represents a record that should be inserted into the table:

```ts
    await DB::table('users').insert([
        {email: 'picard@example.com', votes: 0},
        {email: 'janeway@example.com', votes: 0},
    ]);
```

The `insertOrIgnore` method will ignore errors while inserting records into the database. When using this method, you should be aware that duplicate record errors will be ignored and other types of errors may also be ignored depending on the database engine. For example, `insertOrIgnore` will [bypass MySQL's strict mode](https://dev.mysql.com/doc/refman/en/sql-mode.html#ignore-effect-on-execution):

```ts
await DB.table('users').insertOrIgnore([
    { id: 1, email: 'sisko@example.com' },
    { id: 2, email: 'archer@example.com' }
]);
```

The `insertUsing` method will insert new records into the table while using a subquery to determine the data that should be inserted:

```ts
await DB.table('pruned_users').insertUsing(
    ['id', 'name', 'email', 'email_verified_at'],
    DB.table('users').select('id', 'name', 'email', 'email_verified_at').where('updated_at', '<=', '2023-01-02')
);
```

#### Auto-Incrementing IDs

If the table has an auto-incrementing id, use the `insertGetId` method to insert a record and then retrieve the ID:

```ts
id = await DB.table('users').insertGetId({ email: 'john@example.com', votes: 0 });
```

> **Warning**  
> When using PostgreSQL the `insertGetId` method expects the auto-incrementing column to be named `id`. If you would like to retrieve the ID from a different "sequence", you may pass the column name as the second parameter to the `insertGetId` method.

### Upserts

The `upsert` method will insert records that do not exist and update the records that already exist with new values that you may specify. The method's first argument consists of the values to insert or update, while the second argument lists the column(s) that uniquely identify records within the associated table. The method's third and final argument is an array of columns that should be updated if a matching record already exists in the database:

```ts
await DB.table('flights').upsert(
    [
        { departure: 'Oakland', destination: 'San Diego', price: 99 },
        { departure: 'Chicago', destination: 'New York', price: 150 }
    ],
    ['departure', 'destination'],
    ['price']
);
```

In the example above, Ludb will attempt to insert two records. If a record already exists with the same `departure` and `destination` column values, Ludb will update that record's `price` column.

> **Warning**  
> All databases except SQL Server require the columns in the second argument of the `upsert` method to have a "primary" or "unique" index. In addition, the MySQL database driver ignores the second argument of the `upsert` method and always uses the "primary" and "unique" indexes of the table to detect existing records.

## Update Statements

In addition to inserting records into the database, the query builder can also update existing records using the `update` method. The `update` method, like the `insert` method, accepts an array of column and value pairs indicating the columns to be updated. The `update` method returns the number of affected rows. You may constrain the `update` query using `where` clauses:

```ts
affected = await DB.table('users').where('id', 1).update({ votes: 1 });
```

#### Update Or Insert

Sometimes you may want to update an existing record in the database or create it if no matching record exists. In this scenario, the `updateOrInsert` method may be used. The `updateOrInsert` method accepts two arguments: an object of conditions by which to find the record, and an object of column and value pairs indicating the columns to be updated.

The `updateOrInsert` method will attempt to locate a matching database record using the first argument's column and value pairs. If the record exists, it will be updated with the values in the second argument. If the record can not be found, a new record will be inserted with the merged attributes of both arguments:

```ts
await DB.table('users').updateOrInsert({ email: 'john@example.com', name: 'John' }, { votes: '2' });
```

### Updating JSON Columns

When updating a JSON column, you should use `->` syntax to update the appropriate key in the JSON object. This operation is supported on MySQL 5.7+ and PostgreSQL 9.5+:

```ts
affected = await DB.table('users').where('id', 1).update({ 'options->enabled': true });
```

### Increment & Decrement

The query builder also provides convenient methods for incrementing or decrementing the value of a given column. Both of these methods accept at least one argument: the column to modify. A second argument may be provided to specify the amount by which the column should be incremented or decremented:

```ts
await DB.table('users').increment('votes');

await DB.table('users').increment('votes', 5);

await DB.table('users').decrement('votes');

await DB.table('users').decrement('votes', 5);
```

If needed, you may also specify additional columns to update during the increment or decrement operation:

```ts
await DB.table('users').increment('votes', 1, { name: 'John' });
```

In addition, you may increment or decrement multiple columns at once using the `incrementEach` and `decrementEach` methods:

```ts
await DB.table('users').incrementEach({
    votes: 5,
    balance: 100
});
```

## Delete Statements

The query builder's `delete` method may be used to delete records from the table. The `delete` method returns the number of affected rows. You may constrain `delete` statements by adding "where" clauses before calling the `delete` method:

```ts
deleted = await DB.table('users').delete();

deleted = await DB.table('users').where('votes', '>', 100).delete();
```

If you wish to truncate an entire table, which will remove all records from the table and reset the auto-incrementing ID to zero, you may use the `truncate` method:

```ts
await DB.table('users').truncate();
```

#### Table Truncation & PostgreSQL

When truncating a PostgreSQL database, the `CASCADE` behavior will be applied. This means that all foreign key related records in other tables will be deleted as well.

## Pessimistic Locking

The query builder also includes a few functions to help you achieve "pessimistic locking" when executing your `select` statements. To execute a statement with a "shared lock", you may call the `sharedLock` method. A shared lock prevents the selected rows from being modified until your transaction is committed:

```ts
await DB.table('users').where('votes', '>', 100).sharedLock().get();
```

Alternatively, you may use the `lockForUpdate` method. A "for update" lock prevents the selected records from being modified or from being selected with another shared lock:

```ts
await DB.table('users').where('votes', '>', 100).lockForUpdate().get();
```

## Debugging

You may use the `log` methods while building a query to log the current query bindings and SQL. The `log` method will display the debug information but allow the request to continue executing:

```ts
DB.table('users').where('votes', '>', 100).log();
```

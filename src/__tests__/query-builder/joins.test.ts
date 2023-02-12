import { getBuilder, pdo } from '../fixtures/mocked';

describe('Query Builder Joins', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Join Aliases With Prefix', () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.select('*').from('services').join('translations AS t', 't.item_id', '=', 'services.id');
        expect(builder.toSql()).toBe(
            'select * from "prefix_services" inner join "prefix_translations" as "prefix_t" on "prefix_t"."item_id" = "prefix_services"."id"'
        );
    });

    it('Works Basic Joins', () => {
        let builder = getBuilder();
        builder.select('*').from('users').join('contacts', 'users.id', 'contacts.id');
        expect('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id"').toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', 'users.id', '=', 'contacts.id')
            .leftJoin('photos', 'users.id', '=', 'photos.id');
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" left join "photos" on "users"."id" = "photos"."id"'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .leftJoinWhere('photos', 'users.id', '=', 'bar')
            .joinWhere('photos', 'users.id', '=', 'foo');
        expect(
            'select * from "users" left join "photos" on "users"."id" = ? inner join "photos" on "users"."id" = ?'
        ).toBe(builder.toSql());
        expect(['bar', 'foo']).toEqual(builder.getBindings());
    });

    it('Works Cross Joins', () => {
        let builder = getBuilder();
        builder.select('*').from('sizes').crossJoin('colors');
        expect('select * from "sizes" cross join "colors"').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('tableB').join('tableA', 'tableA.column1', '=', 'tableB.column2', 'cross');
        expect('select * from "tableB" cross join "tableA" on "tableA"."column1" = "tableB"."column2"').toBe(
            builder.toSql()
        );

        builder = getBuilder();
        builder.select('*').from('tableB').crossJoin('tableA', 'tableA.column1', '=', 'tableB.column2');
        expect('select * from "tableB" cross join "tableA" on "tableA"."column1" = "tableB"."column2"').toBe(
            builder.toSql()
        );
    });

    it('Works Cross Join Subs', () => {
        const builder = getBuilder();
        builder
            .selectRaw('(sale / overall.sales) * 100 AS percent_of_total')
            .from('sales')
            .crossJoinSub(getBuilder().selectRaw('SUM(sale) AS sales').from('sales'), 'overall');
        expect(
            'select (sale / overall.sales) * 100 AS percent_of_total from "sales" cross join (select SUM(sale) AS sales from "sales") as "overall"'
        ).toBe(builder.toSql());
    });

    it('Works Complex Join', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                join.on('users.id', '=', 'contacts.id').orOn('users.name', '=', 'contacts.name');
            });
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "users"."name" = "contacts"."name"'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                join.where('users.id', '=', 'foo').orWhere('users.name', '=', 'bar');
            });
        expect('select * from "users" inner join "contacts" on "users"."id" = ? or "users"."name" = ?').toBe(
            builder.toSql()
        );
        expect(['foo', 'bar']).toEqual(builder.getBindings());

        // Run the assertions again
        expect('select * from "users" inner join "contacts" on "users"."id" = ? or "users"."name" = ?').toBe(
            builder.toSql()
        );
        expect(['foo', 'bar']).toEqual(builder.getBindings());
    });

    it('Works Join Where Null', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                join.on('users.id', '=', 'contacts.id').whereNull('contacts.deleted_at');
            });
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."deleted_at" is null'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                join.on('users.id', '=', 'contacts.id').orWhereNull('contacts.deleted_at');
            });
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."deleted_at" is null'
        ).toBe(builder.toSql());
    });

    it('Works Join Where Not Null', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                join.on('users.id', '=', 'contacts.id').whereNotNull('contacts.deleted_at');
            });
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."deleted_at" is not null'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                join.on('users.id', '=', 'contacts.id').orWhereNotNull('contacts.deleted_at');
            });
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."deleted_at" is not null'
        ).toBe(builder.toSql());
    });

    it('Works Join Where In', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                join.on('users.id', '=', 'contacts.id').whereIn('contacts.name', [48, 'baz', null]);
            });
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."name" in (?, ?, ?)'
        ).toBe(builder.toSql());
        expect([48, 'baz', null]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                join.on('users.id', '=', 'contacts.id').orWhereIn('contacts.name', [48, 'baz', null]);
            });
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."name" in (?, ?, ?)'
        ).toBe(builder.toSql());
        expect([48, 'baz', null]).toEqual(builder.getBindings());
    });

    it('Works Join Where In Subquery', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                const query = getBuilder();
                query.select('name').from('contacts').where('name', 'baz');
                join.on('users.id', '=', 'contacts.id').whereIn('contacts.name', query);
            });
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."name" in (select "name" from "contacts" where "name" = ?)'
        ).toBe(builder.toSql());
        expect(['baz']).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                const query = getBuilder();
                query.select('name').from('contacts').where('name', 'baz');
                join.on('users.id', '=', 'contacts.id').orWhereIn('contacts.name', query);
            });
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."name" in (select "name" from "contacts" where "name" = ?)'
        ).toBe(builder.toSql());
        expect(['baz']).toEqual(builder.getBindings());
    });

    it('Works Join Where Not In', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                join.on('users.id', '=', 'contacts.id').whereNotIn('contacts.name', [48, 'baz', null]);
            });
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."name" not in (?, ?, ?)'
        ).toBe(builder.toSql());
        expect([48, 'baz', null]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('contacts', join => {
                join.on('users.id', '=', 'contacts.id').orWhereNotIn('contacts.name', [48, 'baz', null]);
            });
        expect(
            'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "contacts"."name" not in (?, ?, ?)'
        ).toBe(builder.toSql());
        expect([48, 'baz', null]).toEqual(builder.getBindings());
    });

    it('Works Joins With Nested Conditions', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .leftJoin('contacts', join => {
                join.on('users.id', '=', 'contacts.id').where(join => {
                    join.where('contacts.country', '=', 'US').orWhere('contacts.is_partner', '=', 1);
                });
            });
        expect(
            'select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and ("contacts"."country" = ? or "contacts"."is_partner" = ?)'
        ).toBe(builder.toSql());
        expect(['US', 1]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .leftJoin('contacts', join => {
                join.on('users.id', '=', 'contacts.id')
                    .where('contacts.is_active', '=', 1)
                    .orOn(join => {
                        join.orWhere(join => {
                            join.where('contacts.country', '=', 'UK').orOn('contacts.type', '=', 'users.type');
                        }).where(join => {
                            join.where('contacts.country', '=', 'US').orWhereNull('contacts.is_partner');
                        });
                    });
            });
        expect(
            'select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and "contacts"."is_active" = ? or (("contacts"."country" = ? or "contacts"."type" = "users"."type") and ("contacts"."country" = ? or "contacts"."is_partner" is null))'
        ).toBe(builder.toSql());
        expect([1, 'UK', 'US']).toEqual(builder.getBindings());
    });

    it('Works Joins With Advanced Conditions', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .leftJoin('contacts', join => {
                join.on('users.id', 'contacts.id').where(join => {
                    join.where('role', 'admin')
                        .orWhereNull('contacts.disabled')
                        .orWhereRaw('year(contacts.created_at) = 2016');
                });
            });
        expect(
            'select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and ("role" = ? or "contacts"."disabled" is null or year(contacts.created_at) = 2016)'
        ).toBe(builder.toSql());
        expect(['admin']).toEqual(builder.getBindings());
    });

    it('Works Joins With Subquery Condition', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .leftJoin('contacts', join => {
                join.on('users.id', 'contacts.id').whereIn('contact_type_id', function (query) {
                    query.select('id').from('contact_types').where('category_id', '1').whereNull('deleted_at');
                });
            });
        expect(
            'select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and "contact_type_id" in (select "id" from "contact_types" where "category_id" = ? and "deleted_at" is null)'
        ).toBe(builder.toSql());
        expect(['1']).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .leftJoin('contacts', join => {
                join.on('users.id', 'contacts.id').whereExists(function (query) {
                    query
                        .selectRaw('1')
                        .from('contact_types')
                        .whereRaw('contact_types.id = contacts.contact_type_id')
                        .where('category_id', '1')
                        .whereNull('deleted_at');
                });
            });
        expect(
            'select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and exists (select 1 from "contact_types" where contact_types.id = contacts.contact_type_id and "category_id" = ? and "deleted_at" is null)'
        ).toBe(builder.toSql());
        expect(['1']).toEqual(builder.getBindings());
    });

    it('Works Joins With Advanced Subquery Condition', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .leftJoin('contacts', join => {
                join.on('users.id', 'contacts.id').whereExists(query => {
                    query
                        .selectRaw('1')
                        .from('contact_types')
                        .whereRaw('contact_types.id = contacts.contact_type_id')
                        .where('category_id', '1')
                        .whereNull('deleted_at')
                        .whereIn('level_id', function (query) {
                            query.select('id').from('levels').where('is_active', true);
                        });
                });
            });
        expect(
            'select * from "users" left join "contacts" on "users"."id" = "contacts"."id" and exists (select 1 from "contact_types" where contact_types.id = contacts.contact_type_id and "category_id" = ? and "deleted_at" is null and "level_id" in (select "id" from "levels" where "is_active" = ?))'
        ).toBe(builder.toSql());
        expect(['1', true]).toEqual(builder.getBindings());
    });

    it('Works Joins With Nested Joins', () => {
        const builder = getBuilder();
        builder
            .select('users.id', 'contacts.id', 'contact_types.id')
            .from('users')
            .leftJoin('contacts', join => {
                join.on('users.id', 'contacts.id').join(
                    'contact_types',
                    'contacts.contact_type_id',
                    '=',
                    'contact_types.id'
                );
            });
        expect(
            'select "users"."id", "contacts"."id", "contact_types"."id" from "users" left join ("contacts" inner join "contact_types" on "contacts"."contact_type_id" = "contact_types"."id") on "users"."id" = "contacts"."id"'
        ).toBe(builder.toSql());
    });

    it('Works Joins With Multiple Nested Joins', () => {
        const builder = getBuilder();
        builder
            .select('users.id', 'contacts.id', 'contact_types.id', 'countrys.id', 'planets.id')
            .from('users')
            .leftJoin('contacts', join => {
                join.on('users.id', 'contacts.id')
                    .join('contact_types', 'contacts.contact_type_id', '=', 'contact_types.id')
                    .leftJoin('countrys', query => {
                        query.on('contacts.country', '=', 'countrys.country').join('planets', query => {
                            query
                                .on('countrys.planet_id', '=', 'planet.id')
                                .where('planet.is_settled', '=', 1)
                                .where('planet.population', '>=', 10000);
                        });
                    });
            });
        expect(
            'select "users"."id", "contacts"."id", "contact_types"."id", "countrys"."id", "planets"."id" from "users" left join ("contacts" inner join "contact_types" on "contacts"."contact_type_id" = "contact_types"."id" left join ("countrys" inner join "planets" on "countrys"."planet_id" = "planet"."id" and "planet"."is_settled" = ? and "planet"."population" >= ?) on "contacts"."country" = "countrys"."country") on "users"."id" = "contacts"."id"'
        ).toBe(builder.toSql());
        expect([1, 10000]).toEqual(builder.getBindings());
    });

    it('Works Joins With Nested Join With Advanced Subquery Condition', () => {
        const builder = getBuilder();
        builder
            .select('users.id', 'contacts.id', 'contact_types.id')
            .from('users')
            .leftJoin('contacts', join => {
                join.on('users.id', 'contacts.id')
                    .join('contact_types', 'contacts.contact_type_id', '=', 'contact_types.id')
                    .whereExists(query => {
                        query
                            .select('*')
                            .from('countrys')
                            .whereColumn('contacts.country', '=', 'countrys.country')
                            .join('planets', query => {
                                query.on('countrys.planet_id', '=', 'planet.id').where('planet.is_settled', '=', 1);
                            })
                            .where('planet.population', '>=', 10000);
                    });
            });
        expect(
            'select "users"."id", "contacts"."id", "contact_types"."id" from "users" left join ("contacts" inner join "contact_types" on "contacts"."contact_type_id" = "contact_types"."id") on "users"."id" = "contacts"."id" and exists (select * from "countrys" inner join "planets" on "countrys"."planet_id" = "planet"."id" and "planet"."is_settled" = ? where "contacts"."country" = "countrys"."country" and "planet"."population" >= ?)'
        ).toBe(builder.toSql());
        expect([1, 10000]).toEqual(builder.getBindings());
    });

    it('Works Join Sub', () => {
        let builder = getBuilder();
        builder.from('users').joinSub('select * from "contacts"', 'sub', 'users.id', '=', 'sub.id');
        expect(
            'select * from "users" inner join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder.from('users').joinSub(
            query => {
                query.from('contacts');
            },
            'sub',
            'users.id',
            '=',
            'sub.id'
        );
        expect(
            'select * from "users" inner join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"'
        ).toBe(builder.toSql());

        builder = getBuilder();
        const sub1 = getBuilder().from('contacts').where('name', 'foo');
        const sub2 = getBuilder().from('contacts').where('name', 'bar');
        builder
            .from('users')
            .joinWhereSub(sub1, 'sub1', 'users.id', '=', 1, 'inner')
            .joinSub(sub2, 'sub2', 'users.id', '=', 'sub2.user_id');
        let expected = 'select * from "users" ';
        expected += 'inner join (select * from "contacts" where "name" = ?) as "sub1" on "users"."id" = ? ';
        expected +=
            'inner join (select * from "contacts" where "name" = ?) as "sub2" on "users"."id" = "sub2"."user_id"';
        expect(expected).toEqual(builder.toSql());
        expect(['foo', 1, 'bar']).toEqual(builder.getRawBindings().join);

        builder = getBuilder();
        expect(() => {
            // @ts-expect-error test wrong argument
            builder.from('users').joinSub(['foo'], 'sub', 'users.id', '=', 'sub.id');
        }).toThrowError('A subquery must be a query builder instance, a Closure, or a string.');
    });

    it('Works Join Sub With Prefix', () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.from('users').joinSub('select * from "contacts"', 'sub', 'users.id', '=', 'sub.id');
        expect(
            'select * from "prefix_users" inner join (select * from "contacts") as "prefix_sub" on "prefix_users"."id" = "prefix_sub"."id"'
        ).toBe(builder.toSql());
    });

    it('Works Left Join Sub', () => {
        let builder = getBuilder();
        builder.from('users').leftJoinSub(getBuilder().from('contacts'), 'sub', 'users.id', '=', 'sub.id');
        expect('select * from "users" left join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"').toBe(
            builder.toSql()
        );

        builder = getBuilder();
        expect(() => {
            // @ts-expect-error test wrong argument
            builder.from('users').leftJoinSub(['foo'], 'sub', 'users.id', '=', 'sub.id');
        }).toThrowError('A subquery must be a query builder instance, a Closure, or a string.');
    });

    it('Works Right Join Sub', () => {
        let builder = getBuilder();
        builder.from('users').rightJoinSub(getBuilder().from('contacts'), 'sub', 'users.id', '=', 'sub.id');
        expect(
            'select * from "users" right join (select * from "contacts") as "sub" on "users"."id" = "sub"."id"'
        ).toBe(builder.toSql());

        builder = getBuilder();
        expect(() => {
            // @ts-expect-error test wrong argument
            builder.from('users').rightJoinSub(['foo'], 'sub', 'users.id', '=', 'sub.id');
        }).toThrowError('A subquery must be a query builder instance, a Closure, or a string.');
    });
});

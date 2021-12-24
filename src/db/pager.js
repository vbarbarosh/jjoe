import {KNEX_QUERY_LIMIT} from './index';
import {KNEX_QUERY_OFFSET} from './index';

async function pager(query, items)
{
    const total = await query.clone().offset(0).count().then(v => v[0]['count(*)']);
    const limit = query[KNEX_QUERY_LIMIT];
    const offset = query[KNEX_QUERY_OFFSET];
    return {total, limit, offset, items: await items};
}

export default pager;

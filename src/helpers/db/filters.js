import {KNEX_QUERY_LIMIT} from '.';
import {KNEX_QUERY_OFFSET} from '.';

function filters(input, query, dic)
{
    const limit = Math.min(100, parseInt(input.limit, 10) || 100);
    const offset = Math.max(0, parseInt(input.offset, 10) || 0);
    query.limit(limit);
    query.offset(offset);
    query[KNEX_QUERY_LIMIT] = limit;
    query[KNEX_QUERY_OFFSET] = offset;
    return query;
}

export default filters;

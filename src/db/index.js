import knex from 'knex';

// Knex doesn't allow to query current value for `limit`, and `offset`.
const KNEX_QUERY_LIMIT = '__KNEX_QUERY_LIMIT';
const KNEX_QUERY_OFFSET = '__KNEX_QUERY_OFFSET';

const db = knex({client: 'mysql2', connection: 'mysql://jsonstory:jsonstory@127.0.0.1:3306/jsonstory'});

export default db;
export {KNEX_QUERY_LIMIT, KNEX_QUERY_OFFSET};

import cli from '@vbarbarosh/node-helpers/src/cli';
import express from 'express';
import express_routes from '@vbarbarosh/express-helpers/src/express_routes';
import express_run from '@vbarbarosh/express-helpers/src/express_run';
import fs_path_resolve from '@vbarbarosh/node-helpers/src/fs_path_resolve';
import knex from 'knex';
import array_index from '@vbarbarosh/node-helpers/src/array_index';

const db = knex({client: 'mysql2', connection: 'mysql://jsonstory:jsonstory@127.0.0.1:3306/jsonstory'});
const started = new Date();

cli(main);

async function main()
{
    const app = express();

    app.use(express.static(fs_path_resolve(__dirname, 'public')));

    express_routes(app, [
        {req: 'GET /api/v1/updates.json', fn: updates_list},
        {req: 'GET /api/v1/items.json', fn: items_list},
        {req: 'GET /api/v1/diffs.json', fn: diffs_list},
        {req: 'ALL *', fn: page404},
    ]);

    await express_run(app, 3000, '0.0.0.0');
}

async function updates_list(req, res)
{
    res.json(await db('updates').then(strip_ids));
}

async function items_list(req, res)
{
    res.json(await db('items').then(strip_ids));
}

async function diffs_list(req, res)
{
    res.json(await db('diffs').then(prep_diffs));
}

async function page404(req, res)
{
    res.status(404).send(`Page not found: ${req.path}`);
}

async function prep_diffs(diffs)
{
    const items_map = array_index(await db('items').whereIn('id', diffs.map(v => v.item_id)), v => v.id);
    const updates_map = array_index(await db('updates').whereIn('id', diffs.map(v => v.update_id)), v => v.id);
    return JSON.parse(JSON.stringify(diffs)).map(function (diff) {
        diff.item_uid = items_map[diff.item_id].uid;
        diff.update_uid = updates_map[diff.update_id].uid;
        delete diff.id;
        delete diff.item_id;
        delete diff.update_id;
        return diff;
    });
}

function strip_ids(items)
{
    return JSON.parse(JSON.stringify(items)).map(function (item) {
        delete item.id;
        return item;
    });
}

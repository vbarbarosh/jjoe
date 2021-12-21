import cli from '@vbarbarosh/node-helpers/src/cli';
import express from 'express';
import express_routes from '@vbarbarosh/express-helpers/src/express_routes';
import express_run from '@vbarbarosh/express-helpers/src/express_run';
import fs_path_basename from '@vbarbarosh/node-helpers/src/fs_path_basename';
import fs_path_resolve from '@vbarbarosh/node-helpers/src/fs_path_resolve';
import fs_rm from '@vbarbarosh/node-helpers/src/fs_rm';
import fs_write_stream from '@vbarbarosh/node-helpers/src/fs_write_stream';
import knex from 'knex';
import stream_promise from '@vbarbarosh/node-helpers/src/stream_promise';

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
    res.json(await db('diffs').then(strip_ids));
}

async function page404(req, res)
{
    res.status(404).send(`Page not found: ${req.path}`);
}

function strip_ids(items)
{
    return JSON.parse(JSON.stringify(items)).map(function (item) {
        delete item.id;
        return item;
    });
}

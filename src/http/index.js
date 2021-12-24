import array_group_map from '@vbarbarosh/node-helpers/src/array_group_map';
import array_index from '@vbarbarosh/node-helpers/src/array_index';
import cli from '@vbarbarosh/node-helpers/src/cli';
import db from '../db';
import express from 'express';
import express_routes from '@vbarbarosh/express-helpers/src/express_routes';
import express_run from '@vbarbarosh/express-helpers/src/express_run';
import filters from '../db/filters';
import fs_path_resolve from '@vbarbarosh/node-helpers/src/fs_path_resolve';
import pager from '../db/pager';

const started = new Date();

cli(main);

async function main()
{
    const app = express();

    app.use(express.static(fs_path_resolve(__dirname, 'public')));

    express_routes(app, [
        {req: 'GET /api/v1/updates.json', fn: api_updates_list},
        {req: 'GET /api/v1/items.json', fn: api_items_list},
        {req: 'GET /api/v1/diffs.json', fn: api_diffs_list},
        {req: 'ALL *', fn: page404},
    ]);

    await express_run(app, 3000, '0.0.0.0');
}

async function page404(req, res)
{
    res.status(404).send(`Page not found: ${req.path}`);
}

async function api_updates_list(req, res)
{
    const q = filters(req.query, db('updates').orderBy('id').limit(500));
    res.json(await pager(q, frontend_updates(q)));
}

async function api_items_list(req, res)
{
    const q = filters(req.query, db('items').orderBy('id').limit(500));
    res.json(await pager(q, frontend_items(q)));
}

async function api_diffs_list(req, res)
{
    const q = filters(req.query, db('diffs').orderBy('id').limit(500));
    res.json(await pager(q, frontend_diffs(q)));
}

async function frontend_items(query)
{
    const items = await query;
    const ids = items.map(v => v.id);
    const diffs_prep = await frontend_diffs(db('diffs').whereIn('item_id', ids));
    const diffs_prep_map = array_group_map(diffs_prep, v => v.item_uid);
    return items.map(function (item) {
        return {
            uid: item.uid,
            value: item.value,
            created_at: item.created_at,
            updated_at: item.updated_at,
            diffs: diffs_prep_map[item.uid] ? diffs_prep_map[item.uid].items : [],
        };
    });
}

async function frontend_updates(query)
{
    const updates = await query;

    const ids = updates.map(v => v.id);
    const [tmp] = await db.raw(`
        SELECT
            update_id,
            COUNT(*) AS diffs_count
        FROM
            diffs
        WHERE
            update_id IN (${ids.slice().fill('?')})
        GROUP BY
            update_id
    `, ids);
    const diffs_count = {};
    tmp.forEach(v => diffs_count[v.update_id] = v.diffs_count);
    return updates.map(function (update) {
        return {
            uid: update.uid,
            title: update.title,
            total: update.total,
            broken: update.broken,
            inserted: update.inserted,
            updated: update.updated,
            error: update.error,
            created_at: update.created_at,
            updated_at: update.updated_at,
            started_at: update.started_at,
            finished_at: update.finished_at,
            diffs_count: diffs_count[update.id] || 0,
        };
    });
}

async function frontend_diffs(query)
{
    const diffs = await query;
    const items_map = array_index(await db('items').whereIn('id', diffs.map(v => v.item_id)), v => v.id);
    const updates_map = array_index(await db('updates').whereIn('id', diffs.map(v => v.update_id)), v => v.id);
    return diffs.map(function (diff) {
        return {
            uid: diff.uid,
            diff: diff.diff,
            created_at: diff.created_at,
            item_uid: items_map[diff.item_id].uid,
            update_uid: updates_map[diff.update_id].uid,
        };
    });
}

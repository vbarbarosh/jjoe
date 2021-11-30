// noinspection EqualityComparisonWithCoercionJS

import * as jsondiffpatch from 'jsondiffpatch';
import Promise from 'bluebird';
import array_chunk from '@vbarbarosh/node-helpers/src/array_chunk';
import array_index from '@vbarbarosh/node-helpers/src/array_index';
import assert from 'assert';
import crypto_hash_sha256 from '@vbarbarosh/node-helpers/src/crypto_hash_sha256';
import cuid from 'cuid';
import format_bytes_kb from './helpers/format_bytes_kb';
import format_ms_human from './helpers/format_ms_human';
import json_stringify_stable from 'json-stable-stringify';
import knex from 'knex';
import progress_begin from './helpers/progress_begin';
import progress_render from './helpers/progress_render';
import progress_update from './helpers/progress_update';

const db = knex({client: 'mysql2', connection: 'mysql://jjoe:jjoe@127.0.0.1:3306/jjoe'});
const started = new Date();

Promise.resolve(main()).finally(() => db.destroy());

async function main()
{
    // Fetch uids before making any inserts.
    const uids_prev_map = await step1_fetch_uids();
    const uids_next_map = {};
    const stat = {
        total: 0,
        broken: 0,
        inserted: 0,
        updated: 0,
        removed: 0,
    };

    const uid = cuid();
    const now = new Date();
    await db('updates').insert({uid, title: 'Started', created_at: now, updated_at: now, started_at: now});
    const update = await db('updates').where('uid', uid).first();

    try {
        let time0 = null;
        let progress = null;
        const buf1 = [];
        const buf2 = [];
        await stream_data_ln(process.stdin, async function (line) {
            if (!progress) {
                log(`Processing...`);
                time0 = new Date();
                progress = progress_begin(parseInt(line));
                return;
            }
            stat.total++;
            const item = JSON.parse(line);
            if (!item.uid) {
                log(`Warning: missing uid: ${JSON.stringify(line)}`);
                stat.broken++;
                return;
            }
            if (!('value' in item)) {
                log(`Warning: missing value: ${JSON.stringify(line)}`);
                stat.broken++;
                return;
            }
            buf1.push(item);
            if (buf1.length >= 500) {
                buf2.push(...await step2_1_diff(buf1, uids_prev_map, uids_next_map));
                if (buf2.length >= 25*50) {
                    await step2_2_upsert(buf2.splice(0), update.id, stat);
                }
                progress_update(progress, buf1.length);
                if (Date.now() - time0 >= 1000) {
                    log(`Processing: ${progress_render(progress)}; ${stat.inserted}/${stat.updated}/${stat.removed}`);
                    time0 = Date.now();
                }
                buf1.splice(0);
            }
        });
        if (buf1.length) {
            buf2.push(...await step2_1_diff(buf1, uids_prev_map, uids_next_map));
            if (buf2.length) {
                await step2_2_upsert(buf2, update.id, stat, 1);
            }
            progress_update(progress, buf1.length);
            buf1.splice(0);
            buf2.splice(0);
        }
        log(`Processing: ${progress_render(progress)}; ${stat.inserted}/${stat.updated}/${stat.removed}`);
        const uids_remove = Object.keys(uids_prev_map).filter(v => !uids_next_map[v]);
        await step3_remove(uids_remove, stat);
        await db('updates').where('id', update.id).update({
            title: 'Done',
            updated_at: new Date(),
            finished_at: new Date(),
            ...stat,
        });
    }
    catch (error) {
        log(`Error: ${JSON.stringify(error.message)}`);
        await db('updates').where('id', update.id).update({
            title: 'Failed',
            error: error.message.substr(0, 2048) + '\n[...]\n' +  error.message.substr(-1024),
            updated_at: new Date(),
            finished_at: new Date(),
            ...stat,
        });
    }
    log(`Done ${JSON.stringify(stat)}`);
}

async function step1_fetch_uids()
{
    log(`Fetching uids...`);

    let time0 = Date.now();
    const progress = progress_begin();
    const out = {};
    for (let it = 0, id = 0; true; ++it) {
        if (it == 100000) {
            throw new Error('Too many iterations');
        }
        const results = await db('items').orderBy('id').limit(10000).where('id', '>', id).select(['id', 'uid', 'hash']);
        if (results.length == 0) {
            break;
        }
        results.forEach(function (result) {
            id = result.id;
            out[result.uid] = result.hash;
        });
        progress_update(progress, results.length);
        if (Date.now() - time0 >= 1000) {
            log(`Fetching uids: ${progress_render(progress)}`);
            time0 = Date.now();
        }
    }

    log(`Fetching uids: ${progress_render(progress)}`);
    return out;
}

async function step2_1_diff(items, hashes_prev, hashes_next)
{
    return items.filter(function (item) {
        return hashes_prev[item.uid] != (hashes_next[item.uid] = item.hash = render_hash(item.value));
    });
}

async function step2_2_upsert(items, update_id, stat)
{
    const from_db = array_index(await db('items').whereIn('uid', items.map(v => v.uid)), v => v.uid);
    const insert_items = [];
    const update_items = [];
    const insert_diffs = [];
    items.forEach(function (item) {
        const prev = from_db[item.uid];
        if (prev) {
            const diff = jsondiffpatch.diff(prev.value, item.value);
            update_items.push({
                id: prev.id,
                uid: item.uid, // Field 'uid' doesn't have a default value: insert into `items` (`hash`, `id`, `updated_at`, `value`) values (...
                hash: item.hash,
                value: JSON.stringify(item.value),
                created_at: new Date(), // Field 'created_at' doesn't have a default value
                updated_at: new Date(),
            });
            insert_diffs.push({
                item_id: prev.id,
                update_id,
                diff: JSON.stringify(diff),
                created_at: new Date(),
            });
        }
        else {
            insert_items.push({
                uid: item.uid,
                hash: item.hash,
                value: JSON.stringify(item.value),
                created_at: new Date(),
                updated_at: new Date(),
            });
        }
    });
    assert(update_items.length == insert_diffs.length);
    if (insert_items.length) {
        await db('items').insert(insert_items);
        stat.inserted += insert_items.length;
    }
    if (update_items.length) {
        await db('items').insert(update_items).onConflict().merge(['hash', 'value', 'updated_at']);
        stat.updated += update_items.length;
    }
    if (insert_diffs.length) {
        await db('diffs').insert(insert_diffs);
    }
}

async function step3_remove(uids, stat)
{
    log('Removing...');
    const progress = progress_begin(uids.length);
    const chunks = array_chunk(uids, 1000);
    let time0 = new Date();
    let removed = 0;
    for (let i = 0, end = chunks.length; i < end; ++i) {
        const ids = await db('items').whereIn('uid', chunks[i]).pluck('id');
        await db('diffs').whereIn('item_id', ids).del();
        stat.removed = (removed += await db('items').whereIn('id', ids).del());
        progress_update(progress, ids.length);
        if (Date.now() - time0 >= 1000) {
            log(`Removing: ${progress_render(progress)}`);
            time0 = Date.now();
        }
    }
    log(`Removing: ${progress_render(progress)}`);
    assert(removed == uids.length);
}

function render_hash(value)
{
    return crypto_hash_sha256(json_stringify_stable(value)).toString('base64');
}

function log(line)
{
    const elapsed = Date.now() - started.getTime();
    process.stderr.write(`[${format_ms_human(elapsed)}][${format_bytes_kb(process.memoryUsage().heapUsed).padStart(5, ' ')}] ${line}\n`);
}

async function stream_data_ln(stream, fn)
{
    let utf8 = '';
    let busy = 0;
    let failed = false;
    let finished = false;
    return new Promise(function (resolve, reject) {
        stream.on('data', data);
        stream.on('end', end);
        stream.on('error', reject);
        async function end() {
            stream.off('data', data);
            stream.off('end', end);
            finished = true;
            if (!busy) {
                if (utf8) {
                    await fn(utf8, true);
                }
                resolve();
            }
        }
        async function data(buffer) {
            if (failed) {
                log('Warning: stream_data_ln failed, ignoring');
                return;
            }
            busy++;
            stream.pause();
            try {
                utf8 += buffer.toString('utf8');
                for (let iteration = 1; true; ++iteration) {
                    if (iteration == 1000000) {
                        throw new Error('Too many iterations');
                    }
                    const i = utf8.indexOf('\n');
                    if (i == -1) {
                        break;
                    }
                    const line = utf8.substr(0, i);
                    utf8 = utf8.substr(i + 1);
                    await fn(line, false);
                }
            }
            catch (error) {
                failed = true;
                reject(error);
            }
            finally {
                busy--;
                if (!failed) {
                    stream.resume();
                }
            }
            if (finished) {
                if (utf8) {
                    await fn(utf8, true);
                }
                resolve();
            }
        }
    });
}

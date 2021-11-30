import cli from '@vbarbarosh/node-helpers/src/cli';
import http_get_json from '@vbarbarosh/node-helpers/src/http_get_json';

cli(main);

async function main()
{
    const items = await http_get_json('https://dev.to/api/listings');
    process.stdout.write(`${items.length}\n`);
    items.forEach(v => process.stdout.write(`${JSON.stringify({uid: v.id, value: v})}\n`));
}

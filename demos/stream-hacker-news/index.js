import cli from '@vbarbarosh/node-helpers/src/cli';
import puppeteer from 'puppeteer';

cli(main);

async function main()
{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://news.ycombinator.com/');
    const items = await page.evaluate(function () {
        return Array.from(document.querySelectorAll('.athing')).map(function (elem) {
            return {
                id: elem.id,
                title: elem.querySelector('.titlelink').innerText,
                url: elem.querySelector('.titlelink').href,
                score: parseInt((elem.nextSibling.querySelector('[id^=score_]')||{}).innerText) || null,
                age: elem.nextSibling.querySelector('.age').title,
                user: (elem.nextSibling.querySelector('.hnuser')||{}).innerText || null,
                comments: parseInt((elem.nextSibling.querySelector('.subtext > a:last-of-type')).innerText) || null,
            };
        });
    });
    await browser.close();
    process.stdout.write(`${items.length}\n`);
    items.forEach(v => process.stdout.write(`${JSON.stringify({uid: v.id, value: v})}\n`));
}

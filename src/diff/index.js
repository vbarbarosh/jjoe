import * as jsondiffpatch from 'jsondiffpatch';
import cli from '@vbarbarosh/node-helpers/src/cli';
import fs_read_utf8 from '@vbarbarosh/node-helpers/src/fs_read_utf8';

cli(main);

// Given two jsonstory-streams, display diff between them
async function main()
{
    if (process.argv.length != 4) {
        process.stderr.write('usage: jsonstory-diff /path/to/left.json /path/to/right.json\n');
        process.exit(1);
    }

    const left_buffer = await fs_read_utf8(process.argv[2]);
    const right_buffer = await fs_read_utf8(process.argv[3]);
    const [left_total, ...left_lines] = left_buffer.split('\n').filter(v => v);
    const [right_total, ...right_lines] = right_buffer.split('\n').filter(v => v);
    const left = {};
    const right = {};
    left_lines.forEach(function (line) {
        const json = JSON.parse(line);
        left[json.uid] = json.value;
    });
    right_lines.forEach(function (line) {
        const json = JSON.parse(line);
        right[json.uid] = json.value;
    });

    // node_modules/jsondiffpatch/dist/jsondiffpatch.cjs.js
    // - pieceOutput.text = piece.slice(1);
    // + pieceOutput.text = decodeURI(piece.slice(1));
    const parseTextDiff = jsondiffpatch.console.default.prototype.parseTextDiff.toString().replace('pieceOutput.text = piece.slice(1)', 'pieceOutput.text = decodeURI(piece.slice(1))');
    jsondiffpatch.console.default.prototype.parseTextDiff = new Function(`return ${parseTextDiff}`)();

    jsondiffpatch.console.log(jsondiffpatch.diff(left, right));
}

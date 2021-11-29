function progress_render(progress)
{
    const begin = progress.begin.getTime();
    const end = Date.now();
    const total_ms = end - begin;
    const total_done = progress.history.reduce((a,v) => a + v.delta, 0);
    if (progress.expected) {
        const remained_ms = (progress.expected - total_done) * (total_ms/total_done);
        return `${render_thousands(total_done)} of ${render_thousands(progress.expected)} (${(total_done/progress.expected*100).toFixed(2)}%) [${render_ms(total_ms)}] ~${(total_done/total_ms*1000).toFixed(0)}/sec ~[${render_ms(remained_ms)}]`;
    }
    return `${render_thousands(total_done)} of ~ [${render_ms(total_ms)}] ~${(total_done/total_ms*1000).toFixed(0)}/sec`;
}

function render_ms(ms)
{
    const s = Math.floor(ms/1000 % 60);
    const m = Math.floor(ms/1000 / 60);
    return `0${m}:0${s}`.replace(/0(\d\d)/g, '$1');
}

// https://stackoverflow.com/a/2901298
function render_thousands(x)
{
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default progress_render;

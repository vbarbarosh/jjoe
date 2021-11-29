function format_ms_human(ms)
{
    const s = Math.floor(ms/1000 % 60);
    const m = Math.floor(ms/1000 / 60);
    return `0${m}:0${s}`.replace(/0(\d\d)/g, '$1');
}

export default format_ms_human;

import bytes from 'bytes';

function format_bytes_kb(n)
{
    return bytes.format(n, {thousandsSeparator: ',', decimalPlaces: n > 1024*1024*1024 ? 2 : 0});
}

export default format_bytes_kb;

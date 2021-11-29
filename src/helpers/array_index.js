function array_index(array, fn)
{
    const out = {};
    array.forEach((v,i) => out[fn(v, i, array, out)] = v);
    return out;
}

export default array_index;

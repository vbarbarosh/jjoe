function progress_begin(expected = null)
{
    return {expected, begin: new Date(), history: []};
}

export default progress_begin;

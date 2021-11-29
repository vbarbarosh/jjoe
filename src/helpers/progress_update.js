function progress_update(progress, delta)
{
    progress.history.push({delta, date: new Date()});
}

export default progress_update;

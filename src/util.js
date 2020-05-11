function extractStart(html)
{
    html = html.replace(new RegExp(' ', 'g'), '').replace(new RegExp('\n', 'g'), '');

    let from = "Start(";
    let to = ")}catch";
    return asJSON(html.substring(html.indexOf(from) + from.length, html.indexOf(to)));
}

function asJSON(json)
{
    return JSON.parse(json.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ').replace(new RegExp("'", 'g'), '"'));
}

const sectors =
{
    GEII: "DUT 1 Génie Electrique et Informatique Industrielle - Temps plein (FI)"
};


module.exports = {
    extractStart,
    asJSON,
    sectors
};

const config = require('./config.json');

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

function getDate(week,day){
    date = new Date(config.classes.begin_date);
    date = date.addWeeks(week-1);
    date = date.addDays(day);
    return date.getMonth()+1 + "-" + date.getDate()
}


Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.addWeeks = function(weeks) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + weeks*7);
    return date;
}

Date.prototype.addMonths = function(months) {
    var date = new Date(this.valueOf());
    date.setMonth(date.getMonth() + months);
    return date;
}

const sectors =
{
    GEII: "DUT 1 Génie Electrique et Informatique Industrielle - Temps plein (FI)"
};


module.exports = {
    extractStart,
    asJSON,
    getDate,
    sectors
};

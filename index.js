const fs = require('fs');
const db = require('./src/database');
const pronote = require('./src/pronote');
const sectors = require('./src/util').sectors;

(async function main(week)
{
    await pronote.getWeek(sectors.GEII, week)
    .then((ret)=>
    {
        let data = db.ParseData(ret);
        db.StoreData(sectors.GEII, data, week);
    });

    if (week < 52)
        setTimeout(main, 1000, week + 1);
})(1);
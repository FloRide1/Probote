const config = require('./src/config.json');
const sectors = require("./src/util").sectors;
const db = require('./src/database');
const pronote = require("./src/pronote");

(async function main(i)
{
    await pronote.getWeek(sectors.GEII, i)
    .then(ret =>
    {
        data = db.ParseData(ret);
        db.StoreData("<DUT 1 GEII - Temps plein>",data,i);
    })
    .catch(err =>
    {
        console.error(err);       
    });

    if (i < 53)
        setTimeout(main, 1000, i+1);
})(1);
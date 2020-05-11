const pronote = require('./src/pronote');
const sectors = require('./src/util').sectors;

// Il faut que le code soit exécuté dans une fonction asynchrone pour que l'init se fasse correctement.
(async function()
{

    await pronote.getWeek(sectors.GEII, 39)
    .then(ret =>
    {
        console.log(ret);
    })
    .catch(err =>
    {
        console.error(err);
    });


    

    // await pronote.getWeek(sectors.GEII, 12)
    // .then(ret =>
    // {
    //     console.log(ret);
    // })
    // .catch(err =>
    // {
    //     console.error(err);
    // });

    // await pronote.getWeek(sectors.GEII, 29)
    // .then(ret =>
    // {
    //     console.log(ret);
    // })
    // .catch(err =>
    // {
    //     console.error(err);
    // });


})();
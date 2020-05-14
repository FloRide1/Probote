const request = require('./request');
const cipher = require('./cipher');
const util = require('./util');
const config = require("./config.json");

const state = 
{
    init: false
};

const data = 
{
    session: null
};

async function init(url)
{
    if (!url)
    {
        throw new Error('Bad request');
    }

    console.log(`Connection to ${url}...`);

    let html = await request.http({
        url: url + 'invite?login=true',
        method: 'GET'
    });

    let params = util.extractStart(html);

    let session = cipher.createSession();

    cipher.init({
        session,

        modulo: params.MR,
        exposant: params.ER,
        noCompress: params.sCoA
    });

    await request.initPronote({
        session,

        url,
        espace: params.a,
        sessionID: params.i,
        noAES: params.sCrA
    });

    await request.pronote({
        session,

        name: 'FonctionParametres',
        content: {
            donnees: {
                Uuid: cipher.getUUID(session)
            }
        }
    });
    await request.pronote({
        session,

        name: 'DemandeParametreUtilisateur',
        content: {}
    });

    await request.pronote({
        session,

        name: 'FonctionRenvoyerListeDeRessource',
        content: {
            "_Signature_":
            {
                "Onglet":"DIPLOME.EDT.EDT_GRILLE"
            },
            "donnees":
            {
                "GenreRessource":1,
                "GenreRecherche":2,
                "AvecPublicationForcee":false,
                "NomRessource":"",
                "PourEmail":false,
                "PourRessource":false,
                "filtresRessource":[]
            }
        }
    })
    .then((ret) =>
    {
        ret.donneesSec.donnees.ListeRessources.Liste.forEach((ressource) =>
        {
            data[ressource.L] = ressource.N;
        });
    });

    state.init = true;

    data.session = session;
    
    return true;    
}

async function getWeek(sector, week)
{
    //week = (week <= 33) ? week + 19 : week - 33;


    if (!state.init)
        await init(config.url);

    let session = data.session;

    console.log(`Fetching data for ${sector}\tWeek : ${week}`);
    let ret = await request.pronote({
        session,

        name: 'FonctionEmploiDuTemps',
        content: {
            "_Signature_":
            {
                "Onglet":"DIPLOME.EDT.EDT_LISTE",
                "Recherche":
                {
                    "N":data[sector],
                    "G":1,
                    "L":sector
                }
            },
            "donnees":
            {
                "GenrePeriodeEDT":2,
                "GenreAffichageEDT":1,
                "FiltreRessources":
                {
                    "_T":26,
                    "V":"[0,6..7]"
                },
                "AvecIndisponibilites":false,
                "AvecDomaineCours":true,
                "AvecDomainePere":false,
                "filterPlagesHoraires":false,
                "Domaine":
                {
                    "_T":8,
                    "V":`[${week}]`
                }
            }
        }
    });

    data.session = session;
    return ret;
}


module.exports = 
{ 
    init,
    getWeek
};

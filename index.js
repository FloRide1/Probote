const fs = require('fs');
const config = require('./src/config.json');

function main(){
    //data = fs.readFileSync("./tmp/response.json",{encoding:'utf8', flag:'r'});
    //data = ParseData(data)
    //StoreData("<DUT 1 GEII - Temps plein>",data,39)
}

function StoreData(sectorName,data,week){
    file = fs.readFileSync(config.classes.path,{encoding:'utf8', flag:'r'});
    obj = JSON.parse(file)

    if (obj[sectorName] == undefined){
        obj[sectorName] = {}
        console.log("New sector registered : " + sectorName)
    }
    let sector = obj[sectorName]

    for (let i = 0; i < data.length; i++) {
        let date = getDate(week,i);
        data[i].forEach(element => {
            let groups = element.groups;
            let dayName = element.day%(config.classes.max_time/config.classes.delta_time)
            if (groups.length == 0){

                if (sector[config.classes.rootName] == undefined){
                    sector[config.classes.rootName] = {}
                    console.log("New root registered in sector : " + sectorName)
                }

                let all = sector[config.classes.rootName]
                if (all[date] == undefined){
                    all[date] = []
                }
                tdate = all[date]

                let classe = {
                    hours       : element.hours,
                    day         : dayName,
                    delta       : element.delta,
                    topic       : element.topic,
                    teachers    : element.teachers,
                    rooms       : element.rooms,
                    type        : element.type,
                    motif       : element.motif
                }
                let ispresent = false;
                for (let t = 0; t < tdate.length; t++) {
                    if (tdate[t].day == classe.day && tdate[t].topic == classe.topic){
                        tdate[t] = classe
                        ispresent = true
                    }                                        
                }
                if (!ispresent){
                    tdate.push(classe)
                }

                all[date] = tdate
                sector[config.classes.rootName] = all
            }
            groups.forEach(x => {
                let groupName = x
                if (groupName.indexOf(sectorName) != -1){
                   groupName = groupName.replace(sectorName + " ", "");
                }

                if (sector[groupName] == undefined){
                    sector[groupName] = {}
                    console.log("New groupre registered : " + groupName + " in sector : " + sectorName)
                }

                group = sector[groupName]
                if (group[date] == undefined){
                    group[date] = []
                }
                tdate = group[date]

                let classe = {
                    hours       : element.hours,
                    day         : dayName,
                    delta       : element.delta,
                    topic       : element.topic,
                    teachers    : element.teachers,
                    rooms       : element.rooms,
                    type        : element.type,
                    motif       : element.motif
                }
                let ispresent = false;
                for (let t = 0; t < tdate.length; t++) {
                    if (tdate[t].day == classe.day && tdate[t].topic == classe.topic){
                        tdate[t] = classe
                        ispresent = true
                    }                                        
                }
                if (!ispresent){
                    tdate.push(classe)
                }

                group[date] = tdate
                sector[groupName] = group
            });
        });        
    }
    obj[sectorName] = sector
    fs.writeFileSync(config.classes.path,JSON.stringify(obj))
}


function ParseData(data){
    obj = JSON.parse(data);
    functionName = obj.nom;
    let classes_parse = [[],[],[],[],[],[],[]]
    if (functionName == config.classes.functionName){
        listClasses = obj.donneesSec.donnees.ListeCours
        listAbortedClasses = obj.donneesSec.donnees.ListeAnnulationsCours

        listClasses.forEach(element => {
            var weekIndex = element.G
            let classe = element.listeC
            let day = element.p
            let delta = element.d
            let groups = [];
            classe.forEach(x => {
                let i = x.G;
                let index = config.classes.index;
                
                switch (i) {
                    case index.hours:
                        hours = x.C;
                        break;
                    case index.groups:
                        x.C.forEach(j => {
                            groups.push(j.L)
                        });           
                        break;
                    case index.topic:
                        topic = x.C.L
                        break;
                    case index.teachers:
                        teachers = []
                        x.C.forEach(j => {
                            teachers.push(j.L)
                        });  
                        break;
                    case index.rooms:
                        rooms = []
                        x.C.forEach(j => {
                            rooms.push(j.L)
                        }); 
                        break;
                    case index.type:
                        type = x.C.L
                        break;
                }
            });
            let ratio = config.classes.max_time/config.classes.delta_time;
            let classe_parse = {
                week : weekIndex,
                day : day,
                delta : delta,
                groups : groups,
                hours : hours,
                topic : topic,
                rooms : rooms,
                teachers : teachers,
                type : type
            }
            classes_parse[parseInt(day/ratio,10)%7].push(classe_parse);
        });
        
        listAbortedClasses.forEach(element => {
            var weekIndex = element.G
            let classe = element.listeContenus
            let day = element.p
            let delta = element.d
            let motif = element.motif
            let groups = [];
            classe.forEach(x => {
                let i = x.G;
                let index = config.classes.index;
                
                switch (i) {
                    case index.hours:
                        hours = x.C;
                        break;
                    case index.groups:
                        x.C.forEach(j => {
                            groups.push(j.L)
                        });           
                        break;
                    case index.topic:
                        topic = x.C.L
                        break;
                    case index.teachers:
                        teachers = []
                        x.C.forEach(j => {
                            teachers.push(j.L)
                        });  
                        break;
                    case index.rooms:
                        rooms = []
                        x.C.forEach(j => {
                            rooms.push(j.L)
                        }); 
                        break;
                    case index.type:
                        type = x.C.L
                        break;
                }
            });
            let ratio = config.classes.max_time/config.classes.delta_time;
            let classe_parse = {
                motif: motif,
                week : weekIndex,
                day : day,
                delta : delta,
                groups : groups,
                hours : hours,
                topic : topic,
                rooms : rooms,
                teachers : teachers,
                type : type
            }
            classes_parse[parseInt(day/ratio,10)%7].push(classe_parse);
        });
    }
    return classes_parse;
}

function getDate(week,day){
    date = new Date(config.classes.begin_date)
    date = date.addWeeks(week-1);
    date = date.addDays(day)
    return date.getMonth() + "-" + date.getDate()
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

main()
const puppeteer = require('puppeteer');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
const Discord = require('discord.js')
const config = require('./Files/config');
const bot = new Discord.Client()
bot.login(config.discord.token)


bot.on('ready', function () {
    console.log("- Bot is Ready");
    SaveAllWeek();
})

bot.on('message', message => {
    if (message.content === "!test"){
        
    }
})

async function SaveAllWeek(){
    for (let i = 0; i < 52; i++) {
        await GetWeek(i);
    }
}

async function GetWeek(week_number){
    var browser = await puppeteer.launch();
    var page = await browser.newPage();
    await page.goto(config.url.pronote);
    console.log("- Connection to : " + config.url.pronote)
    actual_url = await page.url()
    if (actual_url == config.url.connection){
        await Connect(page)
    }
    await SelectPronoteContent(page,week_number);
    //await page.screenshot({path: 'pronote.png'});
    var content = await ParsePronote(await page.content(),page,week_number);
    await StoreContent(content.join("\n"),config.file.courses + "/" + week_number + "-Week.txt");
    await browser.close();
}

async function Connect(page){
    console.log("- Authentification Needed")
    await page.keyboard.type(config.user);
    await page.keyboard.press('Tab');
    await page.keyboard.type(config.pass);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    console.log("- Authentification Done")
}

async function SelectPronoteContent(page,week_number){
    console.log("- Get Content n" + week_number)
    await page.waitFor(1500);
    for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
    }
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitFor(1000);
    for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Tab')
    }
    await page.keyboard.press('Enter');
    await page.waitFor(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitFor(500); 
    await page.mouse.click(week_number*775/52+10,120);
    await page.waitFor(500);
    
}

async function StoreContent(content,dirname) {
    console.log('- Store Content');
    fs.writeFile(dirname, content, (err) => {
        if (err) throw err;
        console.log('- Content stored');
    });
}

async function ParsePronote(data,page,week_number){
    console.log("- Parse Content")
    const dom = new JSDOM(data);
    if (data.indexOf("Aucun cours n'a été programmé sur cette période.") == -1){
        Harray = dom.window.document.getElementById("GInterface.Instances[1].Instances[8]_Zone_0");
        if (Harray == null){
            console.log("- Retry");
            return await GetWeek(week_number);
        } else {
            Harray = Harray.getElementsByTagName("tr");
            var parsed = [];
            for (let i = 0; i < Harray.length; i++) {
                var array = []
                var table = Harray[i].getElementsByTagName("td")
                var useless = false;
                for (let j = 0; j < table.length; j++) {
                    var inHtml = table[j].innerHTML;
                    var str = table[j].textContent;
                    if (inHtml.indexOf("Image_EtatAnnule") != -1){
                        str = "A";
                    }
                    for (let k = 0; k < config.parse.useless.length;k++){
                        if (str.indexOf(config.parse.useless[k]) != -1){
                            useless = true;
                        }
                    }
                    for (let k = 0; k < config.parse.remove.length;k++){
                        if (str.indexOf(config.parse.remove[k]) != -1){
                            str = str.split(config.parse.remove[k])[1];
                        }
                    }
                    if (str != ""){
                        array.push(str);
                    } else {
                        useless = true;
                    }
                }
                if (!(useless)){
                    if (array.length == 1){
                        var date = array[0].split(" ")
                        date =  (config.parse.month.indexOf(date[2])+1).toString() + "/" + date[1];
                    } else {
                        array[0] = date;
                        parsed.push(array);
                    }

                }
            }
            console.log("- Parse sucess")
            return parsed;
        }
    } else {
        return ["Pas de cours"];
    }
}
//await page.screenshot({path: 'pronote.png'});




/*
    APP INIT
*/
const fs = require('fs');
const config = require('./src/config.json');
const db = require('./src/database');
const Discord = require('discord.js');
const bot = new Discord.Client();
const bot_token = fs.readFileSync('bot_token', {encoding:'utf8', flag:'r'}).trim();
const emoji = config.emoji;


/*  
    LOGS FUNCTIONS
    INHERITANCES Discord.Message
*/
function log(cmd, user, reply, createdAt)
{
    console.log("\n");
    console.log(`Current date: ${new Date(Date.now())}`);
    console.log(`Cmd created at: ${createdAt}`);
    console.log(`Cmd: ${cmd}`);
    console.log(`Author: ${user}`);
    console.log(`Response: ${reply}`);
}

function logError(err)
{
    console.log("\n");
    console.log(`Current date: ${new Date(Date.now())}`);
    console.error(`An error occured:  ${err.message}`);
}

Discord.Message.prototype.logedReply = function(mess, args)
{
    return new Promise((resolve, reject)=>
    {
        this.reply(mess, args)
        .then((m)=>
        {
            log(this.content, this.author.id, mess.content || mess, this.createdAt);
            resolve(m);
        })
        .catch(reject);
    });
};

Discord.Message.prototype.logedSend = function(mess, args)
{
    return new Promise((resolve, reject)=>
    {
        this.author.send(mess, args)
        .then((m)=>
        {
            log(this.content, this.author.id, mess.content || mess, this.createdAt);
            resolve(m);
        })
        .catch(reject);
    });
};

Discord.Message.prototype.logedToAll = function(mess, args)
{
    return new Promise((resolve, reject)=>
    {
        this.channel.send(mess, args)
        .then((m)=>
        {
            //log(this.content, this.author.id, mess.content || mess, this.createdAt);
            resolve(m);
        })
        .catch(reject);
    });
}



/*
    BOT COMMANDS
*/
const command =
{
    public: 
    {
        help:
        {
            exec: (mess) =>
            {
                let embed = new Discord.MessageEmbed()
                .setTitle('Public commands')
                .setColor(0x08ff10);
                for (let [cmd, obj] of Object.entries(command.public))
                {
                    embed.addField("!"+cmd, obj.desc);
                }

                mess.logedToAll(embed)
                .catch(logError);

                embed = new Discord.MessageEmbed()
                .setTitle('Authentified commands')
                .setColor(0xffb700);
                for (let [cmd, obj] of Object.entries(command.protected))
                {
                    embed.addField("!"+cmd, obj.desc);
                }

                mess.logedToAll(embed)
                .catch(logError);
            },
            desc: "Display this help."
        }
    },

    protected:
    {   
        next: 
        {
            exec: (mess) =>
            {
                let classes = command.private.fetch(mess);
                let current_hour = new Date(Date.now()).getHours();
                let embed = new Discord.MessageEmbed();

                if (classes === undefined)
                {
                    embed.setTitle("Auncun cours");
                    embed.setColor(0x000000);
                }
                else
                {
                    let next_cours = classes[0];
                    for (let cours of classes)
                    {
                        console.log(parseInt(cours.hours));
                        console.log(current_hour);
                        if (parseInt(cours.hours) > current_hour)
                        {
                            console.log("break");
                            next_cours = cours;
                            break;
                        }
                    }
                    embed.setTitle(next_cours.hours);
                    switch (next_cours.type)
                    {
                        case 'TD':
                            embed.setColor(0x07fa3c);
                            break;
                        case 'TP':
                            embed.setColor(0x9d07fa);
                            break;
                        case 'CM':
                            embed.setColor(0xd68e09);
                            break;
                        case 'DS':
                            embed.setColor(0xc90606);
                            break;
                    }
                    if (next_cours.motif == "REPORTE")
                        embed.setColor(0x000000);
                    embed.setDescription(next_cours.topic + "\n" + next_cours.teachers[0] + "\n" + next_cours.type + ((next_cours.motif == "REPORTE") ? " REPORTE" : ""));
                }
                mess.logedToAll(embed)
                .catch(logError);
            },
            desc: "Get the next class."
        },

        today: 
        {
            exec: (mess) =>
            {
                let classes = command.private.fetch(mess);
                
                if (classes === undefined)
                {
                    console.log("undefined");
                    let embed = new Discord.MessageEmbed()
                    .setTitle("Auncun cours")
                    .setColor(0x000000);
                    mess.logedToAll(embed)
                    .catch(logError);
                }
                else
                {
                    for (let cours of classes)
                    {
                        let embed = new Discord.MessageEmbed()
                        .setTitle(cours.hours);
                        switch (cours.type)
                        {
                            case 'TD':
                                embed.setColor(0x07fa3c);
                                break;
                            case 'TP':
                                embed.setColor(0x9d07fa);
                                break;
                            case 'CM':
                                embed.setColor(0xd68e09);
                                break;
                            case 'DS':
                                embed.setColor(0xc90606);
                                break;
                        }
                        if (cours.motif == "REPORTE")
                            embed.setColor(0x000000);
                        embed.setDescription(cours.topic + "\n" + cours.teachers[0] + "\n" + cours.type + ((cours.motif == "REPORTE") ? " REPORTE" : ""));

                        mess.logedToAll(embed)
                        .catch(logError);
                    }
                }
            },
            desc: "Get all classes today."
        },

        changegroup:
        { 
            exec: async (mess) =>
            {
                let sector = db.fetchUserData(mess.author.id)[0];

                let groups = db.listAllGroupFiltered(sector);

                await command.private.mcq(mess, "What is your group ?", groups)
                .then((index)=>
                {
                    db.registreUser(mess.author.id, sector, groups[index]);
                    mess.logedSend(`Successfully changed for group ${groups[index]}`);
                })
                .catch(logError);
            },
            desc: "Change current group."
        }
    },

    private:
    {
        register: async (mess) =>
        {
            return new Promise(async (resolve, reject) =>
            {
                let sectors = db.listAllSectors();

                await command.private.mcq(mess, "What is your sector ?", sectors)
                .then((index)=>
                {
                    return sectors[index];
                })
                .then(async (sector)=>
                {
                    let groups = db.listAllGroupFiltered(sector);

                    await command.private.mcq(mess, "What is your group ?", groups)
                    .then((index)=>
                    {
                        db.registreUser(mess.author.id, sector, groups[index]);
                        resolve([groups[index], sector]);
                    })
                })
                .catch(reject);
            });
        },

        mcq: (message, title, data) =>
        {
            return new Promise((resolve, reject)=>
            {
                const filter = (reac, user) =>
                {
                    return user.id == message.author.id && emoji.slice(0,data.length).indexOf(reac.emoji.name) != -1;
                };

                let content = title;

                for (let i = 0; i < data.length; i++)
                {
                    content += `\n${emoji[i]} ${data[i]}`;
                }

                message.logedSend(content)
                .then((m)=>
                {
                    const collector = m.createReactionCollector(filter, {max:1});

                    collector.on('collect', (reac, user) =>
                    {
                        resolve(emoji.indexOf(reac.emoji.name));
                    });

                    for (let i = 0; i < data.length; i++)
                    {
                        m.react(emoji[i])
                        .catch(reject);
                    }
                })
                .catch(reject);
            });
        },

        fetch: (mess)=>
        {
            let time = new Date(Date.now());
            time = time.getMonth()+1 + "-" + time.getDate();
            let user_data = db.fetchUserData(mess.author.id);
            let classes = [];
            for (let group of user_data[1])
            {
                let cours = db.listAllClasses(user_data[0], group, time);
                if (cours !== undefined)
                {
                    for (let sub_cours of cours)
                    {
                        let c = classes.length;

                        if (!c || parseInt(sub_cours.hours) >= parseInt(classes[c-1].hours))
                            classes.push(sub_cours);
                        else
                        {
                            for (let i = 0; i < c; i++)
                            {
                                if (parseInt(sub_cours.hours) < parseInt(classes[i].hours))
                                {
                                    classes.splice(i, 0, sub_cours);
                                    i = c;
                                }
                            }
                        }
                    }
                }
            }
            return (classes.length) ? classes : undefined;
        }
    }
};



/*
    BOT SETUP
    BOT LOGIN
*/
bot.on('ready', () => 
{
    console.log(`Bot logged in as ${bot.user.tag} at ${new Date(Date.now())}.`);
    bot.channels.cache.forEach(channel=>
    {
        if (channel.type == "text")
        {
            let embed = new Discord.MessageEmbed()
            .setTitle("Hi bitches !")
            .setColor(0xe200f2);
            let message = new Discord.Message(bot, embed, channel);
            message.logedToAll(embed)
            .then((mess)=>
            {
                command.public.help.exec(mess);
            })
            .catch(logError);
        }
    });
});

bot.on('message', async (message) => {
    if (message.content[0] == "!" && message.content[1] != "!" && message.content.length > 1)
    {
        let cmd = message.content.split(/\s+/)[0].substring(1).toLowerCase();
        // let args = message.content.split(/\s+/); args.shift();
        
        if (command.public[cmd] !== undefined)
        {
            command.public[cmd].exec(message);
        }
        else if (command.protected[cmd] !== undefined)
        {
            if (!db.isUserRegistered(message.author.id))
            {
                await command.private['register'](message)
                .then((data)=>
                { 
                    message.logedSend(`Successfully registered in ${data[1]}, ${data[0]}`);
                })
                .catch(logError);
            }
            command.protected[cmd].exec(message);
        }
        else
        {
            message.logedReply({content: `Unknow command : ${cmd}`, code:'js'})
            .catch(logError);
        }
    }
});


bot.login(bot_token);

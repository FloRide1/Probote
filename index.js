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
    console.log(`Current date: ${new Date()}`);
    console.log(`Cmd created at: ${createdAt}`);
    console.log(`Cmd: ${cmd}`);
    console.log(`Author: ${user[0]}, ${user[1]}`);
    console.log(`Response: ${reply}`);
}

function logError(err)
{
    console.log("\n");
    console.log(`Current date: ${new Date()}`);
    console.error(`An error occured:  ${err.message}`);
}

Discord.Message.prototype.logedMessage = function(mess, type, args)
{
    return new Promise((resolve, reject)=>
    {
        let target = (type) ? this.author : this.channel;

        target.send(mess)
        .then((m)=>
        {
            log(this.content, [this.author.id, this.author.username], mess.content || mess, this.createdAt);
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
                let embed_public = new Discord.MessageEmbed()
                .setTitle('Public commands')
                .setColor(0x08ff10);
                for (let [cmd, obj] of Object.entries(command.public))
                {
                    embed_public.addField("!"+cmd, obj.desc);
                }

                let embed_protected = new Discord.MessageEmbed()
                .setTitle('Authentified commands')
                .setColor(0xffb700);
                for (let [cmd, obj] of Object.entries(command.protected))
                {
                    embed_protected.addField("!"+cmd, obj.desc);
                }

                mess.logedMessage(embed_public)
                .catch(logError);
                mess.logedMessage(embed_protected)
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
                let time = new Date();
                let embed = new Discord.MessageEmbed();
                
        		let next_cours = undefined;

        		try
        		{
        			for (let cours of classes)
        			{
        				let cours_time = new Date();
        				cours_time.setHours(parseInt(cours.hours.split("-")[0].split("h")[0]));
        				cours_time.setMinutes(parseInt(cours.hours.split("-")[0].split("h")[1]));

        				if (cours_time >= time)
        				{
        					next_cours = cours;
        					break;
        				}
        			}
        		}
        		catch(err){}


        		if (next_cours === undefined)
                        {
                            embed.setTitle("Auncun cours");
                            embed.setColor(0x000000);
                        }
                else
                {
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
                mess.logedMessage(embed)
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
                    let embed = new Discord.MessageEmbed()
                    .setTitle("Auncun cours")
                    .setColor(0x000000);
                    mess.logedMessage(embed)
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

                        mess.logedMessage(embed)
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
                await command.private.register(mess)
                .then((data)=>
                {
                    mess.logedMessage(`Successfully changed group for ${data[1]}, ${data[0]}`, true);
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
                .then(async (sector)=>
                {
                    let groups = db.listAllGroupFiltered(sector);

                    await command.private.mcq(mess, "What is your group ?", groups)
                    .then((group)=>
                    {
                        db.registreUser(mess.author.id, sector, group);
                        resolve([group, sector]);
                    })
                    .catch(reject);
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

                message.logedMessage(content, true)
                .then((m)=>
                {
                    const collector = m.createReactionCollector(filter, {max:1});

                    collector.on('collect', (reac, user) =>
                    {
                        resolve(data[emoji.indexOf(reac.emoji.name)]);
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
            let time = new Date();
            time = time.getMonth()+1 + "-" + time.getDate();
            let user_data = db.fetchUserData(mess.author.id);
            let classes = [];
            for (let group of user_data[1])
            {
                let cours = db.listAllClasses(user_data[0], group, time);
                // tri par ordre chronologique, à mettre dans listAllClasses
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
                // fin tri par ordre chronologique
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
                    message.logedMessage(`Successfully registered in ${data[1]}, ${data[0]}`, true);
                })
                .catch(logError);
            }
            command.protected[cmd].exec(message);
        }
        else
        {
            message.logedMessage({content: `Unknow command : ${cmd}`, code:'js'})
            .catch(logError);
        }
    }
});


bot.login(bot_token);

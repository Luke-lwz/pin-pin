const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

module.exports = {
    name: "dev",
    description: "infos about the dev",
    execute(client, prefix, command, message, args, links) {
        pcdb.read()
        client.users.fetch('462630374028214311').then(me => {
            message.channel.send({
                "embed": {
                    "title": ":robot: DEVELOPER",
                    "description": me.username + "#" + me.discriminator,
                    "color": 12369084,
                    "fields": [
                        {
                            "name": ":bust_in_silhouette: About me",
                            "value": "Heya I'm Luke.\nI'm a german Highschool student and I've created this Bot in my free time!\nI switched from Teamspeak to Discord and immedeatly thought that the feature of password secured channels was missing, so I made it :))\nIf you like " + client.user.username + " then check out other projects in my [server](" + links.server + ") or even donate (every penny is appreciated!)"
                        },
                        {
                            "name": ":heart: Donate",
                            "value": "Help me with server and maintaining costs [here](" + links.dono + ")"
                        },
                        {
                            "name": ":video_game: Discord",
                            "value": "Join my [discord server](" + links.server + ") for bot updates, to explore other bots and apply for the dev team!"
                        },
                        {
                            "name": ":mobile_phone: Socials",
                            "value": "Follow me on my [socials](https://linktr.ee/Luggas), if you're interested :))"
                        }
                    ],
                    "footer": {
                        "text": "✝"
                    }
                }
            });
        })
    }
}
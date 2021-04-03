const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

module.exports = {
    name: "donate",
    description: "donation stuff",
    execute(client, prefix, command, message, args, links) {
        pcdb.read()
        client.users.fetch('462630374028214311').then(me => {
            message.channel.send({
                "embed": {
                    "title": ":dollar: DONATE",
                    "description": "Heya I'm Luke (" + me.username + "#" + me.discriminator + ")\nI'm a Highschool student in Germany and I've created " + client.user.username + " because I thought discord was lacking this feature.\nTo keep this bot maintained and running a small donation would be very appreciated.\nI will keep on developing " + client.user.username + " and many other bots!\n (to be up to date just join the [discord server](" + links.server + ") or follow my [socials](https://linktr.ee/Luggas))",
                    "color": 5537824,
                    "fields": [
                        {
                        "name": ":heart: Donate",
                        "value": "[here](" + links.dono + ")"
                        }
                    ],
                    "footer": {
                        "text": "Thank you for every penny you give!"
                    }
                }
            });
        })
    }
}
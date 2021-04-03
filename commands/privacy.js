const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./pcdb.json')
const pcdb = low(adapter)

module.exports = {
    name: "privacy",
    description: "",
    execute(client, prefix, command, message, args, links) {
        pcdb.read()
        if (args[0] == "example" || args[0] == "ex") {
            message.channel.send({
                embed: {
                    title: "Database Example",
                    description: `Here you can see an example preview of our database: \`\`\`json
{
  "server": [
    {
      "guild": "123456789123456789",
      "serverName": "Cool Server",
      "category": "121212121212121212",
      "requestChannel": "343434343434343434",
      "lastChannel": "565656565656565656"
    }
  ],
  "settings": [
    {
      "guild": "123456789123456789",
      "voice": true,
      "text": true,
      "public": true,
      "visual": true
    }
  ],
  "vcs": [
    {
      "guild": "123456789123456789",
      "channel": "815705665724481546",
      "name": "awesome-vc",
      "pin": "1234",
      "count": 1
    }
  ],
  "tcs": [
    {
      "guild": "123456789123456789",
      "channel": "815705621633957898",
      "host": "011235813213455891",
      "name": "epic-tc",
      "pin": "1234",
      "cooldown": "1614549779"
    }
  ],
  "linked": [
    {
      "guild": "123456789123456789",
      "tc": "822435385346097152",
      "vc": "822435386390741012",
      "name": "cool-channels",
      "pin": "1234",
      "count": 1
    }
  ],
  "requests": [
    {
      "guild": "123456789123456789",
      "userId": "011235813213455891"
    }
  ]
}\`\`\` \n\`JSON file\``, //Here are the [guidlines](https://discord.dev/legal) privided by Discord
                    color: 11723263
                }
            })
            return;
        }
        client.users.fetch('462630374028214311').then(me => {
            message.channel.send({
                embed: {
                    title: "Privacy Policy",
                    description: "Heya, we want to be very transparent about what data we store in our Database, so we created this detailed documentation!\n⠀", //Here are the [guidlines](https://discord.dev/legal) privided by Discord
                    color: 11723263,
                    fields: [
                        {
                            name: ":green_circle: - What we save:",
                            value: "Our database consists of two kinds of stored data:\n\n**Permanent data:**\nThis is the data that gets stored when you use `" + prefix + "setup`.\nIt contains the following Data:\n- The ID of your server\n- The name of your server\n- The ID of the category that was created by PIN PIN\n- The ID of the `request-channel` created by PIN PIN\n- The ID of the `log-channel` created by PIN PIN\n- The PIN PIN settings you set for your server\n\nTo remove any permanent data use `" + prefix + "reset`\n\n**Temporary data:**\nThis is the data that gets stored when you join the 'request' channel or create a PIN protected channel.\nIt contains the following Data:\n- The ID of a user in the request channel\n- The ID of the created channel(s)\n- The name of the created channel(s)\n- The PIN that the user has set!\n- Count of users in channel (only in VC's)\n- Cooldown timestamp (unix) (only in TC's)\n- The ID of the host (only TC's & linked channels)\n\nThe data is removed as soon as you leave the 'request' channel or a PIN channel is empty (deleted)\n⠀"
                        },
                        {
                            name: ":red_circle: - What we don't save:",
                            value: "We won't store any personal Data like username, profile picture or anything else.\nTry `" + prefix + "privacy example` for an example preview of our database!\n⠀"
                        },
                        {
                            name: ":bust_in_silhouette: - Who has access?",
                            value: "Only the development team has access, which currently only consists of one person:\n`" + me.username + "#" + me.discriminator + "`\n\nIf you are interested in developing bots just apply on our [server](" + links.server + "). We are lookin for discord.js beginners/advanced devs, with a good knowledge of JavaScript!\n⠀"
                        },
                        {
                          name: ":grey_question: - Questions?",
                          value: "If there are any questions left unanswered just join the [support server](" + links.server + ")"
                        }
                    ]
                }
            })
        }).catch(console.error)
    }
}
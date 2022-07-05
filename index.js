require('dotenv').config();
const { Client, Intents, VoiceChannel, GuildEmoji, ReactionEmoji } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

var token = process.env.TOKEN;

var debug = process.env.DEBUG;

if( token && debug != 'ENABLE' ) {

    // Create a new client instance
    const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_VOICE_STATES] });

    // When the client is ready, run this code (only once)
    client.once('ready', () => {
        console.log('Ready!');
    });


    // Login to Discord with your client's token
    client.login(token);

    var emojisArray;
    var createdVC = null;
    var VCUser = null;

    client.on("messageCreate", function(message){
        //console.log(message);
        if( message.content.indexOf('!poll ') == 0 && message.content.length > 6 && !message.author.bot ) {
            var stopLine = -1;

            if( message.content.indexOf('| ') !== undefined ) {
                stopLine = message.content.indexOf('| ');
                var emojis = message.content.substring(stopLine + 2);

                emojisArray = emojis.split(' ');
            }
            var poll = message.content.substring(6, stopLine);
            message.channel.send( poll ).then( m => {


                emojisArray.forEach(element => {

                    m.react(element).catch(function(err) {
                        console.log(err);
                        // m.edit(err.message);
                    });
                 
                })

            }).catch(function(err) {
                console.log(err);
                m.edit('Не надо ломать кота :cat:');
            });
         
            
        }
        

        if( message.content.indexOf( '!createHiddenRoom' == 0 ) && !message.author.bot ) {

            if (!message.guild) {
                return;
            }
            //   console.log(message.member);
            //  console.log(message.member.voice.channel);
            if(message.member.voice.channel) {
            message.guild.channels.create(message.author.username, {
                type: 'GUILD_VOICE'
            }).then(vc => {
                vc.permissionOverwrites.create(message.author, { VIEW_CHANNEL: true });
                vc.permissionOverwrites.create(client.user, { VIEW_CHANNEL: true });
                vc.permissionOverwrites.create(message.guild.roles.everyone, { VIEW_CHANNEL: false });
                if( vc.name == message.author.username ) {
                    message.member.voice.setChannel(vc);
                    createdVC = vc;
                    VCUser = message.member;
                    console.log(createdVC);
                    console.log(VCUser);
                }

            }).catch(function(err) {
                console.log(err);
                m.edit('Не надо ломать кота :cat:');
            });
        } else {
            message.reply( 'Нужно находится в голосовом канале :cat:' );
        }
    } 
    });

        client.on("voiceStateUpdate", function(oldVoiceState, newVoiceState){
            if( VCUser !== null && createdVC !== null ) {
                console.log(VCUser);
                console.log('--------');
                console.log(createdVC);

                if( oldVoiceState.channelId == createdVC.id && newVoiceState.channelId !== createdVC.id ) {
                    if( newVoiceState.member.user.username == VCUser.user.username ) {
                        console.log( 'CHANNELL WILL BE DELETED' );
                        createdVC.guild.channels.delete(createdVC.id).catch(console.error);
                    }
                }
            }
        
        });
  
}

require('dotenv').config();
const { Client, Intents, VoiceChannel, GuildEmoji, ReactionEmoji } = require('discord.js');
const cron = require('node-cron');

var token = process.env.TOKEN;
var debug = process.env.DEBUG;


if( token && debug != 'ENABLE' ) {
    
    // Create a new client instance
    const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
    
    // When the client is ready, run this code (only once)
    client.once('ready', () => {
        console.log('Ready!');
    });
    
    
    // Login to Discord with your client's token
    client.login(token);

    let emojisArray;
    let createdVC = new Map();
    let ChannelNameToCreateAnotherChannels = new Map();
    let cronMsg = new Map();

    client.on("messageCreate", async function(message){
        if( message.content.indexOf('!poll ') === 0 && message.content.length > 6 && !message.author.bot ) {
            let stopLine = -1;

            if( message.content.indexOf('| ') !== undefined ) {
                stopLine = message.content.indexOf('| ');
                let emojis = message.content.substring(stopLine + 2);

                emojisArray = emojis.split(' ');
            }
            let poll = message.content.substring(6, stopLine);

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
         
            message.delete();
            
        }

        if( message.content.indexOf( '!setHiddenRoom' ) === 0 && !message.author.bot ) {
            let commandArray = message.content.split(' ');

            try{
                if(commandArray[1].length > 1) {

                    let fetchedChannels = await message.guild.channels.fetch();


                    let FoundedChannel = fetchedChannels.find(function(channel) {
                        return channel.name == commandArray[1] && channel.type === 'GUILD_VOICE';
                    
                    });
                    if(FoundedChannel) {
                        ChannelNameToCreateAnotherChannels.set(message.guild.id, FoundedChannel.id);
                        message.reply( "Теперь слежу за каналом " + FoundedChannel.name + " :cat:" );
                    } else {
                        message.reply( "Не смог найти канал :cat:" );
                    }

                }
            } catch( err ) {
                console.log(err);
                message.reply( 'Ой! Что-то пошло не так :cat:' );
            }
        }

        if( message.content.indexOf( '!setCronTask' === 0 ) && !message.member.user.bot ) {
            // message.react('⏸');
            let commandArray = message.content.split(' ');
            try{
                if( commandArray[0] === '!setCronTask' ) {
                    let userInputData = message.content.substring(12);
                    if(userInputData.indexOf('| ') !== undefined) {
                        let delimeter = userInputData.indexOf('| ');
            
                        let userTime = userInputData.substring(delimeter + 2);
                        let userMessage = userInputData.substring(0,delimeter);
                        console.log(userTime);
                        let task = cron.schedule(userTime, function(date) {
                            console.log(date);
                            message.channel.send(userMessage).then(m => {
                                //console.log(task);
                                m.react('⏸');
                                if( cronMsg.has(message.member.user.id) ) {

                                    let cronData = cronMsg.get(message.member.user.id);
                                    let foundedTask = cronData.find(obj => {
                                        if(obj.task.options.name === task.options.name) {
                                            obj.message = m;
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    });
                                    if(!foundedTask) {
                                        cronData.push({'message': m, 'task': task});
                                    }
                                } else {
                                    cronMsg.set(message.member.user.id, [{'message': m, 'task': task}]);
                                }

                            });
                        });

                        task.start();
                    }
                }
            } catch(err) {
                console.log(err);
                message.reply('Ой-ой, что-то пошло не так #2 :cat:');
            }

        }
    });

        client.on("voiceStateUpdate", async function(oldVoiceState, newVoiceState){
            if( createdVC.has(oldVoiceState.channel) && (oldVoiceState.member === createdVC.get(oldVoiceState.channel)) && newVoiceState.channel !== oldVoiceState.channel ) {
                try{
                    console.log('CHANNEL WILL BE DELETED!')
                    oldVoiceState.guild.channels.delete(oldVoiceState.channel);
                } catch( err ) {
                    console.log(err)
                }
            }
        });

        client.on("voiceStateUpdate", async function(oldVoiceState, newVoiceState) {
            if( ChannelNameToCreateAnotherChannels.has(newVoiceState.guild.id) && ChannelNameToCreateAnotherChannels.get(newVoiceState.guild.id) === newVoiceState.channelId ) {
                if(newVoiceState.member.permissions.has( 'ADMINISTRATOR' )) {
                    newVoiceState.guild.channels.create(newVoiceState.member.user.username, {
                        type: 'GUILD_VOICE'
                    }).then(vc => {
                        vc.permissionOverwrites.create(newVoiceState.member.user, { VIEW_CHANNEL: true });
                        vc.permissionOverwrites.create(client.user, { VIEW_CHANNEL: true });
                        vc.permissionOverwrites.create(newVoiceState.guild.roles.everyone, { VIEW_CHANNEL: false });
                        if( vc.name == newVoiceState.member.user.username ) {
                            newVoiceState.member.voice.setChannel(vc);
                            createdVC.set(vc, newVoiceState.member);
                            console.log(createdVC);
                        }
        
                    }).catch(function(err) {
                        console.log(err);
                        m.edit('Не надо ломать кота :cat:');
                    });
                
                }
            }
        });

        client.on("messageReactionAdd", async function(messageReaction){
            let ReactionUsers = await messageReaction.emoji.reaction.users.fetch();
            let AuthorReaction;
            let FoundedObject;
            ReactionUsers.forEach( user => {
                console.log(user);
                if(cronMsg.has(user.id) && user.bot === false) {

                    FoundedObject = cronMsg.get(user.id).find(object => {
                       return object.message.id === messageReaction.message.id;
                    });
                    AuthorReaction = user;
                    // console.log(cronMsg);
                    // console.log(messageReaction);
                    // console.log(AuthorReaction);
               
                }
            });
            console.log('----------------------------------');
            console.log(FoundedObject);
            console.log(AuthorReaction);
            if(FoundedObject && AuthorReaction) {
                if(messageReaction.emoji.name === '⏸' && messageReaction.count > 1) {

                    console.log(cronMsg);
                    FoundedObject.task.stop();
                    const index = cronMsg.get(AuthorReaction.id).findIndex(function(el, i) {
                        return FoundedObject.message === el.message && FoundedObject.task === el.task;
                    });

                    console.log(index);
                    if (index > -1) {
                        cronMsg.get(AuthorReaction.id).splice(index, 1);
                    }

                    console.log(cronMsg);
                    if(cronMsg.get(AuthorReaction.id).length === 0) {
                        cronMsg.delete(AuthorReaction.id);
                    }
                    console.log(cronMsg);
                    
                }
            }

        });
  
}

var express = require('express');
var builder = require('botbuilder');
var qr = require('qr-image');
var apartments = require('./apartments');
var uuid = require('node-uuid');


var server;
var bot;
var intents;

/**
 * Creates the express server listening at the given port.
 */
function createServer() {
    server = express();
    server.listen(process.env.PORT || 3978, function() {
        console.log('Server listening');
    });
    server.use(express.static(__dirname + '/public'));
}

/**
 * Adds the endpoint that renders the QR codes from a text.
 */
function serveQR() {
    server.get('/qr/:text', function(req,res){
        var code = qr.image(req.params.text, 
        { type: 'png', size: 10, margin: 1 });
        res.setHeader('Content-type', 'image/png');
        code.pipe(res);
    });
}

/**
 * Creates the bot connector, the bot instance and serve it using express.
 */
function createBot() {
    var connector = new builder.ChatConnector({
        appId: process.env.BELLMAN_APP_ID,
        appPassword: process.env.BELLMAN_APP_PASSWORD
    });
    bot = new builder.UniversalBot(connector);
    var luisUrl ="https://api.projectoxford.ai/luis/v1/application"
    luisUrl += "?id="+process.env.BELLMAN_LUIS_ID;
    luisUrl += "&subscription-key="+process.env.BELLMAN_SUBSCRIPTION_KEY;
    var recognizer = new builder.LuisRecognizer(luisUrl);
    intents = new builder.IntentDialog({ recognizers: [recognizer] });
    bot.dialog('/', intents);
    server.post('/api/messages', connector.listen());
}

/**
 * Configure the bot dialogs.
 */
function configureDialogs() {
    bot.dialog('/greetings',function(session, args, next) {
        var name = session.message.address.user.name;
        var msg = new builder.Message()
            .address(session.message.address)
            .text("Hello "+name+"! I'm Bellman. How can I help you?");
        bot.send(msg);
        session.endDialog();
    });

    bot.dialog('/capabilities',function(session, args, next) {
        var name = session.message.address.user.name;
        var msg = new builder.Message()
            .address(session.message.address)
            .text("Well, I can look for a room for you or show your reservations. \nTry something like 'I want a room in Madrid.'");
        bot.send(msg);
        session.endDialog();
    });

    bot.dialog('/search', [
        function(session, args, next) {
            if (!args) {
                session.endDialog();
                return;
            }
            var city = builder.EntityRecognizer.findEntity(args.entities, 'city');
            if (city) {
                if (city.entity) {
                    city = city.entity;
                }
            }
            var fromDate = builder.EntityRecognizer.findEntity(args.entities, 'builtin.datetime.date');
            session.dialogData.city = city;
            session.dialogData.fromDate = fromDate;
            next();
        },
        function(session, args, next) {
            if (!session.dialogData.city) {
                builder.Prompts.text(session, 'What city do you want to visit?');        
            } else {
                next();
            }
        },
        function(session, args, next) {
            if (!session.dialogData.city) {
                session.dialogData.city = args.response;        
            }
            if (!apartments.isValidCity(session.dialogData.city)) {
                var msg = new builder.Message()
                    .address(session.message.address)
                    .text("I'm so sorry, but we don't have any hotel located at "+session.dialogData.city);
                bot.send(msg);
                session.endDialog();
            } else {
                next();
            }
        },
        function(session, args, next) {
            if (!session.dialogData.fromDate) {
                builder.Prompts.time(session, 'When you are arriving?');        
            } else {
                next();
            }
        },
        function(session, args, next) {
            if (!session.dialogData.fromDate) {
                session.dialogData.fromDate = args.response;
            }
            next();
        },
        function(session, args, next) {
            var hotels = apartments.get(session.dialogData.city);
            var attachments = [];
            hotels.forEach(function(hotel) {
                var card = new builder.HeroCard(session)
                    .title(hotel.name)
                    .text('From '+hotel.price+'€')
                    .images([
                        builder.CardImage.create(session, 'https://bellman.herokuapp.com/images/'+hotel.picture)
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, hotel.url, 'Info'),
                        builder.CardAction.imBack(session, hotel.name, 'Reserve')
                    ])
                attachments.push(card);
            });
            var msg = new builder.Message(session)
              .textFormat(builder.TextFormat.xml)
              .attachmentLayout(builder.AttachmentLayout.carousel)
             .attachments(attachments);
            builder.Prompts.text(session, msg);             
        },
        function(session, args, next) {
            var id = uuid.v1(); 
             var msg = new builder.Message(session)
                .attachments([{
                    contentType: "image/png",
                    contentUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Codigo_QR.svg/250px-Codigo_QR.svg.png"
                }]);
            bot.send(msg);            
            session.endDialog();
        }
    ]);


    intents.matches('bellman.greetings', '/greetings');
    intents.matches('bellman.capabilities', '/capabilities');
    intents.matches('bellman.search', '/search');
}

/**
 * Initialize all the infrastructure and starts the bot.
 */
function initialize() {
    createServer();
    serveQR();
    createBot();
    configureDialogs();
}

initialize();

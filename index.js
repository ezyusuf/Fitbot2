var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var Firebase = require('firebase')
var app = express()

var gkey = 'AIzaSyCiIsMceUzSB3RaR-6BhT8lW5F_NPf_UhY';

var firebaseRef = new Firebase('https://fit-bot.firebaseio.com/')
var userRef = new Firebase('https://fit-bot.firebaseio.com/users')

var numGymCards = 3;

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
/*
    userRef.push({
      name: 'allen12354',
      gyms: ['test']
    });
*/
    request({
        url: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
        method: 'GET',
        qs: {
          query: 'goodlife waterloo',
          key: gkey
        },
    }, function(error, response, body) {
        var results = JSON.parse(body).results;
        console.log(results);
        results.forEach(function(result) {
            console.log(result.formatted_address);
        })
    });

})

var lastText;

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            text = event.message.text
            if (lastText === 'promptQuery') {
                showGymCards(text);
                continue;
            }
            if (text === 'Day' || text === 'Afternoon' || text === 'Night' || text === 'Hulktime' ) {
                sendTextMessage(sender, "Below is your customized plan for the first day. Just Type 'Hulktime' to see it again: ")
                sendGenericMessage(sender)
                sendTextMessage(sender, "Would you like me to show you a list of gyms? (Yes/No)")
                lastText = 'time';
                continue
            }
            if (text.toLowerCase() === 'yes' && lastText === 'time') {
                sendTextMessage(sender, "Enter a query");
                lastText = 'promptQuery'
                continue;
            }
        }
        if (event.postback) {
            text = JSON.stringify(event.postback)
            sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
            continue
        }
        //lastText = null;
    }
    res.sendStatus(200)
})
var token = "EAAPMCMAAi7gBAL7mhn4ZAIfBxVSJ4YOGPf9iUGYE9HnyZAyOuRXMPKStIOpoRVxtse7YlS4pqhONAZCcdL9Xz59vyYR68L5T6LcTZBkFEkFUHZBi9G5e6YDhSZBzDScZAY6ZBjvd7ngA4y1JVWKDuuW2O0NCZBbRoTE8jtwsmsOv7owZDZD";
function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function queryPlaces(query, callback) {
    request({
        url: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
        method: 'GET',
        qs: {
          query: query,
          key: gkey
        },
    }, callback);
}

function showGymCards(query) {
    queryPlaces(query, function(error, response, body) {

        var results = JSON.parse(body).results;
        var elementArray = [];
        for (var i = 0; i < Math.min(results.length, numGymCards); i++) {
            var result = results[i];
            console.log(result.formatted_address);
            var element = {
                "title": result.formatted_address,
                "subtitle": "Category:Arms",
                "image_url": "http://www.foreverfitness24.com/wp-content/uploads/2014/08/gym.jpg",
                "buttons": [{
                    "type": "web_url",
                    "url": "https://wger.de/en/exercise/74/view/biceps-curls-with-barbell",
                    "title": "More Info"
                }, {
                    "type": "postback",
                    "title": "Postback",
                    "payload": "Payload for first element in a generic bubble",
                }],
            }
            elementArray.push(element);
        }
        messageData = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": elementArray,
                }
            }
        }
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token:token},
            method: 'POST',
            json: {
                recipient: {id:sender},
                message: messageData,
            }
        }, function(error, response, body) {
            if (error) {
                console.log('Error sending messages: ', error)
            } else if (response.body.error) {
                console.log('Error: ', response.body.error)
            }
        })

    });
}

function sendGenericMessage(sender) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Bicep Curls (3 sets)",
                    "subtitle": "Category:Arms",
                    "image_url": "https://wger.de/media/exercise-images/74/Bicep-curls-1.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://wger.de/en/exercise/74/view/biceps-curls-with-barbell",
                        "title": "More Info"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Bench Press (3 sets)",
                    "subtitle": "Category:Chest",
                    "image_url": "https://wger.de/media/exercise-images/192/Bench-press-2.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

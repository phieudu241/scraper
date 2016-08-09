var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var firebase = require('firebase');
var app = express();

var BASE_PLAYER_URL = "http://vn.fifaaddict.com/fo3player.php?id="

app.get('/scrape', function (req, res) {
    // fs.readFile('player_ids.txt', (err, data) => {
    //   if (err) throw err;
    //   console.log(data);
    // });

    fs.readFileSync('player_ids.txt').toString().split('\n').forEach(function (line) {
        console.log(line);
        getPlayer(line);

        // Write processed id
        fs.appendFileSync("./output.txt", line.toString() + "\n");
    });
});

function getPlayer(playerId, res) {
    let url = BASE_PLAYER_URL + playerId;

    request(url, function (error, response, html) {
        if (!error) {
            let player = parsePlayer(html);
            res.send(player);
        } else {
            res.send('Get error for player with id: ' + playerId);
        }
    });
}

function parsePlayer(html) {
    var $ = cheerio.load(html);
    var player = {};

    $('.stat_list').forEach(function (el) {
        var $el = $(el);
        var key = $el.classList[1];
        var value = $el.find('.stat_value').text();
        player[key] = value;
    });

    console.log(player);

    return player;
}

app.listen("8081");
console.log("Magic happens on port 8081");
"use strict";
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var firebase = require('firebase');
var app = express();

var BASE_PLAYER_URL = "http://vn.fifaaddict.com/fo3player.php?id=";

//var BASE_PLAYER_URL = "http://fifanet.kr/player/player.fifanet?spid=";
var PLAYER_ATTRIBUTES = [
    "finishing",
    "shotpower",
    "curve",
    "longshots",
    "volleys",
    "freekickaccuracy",
    "penalties",
    "headingaccuracy",
    "positioning",
    "sprintspeed",
    "acceleration",
    "agility",
    "reactions",
    "jumping",
    "stamina",
    "strength",
    "balance",
    "shortpassing",
    "longpassing",
    "crossing",
    "ballcontrol",
    "dribbling",
    "tacticalawareness",
    "vision",
    "standingtackle",
    "slidingtackle",
    "marking",
    "aggression",
    "gkdiving",
    "gkhandling",
    "gkkicking",
    "gkreflexes",
    "gkpositioning"
];

app.get('/', function (req, res) {
    res.send('Hello');
});

app.get('/scrape', function (req, res) {
    // fs.readFile('player_ids.txt', (err, data) => {
    //   if (err) throw err;
    //   console.log(data);
    // });
    firebase.initializeApp({
        databaseURL: "https://project-6941809469027540633.firebaseio.com",
        serviceAccount: "ffo3-098c2203d502.json",
        databaseAuthVariableOverride: {
            uid: "fxOWhxsFo6dDrnhbDzNww3sknZf2"
        }
    });

    var db = firebase.database();
    var rootRef = db.ref();

    var playerIds = fs.readFileSync('player_ids.txt').toString().split('\r\n');
    var startIndex = 0;

    getPlayer(playerIds, startIndex, res, rootRef, fs);
});

function getPlayer(playerIds, index, res, rootRef, fs) {
    let playerId = playerIds[index];

    let url = BASE_PLAYER_URL + playerId;

    request(url, function (error, response, html) {
        if (!error) {
            let player = parsePlayer(html, playerId);

            if (player) {
                rootRef.child(playerId).set(player).then(function (response) {
                    next('', playerId, playerIds, index, res, rootRef, fs);
                });
            } else {
                next(' - Not Found', playerId, playerIds, index, res, rootRef, fs);
            }

        } else {
            next(' - Error', playerId, playerIds, index, res, rootRef, fs);

            console.log('Get error for player with id: ' + playerId);
            //res.send('Get error for player with id: ' + playerId);
        }
    });
}

function next(type, playerId, playerIds, index, res, rootRef, fs) {
    fs.appendFileSync("./output.txt", playerId.toString() + type + "\r\n");

    if (index++ < (playerIds.length - 1)) {
        getPlayer(playerIds, index, res, rootRef, fs);
    } else {
        console.log('finished!');
        res.send('finished');
    }
}

function parsePlayer(html, playerId) {
    var $ = cheerio.load(html);
    var player = {pid: playerId};

    if ($('.stat_list').length > 0) {
        // PLAYER_ATTRIBUTES.forEach(function (attr) {
        //     var value = $('#display_' + attr).text();
        //     player[attr] = value;
        // });

        // Get player attributes
        $('.stat_list').each(function (i, el) {
            let $el = $(el);
            let key = $el.attr('class').split(' ')[1];
            let value = $el.find('.stat_value').text();
            player[key] = value;
        });

        let $f3playerTopInfo = $('.f3player_topinfo');
        let $nameEl = $f3playerTopInfo.find('.player_info_list.player_name a');
        // name
        let playerName = $nameEl.text().trim();
        let plusIndex = playerName.indexOf("+");

        if (plusIndex > -1) {
            playerName = playerName.substring(0, plusIndex);
        }

        player['fullname'] = playerName;
        player['shortname'] = playerName;

        // season
        player['badged'] = $nameEl.find('span').attr('class');

        // positions
        let positions = {};
        let $positions = $f3playerTopInfo.find('.player_info_list.player_position');

        $positions.find('.player_position_list').each(function (i, el) {
            let $this = $(el);
            positions[$this.find('.badge_position').text()] = $this.find('.stat_value').text();

            if ($this.attr('class').indexOf('player_position_active') > -1) {
                player['overallrating'] = $this.find('.stat_value').text();
            }
        });

        player['positions'] = positions;

        // skillmoves
        player['skillmoves'] = $f3playerTopInfo.find('.player_info_list.player_skillmoves i').length;

        // nation
        player['nation'] = $f3playerTopInfo.find('.player_nation b').text();
        // club
        player['club'] = $f3playerTopInfo.find('.player_club b').text();

        // birthday
        let $values = $($f3playerTopInfo.find('.player_info_list')[2]).find('b');
        player['birthday'] = $($values[0]).text();
        player['height'] = $($values[1]).text();
        player['weight'] = $($values[2]).text();

        player['leftfoot'] = $f3playerTopInfo.find('.leftfoot').text().trim();
        player['rightfoot'] = $f3playerTopInfo.find('.rightfoot').text().trim();

        // attack/defence
        let $playerStatInner = $('.player_stat_inner');
        player['attack'] = $playerStatInner.find('.workrate .att b').text();
        player['defence'] = $playerStatInner.find('.workrate .def b').text();

        //speciality
        let speciality = [];
        $playerStatInner.find('.speciality b').each(function (i, el) {
            speciality.push($(el).text());
        });
        player['speciality'] = speciality;

        //trait
        let hiddenScore = [];
        $($playerStatInner.find('.trait.sm')[1]).find('b').each(function (i, el) {
            hiddenScore.push($(el).text());
        });
        player['hidden_score'] = hiddenScore;
    } else {
        player = undefined;
    }

    console.log(player);

    return player;
}

app.listen("8081");
console.log("Magic happens on port 8081");
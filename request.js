"use strict";
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var LANGUAGE_MAPPING = require('./multi-language-mapping');

var app = express();

var BASE_PLAYER_URL = "http://en.fifaaddict.com/fo3player.php?id=";
var SEARCH_BY_SEASON_URL = "http://en.fifaaddict.com/fo3db.php?q=player&season=";

var PLAYER_ATTRIBUTES = [
    "overallrating",
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
    "gkpositioning",
    "poten"
];

app.set('port', (process.env.PORT || 5000));

app.get('/test', function (req, res) {
    res.send('Hello');
});

app.get('/scrape', function (req, res) {
    var playerIds = fs.readFileSync('2007.txt').toString().split('\r\n');
    var startIndex = 0;
    getPlayer(playerIds, startIndex, res, fs);
});

app.get('/getPlayerIdsBySeason/:season', function (req, res) {
    getPlayerIds(req.params.season, res);
});


function getPlayerIds(season, res) {

    let url = SEARCH_BY_SEASON_URL + season;

    request(url, function (error, response, html) {
        if (!error) {
            let playerIds = parsePlayerIds(html);

            if (playerIds && playerIds.length) {
                writeIdsFile(playerIds, season);
            }

            res.send('Finished!');

        } else {
            console.log('Get error for search with season: ' + season);
            res.send('Error');
        }
    });
}

function writeIdsFile(playerIds, filename) {
    for (var i = playerIds.length - 1; i >= 0; i--) {
        console.log(playerIds[i]);
        fs.appendFileSync("./" + filename +".txt", playerIds[i] + "\r\n");
    }
}

function parsePlayerIds(html) {
    let $ = cheerio.load(html);
    let playerIds = [];
    let prefix = 'player_id';
    let prefixLength = prefix.length;

    $('#fo3-search-result #playerlistable tr.player-row').each(function (i, el) {
        let $el = $(el);
        let id = $el.attr('id');

        
        if (id.indexOf(prefix) == 0) {
            playerIds.push(id.substring(prefixLength));
        }
    });

    return playerIds;
}


function getPlayer(playerIds, index, res, fs) {
    let playerId = playerIds[index];

    let url = BASE_PLAYER_URL + playerId;

    request(url, function (error, response, html) {
        if (!error) {
            let player = parsePlayer(html, playerId);

            if (player) {
                // Write JSON file here
                writeJSON(playerId, player, fs);
                next('', playerId, playerIds, index, res, fs);
            } else {
                next(' - Not Found', playerId, playerIds, index, res, fs);
            }

        } else {
            next(' - Error', playerId, playerIds, index, res, fs);

            console.log('Get error for player with id: ' + playerId);
            res.send('Error');
        }
    });
}

function writeJSON(playerId, player, fs) {
    var playersStr = fs.readFileSync('players.json').toString();
    var players = {};
    if (playersStr != undefined && playersStr.trim() != '') {
        players = JSON.parse(playersStr);
    }
    players[playerId] = player;

    fs.writeFileSync('players.json', JSON.stringify(players));
}

function next(type, playerId, playerIds, index, res, fs) {
    fs.appendFileSync("./output.txt", playerId.toString() + type + "\r\n");

    if (index++ < (playerIds.length - 1)) {
        getPlayer(playerIds, index, res, fs);
    } else {
        console.log('Finished!');
        res.send('Finished!');
    }
}

function parsePlayer(html, playerId) {
    var $ = cheerio.load(html);
    var player = {pid: playerId};

    if ($('.stat_list').length > 0) {
        // Get player attributes
        $('.stat_list').each(function (i, el) {
            let $el = $(el);
            let key = $el.attr('class').split(' ')[1];
            let value = $el.find('.stat_value').text();
            player[key] = parsePlayerAttribute(key, value);
        });

        // Localize perfcon attr
        player['perfcon_vn'] = getLanguageMapping(LANGUAGE_MAPPING.PERF_CON, player['perfcon'], 'vn');
        player['perfcon_cn'] = getLanguageMapping(LANGUAGE_MAPPING.PERF_CON, player['perfcon'], 'cn');
        player['perfcon_id'] = getLanguageMapping(LANGUAGE_MAPPING.PERF_CON, player['perfcon'], 'id');
        player['perfcon_kr'] = getLanguageMapping(LANGUAGE_MAPPING.PERF_CON, player['perfcon'], 'kr');
        player['perfcon_th'] = getLanguageMapping(LANGUAGE_MAPPING.PERF_CON, player['perfcon'], 'th');

        let $f3playerTopInfo = $('.f3player_topinfo');
        let $nameEl = $f3playerTopInfo.find('.player_info_list.player_name a');
        // name
        let playerName = $nameEl.text().trim();
        let plusIndex = playerName.indexOf("+");

        if (plusIndex > -1) {
            playerName = playerName.substring(0, plusIndex);
        }

        player['fullname'] = playerName;
        player['shortname'] = getShortname(playerName);

        // badged
        player['badged'] = $nameEl.find('span').attr('class');
        // season
        let seasonHref = $f3playerTopInfo.find('.team_color_label_wrapper .team_color_label.label_season').attr('href');
        player['season'] = getValueFromHref(seasonHref, 'season');

        // league (giai dau)
        let leagueHref = $('.fobreadcrumb').find('li').last().find('a').attr('href');
        player['league'] = getValueFromHref(leagueHref, 'league');

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
        let speciality_vn = [];
        let speciality_cn = [];
        let speciality_kr = [];
        $playerStatInner.find('.speciality b').each(function (i, el) {
            let value = $(el).text().trim();
            speciality.push(value);
            speciality_vn.push(getLanguageMapping(LANGUAGE_MAPPING.SPECIALITIES, value, 'vn'));
            speciality_cn.push(getLanguageMapping(LANGUAGE_MAPPING.SPECIALITIES, value, 'cn'));
            speciality_kr.push(getLanguageMapping(LANGUAGE_MAPPING.SPECIALITIES, value, 'kr'));
        });
        player['speciality'] = speciality;
        player['speciality_vn'] = speciality_vn;
        player['speciality_cn'] = speciality_cn;
        player['speciality_kr'] = speciality_kr;

        //trait
        let hiddenScore = [];
        let hiddenScore_vn = [];
        let hiddenScore_cn = [];
        let hiddenScore_kr = [];
        $($playerStatInner.find('.trait.sm')[1]).find('b').each(function (i, el) {
            let hiddenAttr = $(el).text().trim();
            hiddenScore.push(hiddenAttr);
            hiddenScore_vn.push(getLanguageMapping(LANGUAGE_MAPPING.HIDDEN_STATS, hiddenAttr, 'vn'));
            hiddenScore_cn.push(getLanguageMapping(LANGUAGE_MAPPING.HIDDEN_STATS, hiddenAttr, 'cn'));
            hiddenScore_kr.push(getLanguageMapping(LANGUAGE_MAPPING.HIDDEN_STATS, hiddenAttr, 'kr'));
        });
        player['hidden_score'] = hiddenScore;
        player['hidden_score_vn'] = hiddenScore_vn;
        player['hidden_score_cn'] = hiddenScore_cn;
        player['hidden_score_kr'] = hiddenScore_kr;
    } else {
        player = undefined;
    }

    console.log(player);

    return player;
}

function getLanguageMapping(map, key, language) {
    if (map[key] && map[key][language]) return map[key][language];
    return key;
}

function getShortname(name) {
    let shortname = name;
    if (name.indexOf(' ') > 0) {
        let parts = name.split(' ');
        shortname = parts[0][0] + '. ' + parts.slice(1).join(' ');
    }

    return shortname;
}

function getValueFromHref(href, delicator) {
    var value;

    if (href.indexOf(delicator) > -1) {
        value = href.substring(href.indexOf(delicator) + delicator.length + 1).toLowerCase();
    }

    return value;
}

function parsePlayerAttribute(key, value) {
    if (PLAYER_ATTRIBUTES.indexOf(key) > -1) {
        value = parseInt(value);
    }

    return value;
}

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
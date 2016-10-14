"use strict";
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
//var _ = require('lodash');
var LANGUAGE_MAPPING = require('./multi-language-mapping');
var COUNTRIES_CONSTANTS = require('./countries');

var app = express();

//var BASE_PLAYER_URL = "http://en.fifaaddict.com/fo3player.php?id=";
var BASE_PLAYER_URL = "http://en.fifaaddict.com/fo3player.php?id=";
var SEARCH_BY_SEASON_URL = "http://en.fifaaddict.com/fo3db.php?q=player&limit=500&player&season=";
// Just get id for player overallrating >= 70
var SEARCH_BY_COUNTRY_URL = "http://en.fifaaddict.com/fo3db.php?q=player&limit=500&player&ability=overallrating_70&nation=";

var SCAPE_INPUT_FILE = './input/test.txt';
var SCAPE_OUTPUT_FILE = './output/test.json';
var SCAPE_OUTPUT_LOG_FILE = './output/test.txt';

var SCAPE_IMAGEID_INTPUT_FILE = './input/scanImageIds.txt';
var SCAPE_IMAGEID_OUTPUT_FILE = './output/image_id.txt';
var SCAPE_IMAGEID_OUTPUT_LOG_FILE = './output/image_id_log.txt';

var SEARCH_BY_COUNTRY_OUTPUT_FILE = "./output/playerIdsByCountry.txt";
var SEARCH_BY_COUNTRY_OUTPUT_FILE_NAME = "playerIdsByCountry";
var CONVERT_JSON_INPUT_FILE = './output/test.json';
var CONVERT_CSV_OUTPUT_FILE = './output/test.csv';

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
    var playerIds = fs.readFileSync(SCAPE_INPUT_FILE).toString().split('\r\n');
    var startIndex = 0;
    getPlayer(playerIds, startIndex, fs);
    res.send('Doing....');
});

app.get('/scrapeImageId', function (req, res) {
    var playerIds = fs.readFileSync(SCAPE_IMAGEID_INTPUT_FILE).toString().split('\r\n');
    var startIndex = 0;
    getImageId(playerIds, startIndex, fs);
    res.send('Doing....');
});

app.get('/getPlayerIdsBySeason/:season', function (req, res) {
    let url = SEARCH_BY_SEASON_URL + req.params.season;
    getPlayerIds(url, req.params.season);
    res.send('Doing....');
});

app.get('/getPlayerIdsByCountries', function (req, res) {
    getPlayerIdsByCountries(COUNTRIES_CONSTANTS.COUNTRIES, 0);
    res.send('Doing....');
});

app.get('/convert', function (req, res) {
    convertJsonToCsv(CONVERT_JSON_INPUT_FILE, CONVERT_CSV_OUTPUT_FILE);
    res.send('Doing....');
});

function getPlayerIdsByCountries(countries, index) {
    let url = SEARCH_BY_COUNTRY_URL + countries[index];
    //Add Header
    console.log(countries[index]);
    fs.appendFileSync(SEARCH_BY_COUNTRY_OUTPUT_FILE, '#' + countries[index] + "\r\n");
    getPlayerIds(url, SEARCH_BY_COUNTRY_OUTPUT_FILE_NAME, function () {
        if (index++ < countries.length - 1) {
            getPlayerIdsByCountries(countries, index);
        } else {
            console.log('Finished!');
        }
    });
}

function getPlayerIds(url, outputFileName, callback) {

    request(url, function (error, response, html) {
        if (!error) {
            let playerIds = parsePlayerIds(html);

            if (playerIds && playerIds.length) {
                writeIdsFile(playerIds, outputFileName);
            }

            if (callback) {
                callback();
            } else {
                console.log('Finished!');
            }

        } else {
            console.log('Get error for search with reason: ' + outputFileName);
            if (callback) {
                callback();
            } else {
                console.log('Error');
            }
        }
    });
}

function writeIdsFile(playerIds, filename) {
    for (var i = playerIds.length - 1; i >= 0; i--) {
        console.log(playerIds[i]);
        fs.appendFileSync("./output/" + filename +".txt", playerIds[i] + "\r\n");
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


function getPlayer(playerIds, index, fs) {
    let playerId = playerIds[index];

    if (!playerId || playerId.trim() == '' || playerId.indexOf('//') > - 1 || playerId.indexOf('#') > - 1) {
        // Ignore comment row
        next('Comment', playerId, playerIds, index, fs);
    } else {
        let url = BASE_PLAYER_URL + playerId;
        request(url, function (error, response, html) {
            if (!error) {
                let player = parsePlayer(html, playerId);

                if (player) {
                    // Write JSON file here
                    writeJSON(playerId, player, fs);
                    next('', playerId, playerIds, index, fs);
                } else {
                    next(' - Not Found', playerId, playerIds, index, fs);
                }

            } else {
                console.log('Get error for player with id: ' + playerId);
                next(' - Error', playerId, playerIds, index, fs);
            }
        });
    }
}

function getImageId(playerIds, index, fs) {
    let playerId = playerIds[index];

    if (!playerId || playerId.trim() == '' || playerId.indexOf('//') > - 1 || playerId.indexOf('#') > - 1) {
        // Ignore comment row
        next('Comment', playerId, playerIds, index, fs);
    } else {
        let url = BASE_PLAYER_URL + playerId;
        request(url, function (error, response, html) {
            if (!error) {
                let imageId = parseImageId(html, playerId);

                if (imageId) {
                    // Write ImageId here
                    fs.appendFileSync(SCAPE_IMAGEID_OUTPUT_FILE, playerId + '-' + imageId + "\r\n");
                    nextImageId('', playerId, playerIds, index, fs);
                } else {
                    console.log('Not Finished');
                }

            } else {
                console.log('Get error for player with id: ' + playerId);
                nextImageId(' - Error', playerId, playerIds, index, fs);
            }
        });
    }
}

function writeJSON(playerId, player, fs) {
    var playersStr = fs.readFileSync(SCAPE_OUTPUT_FILE).toString();
    var players = {};
    if (playersStr != undefined && playersStr.trim() != '') {
        players = JSON.parse(playersStr);
    }
    players[playerId] = player;

    fs.writeFileSync(SCAPE_OUTPUT_FILE, JSON.stringify(players));
}

function next(type, playerId, playerIds, index, fs) {
    console.log(index);
    if (type != 'Comment') {
        fs.appendFileSync(SCAPE_OUTPUT_LOG_FILE, playerId.toString() + type + "\r\n");
    }

    if (index++ < (playerIds.length - 1)) {
        getPlayer(playerIds, index, fs);
    } else {
        console.log('Finished!');
    }
}

function nextImageId(type, playerId, playerIds, index, fs) {
    console.log(index);
    if (type != 'Comment') {
        fs.appendFileSync(SCAPE_IMAGEID_OUTPUT_LOG_FILE, playerId.toString() + type + "\r\n");
    }

    if (index++ < (playerIds.length - 1)) {
        getImageId(playerIds, index, fs);
    } else {
        console.log('Finished!');
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

        if (!player['poten']) player['poten'] = 1;

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

        // imageid
        let smallImageUrl = $f3playerTopInfo.find('.player_img').attr('src');
        player['imageid'] = smallImageUrl.substring(smallImageUrl.lastIndexOf('/') + 2, smallImageUrl.indexOf('png') - 1);

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
            positions[$this.find('.badge_position').text()] = getLevel1($this.find('.stat_value').text());

            if ($this.attr('class').indexOf('player_position_active') > -1) {
                player['overallrating'] = parsePlayerAttribute('overallrating', $this.find('.stat_value').text());
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

        let $traits = $playerStatInner.find('.trait.speciality.sm');
        $traits.find('b').each(function (i, el) {
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
        $playerStatInner.find('.trait.sm').not('.speciality').find('b').each(function (i, el) {
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

    console.log(player ? 'OK' : player);

    return player;
}


function parseImageId(html, playerId) {
    var $ = cheerio.load(html);
    var imageId;

    if ($('.stat_list').length > 0) {
        let $f3playerTopInfo = $('.f3player_topinfo');
        // imageid
        let smallImageUrl = $f3playerTopInfo.find('.player_img').attr('src');
        imageId = smallImageUrl.substring(smallImageUrl.lastIndexOf('/') + 2, smallImageUrl.indexOf('png') - 1);
    }

    console.log(imageId ? 'OK' : imageId);

    return imageId;
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
        // Level 1 (+5)
        value = getLevel1(value);
    }

    return value;
}

function getLevel1(value) {
    // Level 1 (+5)
    return parseInt(value) + 5;
}

function convertJsonToCsv(jsonFile, csvFile) {
    var playersStr = fs.readFileSync(jsonFile).toString();
    var players = {};
    if (playersStr != undefined && playersStr.trim() != '') {
        players = JSON.parse(playersStr);
    }

    var header = false;

    for (var playerId in players) {
        var playerInfo = players[playerId];
        // Write Header Row
        if (!header) {
            var headerRow = [];
            for (var property in playerInfo) {
                headerRow.push(property);
            }

            fs.appendFileSync(csvFile, headerRow.join(',') + "\r\n");

            header = true;
        }

        var dataRow = [];
        for (var property in playerInfo) {
            if (playerInfo[property] instanceof Array) {
                dataRow.push('"' +  playerInfo[property].join(',') + '"');
            } else if (playerInfo[property] instanceof Object) {
                var detailInfo = [];
                for (var detailProp in playerInfo[property]) {
                    detailInfo.push(detailProp + '-' + playerInfo[property][detailProp]);
                }
                dataRow.push('"' +  detailInfo.join(',') + '"');
            } else {
                if (typeof(playerInfo[property]) == 'string') {
                    dataRow.push('"' + playerInfo[property] + '"');
                } else {
                    dataRow.push(playerInfo[property]);
                }
            }
        }

        fs.appendFileSync(csvFile, dataRow.join(',') + "\r\n");
    }

    console.log('Finished!');
}

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
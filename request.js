"use strict";
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
//var _ = require('lodash');
var LANGUAGE_MAPPING = require('./multi-language-mapping');
var CONSTANTS = require('./constants');

var app = express();

var BASE_PLAYER_URL = "http://en.fifaaddict.com/fo3player.php?id=";
var BASE_PLAYER_ROSTER_URL = "http://en.fifaaddict.com/roster_update_2016_second_half.php?player_id=";
var SEARCH_BY_SEASON_URL = "http://en.fifaaddict.com/fo3db.php?q=player&limit=500&ability=overallrating_70&season=";
// Just get id for player overallrating >= 70
var SEARCH_BY_COUNTRY_URL = "http://en.fifaaddict.com/fo3db.php?q=player&limit=500&player&ability=overallrating_70&nation=";
var LIVEBOOST_URL = "http://en.fifaaddict.com/fo3db.php?q=player&ability=overallrating_70&liveboost=yes&limit=500";
var LIVEBOOST_NEXON_URL = "http://fifaonline3.nexon.com/community/common/search/liveboostsearch.aspx?n4WeekFo3=";
var LIVEBOOST_NEXON_GET_WEEK_URL = "http://fifaonline3.nexon.com/community/square/list.aspx?n4ArticleCategorySN=4";
var FIFA_NET_PLAYER_URL = "http://fifanet.kr/player/player.fifanet?spid=";
var ROSTER_UPDATE_URL = "http://en.fifaaddict.com/roster_update_2017_firsthalf.php";

var SCAPE_INPUT_FILE = './input/RyanGiggs_And_Friends.txt';
var SCAPE_OUTPUT_FILE = './output/Giggs.json';
var SCAPE_OUTPUT_LOG_FILE = './output/Giggs.txt';

var SCAPE_LEAGUE_INTPUT_FILE = './input/2016.txt';
var SCAPE_LEAGUE_OUTPUT_FILE = './output/2016_league.txt';
var SCAPE_LEAGUE_OUTPUT_LOG_FILE = './output/2016_league_log.txt';

var SCAPE_IMAGEID_INTPUT_FILE = './input/scanImageIds.txt';
var SCAPE_IMAGEID_OUTPUT_FILE = './output/image_id.txt';
var SCAPE_IMAGEID_OUTPUT_LOG_FILE = './output/image_id_log.txt';

var SCAPE_KOREAN_NAME_INTPUT_FILE = './input/scanKoreanNameIds.txt';
var SCAPE_KOREAN_NAME_OUTPUT_FILE = './output/Korean_Names.txt';
var SCAPE_KOREAN_NAME_OUTPUT_LOG_FILE = './output/Korean_Names_log.txt';

var SEARCH_BY_COUNTRY_OUTPUT_FILE = "./output/playerIdsByCountry.txt";
var SEARCH_BY_COUNTRY_OUTPUT_FILE_NAME = "playerIdsByCountry";
var CONVERT_JSON_INPUT_FILE = './output/Giggs.json';
var CONVERT_CSV_OUTPUT_FILE = './output/Giggs.csv';

var PROXY = '';
//var PROXY = 'http://192.168.78.7:8888';

app.set('port', (process.env.PORT || 5000));

app.use(express.static('public'));

app.get('/test', function (req, res) {
    res.send('Hello');
});

app.get('/scrape/:playerId', function (req, res) {
    getRosterPlayer(req.params.playerId);
    res.send('Doing....');
});

app.get('/scrape', function (req, res) {
    var playerIds = fs.readFileSync(SCAPE_INPUT_FILE).toString().split('\r\n');
    var startIndex = 0;
    getPlayer(playerIds, startIndex, fs);
    res.send('Doing....');
});

app.get('/getRosterUpdateIds', function (req, res) {
    getRosterUpdateIds(ROSTER_UPDATE_URL, res);
});

app.get('/scrapeLeague', function (req, res) {
    var playerIds = fs.readFileSync(SCAPE_LEAGUE_INTPUT_FILE).toString().split('\r\n');
    var startIndex = 0;
    getLeague(playerIds, startIndex, fs);
    res.send('Doing....');
});

app.get('/scrapeImageId', function (req, res) {
    var playerIds = fs.readFileSync(SCAPE_IMAGEID_INTPUT_FILE).toString().split('\r\n');
    var startIndex = 0;
    getImageId(playerIds, startIndex, fs);
    res.send('Doing....');
});

app.get('/scrapeKoreanName', function (req, res) {
    var playerIds = fs.readFileSync(SCAPE_KOREAN_NAME_INTPUT_FILE).toString().split('\r\n');
    var startIndex = 0;
    getKoreanName(playerIds, startIndex, fs);
    res.send('Doing....');
});

app.get('/getPlayerIdsBySeason/:season', function (req, res) {
    let url = SEARCH_BY_SEASON_URL + req.params.season;
    getPlayerIds(url, req.params.season);
    res.send('Doing....');
});

app.get('/getPlayerIdsByCountries', function (req, res) {
    getPlayerIdsByCountries(CONSTANTS.COUNTRIES, 0);
    res.send('Doing....');
});

app.get('/convert', function (req, res) {
    convertJsonToCsv(CONVERT_JSON_INPUT_FILE, CONVERT_CSV_OUTPUT_FILE);
    res.send('Doing....');
});

app.get('/fixJson', function (req, res) {
    fixJsonForGK(CONVERT_JSON_INPUT_FILE);
    res.send('Doing....');
});

app.get('/getLiveBoost', function (req, res) {
    //getLiveBoost(res);
    getLiveBoostCurrentWeekFromNexon(res, getLiveBoostFromNexon);
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

function getLiveBoostCurrentWeekFromNexon(res, callblack) {
    request({
        url: LIVEBOOST_NEXON_GET_WEEK_URL,
        proxy: PROXY
    }, function (error, response, html) {
        if (!error) {
            let $ = cheerio.load(html),
                week = $('#LiveBoostCurrentWeek').attr('value');
            if (week) {
                callblack(res, week);
            } else {
                res.send("error");
            }
        } else {
            res.sendStatus(500);
        }
    });
}

function getLiveBoostFromNexon(res, week) {
    request({
        url: LIVEBOOST_NEXON_URL + week,//LIVEBOOST_URL
        proxy: PROXY
    }, function (error, response, html) {
        if (!error) {
            var liveBoostInfo = parseLiveBoostFromNexon(html);
            if (liveBoostInfo) {
                res.send(liveBoostInfo);
            } else {
                res.send("error");
            }
        } else {
            res.sendStatus(500);
        }
    });
}

function getLiveBoost(res) {
    request({
        url: LIVEBOOST_URL,
        proxy: PROXY
    }, function (error, response, html) {
        if (!error) {
            var liveBoostInfo = parseLiveBoost(html);
            if (liveBoostInfo) {
                res.send(liveBoostInfo);
            } else {
                res.send("error");
            }
        } else {
            res.sendStatus(500);
        }
    });
}

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

function getRosterPlayer(playerId) {
    let url = 'http://en.fifaaddict.com/roster_update_2016_second_half.php?player_id=' + playerId;
    request.post({
        url: url,
        proxy: PROXY,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': url
        },
        form: {araiwa: '4e2ae8fb07d15a2f456fc5410a488ad0'}
    }, function (error, response, html) {
        if (!error) {
            let data = JSON.parse(html);
            if (data.status) {

            } else {

            }

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

function getRosterUpdateIds(url, res) {
    request({
        url: url,
        proxy: PROXY
    }, function (error, response, html) {
        if (!error) {
            let playerIds = parseRosterUpdateIds(html);

            console.log('Finished!');
            res.send(playerIds);

        } else {
            console.log('Can not get roster update');
            res.send('Error');
        }
    });
}

function parseRosterUpdateIds(html) {
    let $ = cheerio.load(html);
    let playerIds = [];

    $('.player_list.table .table-row').not('.thead').each(function (i, el) {
        let $el = $(el),
            href = $el.find('.player_link').attr('href'),
            extractedId = href.substring(href.indexOf('=') + 1);
        if (extractedId) {
            playerIds.push(extractedId);
        }
    });

    return playerIds;
}

function getPlayerIds(url, outputFileName, callback) {
    request({
        url: url,
        proxy: PROXY
    }, function (error, response, html) {
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

function parseLiveBoost(html) {
    let $ = cheerio.load(html);
    let liveBoostInfo;

    let $resultDiv = $('#fo3-search-result');
    if ($resultDiv.length > 0) {
        liveBoostInfo = [];

        $resultDiv.find('#playerlistable tr.player-row').each(function (i, el) {
            let $el = $(el),
                id = $el.attr('id'),
                extractedId = extractId(id);
            if (extractedId) {
                let boostValue = $el.find('span.liveboost b').text();
                if (boostValue) {
                    liveBoostInfo.push({id: extractedId, boost: boostValue});
                }
            }
        });
    }

    return liveBoostInfo;
}

function parseLiveBoostFromNexon(html) {
    let $ = cheerio.load(html);
    let liveBoostInfo;

    let $resultDiv = $('.country');
    if ($resultDiv.length > 0) {
        liveBoostInfo = [];

        $resultDiv.find('li a strong.name').each(function (i, el) {
            let $el = $(el),
                extractedId = $el.attr('data-player-id'),
                playerName = $el.text();
            if (extractedId) {
                let boostValue = $el.parent().find('span.boost span').text();
                if (boostValue) {
                    liveBoostInfo.push({id: extractedId, name: playerName, boost: boostValue});
                }
            }
        });
    }

    return liveBoostInfo;
}

function parsePlayerIds(html) {
    let $ = cheerio.load(html);
    let playerIds = [];

    $('#fo3-search-result #playerlistable tr.player-row').each(function (i, el) {
        let $el = $(el),
            id = $el.attr('id'),
            extractedId = extractId(id);
        if (extractedId) {
            playerIds.push(extractedId);
        }
    });

    return playerIds;
}

function extractId(id) {
    let prefix = 'player_id',
        prefixLength = prefix.length;

    return (id.indexOf(prefix) == 0) ? id.substring(prefixLength) : undefined;
}

function getPlayer(playerIds, index, fs) {
    let playerId = playerIds[index];

    if (!playerId || playerId.trim() == '' || playerId.indexOf('//') > - 1 || playerId.indexOf('#') > - 1) {
        // Ignore comment row
        next('Comment', playerId, playerIds, index, fs);
    } else {
        //let url = 'http://en.fifaaddict.com/roster_update_2016_second_half.php?player_id=' + playerId;
        //let url = BASE_PLAYER_ROSTER_URL + playerId;

        let url = 'http://en.fifaaddict.com/api.php?player_compare_id={0}&player_class=player_a';
        url = url.replace('{0}', playerId);

        request.get({
            url: url,
            proxy: PROXY,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': url
            }
        }, function (error, response, html) {
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
        request({
            url: url,
            proxy: PROXY
        }, function (error, response, html) {
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

function getKoreanName(playerIds, index, fs) {
    let playerId = playerIds[index];

    if (!playerId || playerId.trim() == '' || playerId.indexOf('//') > - 1 || playerId.indexOf('#') > - 1) {
        // Ignore comment row
        next('Comment', playerId, playerIds, index, fs);
    } else {
        let url = FIFA_NET_PLAYER_URL + playerId;
        request({
            url: url,
            proxy: PROXY
        }, function (error, response, html) {
            if (!error) {
                let name = parseKoreanName(html, playerId);

                if (name) {
                    // Write Korean Name here
                    fs.appendFileSync(SCAPE_KOREAN_NAME_OUTPUT_FILE, playerId + '-' + name + "\r\n");
                    nextKoreanName('', playerId, playerIds, index, fs);
                } else {
                    console.log('Not Found');
                    fs.appendFileSync(SCAPE_KOREAN_NAME_OUTPUT_FILE, playerId + '-' + 'Not Found' + "\r\n");
                    nextKoreanName(' - Not Found', playerId, playerIds, index, fs);
                }

            } else {
                console.log('Get error for player with id: ' + playerId);
                fs.appendFileSync(SCAPE_KOREAN_NAME_OUTPUT_FILE, playerId + '-' + 'Error' + "\r\n");
                nextKoreanName(' - Error', playerId, playerIds, index, fs);
            }
        });
    }
}

function getLeague(playerIds, index, fs) {
    let playerId = playerIds[index];

    if (!playerId || playerId.trim() == '' || playerId.indexOf('//') > - 1 || playerId.indexOf('#') > - 1) {
        // Ignore comment row
        next('Comment', playerId, playerIds, index, fs);
    } else {
        let url = BASE_PLAYER_URL + playerId;
        request({
            url: url,
            proxy: PROXY
        }, function (error, response, html) {
            if (!error) {
                let league = parseLeague(html, playerId);

                if (league) {
                    // Write league here
                    fs.appendFileSync(SCAPE_LEAGUE_OUTPUT_FILE, playerId + '_' + league + "\r\n");
                    nextLeague('', playerId, playerIds, index, fs);
                } else {
                    console.log('Not Found');
                    fs.appendFileSync(SCAPE_LEAGUE_OUTPUT_FILE, playerId + '-' + 'Not Found' + "\r\n");
                    nextLeague(' - Not Found', playerId, playerIds, index, fs);
                }

            } else {
                console.log('Get error for player with id: ' + playerId);
                fs.appendFileSync(SCAPE_LEAGUE_OUTPUT_FILE, playerId + '-' + 'Error' + "\r\n");
                nextLeague(' - Error', playerId, playerIds, index, fs);
            }
        });
    }
}

function nextLeague(type, playerId, playerIds, index, fs) {
    console.log(index);
    if (type != 'Comment') {
        fs.appendFileSync(SCAPE_LEAGUE_OUTPUT_LOG_FILE, playerId.toString() + type + "\r\n");
    }

    if (index++ < (playerIds.length - 1)) {
        getLeague(playerIds, index, fs);
    } else {
        console.log('Finished!');
    }
}

function parseLeague(html) {
    var $ = cheerio.load(html),
        league;

    let leagueHref = $('.fobreadcrumb').find('li').last().find('a').attr('href');

    if (leagueHref) league = getValueFromHref(leagueHref, 'league');
    console.log(league ? 'OK' : league);
    return league;
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

function nextKoreanName(type, playerId, playerIds, index, fs) {
    console.log(index);
    if (type != 'Comment') {
        fs.appendFileSync(SCAPE_KOREAN_NAME_OUTPUT_LOG_FILE, playerId.toString() + type + "\r\n");
    }

    if (index++ < (playerIds.length - 1)) {
        getKoreanName(playerIds, index, fs);
    } else {
        console.log('Finished!');
    }
}

function parsePlayer(html, playerId) {
    let data = JSON.parse(html);
    if (!data.player_position.overallrating) return undefined;

    //let $ = cheerio.load(data.html);
    //let $f3playerTopInfo = $('.f3player_topinfo');

    let player = {pid: playerId};

    // imageid
    let $f3playerImgCell = cheerio.load(data.player_img_cell);
    let smallImageUrl = $f3playerImgCell('.player_img').attr('src');
    player['imageid'] = smallImageUrl.substring(smallImageUrl.lastIndexOf('/') + 2, smallImageUrl.indexOf('png') - 1);

    // Get player attributes
    let perfcon = '';

    for (var property in data.player_stat) {
        if (property == 'perfcon') {
            perfcon = parsePlayerAttribute(property, data.player_stat[property]);
        } else {
            player[property] = parsePlayerAttribute(property, data.player_stat[property]);
        }
    }

    if (!player['poten']) player['poten'] = 1;
    
    // Localize perfcon attr
    player['perfcon'] = perfcon;
    player['perfcon_vn'] = getLanguageMapping(LANGUAGE_MAPPING.PERF_CON, player['perfcon'], 'vn');
    player['perfcon_cn'] = getLanguageMapping(LANGUAGE_MAPPING.PERF_CON, player['perfcon'], 'cn');
    player['perfcon_id'] = getLanguageMapping(LANGUAGE_MAPPING.PERF_CON, player['perfcon'], 'id');
    player['perfcon_kr'] = getLanguageMapping(LANGUAGE_MAPPING.PERF_CON, player['perfcon'], 'kr');
    player['perfcon_th'] = getLanguageMapping(LANGUAGE_MAPPING.PERF_CON, player['perfcon'], 'th');

    let $playerName = cheerio.load(data.player_name);
    // name
    player['fullname'] = $playerName('b.fullname').text().trim();
    player['shortname'] = $playerName('b.tname').text().trim();
    //player['shortname'] = getShortname(playerName);

    // badged
    player['badged'] = $playerName('.badged').attr('class');
    // season
    //let seasonHref = $f3playerTopInfo.find('.team_color_label_wrapper .team_color_label.label_season').attr('href');
    //player['season'] = getValueFromHref(seasonHref, 'season');
    // TODO lack of this info. Using hardcode for current season
    player['season'] = 'lp';

    // TODO lack of this info
    // league (giai dau)
    //let leagueHref = $('.fobreadcrumb').find('li').last().find('a').attr('href');
    //player['league'] = getValueFromHref(leagueHref, 'league');
    player['league'] = '';

    // positions
    player['overallrating'] = parsePlayerAttribute('overallrating', data.player_position.overallrating);
    let positions = {};
    let positions_recom = data.position_recom.split(',');

    positions_recom.forEach(function (item) {
        let positionKey = item.substring(1);
        if (positionKey == 'gk') {
            positions[positionKey] = player['overallrating'];
        } else {
            positions[positionKey] = getLevel1(data.player_position[positionKey]);
        }
    });

    player['positions'] = positions;

    // skillmoves
    let $skillmoves = cheerio.load(data.player_skillmoves);
    player['skillmoves'] = $skillmoves('.player_skillmoves i').length;

    let $playerInfo = cheerio.load(data.player_info);
    //$playerInfo.append(data.player_info);
    // nation
    player['nation'] = $playerInfo('.player_nation b').text();
    // club
    player['club'] = $playerInfo('.player_club b').text();

    // birthday
    let $values = $playerInfo($playerInfo('.player_info_list')[2]).find('b');
    let birthday = $playerInfo($values[0]).text();
    player['birthday'] = updateBirthday(birthday);
    player['height'] = $playerInfo($values[2]).text();
    player['weight'] = $playerInfo($values[4]).text();

    let $statFoot = cheerio.load(data.stat_foot);
    player['leftfoot'] = $statFoot('.leftfoot').text().trim();
    player['rightfoot'] = $statFoot('.rightfoot').text().trim();

    // attack/defence
    let $formationMap = cheerio.load(data.formation_map);
    player['attack'] = $formationMap('.workrate .att b').text();
    player['defence'] = $formationMap('.workrate .def b').text();

    // speciality & hidden
    let $trait = cheerio.load(data.trait);

    // speciality
    let speciality = [];
    let speciality_vn = [];
    let speciality_cn = [];
    let speciality_kr = [];

    let $speciality = $trait('.trait.speciality.sm');
    $speciality.find('b').each(function (i, el) {
        let value = $trait(el).text().trim();
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
    $trait('.trait.sm').not('.speciality').find('b').each(function (i, el) {
        let hiddenAttr = $trait(el).text().trim();
        hiddenScore.push(hiddenAttr);
        hiddenScore_vn.push(getLanguageMapping(LANGUAGE_MAPPING.HIDDEN_STATS, hiddenAttr, 'vn'));
        hiddenScore_cn.push(getLanguageMapping(LANGUAGE_MAPPING.HIDDEN_STATS, hiddenAttr, 'cn'));
        hiddenScore_kr.push(getLanguageMapping(LANGUAGE_MAPPING.HIDDEN_STATS, hiddenAttr, 'kr'));
    });
    player['hidden_score'] = hiddenScore;
    player['hidden_score_vn'] = hiddenScore_vn;
    player['hidden_score_cn'] = hiddenScore_cn;
    player['hidden_score_kr'] = hiddenScore_kr;

    //liveboost
    player['isliveboost'] = '';
    player['boostvalue'] = '';
        

    console.log(player ? 'OK' : player);

    return player;
}

function updateBirthday(birthday) {
    let yearOld = birthday.substring(birthday.indexOf('(') + 1, birthday.indexOf(')'));
    return birthday.substring(0, birthday.indexOf('(') + 1)  + (parseInt(yearOld) + 1).toString() + ')';
}

function parseImageId(html) {
    var $ = cheerio.load(html),
        imageId;

    if ($('.stat_list').length > 0) {
        let $f3playerTopInfo = $('.f3player_topinfo');
        // imageid
        let smallImageUrl = $f3playerTopInfo.find('.player_img').attr('src');
        imageId = smallImageUrl.substring(smallImageUrl.lastIndexOf('/') + 2, smallImageUrl.indexOf('png') - 1);
    }

    console.log(imageId ? 'OK' : imageId);

    return imageId;
}

function parseKoreanName(html) {
    var $ = cheerio.load(html),
        name;

    let $name = $('.playerInfos ul li strong');
    // name
    if ($name.length > 0) {
        name = $name.text();
    }

    console.log(name ? 'OK' : name);
    return name;
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
    if (CONSTANTS.PLAYER_ATTRIBUTES.indexOf(key) > -1) {
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

function fixJsonForGK(jsonFile) {
    var playersStr = fs.readFileSync(jsonFile).toString();
    var players = {};
    if (playersStr != undefined && playersStr.trim() != '') {
        players = JSON.parse(playersStr);
    }

    for (var playerId in players) {
        var playerInfo = players[playerId];
        if (playerInfo.positions.gk) {
            playerInfo.positions.gk = playerInfo.overallrating;
        }
    }

    fs.writeFileSync(jsonFile, JSON.stringify(players));

    console.log('Finished!');
}

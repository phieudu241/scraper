"use strict";
const express = require('express');
const request = require('request');
const cheerio = require('cheerio');

const app = express();

const LIVEBOOST_NEXON_URL = "http://fifaonline4.nexon.com/datacenter/PlayerList";
const PRICE_NEXON_URL = "http://fifaonline4.nexon.com/datacenter/PlayerPriceGraph";

const PROXY = '';
//var PROXY = 'http://192.168.78.7:8888';

app.set('port', (process.env.PORT || 5000));

app.use(express.static('public'));

app.get('/test', function (req, res) {
    res.send('Hello');
});

app.get('/getLiveBoost', function (req, res) {
    getLiveBoostFromNexon(res);
});

app.get('/getPrice/:playerId', function (req, res) {
    getPrice(res, req.params.playerId, req.query.enchant);
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

function getLiveBoostFromNexon(res) {
    request.post({
        url: LIVEBOOST_NEXON_URL,
        form: {
            n1LivePerfomance: 1,
            strSkill1: 'liveperformance1',
            strSkill2: 'liveperformance2',
            strSkill3: 'liveperformance3',
            strSkill4: 'liveperformance4',
        },
        proxy: PROXY
    }, function (error, response, html) {
        if (!error) {
            console.log('HTML - OK');
            let liveBoostInfo = parseLiveBoostFromNexon(html);
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

function parseLiveBoostFromNexon(html) {
    let $ = cheerio.load(html);
    let liveBoostInfo;

    let $players = $('.tr');
    if ($players.length > 0) {
        liveBoostInfo = [];

        $players.each(function (i, el) {
            let item = {};
            let $el = $(el);
            let overallSpans = $el.find('.td_ar.ovr > span');
            let $playerIdSpan = overallSpans.first();
            let playerId = $playerIdSpan.attr('class').replace('skillData_', '');

            item['playerId'] = playerId;

            if (overallSpans.length > 1) {
                let livePerAmount = $(overallSpans[1]).text().trim();
                item['livePerAmount'] = livePerAmount;
            } else {
                let livePer = $($el.find('.td_ar')[2]).text().trim();
                item['livePer'] = livePer;
            }

            liveBoostInfo.push(item);
        });
    }

    return liveBoostInfo;
}

function getPrice(res, playerId, enchant = 1) {
    console.log('playerId:', playerId);
    request.post({
        url: PRICE_NEXON_URL,
        form: {
            spid: playerId,
            n1strong: enchant
        },
        proxy: PROXY
    }, function (error, response, html) {
        if (!error) {
            console.log('HTML - OK');
            let priceInfo = parsePrice(html);
            if (priceInfo) {
                res.send(priceInfo);
            } else {
                res.send("error");
            }
        } else {
            res.sendStatus(500);
        }
    });
}

function parsePrice(html) {
    let result = {};
    let $ = cheerio.load(html);

    // Get current price
    result.currentPrice = $('.add_info strong').text().trim().replace(/\r\n/g, '');

    // Get price chart json data
    let script = $('script').toString();

    //Remove all spaces
    script = script.replace(/\s/g, '');
    //Remove all new lines
    script = script.replace(/\r\n/g, '');
    //Remove invalid array elements
    script = script.replace(/,]/g, ']');

    let priceChartDataFilterReg = /{.+?(]})/;
    let priceChartDataStr = script.match(priceChartDataFilterReg)[0];

    result.priceChart = JSON.parse(priceChartDataStr);

    return result;
}
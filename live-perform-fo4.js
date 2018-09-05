"use strict";
const express = require('express');
const request = require('request');
const cheerio = require('cheerio');

const app = express();

const LIVEBOOST_NEXON_URL = "http://fifaonline4.nexon.com/datacenter/PlayerList";

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
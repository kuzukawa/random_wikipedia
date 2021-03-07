'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// createExpress app
const app = express();

// Alive monitoring (to keep up Heroku)
app.get('/alive', (req, res) => {
  return res.send('I\'m alive.');
});

app.post('/callback', line.middleware(config), (req, res) => {
  //console.log(req.body.events);

  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent(event) {
  if(event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  const w_arr = ['うぃき', 'ウィキ', 'wiki'];
  // create a text message
  if(w_arr.includes(event.message.text)) {
    getRandomArticle(replyText => {
     const reply = { type: 'text', text: replyText};

      // use reply API
      return client.replyMessage(event.replyToken, reply);
    });
  }
  else {
    //const echo = { type: 'text', text: event.message.text};
    const reply = { type: 'text', text: 'ごめん！今はまだできないっ👻'};

    // use reply API
    return client.replyMessage(event.replyToken, reply);
  }
}

// get random article from wikipedia
function getRandomArticle(callback) {
  const url = 'https://ja.wikipedia.org/w/api.php?format=json&action=query&generator=random&grnnamespace=0&prop=info&inprop=url&indexpageids';
  
  axios.get(url)
    .then(res => {
      const item = res.data;
  
      // 取得したページのIDを取得
      const pageID = item.query.pageids;
      // ページのタイトルを取得
      const pageTitle = item.query.pages[pageID].title;
      // ページのURLを取得
      const pageUrl = item.query.pages[pageID].fullurl;
      
      // リプライ用のテキスト生成
      const replyText  = 'こんな記事はどう😆！？'+'\n' + 
      '【'+pageTitle +'】'+'\n' +
      pageUrl;
      
      callback(replyText);
    })
    .catch(err => {
      callback("ごめん！失敗した！！");
      console.log(err);
    })
}
// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`)
});

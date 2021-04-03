const express = require('express')
const expressLess = require('express-less');
const fetch = require('sync-fetch');
const app = express()
const port = 8855
const bbcode = require('./bbcode');

const subforums = [3, 4, 5, 6];
let store = [];
let threadstore = [];
let topitems = [];
let topitemsstore = [];
// How long is our memory
const frontpageintervaltime = 900000;
// const frontpageintervaltime = 90000000000000000000000000000000; // debug is fun!
const articleintervaltime = 300000;
// const articleintervaltime = 30000000000000000000000000000000; // debug is fun!

// Reverse sort array
function CompareNumbers(a, b) {
  if (parseInt(a.id) < parseInt(b.id)) return 1;
  if (parseInt(a.id) > parseInt(b.id)) return -1;
  return 0;
}

function FetchThread(id) {
  let stored;
  threadstore.forEach(element => {
    if (element.id == id) {
      console.log("loaded " + id)
      stored = element;
    }
  });
  if (!stored) {
    let response = fetch("https://api.knockout.chat/" + 'thread/' + id);
    let data = response.json()
    if (data.message || data.totalPosts == 0) {
      return false;
    }
    else {
      console.log("saved " + id)
      threadstore.push(data)
      stored = data;
    }
  }
  return stored;
}

function FrontpageInterval() {
  store = [];
  topitems = [];
  topitemsstore = [];
  subforums.forEach(element => {
    let response = fetch("https://api.knockout.chat/subforum/" + element);
    let threads = response.json()
    threads.threads.forEach(element => {
      element.viewers = (element.viewers.memberCount + element.viewers.guestCount)
      if (!element.pinned && !element.locked) {
        store.push(element)
      }

    });
  });
  topitemsstore = store;
  topitemsstore.sort(function (a, b) {
    return b.viewers - a.viewers;
  });

  // jus loop it for now
  for (let index = 0; index < 6; index++) {
    topitems.push(topitemsstore[index])
  }
  console.log("frontpage refresh done")
}

function ArticleInterval() {
  threadstore = [];
  console.log("article purge done")
}

// setup and update loop stuff
FrontpageInterval()

// refresh frontpage
setInterval(FrontpageInterval, frontpageintervaltime); // Refresh frontpage every 15 minutes
setInterval(ArticleInterval, articleintervaltime); // clear threadstore every 5 minutes, just so we can reload without hammering knockout

// App stuff
app.set('view engine', 'pug')
app.use(express.static('public'))
app.use('/static', express.static('public'))
app.use('/less-css', expressLess(__dirname + '/less'));

// Get page stuff
app.get('/', (req, res) => {
  store.sort(CompareNumbers) // This is bad, but needed for now
  res.render('news_index', { items: store, top: topitems, page: 'home' })
})

// reload the thread list
app.get('/refresh', (req, res) => {
  FrontpageInterval()
  res.redirect('/')
})

// sort it by hand
app.get('/resort', (req, res) => {
  store.sort(CompareNumbers)
  res.redirect('/')
})

app.get('/view/:id', (req, res) => {
  console.log('reqeust for ' + req.params.id)
  let thread = FetchThread(req.params.id);
  for (let index = 0; index < thread.posts.length; index++) {
    thread.posts[index].content = bbcode.render(thread.posts[index].content)
  }
  res.render("news_view", { thread: thread, page: 'article' })
})

// Boring listen
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
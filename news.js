const express = require('express')
const expressLess = require('express-less');

const fetch = require('sync-fetch');
const app = express()
const port = 8855
const bbcode = require('./bbcode');


app.set('view engine', 'pug')
app.use(express.static('public'))
app.use('/static', express.static('public'))
app.use('/less-css', expressLess(__dirname + '/less'));

let subforums = [3,4,5,6];
let store = [];

subforums.forEach(element => {
  let response = fetch("https://api.knockout.chat/subforum/"+element);
  console.log(response)
  let threads = response.json()
  threads.threads.forEach(element => {
    element.viewers= (element.viewers.memberCount+element.viewers.guestCount)
    if(element.pinned != true && element.locked !=true)
    {
      store.push(element)
    }
    
  });
});

let topitems = [];
let topitemsstore = store;

function compareNumbers(a, b) {
  if(parseInt(a.id) < parseInt(b.id)) return 1;
  if(parseInt(a.id) > parseInt(b.id)) return -1;
  return 0;
}

topitemsstore.sort(function (a, b) {
  return b.viewers - a.viewers;
});

for (let index = 0; index < 6; index++) {
  topitems.push(topitemsstore[index])
}


app.get('/', (req, res) => {


  store.sort(compareNumbers)
  res.render('news_index', { items: store, top: topitems })
})

function FetchThread(id) {
  let response = fetch("https://api.knockout.chat/" + 'thread/' + id);
  let data = response.json()
  if (data.message||data.totalPosts==0) {
      return false;
  }
  else {
      return data;
  }
}

app.get('/view/:id', (req, res) => {
  thread = FetchThread(req.params.id);
  for (let index = 0; index < thread.posts.length; index++) {
    thread.posts[index].content = bbcode.render(thread.posts[index].content)
  }

  //console.log(JSON.parse(JSON.stringify(thread)))
  res.render("news_view",{thread: thread})
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
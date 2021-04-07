const express = require('express')
const expressLess = require('express-less');
const fetch = require('sync-fetch');
const app = express()
const port = 8855
const bbcode = require('./bbcode');
const CentralDate = require('./CentralDate');
const rundate = CentralDate.Get()
const loglevel = 5;
// subforum ids
//const subforums = [4];
const subforums = [1, 3, 4, 5, 6];
const kourl = "https://api.knockout.chat/"

function Logger(type,level,message) {
  if (level <= loglevel) {
    console.log(type+"."+level+": "+message)
  }
}

// Main storage
let storage = {
  subforum: [], // Complete firstpages of subforums
  menusubforum: [], // Menu links to subforums
  thread: [], // thread/article we keep in memory for faster loading
  threadid: [], // thread numbers
  threadidvalid: [], // storage of ids that can be viewed so it doesn't become a generic proxy
  topitems: [] // threads with many viewers
}

// How long is our memory
const frontpageintervaltime = 900000;
// const frontpageintervaltime = 90000000000000000000000000000000; // debug is fun!
const articleintervaltime = 300000;
// const articleintervaltime = 30000000000000000000000000000000; // debug is fun!
const maxtopitems = 6

// Reverse sort array
function CompareNumbers(a, b) {
  if (parseInt(a.id) < parseInt(b.id)) return 1;
  if (parseInt(a.id) > parseInt(b.id)) return -1;
  return 0;
}

// forum thread loader and storer
function FetchThread(id) {
  Logger("FetchThread",1,`Request ${id}`)
  if (storage.threadid.includes(id)) {
    Logger("FetchThread",2,`Loaded ${id}`)
  }
  else {
    let response = fetch(`${kourl}thread/${id}`);
    let data = response.json()
    if (data.message || data.totalPosts == 0) {
      return false;
    }
    else {
      // convert bbcode, could just foreach
      data.date = CentralDate.Get(data.createdAt)
      for (let index = 0; index < data.posts.length; index++) {
        data.posts[index].content = bbcode.render(data.posts[index].content)
        data.posts[index].date = CentralDate.Get(data.posts[index].createdAt)
      }
      Logger("FetchThread",2,`Saved ${id}`)
      storage.threadid.push(id)
      storage.thread[id] = data
    }
  }
  return storage.thread[id]; // bad idea as it could not exist
}

// frontpage lister
function FrontpageInterval() {
  Logger("FrontpageInterval",1,"Request")
  storage.subforum =[];
  let tempstorage = {
    subforum: []
  }
  subforums.forEach(element => {
    Logger("FrontpageInterval",2,"Loading sub "+element)
    let response = fetch(`${kourl}subforum/${element}`);
    let targetssubforums = response.json()
    //if(storage.menusubforum[element]==undefined)
    //{
      //storage.menusubforum[element] = {id:element.id,subname:element.name}
    //}
    targetssubforums.threads.forEach(element => {
      Logger("FrontpageInterval",3,"Scanning sub "+element.id)
      element.viewers = (element.viewers.memberCount + element.viewers.guestCount)
      let ThreadDate=CentralDate.Get(element.createdAt)
      element.date = ThreadDate
      element.dateshort = ThreadDate.Date+"-"+ThreadDate.Month+"-"+ThreadDate.Year
      element.subforumName=targetssubforums.name
      if (!element.pinned && !element.locked && element.date.Year==rundate.Year&&element.date.Month >= (rundate.Month-2)) {
        //storage.threadidvalid.push(element.id)
        if (tempstorage.subforum[element.dateshort]==undefined){
          tempstorage.subforum[element.dateshort] = {id:ThreadDate.Time,objects:[],date:ThreadDate}
          tempstorage.subforum[element.dateshort].objects.push(element)
        }
        else {
          tempstorage.subforum[element.dateshort].objects.push(element)
        }
        //storage.subforum.push(element) // we really need to group by date
      }
    });
  });

  for (var key in tempstorage.subforum) {
    tempstorage.subforum[key].objects.sort(CompareNumbers)
    storage.subforum.push(tempstorage.subforum[key])
  }

  // // sort threads
  storage.subforum.sort(CompareNumbers)

  Logger("FrontpageInterval",1,"frontpage refresh done")
}

// purges articles
function ArticleInterval() {
  storage.threadstore = [];
  storage.threadid = [];
  Logger("Interval",1,"article purge done")
}

// setup
Logger("Start",0,"Starting can be slow")
FrontpageInterval()

// refresh frontpage
setInterval(FrontpageInterval, frontpageintervaltime); // Refresh frontpage every 15 minutes
setInterval(ArticleInterval, articleintervaltime); // clear threadstore every 5 minutes, edit less and pug without hammerin the server

// App stuff
app.set('view engine', 'pug')
app.use(express.static('public'))
app.use('/static', express.static('public'))
app.use('/less-css', expressLess(__dirname + '/less'));

// Get page stuff
app.get('/', (req, res) => {
  Logger("app/",2,"Frontpage load")
  res.render('news_index', { items: storage.subforum, top: storage.topitems, page: 'home', menu: storage.menusubforum })
})

// reload the thread list
app.get('/refresh', (req, res) => {
  Logger("app/refresh",1,"forcing refresh")
  FrontpageInterval()
  res.redirect('/')
})

// sort it by hand
app.get('/resort', (req, res) => {
  Logger("app/resort",1,"forcing sorting")
  storage.subforum.sort(CompareNumbers) // Broken?
  res.redirect('/')
})

app.get('/view/:id', (req, res) => {
  Logger("/view/:id",2,'reqeust for ' + req.params.id)
  //console.log(storage.menusubforum)
  //console.log(storage.threadidvalid)
  //if (storage.threadidvalid.includes(req.params.id))
  //{
    let thread = FetchThread(req.params.id);
    res.render("news_view", { thread: thread, page: 'article', menu: storage.menusubforum })
  //}
  //else {
  //  res.redirect('/');
  //}
})

// Boring listen
app.listen(port, () => {
  Logger("Start",0,`app listening at http://localhost:${port}`)
})
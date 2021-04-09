const express = require('express')
const expressLess = require('express-less');
const fetch = require('node-fetch');
const compression = require('compression')
const pug = require('pug');
const app = express()
const port = 8855
const bbcode = require('./bbcode');
const CentralDate = require('./CentralDate');
const rundate = CentralDate.Get()
let loglevel = 0
let devmode = false
const starargs = process.argv.slice(2);

if(starargs[0] == "dev")
{
  devmode = true
  loglevel = starargs[1]
}
else if (starargs[0]) {
  loglevel = starargs[0]
}
else {
  loglevel = 0
}


// subforum ids
//const subforums = [4];
const subforums = [1, 3, 4, 5, 6];
const kourl = "https://api.knockout.chat/"

function Logger(type, level, message) {
  if (level <= loglevel) {
    console.log(type + "." + level + ": " + message)
  }
}

// Main storage
let storage = {
  subforum: [], // Complete firstpages of subforums
  menusubforum: [], // Menu links to subforums
  thread: [], // thread/article we keep in memory for faster loading
  threadid: [], // thread numbers
  threadidvalid: [], // storage of ids that can be viewed so it doesn't become a generic proxy
  topitems: [], // threads with many viewers
  frontpage: "" // prerender frontpage
}

// How long is our memory
const frontpageintervaltime = 900000;
// const frontpageintervaltime = 90000000000000000000000000000000; // debug is fun!
const articleintervaltime = 7200000;
// const articleintervaltime = 30000000000000000000000000000000; // debug is fun!
const maxtopitems = 6

// Reverse sort array
function CompareNumbers(a, b) {
  if (parseInt(a.id) < parseInt(b.id)) return 1;
  if (parseInt(a.id) > parseInt(b.id)) return -1;
  return 0;
}

// forum thread loader and storer
async function FetchThread(id) {
  Logger("FetchThread", 2, `Request ${id}`)
  if (storage.threadid.includes(id)) {
    Logger("FetchThread", 3, `Loaded ${id}`)
  }
  else {
    let response = await fetch(`${kourl}thread/${id}`);
    let data = await response.json()
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
      Logger("FetchThread", 3, `Saved ${id}`)
      storage.threadid.push(id)
      if (devmode) {
        storage.thread[id] = data
      }
      else {
        storage.thread[id] = pug.renderFile("news_view", { thread: data, page: 'article', menu: storage.menusubforum })
      }
      
    }
  }
  return storage.thread[id]; // bad idea as it could not exist
}

// frontpage lister

async function FrontpageInterval() {
  Logger("FrontpageInterval", 2, "Request")
  storage.subforum = [];
  storage.topitems = [];
  let tempstorage = {
    subforum: []
  }

  for (let index = 0; index < subforums.length; index++) {
    const element = subforums[index];
    Logger("FrontpageInterval", 2, "Loading sub " + element)
    let response = await fetch(`${kourl}subforum/${element}`);
    let targetssubforums = await response.json()
    //if(storage.menusubforum[element]==undefined)
    //{
    //storage.menusubforum[element] = {id:element.id,subname:element.name}
    //}
    for (let xindex = 0; xindex < targetssubforums.threads.length; xindex++) {
      const xelement = targetssubforums.threads[xindex];
      Logger("FrontpageInterval", 3, "Scanning sub " + xelement.id)
      xelement.viewers = (xelement.viewers.memberCount + xelement.viewers.guestCount)
      let ThreadDate = CentralDate.Get(xelement.createdAt)
      xelement.date = ThreadDate
      xelement.dateshort = ThreadDate.Date + "-" + ThreadDate.Month + "-" + ThreadDate.Year
      xelement.subforumName = targetssubforums.name
      if (!xelement.pinned && !xelement.locked && xelement.date.Year == rundate.Year && xelement.date.Month >= (rundate.Month - 2)) {
        //storage.threadidvalid.push(element.id)
        if (tempstorage.subforum[xelement.dateshort] == undefined) {
          tempstorage.subforum[xelement.dateshort] = { id: ThreadDate.Time, objects: [], date: ThreadDate }
          tempstorage.subforum[xelement.dateshort].objects.push(xelement)
        }
        else {
          tempstorage.subforum[xelement.dateshort].objects.push(xelement)
        }
        //storage.subforum.push(element) // we really need to group by date
      }
      if (xelement.pinned && !xelement.locked) {
        storage.topitems.push(xelement)
      }
    }
  }

  for (var key in tempstorage.subforum) {
    tempstorage.subforum[key].objects.sort(CompareNumbers)
    storage.subforum.push(tempstorage.subforum[key])
  }

  // // sort threads
  storage.subforum.sort(CompareNumbers)
  if(!devmode)
  {
    storage.frontpage = pug.renderFile("news_view", { thread: storage.subforum, page: 'article', menu: storage.menusubforum })
  }
  Logger("FrontpageInterval", 1, "frontpage refresh done")
}

// purges articles
function ArticleInterval() {
  storage.threadstore = [];
  storage.threadid = [];
  Logger("ArticleInterval", 1, "article purge done")
}

// setup
Logger("Start", 0, "Starting can be slow")
FrontpageInterval();

// refresh frontpage
setInterval(FrontpageInterval, frontpageintervaltime); // Refresh frontpage every 15 minutes
setInterval(ArticleInterval, articleintervaltime); // clear threadstore every 2 hours, we really do not care about comments

// App stuff
if (devmode)
{
  app.set('view engine', 'pug')
}

app.use(express.static('public'))
app.use('/static', express.static('public'))
app.use('/less-css', expressLess(__dirname + '/less'));
app.use(compression())

// Get page stuff
app.get('/', async (req, res) => {
  Logger("app/", 2, "Frontpage load")
  if (devmode)
  {
    res.render('news_index', { items: storage.subforum, top: storage.topitems, page: 'home', menu: storage.menusubforum })
  }
  else {
    res.send(storage.frontpage);
  }
  
})

// reload the thread list
app.get('/refresh', async (req, res) => {
  Logger("app/refresh", 1, "forcing refresh")
  FrontpageInterval()
  res.redirect('/')
})

// sort it by hand
app.get('/resort', async (req, res) => {
  Logger("app/resort", 1, "forcing sorting")
  storage.subforum.sort(CompareNumbers) // Broken?
  res.redirect('/')
})

app.get('/view/:id', async (req, res) => {
  Logger("/view/:id", 2, 'reqeust for ' + req.params.id)
  //console.log(storage.menusubforum)
  //console.log(storage.threadidvalid)
  //if (storage.threadidvalid.includes(req.params.id))
  //{
  let thread = await FetchThread(req.params.id);
  if (devmode)
  {
    res.render("news_view", { thread: data, page: 'article', menu: storage.menusubforum })
  }
  else {
    res.send(thread);
  }
  
  //}
  //else {
  //  res.redirect('/');
  //}
})

// Boring listen
app.listen(port, async () => {
  Logger("Start", 0, `app listening at http://localhost:${port}`)
})
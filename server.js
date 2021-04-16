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

// Simple console function
function Logger(type, level, message) {
  if (level <= loglevel) {
    console.log(type + "." + level + ": " + message)
  }
}

const starargs = process.argv.slice(2);
if (starargs[0] == "dev") {
  devmode = true
  loglevel = 5
}
else if (starargs[0]) {
  loglevel = starargs[0]
  if (loglevel > 0) {
    Logger('Start', 0, 'Console output will hurt preformance')
  }
}
else {
  loglevel = 0
}


// subforum ids
const subforums = [
  { id: 1, name: "General Discussion" },
  { id: 3, name: "Gaming" },
  { id: 4, name: "Videos" },
  { id: 5, name: "Politics" },
  { id: 6, name: "News" }
];
const kourl = "https://api.knockout.chat/"

// Main storage
let storage = {
  subforum: [], // Complete firstpages of subforums
  menusubforum: subforums, // Menu links to subforums
  thread: [], // thread/article we keep in memory for faster loading
  threadrender: [], // renderd thread
  threadid: [], // thread numbers
  threadidvalid: [], // storage of ids that can be viewed so it doesn't become a generic proxy
  topitems: [], // threads with many viewers
  frontpage: "", // prerender frontpage
  subforumrender: []
}

// How long is our memory
const frontpageintervaltime = 900000;
// const frontpageintervaltime = 90000000000000000000000000000000; // debug is fun!
//const articleintervaltime = 7200000;
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

  // Fecth the thread. more ideal would using .then
  let response = await fetch(`${kourl}thread/${id}`);
  let data = await response.json()

  // Probably broken has data check
  if (data.message || data.totalPosts == 0) {
    return false;
  }
  else {
    // Do we know this thread?
    if (!storage.threadid.includes(id)) {
      data.createdAt = CentralDate.Get(data.createdAt) // Convert date to date array
      data.updatedAt = CentralDate.Get(data.updatedAt) //  Convert date to date array
      // Loop all posts in thread
      for (let index = 0; index < data.posts.length; index++) {
        data.posts[index].content = bbcode.render(data.posts[index].content) // Convert post bbcode to html
        data.posts[index].createdAt = CentralDate.Get(data.posts[index].createdAt) // Convert date to date array
        data.posts[index].updatedAt = CentralDate.Get(data.posts[index].updatedAt) // Convert date to date array
      }
      // Save the results
      Logger("FetchThread", 3, `Saved ${id}`)
      storage.threadid.push(id.toString())
      // Are we in dev mode?
      if (devmode) {
        // Save the json
        storage.thread[id] = data
      }
      else {
        // Save the json and prerender thread
        storage.thread[id] = data
        storage.threadrender[id] = pug.renderFile("views/news_view.pug", { thread: data, page: 'article', menu: storage.menusubforum })
      }
    }
    else {
      // We already know this one and do nothing
      Logger("FetchThread", 3, `Loaded ${id}`)
    }
  }
  // Return the thread
  return storage.thread[id];
}

// Creat the frontpage
async function FrontpageInterval() {
  Logger("FrontpageInterval", 2, "Request")
  // Clear the storage, probably can be done later to prevent a whitepage
  storage.subforum = [];
  storage.topitems = [];
  storage.threadidvalid = [];

  // Create a temp storage
  let tempstorage = {
    subforum: []
  }

  // Loop all the subforums we want
  for (let index = 0; index < subforums.length; index++) {
    // Pretend this is a for each
    const element = subforums[index].id;
    Logger("FrontpageInterval", 2, "Loading sub " + element)

    // Fecth the thread. more ideal would using .then. Skipped for now because async issues
    let response = await fetch(`${kourl}subforum/${element}`);
    let targetssubforums = await response.json()

    // Loop the threads
    for (let xindex = 0; xindex < targetssubforums.threads.length; xindex++) {
      // Pretend this is a for each
      const xelement = targetssubforums.threads[xindex];
      Logger("FrontpageInterval", 3, "Scanning sub " + xelement.id)
      // Count up the viewers
      xelement.viewers.total = (xelement.viewers.memberCount + xelement.viewers.guestCount)
      let ThreadDate = CentralDate.Get(xelement.createdAt) // remove
      // Create a date format for grouping
      ThreadDate.dateshort = ThreadDate.Date + "-" + ThreadDate.Month + "-" + ThreadDate.FullYear
      // Convert dates to array
      xelement.createdAt = CentralDate.Get(xelement.createdAt)
      xelement.updatedAt = CentralDate.Get(xelement.updatedAt)
      // Store in which subforum the thread is in
      xelement.subforumName = targetssubforums.name
      // Ignore pinned and locked. Only get this years and recent months
      if (!xelement.pinned && !xelement.locked && xelement.createdAt.FullYear == rundate.FullYear && xelement.createdAt.Month >= (rundate.Month - 2)) {
        // Store that this exists thread
        storage.threadidvalid.push(xelement.id.toString())
        // Does the group exist?
        if (tempstorage.subforum[ThreadDate.dateshort] == undefined) {
          // Creat a group, using time as a unique ID
          tempstorage.subforum[ThreadDate.dateshort] = { id: ThreadDate.Time, objects: [], date: ThreadDate }
          // push threads to group
          tempstorage.subforum[ThreadDate.dateshort].objects.push(xelement)
        }
        else {
          // push threads to group
          tempstorage.subforum[ThreadDate.dateshort].objects.push(xelement)
        }
      }
      // Store pinned and not locked threads seperate
      if (xelement.pinned && !xelement.locked) {
        storage.topitems.push(xelement)
      }
    }
  }
  // Loop stored groups
  for (var key in tempstorage.subforum) {
    tempstorage.subforum[key].objects.sort(CompareNumbers) // Sort the threads in the group
    storage.subforum.push(tempstorage.subforum[key]) // Pus the current group to the main storage
  }
  // Sort the group
  storage.subforum.sort(CompareNumbers)

  // Loop through the first group (the today one) and prerender those
  for (let index = 0; index < storage.subforum[0].objects.length; index++) {
    // We store the thread id
    let storedid = storage.subforum[0].objects[index].id
    // and as a string
    let storedidt = storedid.toString()
    // Prerender if it does not exist or has new comments but not beyond the first page
    if (storedid == undefined || !storage.threadid.includes(storedidt) || (storage.subforum[0].objects[index].postCount != storage.thread[storedid].postCount && storage.subforum[0].objects[index].postCount < 19)) {
      await FetchThread(storage.subforum[0].objects[index].id)
    }
  }

  for (let index = 0; index < subforums.length; index++) {
    const element = subforums[index];
    storage.subforumrender[element.id] = pug.renderFile('views/news_subforum.pug', { subforumitems: JSON.parse(JSON.stringify(storage.subforum)), top: storage.topitems, page: 'subforum', subforumid: element.id, menu: storage.menusubforum })
  }
  // In production we prerender the entire page
  if (!devmode) {
    storage.frontpage = pug.renderFile("views/news_index.pug", { subforumitems: storage.subforum, top: storage.topitems, page: 'home', menu: storage.menusubforum })
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
//setInterval(ArticleInterval, articleintervaltime); // clear threadstore every 2 hours, we really do not care about comments

// App stuff
app.use(express.static('public'))
app.use('/static', express.static('public'))

// devmode plays by different rules
if (devmode) {
  app.set('view engine', 'pug')
  app.use('/less-css', expressLess(__dirname + '/less'));
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
}
else {
  app.use('/less-css', expressLess(__dirname + '/less', { cache: true, compress: true }));
  app.use(compression())
}

// Land page
app.get('/', async (req, res) => {
  Logger("app/", 2, "Frontpage load")
  // Rerender in devmode, else static
  if (devmode) {
    res.render('news_index', { subforumitems: JSON.parse(JSON.stringify(storage.subforum)), top: storage.topitems, page: 'home', menu: storage.menusubforum })
  }
  else {
    res.send(storage.frontpage);
  }

})

app.get('/subforum/:id', async (req, res) => {
  if (devmode) {
    res.render('news_subforum', { subforumitems: JSON.parse(JSON.stringify(storage.subforum)), top: storage.topitems, page: 'subforum', subforumid: parseInt(req.params.id), menu: storage.menusubforum })
  }
  else {
    res.send(storage.subforumrender[req.params.id]);
  }
})

// Articles
app.get('/view/:id', async (req, res) => {
  Logger("/view/:id", 2, 'reqeust for ' + req.params.id)
  // Do we know this article?
  if (storage.threadidvalid.includes(req.params.id) || devmode) {
    // Rerender in devmode, else static
    let thread;
    // Load the thread if not stored while in devmode
    if (!storage.threadid.includes(req.params.id)) {
      thread = await FetchThread(req.params.id);
    }

    if (devmode) {

      res.render("news_view", { thread: storage.thread[req.params.id], page: 'article', menu: storage.menusubforum })
    }
    else {
      res.send(storage.threadrender[req.params.id]);
    }

  }
  else {
    res.redirect('/');
  }
})

// Boring listen
app.listen(port, async () => {
  Logger("Start", 0, `app listening at http://localhost:${port}`)
})
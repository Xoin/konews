const express = require('express')
const expressLess = require('express-less');
const compression = require('compression')
const app = express()
const CentralDate = require('./CentralDate');
const { FetchThread } = require("./FetchThread");
const { FrontpageInterval } = require("./FrontpageInterval");
const { Logger } = require("./Logger");
const { CompareNumbers } = require("./CompareNumbers");
const { ThreadStorage } = require("./ThreadStorage");
const { devmode, loglevel, port } = require("./port");
const rundate = CentralDate.Get();
exports.rundate = rundate;

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


const FrontPageIntervalTime = 900000;
const maxtopitems = 6

// setup
Logger("Start", 0, "Starting can be slow")
FrontpageInterval();

setInterval(FrontpageInterval, FrontPageIntervalTime);

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
    ThreadStorage.SubForum.sort(CompareNumbers) // Broken?
    res.redirect('/')
  })

  app.get('/api/frontpage', async (req, res) => {
    res.send({ subforumitems: JSON.parse(JSON.stringify(ThreadStorage.SubForum)), top: ThreadStorage.TopItems, page: 'home', menu: ThreadStorage.MenuSubForum });
  })

  app.get('/api/subforum/:id', async (req, res) => {
    res.send({ subforumitems: JSON.parse(JSON.stringify(ThreadStorage.SubForum)), top: ThreadStorage.TopItems, page: 'subforum', subforumid: parseInt(req.params.id), menu: ThreadStorage.MenuSubForum });
  })
  app.get('/api/view/:id', async (req, res) => {
    res.send({ thread: ThreadStorage.Thread[req.params.id], page: 'article', menu: ThreadStorage.MenuSubForum });
  })
  app.get('/api/view/:id', async (req, res) => {
    res.send(ThreadStorage);
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
    res.render('news_index', { subforumitems: JSON.parse(JSON.stringify(ThreadStorage.SubForum)), top: ThreadStorage.TopItems, page: 'home', menu: ThreadStorage.MenuSubForum })
  }
  else {
    res.send(ThreadStorage.Frontpage);
  }

})

app.get('/subforum/:id', async (req, res) => {
  if (devmode) {
    res.render('news_subforum', { subforumitems: JSON.parse(JSON.stringify(ThreadStorage.SubForum)), top: ThreadStorage.TopItems, page: 'subforum', subforumid: parseInt(req.params.id), menu: ThreadStorage.MenuSubForum })
  }
  else {
    res.send(ThreadStorage.SubForumRender[req.params.id]);
  }
})

// Articles
app.get('/view/:id', async (req, res) => {
  Logger("/view/:id", 2, 'reqeust for ' + req.params.id)
  // Do we know this article?
  if (ThreadStorage.ThreadInvalid.includes(req.params.id) || devmode) {
    // Rerender in devmode, else static
    let thread;
    // Load the thread if not stored while in devmode
    if (!ThreadStorage.ThreadID.includes(req.params.id)) {
      thread = await FetchThread(req.params.id);
    }

    if (devmode) {

      res.render("news_view", { thread: ThreadStorage.Thread[req.params.id], page: 'article', menu: ThreadStorage.MenuSubForum })
    }
    else {
      res.send(ThreadStorage.ThreadRender[req.params.id]);
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

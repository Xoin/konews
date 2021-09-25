const express = require('express')
const expressLess = require('express-less');
const compression = require('compression')
const app = express()
const { Logger } = require("./Logger");

const ThreadStorage = require("./ThreadStorage");
let { devmode, loglevel, port } = require("./port");

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

let ThreadStore = new ThreadStorage.Thread()

const FrontPageIntervalTime = 1800000;
let SubFroumStorage = new ThreadStorage.Index()

const maxtopitems = 6

// setup
Logger("Start", 0, "Starting can be slow")

async function FrontpageInterval() {
  Logger("FrontpageInterval", 2, "Request");
  await SubFroumStorage.UpdateAll()
}
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

}
else {
  app.use('/less-css', expressLess(__dirname + '/less', { cache: true, compress: true }));
  app.use(compression())
}

// Land page
app.get('/', async (req, res) => {
  Logger("app/", 2, "Frontpage load")
  res.send(SubFroumStorage.IndexRender);
})

app.get('/subforum/:id', async (req, res) => {
  Logger("/subforum/:id", 2, 'reqeust for ' + req.params.id)
  res.send(SubFroumStorage.GetRenderSubForum(req.params.id));

})

// Articles
app.get('/view/:id', async (req, res) => {
  Logger("/view/:id", 2, 'reqeust for ' + req.params.id)
  const request = await ThreadStore.AddThread(req.params.id)
  console.log(request)
  if (request) {
    res.send(ThreadStore.GetRender(req.params.id));
  }
  else {
    res.redirect('/');
  }
})

// Boring listen
app.listen(port, async () => {
  Logger("Start", 0, `app listening at http://localhost:${port}`)
})

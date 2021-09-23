const fetch = require('node-fetch');
const pug = require('pug');
const bbcode = require('./bbcode');
const {CentralDate} = require('./CentralDate');
const { kourl, devmode } = require("./port");
const { ThreadStorage } = require("./ThreadStorage");
const { Logger } = require("./Logger");

class ForumThread {
  Posts()
  {
    return this.Data.posts.length
  }
  Post(PostID) {
    this.Data.posts[PostID].content = bbcode.render(this.Data.posts[PostID].content); // Convert post bbcode to html
    this.Data.posts[PostID].createdAt = CentralDate(this.Data.posts[PostID].createdAt); // Convert date to date array
    this.Data.posts[PostID].updatedAt = CentralDate(this.Data.posts[PostID].updatedAt); // Convert date to date array
  }
  Thread() {
    return this.Data
  }
  constructor(ThreadData) {
    this.Data = ThreadData;
    this.Data.createdAt = CentralDate(this.Data.createdAt); // Convert date to date array
    this.Data.updatedAt = CentralDate(this.Data.updatedAt); //  Convert date to date array
  }
}

async function FetchThread(ThreadID) {
  Logger("FetchThread", 2, `Request ${ThreadID}`);
  let FetchResponse = await fetch(`${kourl}thread/${ThreadID}`);
  if (!FetchResponse.ok) {
    return false;
  }
  let ThreadData = await FetchResponse.json();
  
  if (!ThreadStorage.ThreadID.includes(ThreadID)) {
    const CurrentThread = new ForumThread(ThreadData);
    for (let PostID = 0; PostID < CurrentThread.Posts(); PostID++) {
      CurrentThread.Post(PostID)
    }
    Logger("FetchThread", 3, `Saved ${ThreadID}`);
    ThreadStorage.ThreadID.push(ThreadID.toString());
    if (devmode) {
      ThreadStorage.Thread[ThreadID] = CurrentThread.Thread();
    }
    else {
      ThreadStorage.Thread[ThreadID] = CurrentThread.Thread();
      ThreadStorage.ThreadRender[ThreadID] = pug.renderFile("views/news_view.pug", { thread: CurrentThread.Thread(), page: 'article', menu: ThreadStorage.MenuSubForum });
    }
  }
  else {
    Logger("FetchThread", 3, `Loaded ${ThreadID}`);
  }
  return ThreadStorage.Thread[ThreadID];
}
exports.FetchThread = FetchThread;

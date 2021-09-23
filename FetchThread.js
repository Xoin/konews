const fetch = require('node-fetch');
const pug = require('pug');
const bbcode = require('./bbcode');
const CentralDate = require('./CentralDate');
const { kourl, devmode } = require("./port");
const { ThreadStorage } = require("./ThreadStorage");
const { Logger } = require("./Logger");

// forum thread loader and storer

async function FetchThread(ThreadID) {
  Logger("FetchThread", 2, `Request ${ThreadID}`);
  // Fecth the thread. more ideal would using .then
  let FetchResponse = await fetch(`${kourl}thread/${ThreadID}`);
  // Do we get something
  if (!FetchResponse.ok) {
    return false;
  }
  // Store json response
  let ThreadData = await FetchResponse.json();
  
  // Do we know this thread?
  if (!ThreadStorage.ThreadID.includes(ThreadID)) {
    ThreadData.createdAt = CentralDate.Get(ThreadData.createdAt); // Convert date to date array
    ThreadData.updatedAt = CentralDate.Get(ThreadData.updatedAt); //  Convert date to date array

    // Loop all posts in thread
    for (let PostID = 0; PostID < ThreadData.posts.length; PostID++) {
      ThreadData.posts[PostID].content = bbcode.render(ThreadData.posts[PostID].content); // Convert post bbcode to html
      ThreadData.posts[PostID].createdAt = CentralDate.Get(ThreadData.posts[PostID].createdAt); // Convert date to date array
      ThreadData.posts[PostID].updatedAt = CentralDate.Get(ThreadData.posts[PostID].updatedAt); // Convert date to date array
    }
    // Save the results
    Logger("FetchThread", 3, `Saved ${ThreadID}`);
    ThreadStorage.ThreadID.push(ThreadID.toString());
    // Are we in dev mode?
    if (devmode) {
      // Save the json
      ThreadStorage.Thread[ThreadID] = ThreadData;
    }
    else {
      // Save the json and prerender thread
      ThreadStorage.Thread[ThreadID] = ThreadData;
      ThreadStorage.ThreadRender[ThreadID] = pug.renderFile("views/news_view.pug", { thread: ThreadData, page: 'article', menu: ThreadStorage.MenuSubForum });
    }
  }
  else {
    // We already know this one and do nothing
    Logger("FetchThread", 3, `Loaded ${ThreadID}`);
  }
  // Return the thread
  return ThreadStorage.Thread[ThreadID];
}
exports.FetchThread = FetchThread;

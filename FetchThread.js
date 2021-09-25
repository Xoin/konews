const fetch = require('node-fetch');

const ThreadStorage = require("./ThreadStorage");


async function FetchThread(ThreadID) {

  


  if (!ThreadStorage.ThreadID.includes(ThreadID)) {
    const CurrentThread = new ForumThread(ThreadData);
    for (let PostID = 0; PostID < CurrentThread.Posts; PostID++) {
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

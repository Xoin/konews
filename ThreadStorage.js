const { WachtedSubforums } = require("./WachtedSubforums");
const pug = require('pug');
const { CentralDate, rundate } = require("./CentralDate");
const { kourl, devmode } = require("./port");
const { Logger } = require("./Logger");
const fetch = require('node-fetch');
const bbcode = require('./bbcode');
const { CompareNumbers } = require("./CompareNumbers");

// Main storage
let ThreadStorage = {
  MenuSubForum: WachtedSubforums
};

class Thread {
  async Fetch(ThreadID) {
    console.log("Fetch  " + ThreadID)
    Logger("FetchThread", 2, `Request ${ThreadID}`);
    let FetchResponse = await fetch(`${kourl}thread/${ThreadID}`);
    console.log(`${kourl}thread/${ThreadID}`)
    console.log(FetchResponse.status)
    if (FetchResponse.status != 200) {
      console.log(":(")
      return false;
    }
    let ThreadData = await FetchResponse.json();
    return ThreadData;
  }
  MakeRender(ThreadID) {
    console.log("Render " + ThreadID)
    console.log(this.threads)
    this.threads[ThreadID].render = pug.renderFile("views/news_view.pug", { thread: this.threads[ThreadID], page: 'article', menu: ThreadStorage.MenuSubForum });
  }
  GetRender(ThreadID) {
    if (this.threads[ThreadID].render == undefined) {
      this.MakeRender(ThreadID)
    }
    console.log("Get render " + ThreadID)
    return this.threads[ThreadID].render
  }
  ProccessPost(ThreadID, PostID) {
    console.log("Posts " + PostID)
    this.threads[ThreadID].posts[PostID].content = bbcode.render(this.threads[ThreadID].posts[PostID].content); // Convert post bbcode to html
    this.threads[ThreadID].posts[PostID].createdAt = CentralDate(this.threads[ThreadID].posts[PostID].createdAt); // Convert date to date array
    this.threads[ThreadID].posts[PostID].updatedAt = CentralDate(this.threads[ThreadID].posts[PostID].updatedAt); // Convert date to date array
  }
  async AddThread(ThreadID) {
    console.log("Addd " + ThreadID)
    if (this.threads[ThreadID] != undefined) {
      return true;
    }
    let fetched = await this.UpdateThread(ThreadID);
    if (fetched) {
      this.stored.push(ThreadID);
      return true;
    }
    else {
      return false;
    }
  }
  async UpdateThread(ThreadID) {
    console.log("Upadte " + ThreadID)
    let ThreadData = await this.Fetch(ThreadID)
    if (!ThreadData) {
      return false;
    }
    if (this.threads[ThreadData.id] != undefined && this.threads[ThreadData.id].postCount == ThreadData.postCount) {
      return true;
    }
    this.threads[ThreadData.id] = ThreadData
    this.threads[ThreadData.id].createdAt = CentralDate(ThreadData.createdAt); // Convert date to date array
    this.threads[ThreadData.id].updatedAt = CentralDate(ThreadData.updatedAt); //  Convert date to date array
    for (let PostID = 0; PostID < this.threads[ThreadData.id].posts.length; PostID++) {
      this.ProccessPost(ThreadData.id, PostID)
    }
    return true;
  }
  constructor() {
    this.threads = [];
    this.stored = [];
  }
}

class Index {
  async Fetch(SubForumID) {
    console.log("Fetch  " + SubForumID)
    Logger("FetchThread", 2, `Request ${SubForumID}`);
    let FetchResponse = await fetch(`${kourl}subforum/${SubForumID}`);
    console.log(`${kourl}thread/${SubForumID}`)
    console.log(FetchResponse.status)
    if (FetchResponse.status != 200) {
      console.log(":(")
      return false;
    }
    let SubForumData = await FetchResponse.json();
    return SubForumData;
  }
  Get() {
    return this.threads;
  }
  async UpdateAll() {
    for (let key in WachtedSubforums) {
      this.UpdateThread(WachtedSubforums[key].id)
    }
  }
  async AddThread(SubForumID) {
    let fetched = await this.UpdateThread(SubForumID)
    if (fetched) {
      return true;
    } else {
      return false;
    }
  }
  Sort() {
    this.threads = this.threads.filter(word => word != undefined);
    return this.threads.sort(CompareNumbers)
  }
  GetRenderIndex() {
    return this.IndexRender;
  }
  GetRenderSubForum(SubForumID) {
    return this.SubForumRender[SubForumID];
  }
  RenderIndex() {
    this.Sort()
    this.IndexRender = pug.renderFile("views/news_index.pug", { subforumitems: this.threads, top: this.TopItems, page: 'home', menu: ThreadStorage.MenuSubForum })
  }
  RenderSubForum(SubForumID) {
    this.Sort()
    this.SubForumRender[SubForumID] = pug.renderFile('views/news_subforum.pug', { subforumitems: this.threads, top: this.TopItems, page: 'subforum', subforumid: SubForumID, menu: ThreadStorage.MenuSubForum })
  }
  async UpdateThread(SubForumID) {
    let SubForumData = await this.Fetch(SubForumID)
    if (!SubForumData) {
      return false;
    }
    for (const Thread of SubForumData.threads) {
      let rebuild = false;

      let ThreadDate = CentralDate(Thread.createdAt)
      if (this.threads[Thread.id] != undefined && rundate.Date == ThreadDate.Date && rundate.Month == ThreadDate.FullYear && (Thread.postCount != this.threads[Thread.id].postCount && Thread.postCount <= 20)) {
        rebuild = true;
      }
      this.threads[Thread.id] = {}
      this.threads[Thread.id].createdAt = CentralDate(Thread.createdAt); // Convert date to date array
      this.threads[Thread.id].date = CentralDate(Thread.createdAt); // Convert date to date array
      this.threads[Thread.id].updatedAt = CentralDate(Thread.updatedAt); //  Convert date to date array
      this.threads[Thread.id].title = Thread.title
      this.threads[Thread.id].total = (Thread.viewers.memberCount + Thread.viewers.guestCount)
      this.threads[Thread.id].viewers = Thread.viewers
      this.threads[Thread.id].dateshort = ThreadDate.Date + "-" + ThreadDate.Month + "-" + ThreadDate.FullYear
      this.threads[Thread.id].subforumId = Thread.subforumId
      this.threads[Thread.id].locked = Thread.locked
      this.threads[Thread.id].pinned = Thread.pinned
      this.threads[Thread.id].subforumId = Thread.subforumId
      this.threads[Thread.id].id = Thread.id
      this.threads[Thread.id].postCount = Thread.postCount
      this.threads[Thread.id].tags = Thread.tags
      this.threads[Thread.id].iconId = Thread.iconId
      if(rebuild)
      {
        await Thread.UpdateThread(Thread.id)
        Thread.MakeRender(Thread.id)
      }
    }
    this.RenderSubForum(SubForumID)
    this.RenderIndex()
    return true;
  }
  constructor() {
    this.threads = [];
    this.stored = [];
    this.TopItems = [];
    this.Grouped = []
    this.IndexRender = "";
    this.SubForumRender = [];
    this.ShortDates = [];
  }
}

module.exports = {
  Thread,
  Index
};
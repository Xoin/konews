const fetch = require('node-fetch');
const pug = require('pug');
const CentralDate = require('./CentralDate');
const { FetchThread } = require("./FetchThread");
const { WachtedSubforums,, rundate, } = require("./server");
const { kourl, devmode } = require("./port");
const { ThreadStorage } = require("./ThreadStorage");
const { CompareNumbers } = require("./CompareNumbers");
const { Logger } = require("./Logger");

async function FrontpageInterval() {
  Logger("FrontpageInterval", 2, "Request");

  ThreadStorage.SubForum = [];
  ThreadStorage.TopItems = [];
  ThreadStorage.ThreadInvalid = [];

  let TempStorage = {
    SubForum: []
  };

  await SubForumLoop();
  for (var SubForumID in TempStorage.SubForum) {
    TempStorage.SubForum[SubForumID].objects.sort(CompareNumbers); // Sort the threads in the group
    ThreadStorage.SubForum.push(TempStorage.SubForum[SubForumID]); // Pus the current group to the main storage
  }
  ThreadStorage.SubForum.sort(CompareNumbers);

  for (let index = 0; index < ThreadStorage.SubForum[0].objects.length; index++) {
    let ThreadID = ThreadStorage.SubForum[0].objects[index].id;
    let storedidt = ThreadID.toString();
    if (ThreadID == undefined || !ThreadStorage.ThreadID.includes(storedidt) || (ThreadStorage.SubForum[0].objects[index].postCount != ThreadStorage.Thread[ThreadID].postCount && ThreadStorage.SubForum[0].objects[index].postCount < 19)) {
      await FetchThread(ThreadStorage.SubForum[0].objects[index].id);
    }
  }

  for (let SubForumMenuID = 0; SubForumMenuID < WachtedSubforums.length; SubForumMenuID++) {
    const WatchedSubForumItem = WachtedSubforums[SubForumMenuID];
    ThreadStorage.SubForumRender[WatchedSubForumItem.id] = pug.renderFile('views/news_subforum.pug', { subforumitems: JSON.parse(JSON.stringify(ThreadStorage.SubForum)), top: ThreadStorage.TopItems, page: 'subforum', subforumid: WatchedSubForumItem.id, menu: ThreadStorage.MenuSubForum });
  }

  if (!devmode) {
    ThreadStorage.Frontpage = pug.renderFile("views/news_index.pug", { subforumitems: ThreadStorage.SubForum, top: ThreadStorage.TopItems, page: 'home', menu: ThreadStorage.MenuSubForum });
  }
  Logger("FrontpageInterval", 1, "frontpage refresh done");

  async function SubForumLoop() {
    for (let SubForumID = 0; SubForumID < WachtedSubforums.length; SubForumID++) {
      const element = WachtedSubforums[SubForumID].id;
      Logger("FrontpageInterval", 2, "Loading sub " + element);

      let FetchResponse = await fetch(`${kourl}subforum/${element}`);
      let SubForum = await FetchResponse.json();

      ThreadLoop(SubForum);
    }
  }

  function ThreadLoop(SubForum) {
    for (let ThreadID = 0; ThreadID < SubForum.threads.length; ThreadID++) {

      const Thread = SubForum.threads[ThreadID];
      Logger("FrontpageInterval", 3, "Scanning sub " + Thread.id);

      Thread.viewers.total = (Thread.viewers.memberCount + Thread.viewers.guestCount);
      let ThreadDate = CentralDate.Get(Thread.createdAt); // remove

      ThreadDate.dateshort = ThreadDate.Date + "-" + ThreadDate.Month + "-" + ThreadDate.FullYear;
      Thread.createdAt = CentralDate.Get(Thread.createdAt);
      Thread.updatedAt = CentralDate.Get(Thread.updatedAt);
      Thread.subforumName = SubForum.name;
      if (!Thread.pinned && !Thread.locked && Thread.createdAt.FullYear == rundate.FullYear && Thread.createdAt.Month >= (rundate.Month - 2)) {
        ThreadStorage.ThreadInvalid.push(Thread.id.toString());
        if (TempStorage.SubForum[ThreadDate.dateshort] == undefined) {
          TempStorage.SubForum[ThreadDate.dateshort] = { id: ThreadDate.Time, objects: [], date: ThreadDate };
          TempStorage.SubForum[ThreadDate.dateshort].objects.push(Thread);
        }
        else {
          TempStorage.SubForum[ThreadDate.dateshort].objects.push(Thread);
        }
      }
      if (Thread.pinned && !Thread.locked) {
        ThreadStorage.TopItems.push(Thread);
      }
    }
  }
}
exports.FrontpageInterval = FrontpageInterval;

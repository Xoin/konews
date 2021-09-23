const { WachtedSubforums } = require("./WachtedSubforums");

// Main storage
let ThreadStorage = {
  SubForum: [],
  MenuSubForum: WachtedSubforums,
  Thread: [],
  ThreadRender: [],
  ThreadID: [],
  ThreadInvalid: [],
  TopItems: [],
  Frontpage: "",
  SubForumRender: []
};
exports.ThreadStorage = ThreadStorage;

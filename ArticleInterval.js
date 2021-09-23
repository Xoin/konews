const { Logger } = require("./Logger");
const { ThreadStorage } = require("./ThreadStorage");

// purges articles
function ArticleInterval() {
  ThreadStorage.threadstore = [];
  ThreadStorage.ThreadID = [];
  Logger("ArticleInterval", 1, "article purge done");
}

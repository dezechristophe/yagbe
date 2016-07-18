
function getCurrentTab(callback) {
    chrome.tabs.query(
        { currentWindow: true, active: true, windowType:'normal' },
        function (array) { callback(array[0]); }
    );
}

function Options() {
  this.newTab = true;
  this.labelUnlabeled = false;
  this.unlabeledLabel = "Unlabeled";
  this.readLaterLabel = "Unread Bookmarks";
  this.sortBy = "label";
  this.sortDir = "asc";
  this.autocompleteMatch = "contains";
  this.toolbarIcon = "default";
  this.enableNotes = true;
  this.showVersionHistory = true;
  this.searchMethod = "highlight";
  this.theme = "default";
  this.fontSize = "9pt";
  this.bgColor = "#FFFFFF";
  this.indent = "5px";
  this.showDots = true;
  this.showFavs = true;
  this.favsType = "chrome";
  this.showLabelToolTips = true;
  this.showToolTips = true;
  this.showNameToolTips = true;
  this.showLocToolTips = true;
  this.showLblToolTips = true;
  this.showNotesToolTips = true;
  this.showTimeToolTips = true;
  this.labelSep = ">";
  this.menuSpeed = 100;
  this.hoverExpand = false;
  this.singleExpand = false;
  this.rememberExpanded = false;
  this.reqTimeout = 5000;
  this.searchDelay = 200;
  this.searchMinChars = 1;
  this.width = 400;
  this.height = 600;
  this.newBookmarkShortcut = true;
  this.newBookmarkShortcutMod = "alt";
  this.newBookmarkShortcutKey = "B";
  this.searchShortcut = true;
  this.searchShortcutMod = "ctrl";
  this.searchShortcutKey = "F";
  this.showContextMenu = true;
  this.support = true;
}

Options.prototype.load = function() {
  var opt = localStorage["newTab"];
  this.newTab = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["labelUnlabeled"];
  this.labelUnlabeled = ((opt != null) && (opt.toLowerCase() == "true"));
  
  opt = localStorage["unlabeledLabel"];
  this.unlabeledLabel = ((opt != null) && (opt.length > 0) ? opt : "Unlabeled");
  
  opt = localStorage["readLaterLabel"];
  this.readLaterLabel = ((opt != null) && (opt.length > 0) ? opt : "Unread Bookmarks");
  
  opt = localStorage["sortBy"];
  this.sortBy = ((opt != null) && (opt.length > 0) ? opt : "label");
  
  opt = localStorage["sortDir"];
  this.sortDir = ((opt != null) && (opt.length > 0) ? opt : "asc");
  
  opt = localStorage["autocompleteMatch"];
  this.autocompleteMatch = ((opt != null) && (opt.length > 0) ? opt : "contains");
  
  opt = localStorage["toolbarIcon"];
  this.toolbarIcon = ((opt != null) && (opt.length > 0) ? opt : "default");
  
  opt = localStorage["enableNotes"];
  this.enableNotes = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["showVersionHistory"];
  this.showVersionHistory = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["searchMethod"];
  this.searchMethod = ((opt != null) && (opt.length > 0) ? opt : "highlight");
  
  opt = localStorage["theme"];
  this.theme = ((opt != null) && (opt.length > 0) ? opt : "default");
  
  opt = localStorage["fontSize"];
  this.fontSize = ((opt != null) && (opt.length > 0) ? opt : "9pt");
  
  opt = localStorage["bgColor"];
  this.bgColor = ((opt != null) && (opt.length > 0) ? opt : "#FFFFFF");
  
  opt = localStorage["indent"];
  this.indent = ((opt != null) && (opt.length > 0) ? opt : "5px");
  
  opt = localStorage["showDots"];
  this.showDots = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["showFavs"];
  this.showFavs = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["favsType"];
  this.favsType = ((opt != null) && (opt.length > 0) ? opt : "chrome");
  
  opt = localStorage["showLabelToolTips"];
  this.showLabelToolTips = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["showToolTips"];
  this.showToolTips = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["showNameToolTips"];
  this.showNameToolTips = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["showLocToolTips"];
  this.showLocToolTips = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["showLblToolTips"];
  this.showLblToolTips = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["showNotesToolTips"];
  this.showNotesToolTips = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["showTimeToolTips"];
  this.showTimeToolTips = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["labelSep"];
  this.labelSep = ((opt != null) && (opt.length > 0) ? opt : ">");
  
  opt = localStorage["menuSpeed"];
  this.menuSpeed = ((opt != null) && (opt.length > 0) ? parseInt(opt) : 100);
  
  opt = localStorage["hoverExpand"];
  this.hoverExpand = ((opt != null) && (opt.toLowerCase() == "true"));
  
  opt = localStorage["singleExpand"];
  this.singleExpand = ((opt != null) && (opt.toLowerCase() == "true"));
  
  opt = localStorage["rememberExpanded"];
  this.rememberExpanded = ((opt != null) && (opt.toLowerCase() == "true"));
  
  opt = localStorage["reqTimeout"];
  this.reqTimeout = ((opt != null) && (opt.length > 0) ? parseInt(opt) : 5000);
  
  opt = localStorage["searchDelay"];
  this.searchDelay = ((opt != null) && (opt.length > 0) ? parseInt(opt) : 200);
  
  opt = localStorage["searchMinChars"];
  this.searchMinChars = ((opt != null) && (opt.length > 0) ? parseInt(opt) : 1);
  
  opt = localStorage["width"];
  this.width = ((opt != null) && (opt.length > 0) ? parseInt(opt) : 400);
  
  opt = localStorage["height"];
  this.height = ((opt != null) && (opt.length > 0) ? parseInt(opt) : 600);
  
  opt = localStorage["newBookmarkShortcut"];
  this.newBookmarkShortcut = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["newBookmarkShortcutMod"];
  this.newBookmarkShortcutMod = ((opt != null) && (opt.length > 0) ? opt : "alt");
  
  opt = localStorage["newBookmarkShortcutKey"];
  this.newBookmarkShortcutKey = ((opt != null) && (opt.length > 0) ? opt : "B");
  
  opt = localStorage["searchShortcut"];
  this.searchShortcut = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["searchShortcutMod"];
  this.searchShortcutMod = ((opt != null) && (opt.length > 0) ? opt : "ctrl");
  
  opt = localStorage["searchShortcutKey"];
  this.searchShortcutKey = ((opt != null) && (opt.length > 0) ? opt : "F");
  
  opt = localStorage["showContextMenu"];
  this.showContextMenu = ((opt == null) || (opt.toLowerCase() == "true"));
  
  opt = localStorage["support"];
  this.support = ((opt == null) || (opt.toLowerCase() == "true"));
}

Options.prototype.save = function() {
  localStorage["newTab"] = this.newTab;
  localStorage["labelUnlabeled"] = this.labelUnlabeled;
  localStorage["unlabeledLabel"] = this.unlabeledLabel;
  localStorage["readLaterLabel"] = this.readLaterLabel;
  localStorage["sortBy"] = this.sortBy;
  localStorage["sortDir"] = this.sortDir;
  localStorage["autocompleteMatch"] = this.autocompleteMatch;
  localStorage["toolbarIcon"] = this.toolbarIcon;
  localStorage["enableNotes"] = this.enableNotes;
  localStorage["showVersionHistory"] = this.showVersionHistory;
  localStorage["searchMethod"] = this.searchMethod;
  localStorage["theme"] = this.theme;
  localStorage["fontSize"] = this.fontSize;
  localStorage["bgColor"] = this.bgColor;
  localStorage["indent"] = this.indent;
  localStorage["showDots"] = this.showDots;
  localStorage["showFavs"] = this.showFavs;
  localStorage["favsType"] = this.favsType;
  localStorage["showLabelToolTips"] = this.showLabelToolTips;
  localStorage["showToolTips"] = this.showToolTips;
  localStorage["showNameToolTips"] = this.showNameToolTips;
  localStorage["showLocToolTips"] = this.showLocToolTips;
  localStorage["showLblToolTips"] = this.showLblToolTips;
  localStorage["showNotesToolTips"] = this.showNotesToolTips;
  localStorage["showTimeToolTips"] = this.showTimeToolTips;
  localStorage["labelSep"] = this.labelSep;
  localStorage["menuSpeed"] = this.menuSpeed;
  localStorage["hoverExpand"] = this.hoverExpand;
  localStorage["singleExpand"] = this.singleExpand;
  localStorage["rememberExpanded"] = this.rememberExpanded;
  localStorage["reqTimeout"] = this.reqTimeout;
  localStorage["searchDelay"] = this.searchDelay;
  localStorage["searchMinChars"] = this.searchMinChars;
  localStorage["width"] = this.width;
  localStorage["height"] = this.height;
  localStorage["newBookmarkShortcut"] = this.newBookmarkShortcut;
  localStorage["newBookmarkShortcutMod"] = this.newBookmarkShortcutMod;
  localStorage["newBookmarkShortcutKey"] = this.newBookmarkShortcutKey;
  localStorage["searchShortcut"] = this.searchShortcut;
  localStorage["searchShortcutMod"] = this.searchShortcutMod;
  localStorage["searchShortcutKey"] = this.searchShortcutKey;
  localStorage["showContextMenu"] = this.showContextMenu;
  localStorage["support"] = this.support;
}



// add content script manually upon first run (just installed/enabled)
chrome.tabs.query({}, function (tabs) {
  tabs.forEach(includeYAGBE);
});

function includeYAGBE(tab) {
  if (/^chrome/.test(tab.url)) return;
  chrome.tabs.insertCSS(tab.id, {
      file: "jquery-ui.css"
  });
  chrome.tabs.insertCSS(tab.id, {
      file: "jquery.autocomplete.css"
  });
  chrome.tabs.executeScript(tab.id, {
      file: "jquery-1.5.2.min.js"
  });
  chrome.tabs.executeScript(tab.id, {
      file: "jquery-ui-1.7.3.custom.min.js"
  });
  chrome.tabs.executeScript(tab.id, {
      file: "jquery.autocomplete.min.js"
  });
  chrome.tabs.executeScript(tab.id, {
      file: "content.js"
  });
}


var baseUrl = "https://www.google.com/bookmarks/",
    isNewTab = "false",
    req = null,
    bookmarks = null,
    urls = null,
    labels = null,
    signature = null,
    error = null,
    popupWaiting = null,
    opts = new Options(),
    openFolders = [ ],
    loadingInterval = null,
    bms = [],
    imgList = [],
    count = 0;

function setIcon(tabId) {
  chrome.tabs.get(tabId, function(tab) {
    if (tab.selected) {
      var iconPath;
      
      switch (opts.toolbarIcon) {
        case "chrome":
          iconPath = "icon_chrome";
          break;
        case "chrome2":
          iconPath = "icon_chrome2";
          break;
        default:
          iconPath = "icon";
          break;
      }
  
      if ($.inArray(tab.url, urls) > -1) {
        chrome.browserAction.setIcon({ path: iconPath + "_on.png" });
      } else {
        chrome.browserAction.setIcon({ path: iconPath + "_off.png" });
      }
    }
  });
}

function ctxBookmarkCurrentPage(info, tab) {
  chrome.tabs.sendMessage(tab.id, { op: "BookmarkCurrentPage" });
}

function ctxBookmarkLink(info, tab) {
  chrome.tabs.sendMessage(tab.id, { op: "BookmarkLink", url: info.linkUrl });
}

function handleRequest(request, sender, sendResponse) {
  if (request.op == "GetOptions") {
    sendResponse({ "opts": opts, "labels": labels });
  } else if (request.op == "AddBookmark") {
    $.ajax({
      type: "POST",
      url: "https://www.google.com/bookmarks/mark",
      data: {
        zx: (new Date()).getTime(),
        bkmk: request.url,
        title: request.title,
        annotation: request.notes,
        labels: request.labels,
        prev: "/lookup",
        sig: signature
      },
      timeout: opts.reqTimeout,
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        reloadBookmarksRSS(null);
        
        sendResponse({ "result": "error" });
      },
      success: function(data, textStatus) {
        reloadBookmarksRSS(null);
        
        sendResponse({ "result": "success" });
      }
    });
    return true; // we'll send an async response later
  }
}

function searchBookmarks(text, bookmarkArray, results) {
  for (var i = 0, len = bookmarkArray.length; i < len; i++) {
    var value = bookmarkArray[i];
    
    if (value.attributes.rel == "label") {
      searchBookmarks(text, value.children, results);
    } else {
      if ((value.data.title.toLowerCase().indexOf(text.toLowerCase()) >= 0) || (value.attributes.notes.toLowerCase().indexOf(text.toLowerCase()) >= 0)) {
        results.push({
          content: "__URL__:" + value.data.attributes.href,
          description: "<url>" + value.data.attributes.href + "</url> - <dim><match>" + value.data.title + "</match> - " + value.attributes.notes + "</dim>"
        });
      }
    }
  }
}

function suggestBookmarks(text, suggest) {
  var results = [ ];
  
  searchBookmarks(text, bookmarks, results);
  
  suggest(results);
}

function selectSuggestedBookmark(text) {
  getCurrentTab( function(tab) {
    var url = null;
    
    if (text.indexOf("__URL__:") == 0) {
      url = text.substr(8);
    } else {
      url = baseUrl + "find?q=" + text;
    }
    
    chrome.tabs.update(tab.id, { url: url });
  });
}

function htmlEncode(str) {
  return $('<div/>').text(str).html();
}

function encodeLabel(lbl) {
  return $('<div/>').text(lbl).html().replace(/'/g, "&#39;");
}

function generateTitleText(title, url, lbls, timestamp, desc) {
  var tmpStr = "";
  
  if (opts.showToolTips) {
    tmpStr = (opts.showNameToolTips ? title + "\n\n" : "") +
             (opts.showLocToolTips ? url + "\n\n" : "") +
             (opts.showLblToolTips ? "Labels: " + lbls + "\n\n" : "") +
             (opts.showNotesToolTips ? "Notes: " + desc + "\n\n" : "") +
             (opts.showTimeToolTips ? timestamp : "");
  }
  
  tmpStr = htmlEncode(tmpStr);
  
  // Encode the single quotes
  tmpStr = tmpStr.replace(/'/g, "&#39;");
  
  return tmpStr;
}

function generateLblId(lbl) {
  var lblId = "";
  
  for (i = 0; i < lbl.length; i++) {
    lblId += lbl.charCodeAt(i);
  }
  
  return lblId;
}

function sortByLabel(a, b) {
  var nullChar = String.fromCharCode(0),
      compA = a.data.title.toLowerCase().replace(/_/i, nullChar),
      compB = b.data.title.toLowerCase().replace(/_/i, nullChar);
  
  if (opts.sortDir == "asc") {
    return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
  } else {
    return (compA > compB) ? -1 : (compA < compB) ? 1 : 0;
  }
}

function sortByTimestamp(a, b) {
  var compA = new Date(a.timestamp),
      compB = new Date(b.timestamp);
  
  if (opts.sortDir == "asc") {
    return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
  } else {
    return (compA > compB) ? -1 : (compA < compB) ? 1 : 0;
  }
}

function displayBookmarks() {
  popupWaiting.showBookmarks();
}

function addBookmarkToLabelList(bm, lbl, parent, lblLst) {
  var sep = lbl.indexOf(opts.labelSep),
      item = null,
      current = null;
  
  // Nested bookmarks
  if (sep == -1) {
    current = parent.length == 0 ? encodeLabel(lbl) : parent + opts.labelSep + encodeLabel(lbl);
    
    // Find the current label
    item = $.grep(lblLst, function(elem, idx) {
      return ((elem.attributes["rel"] == "label") && (elem.attributes["label"] == current));
    })[0];
    
    // If the label isn't in the array add it, otherwise just add the bookmark to the array
    if (item != null) {
      item.children.push(bm);
    } else {
      lblLst.push({ attributes: { "id": generateLblId(current), "rel": "label", "title": encodeLabel(opts.showLabelToolTips ? lbl : ""), "label": current }, data: { title: encodeLabel(lbl) }, children: [ bm ], state: "closed" });
    }
  } else {
    var topLbl = lbl.substring(0, sep),
        subLbl = lbl.substring(sep + 1);
        
    current = parent.length == 0 ? encodeLabel(topLbl) : parent + opts.labelSep + encodeLabel(topLbl);
    
    // Find the current label
    item = $.grep(lblLst, function(elem, idx) {
      return ((elem.attributes["rel"] == "label") && (elem.attributes["label"] == current));
    })[0];
    
    // If the label isn't in the array add it, otherwise just add the bookmark to the array
    if (item == null) {
      item = { attributes: { "id": generateLblId(current), "rel": "label", "title": encodeLabel(opts.showLabelToolTips ? topLbl : ""), "label": current }, data: { title: encodeLabel(topLbl) }, children: [], state: "closed" };
      
      lblLst.push(item);
    }
    
    addBookmarkToLabelList(bm, subLbl, current, item.children);
  }
}

function sortAll(lst) {
  var lbls = [],
      bms = [];
  
  for (var i = 0, len = lst.length; i < len; i++) {
    var value = lst[i];
    
    if (value.attributes["rel"] == "label") {
      value.children = sortAll(value.children);
      
      lbls.push(value);
    } else {
      bms.push(value);
    }
  }
  
  if (opts.sortBy == "label") {
    // Sort the labels
    lbls.sort(sortByLabel);
    
    // Sort the bookmarks
    bms.sort(sortByLabel);
  } else if (opts.sortBy == "timestamp") {
    // Sort the labels
    lbls.sort(sortByTimestamp);
    
    // Sort the bookmarks
    bms.sort(sortByTimestamp);
  }
  
  return $.merge(lbls, bms);
}

function processBookmarks(bm_arg) {
  var bmIcon = "/bookmark.png",
      bm = $(bm_arg),
      url = bm.children(opts.enableNotes ? "link:first" : "url:first").text(),
      timestamp = bm.children(opts.enableNotes ? "pubDate:first" : "timestamp:first").text(),
      title = bm.children(opts.enableNotes ? "[nodeName='smh:bkmk_title']:first" : "title:first").text(),
      notes = (opts.enableNotes ? bm.children("[nodeName='smh:bkmk_annotation']:first").text() : ""),
      favicon = null,
      regex = /(\b(?:(?:https?):\/\/[\-\w]+(?:\.\w[\-\w]*)+|(?:[a-z0-9](?:[\-a-z0-9]*[a-z0-9])?\.)+(?:com\b|edu\b|biz\b|gov\b|in(?:t|fo)\b|mil\b|net\b|org\b|[a-z][a-z]\.[a-z][a-z]\b))(?::\d+)?)(?:\/[^.!,?;"'<>()[\]{}\s\x7F-\xFF]*(?:[.!,?]+[^.!,?;"'<>()[\]{}\s\x7F-\xFF]+)*)?/i;
  
  if (opts.showFavs) {
    switch(opts.favsType) {
      case "validate":
        favicon = (opts.enableNotes ? url : bm.find("attribute > name:contains('favicon_url')").next().text());
        if (opts.enableNotes || (favicon == null) || (favicon.length == 0)) {
          var match = regex.exec(url);
          favicon = (match != null ? match[1] + "/favicon.ico" : null);
        }
        break;
      case "getFavicon":
        favicon = "http://getfavicon.appspot.com/" + url;
        break;
      case "chrome":
      default:
        favicon = "chrome://favicon/" + url;
        break;
    }
  }
  
  var lbls = bm.find(opts.enableNotes ? "[nodeName='smh:bkmk_label']" : "label"),
      lblString = "",
      lblRawString = "";
  
  for (var i = 0, len = lbls.length; i < len; i++) {
    var lbl = $(lbls[i]).text();
    
    if ($.grep(labels, function(elem, idx) { return (elem.value == lbl); }).length == 0) {
      labels.push({ "value": lbl, "display": encodeLabel(lbl) });
    }
    
    if (lblString.length > 0) {
      lblString += ",";
      lblRawString += ",";
    }
    
    lblString += encodeLabel(lbl);
    lblRawString += lbl;
  }
  
  var obj = {
    attributes: {
      "id": bm.children(opts.enableNotes ? "[nodeName='smh:bkmk_id']:first" : "id:first").text(),
      "title": generateTitleText(title, url, lblRawString, new Date(opts.enableNotes ? timestamp : parseInt(timestamp/1000)).toLocaleString().replace(/ \(.*?\)/i, ""), notes),
      "rel": "bookmark",
      "labels": htmlEncode(lblString),
      "notes": encodeLabel(notes)
    },
    data: {
      title: htmlEncode(title),
      icon: (favicon != null ? favicon : bmIcon),
      attributes: { "href": url }
    },
    timestamp: timestamp
  };
  
  if ((opts.favsType != null) && (opts.favsType == "validate")) {
    if (obj.data["icon"] != bmIcon) {
      var img = new Image();
      var idx = imgList.push(false) - 1;
      
      $(img).error(function() {
        obj.data["icon"] = bmIcon;
        
        imgList[idx] = true;
      }).load(function () {
        imgList[idx] = true;
      });
      
      img.src = obj.data["icon"];
    }
  }
  
  urls.push(url);
  
  // Loop through each label and add the bookmark to the array
  if (lbls.length == 0) {
    if (opts.labelUnlabeled) {
      addBookmarkToLabelList(obj, opts.unlabeledLabel, "", bms);
    } else {
      bms.push(obj);
    }
  } else {
    for (var i = 0, len = lbls.length; i < len; i++) {
      addBookmarkToLabelList(obj, $(lbls[i]).text(), "", bms);
    }
  }
}

function processResponse(data, textStatus) {
  var data_obj = $(data),
      data_bookmarks = data_obj.find(opts.enableNotes ? "item" : "bookmark");
  
  if (count == 1) {

    if (!data || !data_obj.find('rss').length && !data_obj.find('xml_api_reply').length) {
      error = "Please <a href='" + baseUrl + "' target='_blank'>login</a> to see your Google Bookmarks.";
    }
    
    if (!data_bookmarks.length) {
      error = "No <a href='https://www.google.com/bookmarks/' target='_blank'>Google Bookmarks</a> found.<br /> You probably haven't saved any bookmarks yet .";
    }

    // Display the bookmarks, if necessary
    chrome.extension.sendMessage({ op: "ShowBookmarks" });  
    
    // Get the signature for add/delete/modify functions
    if (opts.enableNotes) {
      signature = data_obj.find("signature:first").text();
    }
  }
  
  // Loop through each bookmark and create the bookmark object
  for (var i = 0, len = data_bookmarks.length; i < len; i++) {
    processBookmarks(data_bookmarks[i]);
  }
  
  // Now read the rest of the RSS bookmarks
  if (opts.enableNotes && (data_bookmarks != null) && (data_bookmarks.length >= 1000)) {
    $.ajax({
      type: "GET",
      url: baseUrl,
      data: {
        zx: (new Date()).getTime(),
        output: "rss",
        num: "1000",
        start: count++ * 1000
      },
      timeout: opts.reqTimeout,
      success: processResponse
    });
  } else {
    // Finish processing and clean up
    bookmarks = sortAll(bms);
    bms = null;
    
    if (isNewTab != "true") {
      getCurrentTab( function(tab) {
        setIcon(tab.id);
      });
      
      // Add event listeners
      chrome.tabs.onUpdated.addListener(setIcon);
      chrome.tabs.onSelectionChanged.addListener(setIcon);
    }
  
    // Display the bookmarks, if necessary
    chrome.extension.sendMessage({ op: "ShowBookmarks" });

    // Loop until all of the favicons have been checked
    if ((opts.favsType != null) && (opts.favsType == "validate")) {
      loadingInterval = window.setInterval(function() {
        var imgsDone = false;
        
        for (var i = 0, len = imgList.length; i < len; i++) {
          imgsDone = imgList[i];
          
          if (!imgsDone) {
            break;
          }
        }
        
        if (imgsDone) {
          imgList = null;
          
          window.clearInterval(loadingInterval);
          
          loadingInterval = null;
        }
      },
      1000);
    }
  }
}

function reloadBookmarks(showInPopup) {
  bookmarks = null;
  urls = [];
  labels = [];
  error = null;
  signature = null;
  bms = [];
  imgList = [];
  count = 1;

  popupWaiting = showInPopup;
  
  if (opts.rememberExpanded == false) {
    openFolders = [ ];
  }
  
  if (req != null) {
    req.abort();
  }
  
  if (loadingInterval != null) {
    window.clearInterval(loadingInterval);
    
    loadingInterval = null;
  }
  
  // Get the bookmarks
  req = $.ajax({
    type: "GET",
    url: baseUrl,
    data: {
      zx: (new Date()).getTime(),
      output: (opts.enableNotes ? "rss" : "xml"),
      num: (opts.enableNotes ? "1000" : "20000"),
      start: "0"
    },
    timeout: opts.reqTimeout,
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      error = textStatus + "<br /><br />Please <a href='" + baseUrl + "' target='_blank'>login</a>";
      
      // Display the bookmarks, if necessary
      chrome.extension.sendMessage({ op: "ShowBookmarks" });
    },
    success: processResponse
  });
  
  if (opts.enableNotes == false) {
    // Get the signature for add/delete/modify functions
    if ((signature == null) || (signature.length == 0)) {
      $.ajax({
        type: "GET",
        url: baseUrl + "find",
        data: { zx: (new Date()).getTime(), q: "__YAGBE__", output: "rss" },
        timeout: opts.reqTimeout,
        success: function(data, textStatus) {
          signature = $(data).find("signature:first").text();
        }
      });
    }
  }
}

function reloadBookmarksRSS(showInPopup) {
  // Load the options and then load the bookmarks
  if (isNewTab != "true") {
    opts.load();
    
    // Reset the context menus
    chrome.contextMenus.removeAll();

    // Add the context menus
    if (opts.showContextMenu == true) {
      chrome.contextMenus.create({"title": chrome.i18n.getMessage("bookmark_current_page"), "contexts" : [ "page", "selection", "link", "editable", "image", "video", "audio" ], "onclick": ctxBookmarkCurrentPage});
      chrome.contextMenus.create({"title": chrome.i18n.getMessage("bookmark_link"), "contexts" : [ "link" ], "onclick": ctxBookmarkLink});
    }

    reloadBookmarks(showInPopup);
  } else {
    chrome.extension.sendMessage(/*"mgfimbcdlkelklcelagmikpohmfceegd",*/ { 'op' : 'GetOptions' }, function(data) {
      opts = data.opts;
      reloadBookmarks(showInPopup);
    });
  }
}

$(document).ready(function () {
  var version = "1.14",
      versionString = "version";
  
  if (isNewTab != "true") {
    // Set the toolbar icon
    var iconPath;
    
    switch (localStorage["toolbarIcon"]) {
      case "chrome":
        iconPath = "icon_chrome_off.png";
        break;
      case "chrome2":
        iconPath = "icon_chrome2_off.png";
        break;
      default:
        iconPath = "icon_off.png";
        break;
    }
    
    chrome.browserAction.setIcon({ path: iconPath });
    
    if ((localStorage[versionString] == null) || (localStorage[versionString] != version)) {
      // Update local storage for favsType
      if (localStorage["validateFavs"] != null) {
        localStorage["favsType"] = (localStorage["validateFavs"] == "true" ? "validate" : "chrome");
        
        localStorage.removeItem("validateFavs");
      }
      
      if ((localStorage[versionString] != null) && (localStorage["showVersionHistory"] != "false")) {
        ///chrome.tabs.create({ url: "http://www.jimnuzzi.com/YAGBE/Version_History.html?updated=true", selected: false });
      }
      
      // Update version number
      localStorage[versionString] = version;
    }
  
    // Add the listeners
    chrome.extension.onMessage.addListener(handleRequest);
    chrome.extension.onMessageExternal.addListener(handleRequest);
    
    // Setup the Omnibox functionality
    chrome.omnibox.setDefaultSuggestion({ description: "Search YAGBE: <match>%s</match>" });
    chrome.omnibox.onInputChanged.addListener(suggestBookmarks);
    chrome.omnibox.onInputEntered.addListener(selectSuggestedBookmark);
  }
  
  // Reload the bookmarks
  reloadBookmarksRSS(null);
});

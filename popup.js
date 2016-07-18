var baseUrl2 = "https://www.google.com/bookmarks/mark",
    bg = chrome.extension.getBackgroundPage(),
    isNewTab = "false",
    tree_inst = null,
    addDialog = null,
    editDialog = null,
    renameDialog = null,
    deleteBmDialog = null,
    deleteLblDialog = null,
    addAllDialog = null,
    searchTimeout = null,
    delInterval = null,
    addInterval = null;


$(document).ready(function(){
  $("#reloadBookmarks").click(reloadBookmarks);
  $("#addCurrentImg").click(bookmarkCurrentPage.bind($("#addCurrentImg")[0], false));
  $("#editCurrentBookmark").click(editCurrentBookmark);
  $("#deleteCurrentImg").click(deleteCurrentBookmark);
  $("#readLaterImg").click(bookmarkCurrentPage.bind($("#readLaterImg")[0], true));
  $("#optionsImg").click(showOptions);
  $("#googleBookmarksImg").click(openGoogleBookmarks);
  $("#logoutButton").click(logout);
  $("#showHistory").click(showHistory);
  $("#showDownloads").click(showDownloads);
  $("#deleteLblChildren").click(deleteLblChildren);
});


function openGoogleBookmarks() {
	chrome.tabs.create({ url: 'https://www.google.com/bookmarks/', selected: true }); 
	window.close();
}

function deleteLblChildren(e) {
	if (this.checked) { 
		$('#deleteLblChildrenWarning').show(); 
	} else { 
		$('#deleteLblChildrenWarning').hide();
	}
}


function closeDialog(event, ui) {
  if (ui == null) {
    $(this).dialog("close");
  } else {
    $(ui).dialog("close");
  }
}

function renameNode(node, tree_obj) {
  var nodeObj = $(node);
  
  if (nodeObj.attr("rel") == "bookmark") {
    var editName = $("#editName"),
        editUrl = $("#editUrl"),
        editLabels = $("#editLabels"),
        editNotes = $("#editNotes"),
        lbls = nodeObj.attr("labels").split(","),
        lblStr = "";
        
    editName.val($.trim(nodeObj.children("a:first").text()));
    editUrl.val(nodeObj.children("a:first").attr("href")).attr("disabled", true);
    editNotes.val(nodeObj.attr("notes"));

    // build the label string
    for (var i = 0, len = lbls.length; i < len; i++) {
      var curr = lbls[i];
      
      if (curr.length > 0) {
        lblStr += $.grep(bg.labels, function(elem, idx) { return (elem.display == curr.valueOf()); })[0].value;
        lblStr += ", ";
      }
    }
    
    editLabels.val(lblStr);
    editLabels.flushCache();
    editLabels.autocomplete(
      bg.labels,
      {
        multiple: true,
        max: 10000,
        scrollHeight: 160,
        matchContains: (bg.opts.autocompleteMatch != "begins"),
        selectFirst: false,
        formatItem: function(item) {
          return item.display;
        },
        formatMatch: function(item) {
          return item.value;
        },
        formatResult: function(item) {
          return item.value;
        }
      }
    );

    if (editDialog == null) {
      editDialog = $("#editDialog");
      
      editDialog.dialog({
        autoOpen: false,
        modal: true,
        draggable: false,
        resizable: false,
        title: "Edit Bookmark",
        open: function(event, ui) {
          editLabels.focus();
        },
        buttons: {
          "Save": function() {
            $("body").css("cursor", "wait");
            
            $.ajax({
              type: "post",
              url: baseUrl2,
              data: (bg.opts.enableNotes ?
                {
                  zx: (new Date()).getTime(),
                  bkmk: editUrl.val(),
                  title: editName.val(),
                  labels: editLabels.val(),
                  annotation: editNotes.val(),
                  prev: "/lookup",
                  sig: bg.signature
                } :
                {
                  zx: (new Date()).getTime(),
                  bkmk: editUrl.val(),
                  title: editName.val(),
                  labels: editLabels.val(),
                  prev: "/lookup",
                  sig: bg.signature
                }),
              timeout: bg.opts.reqTimeout,
              error: function(XMLHttpRequest, textStatus, errorThrown) {
                $("body").css("cursor", "default");
                
                reloadBookmarks();
                
                closeDialog(null, editDialog);
              },
              success: function(data, textStatus) {
                $("body").css("cursor", "default");
                
                reloadBookmarks();
                
                closeDialog(null, editDialog);
              }
            });
          },
          Cancel: closeDialog,
        }
      });
    }
    
    editDialog.dialog("open");
  } else {
    var newName = $("#renameNewName"),
        oldName = $("#renameOldName");
        
    newName.val(nodeObj.attr("label"));
    oldName.val(nodeObj.attr("label"));
    
    if (renameDialog == null) {
      renameDialog = $("#renameDialog");
      
      renameDialog.dialog({
        autoOpen: false,
        modal: true,
        draggable: false,
        resizable: false,
        title: "Rename Label",
        open: function(event, ui) {
          newName.focus();
        },
        buttons: {
          "Save": function() {
            $("body").css("cursor", "wait");
            
            $.ajax({
              type: "POST",
              url: baseUrl2,
              data: {
                op: "modlabel",
                zx: (new Date()).getTime(),
                labels: oldName.val() + "," + newName.val(),
                sig: bg.signature
              },
              timeout: bg.opts.reqTimeout,
              error: function(XMLHttpRequest, textStatus, errorThrown) {
                $("body").css("cursor", "default");
                
                reloadBookmarks();
                
                closeDialog(null, renameDialog);
              },
              success: function(data, textStatus) {
                $("body").css("cursor", "default");
                
                reloadBookmarks();
                
                closeDialog(null, renameDialog);
              }
            });
          },
          Cancel: closeDialog,
        }
      });
    }
    
    renameDialog.dialog("open");
  }
}

function editCurrentBookmark() {
  getCurrentTab( function(tab) {
    var currBm = tree_inst.container.find("li[rel='bookmark'] > a[href='" + tab.url + "']").parent();
    
    renameNode(currBm, tree_inst);
  });
}

function deleteCurrentBookmark() {
  getCurrentTab( function(tab) {
    var currBm = tree_inst.container.find("li[rel='bookmark'] > a[href='" + tab.url + "']"),
        deleteBmId = $("#deleteBmId");
    
    $("#deleteBmName").text($.trim(currBm.text()));
    deleteBmId.val(currBm.parent().attr("id"));
    
    if (deleteBmDialog == null) {
      deleteBmDialog = $("#deleteBmDialog");
      
      deleteBmDialog.dialog({
        autoOpen: false,
        modal: true,
        draggable: false,
        resizable: false,
        title: "Delete Bookmark",
        buttons: {
          "Delete": function() {
            $("body").css("cursor", "wait");
            
            $.ajax({
              type: "get",
              url: baseUrl2,
              data: {
                zx: (new Date()).getTime(),
                dlq: deleteBmId.val(),
                sig: bg.signature
              },
              timeout: bg.opts.reqTimeout,
              error: function(XMLHttpRequest, textStatus, errorThrown) {
                $("body").css("cursor", "default");
                
                reloadBookmarks();
                
                closeDialog(null, deleteBmDialog);
              },
              success: function(data, textStatus) {
                $("body").css("cursor", "default");
                
                reloadBookmarks();
                
                closeDialog(null, deleteBmDialog);
              }
            });
          },
          Cancel: closeDialog,
        }
      });
    }
    
    deleteBmDialog.dialog("open");
  });
}

function deleteBookmark(bmId, reload, dlg) {
  if (reload == true) {
    $("body").css("cursor", "wait");
  }
  
  return $.ajax({
    type: "get",
    url: baseUrl2,
    async: false,
    data: {
      zx: (new Date()).getTime(),
      dlq: bmId,
      sig: bg.signature
    },
    timeout: bg.opts.reqTimeout,
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      if (reload == true) {
        $("body").css("cursor", "default");
        
        reloadBookmarks();
      
        closeDialog(null, dlg);
      }
    },
    success: function(data, textStatus) {
      if (reload == true) {
        $("body").css("cursor", "default");
        
        reloadBookmarks();
      
        closeDialog(null, dlg);
      }
    }
  });
}

function removeNode(node, tree_obj) {
  var nodeObj = $(node);
  
  if (nodeObj.attr("rel") == "bookmark") {
    var deleteBmId = $("#deleteBmId");
    
    $("#deleteBmName").text($.trim(nodeObj.children("a:first").text()));
    deleteBmId.val(nodeObj.attr("id"));
    
    if (deleteBmDialog == null) {
      deleteBmDialog = $("#deleteBmDialog");
      
      deleteBmDialog.dialog({
        autoOpen: false,
        modal: true,
        draggable: false,
        resizable: false,
        title: "Delete Bookmark",
        buttons: {
          "Delete": function() {
            deleteBookmark(deleteBmId.val(), true, deleteBmDialog);
          },
          Cancel: closeDialog,
        }
      });
    }
    
    deleteBmDialog.dialog("open");
  } else {
    var deleteLblName = $("#deleteLblName");
    
    deleteLblName.text(nodeObj.attr("label"));
    
    if (deleteLblDialog == null) {
      deleteLblDialog = $("#deleteLblDialog");
      
      deleteLblDialog.dialog({
        autoOpen: false,
        modal: true,
        draggable: false,
        resizable: false,
        title: "Delete Label",
        buttons: {
          "Delete": function() {
            if ($("#deleteLblChildren").attr("checked")) {
              var reqs = [ ];
              
              $("body").css("cursor", "wait");
              
              $(node).find("li[rel='bookmark']").each(function() {
                reqs.push(deleteBookmark($(this).attr("id")));
              });
              
              delInterval = window.setInterval(function() {
                var delsDone = false;

                $.each(reqs, function(index, value) {
                  delsDone = (value.readyState == 4);
                  
                  return delsDone;
                });
                
                if (delsDone) {
                  reqs = null;
                  
                  window.clearInterval(delInterval);
                  
                  delInterval = null;
                  
                  $("body").css("cursor", "default");
                  
                  reloadBookmarks();
    
                  closeDialog(null, deleteLblDialog);
                }
              },
              500);
            } else {
              $("body").css("cursor", "wait");
              
              $.ajax({
                type: "get",
                url: baseUrl2,
                data: {
                  op: "modlabel",
                  zx: (new Date()).getTime(),
                  labels: deleteLblName.text(),
                  sig: bg.signature
                },
                timeout: bg.opts.reqTimeout,
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                  $("body").css("cursor", "default");
                  
                  reloadBookmarks();
                  
                  closeDialog(null, deleteLblDialog);
                },
                success: function(data, textStatus) {
                  $("body").css("cursor", "default");
                  
                  reloadBookmarks();
                  
                  closeDialog(null, deleteLblDialog);
                }
              });
            }
          },
          Cancel: closeDialog,
        }
      });
    }
    
    deleteLblDialog.dialog("open");
  }
}

function selectNode(node, tree_obj) {
  var nodeObj = $(node);
  
  if (tree_obj.children(node).length > 0) {
    tree_obj.toggle_branch(node);
    
    nodeObj.children("a").removeClass("clicked");
  } else {
    if (bg.opts.newTab) {
      chrome.tabs.create({ url: nodeObj.children("a:first").attr("href"), selected: true });
      
      if (isNewTab != "true") {
        window.close();
      }
    } else {
      getCurrentTab( function(tab) {
        chrome.tabs.update(tab.id, { url: nodeObj.children("a:first").attr("href") });
        
        if (isNewTab != "true") {
          window.close();
        }
      });
    }
  }
}

function bmClick(e) {
  if ((e.which == 1) && e.ctrlKey) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    
    chrome.tabs.create({ url: this.href, selected: false });
    
    return false;
  }
}

function bmMouseUp(e) {
  if ((e.which == 2) && (isNewTab != "true")) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    
    chrome.tabs.create({ url: this.href, selected: false });
    
    return false;
  }
}

function lblClick(e) {
  if ((e.which == 1) && e.ctrlKey) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    
    for (var bms = $(this).children("ul").first().children("li[rel='bookmark']"), i = 0, len = bms.length; i < len; i++) {
      var bm = $(bms[i]).children("a").first();
      
      chrome.tabs.create({ url: bm.attr("href"), selected: false });
    }
    
    return false;
  }
}

function lblMouseUp(e) {
  if (e.which == 2) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    
    for (var bms = $(this).children("ul").first().children("li[rel='bookmark']"), i = 0, len = bms.length; i < len; i++) {
      var bm = $(bms[i]).children("a").first();
      
      chrome.tabs.create({ url: bm.attr("href"), selected: false });
    }

    return false;
  }
}

function searchComplete(node, tree_obj) {
  if (bg.opts.searchMethod == "highlight") {
    node.addClass("search");
  } else {
    node.addClass("found");
    
    for (var i = 0, len = node.length; i < len; i++) {
      var value = $(node[i]);
      
      value.closest("ul").parents("li").children("a").addClass("found");
      value.next("ul").find("a").addClass("found");
    }
    
    tree_obj.container.find("a:not(.found)").parent().hide();
  }
  
  if (node.length > 0) {
    tree_obj.scroll_into_view(node[0]);
  }
}

function openInTabs(node, tree_obj) {
  var bms = null;
  
  if (bms = tree_inst.children(node)) {
    for (var i = 0, len = bms.length; i < len; i++) {
      var bm = $(bms[i]);
      
      if (bm.attr("rel") == "bookmark") {
        chrome.tabs.create({ url: bm.children("a:first").attr("href") });
      }
    }
    
    window.close();
  }
}

function openInTabsInNewWindow(node, tree_obj) {
  var bms = null,
      urls = [ ];
  
  if (bms = tree_inst.children(node)) {
    for (var i = 0, len = bms.length; i < len; i++) {
      var bm = $(bms[i]);
      
      if (bm.attr("rel") == "bookmark") {
        urls.push(bm.children("a:first").attr("href"));
      }
    }
    
    chrome.windows.create({ url: urls });
    
    window.close();
  }
}

function openInTabsInIncognitoWindow(node, tree_obj) {
  var bms = null,
      urls = [ ];
  
  if (bms = tree_inst.children(node)) {
    for (var i = 0, len = bms.length; i < len; i++) {
      var bm = $(bms[i]);
      
      if (bm.attr("rel") == "bookmark") {
        urls.push(bm.children("a:first").attr("href"));
      }
    }
    
    chrome.windows.create({ url: urls, incognito: true });
    
    window.close();
  }
}

function showBookmarks() {
  // Wait for the background page to finish
  if ((bg.bookmarks == null) && (bg.error == null)) {
    //bg.popupWaiting = this;
    
    return;
  }
  
  var bms = bg.bookmarks,
      bmsDiv = $("#bookmarks");
  
  bmsDiv.empty();



  
  if (tree_inst == null) {
    tree_inst = $.tree.create();
    
    tree_inst.init(bmsDiv, {
      data: { type: "json", opts: { "static": bms } },
      ui: {
        theme_name: bg.opts.theme,
        dots: bg.opts.showDots,
        animation: bg.opts.menuSpeed
      },
      rules: {
        multiple: false
      },
      types: {
        "label": {
          clickable: true,
          renameable: true,
          deletable: true,
          creatable: false,
          draggable: false,
        },
        "bookmark": {
          clickable: true,
          renameable: true,
          deletable: true,
          creatable: false,
          draggable: false,
        }
      },
      plugins: {
        contextmenu: {
          items : {
            create: false,
            rename: {
              label: chrome.i18n.getMessage("edit"),
              action: renameNode,
            },
            remove : {
              label: chrome.i18n.getMessage("delete"),
              action: removeNode,
            },
            openInTabs: {
              label: chrome.i18n.getMessage("open_in_tabs"),
              icon: "openInTabs",
              visible: function (node, tree_obj) {
                return ($(node).attr("rel") == "label" ? 1 : -1);
              },
              action: openInTabs,
              separator_before: true,
            },
            openInTabsInNewWindow: {
              label: chrome.i18n.getMessage("open_in_new_window"),
              icon: "openInTabs",
              visible: function (node, tree_obj) {
                return ($(node).attr("rel") == "label" ? 1 : -1);
              },
              action: openInTabsInNewWindow,
            },
            openInTabsInIncognitoWindow: {
              label: chrome.i18n.getMessage("open_in_incognito_window"),
              icon: "openInTabs",
              visible: function (node, tree_obj) {
                return ($(node).attr("rel") == "label" ? 1 : -1);
              },
              action: openInTabsInIncognitoWindow,
            },
            open: {
              label: chrome.i18n.getMessage("open_in_current_tab"),
              icon: "openInTabs",
              visible: function (node, tree_obj) {
                return ($(node).attr("rel") == "bookmark" ? 1 : -1);
              },
              action: function(node, tree_obj) {
                getCurrentTab( function(tab) {
                  chrome.tabs.update(tab.id, { url: node.children("a:first").attr("href") });
                  
                  window.close();
                });
              },
              separator_before: true,
            },
            openInNewTab: {
              label: chrome.i18n.getMessage("open_in_new_tab"),
              icon: "openInTabs",
              visible: function (node, tree_obj) {
                return ($(node).attr("rel") == "bookmark" ? 1 : -1);
              },
              action: function(node, tree_obj) {
                chrome.tabs.create({ url: node.children("a:first").attr("href") });
              },
            },
            openInNewWindow: {
              label: chrome.i18n.getMessage("open_in_new_window"),
              icon: "openInTabs",
              visible: function (node, tree_obj) {
                return ($(node).attr("rel") == "bookmark" ? 1 : -1);
              },
              action: function(node, tree_obj) {
                chrome.windows.create({ url: node.children("a:first").attr("href") });
              },
            },
            openInIncognitoWindow: {
              label: chrome.i18n.getMessage("open_in_incognito_window"),
              icon: "openInTabs",
              visible: function (node, tree_obj) {
                return ($(node).attr("rel") == "bookmark" ? 1 : -1);
              },
              action: function(node, tree_obj) {
                chrome.windows.create({ url: node.children("a:first").attr("href"), incognito: true });
              },
            },
            addHere: {
              label: chrome.i18n.getMessage("add_bookmark_here"),
              icon: "add",
              visible: function (node, tree_obj) {
                return ($(node).attr("rel") == "label" ? 1 : -1);
              },
              action: function(node, tree_obj) {
                $("#addLabels").val($(node).attr("label"));
                bookmarkCurrentPage(false);
              },
              separator_before: true,
            },
            addTabsHere: {
              label: chrome.i18n.getMessage("bookmark_tabs_here"),
              icon: "add",
              visible: function (node, tree_obj) {
                return ($(node).attr("rel") == "label" ? 1 : -1);
              },
              action: function(node, tree_obj) {
                var lbl = $(node).attr("label");
                
                chrome.tabs.getAllInWindow(null, function(tabs) {
                  var reqs = [ ];
                  
                  $("body").css("cursor", "wait");
                  
                  if (addAllDialog == null) {
                    addAllDialog = $("#addAllDialog");
                    
                    addAllDialog.dialog({
                      autoOpen: false,
                      modal: true,
                      draggable: false,
                      resizable: false,
                      title: "Adding Bookmarks",
                    });
                  }
                  
                  addAllDialog.dialog("open");
                  
                  $.each(tabs, function(index, value) {
                    reqs.push($.ajax({
                      type: "POST",
                      url: baseUrl2,
                      data: {
                        zx: (new Date()).getTime(),
                        bkmk: this.url,
                        title: this.title,
                        annotation: "",
                        labels: lbl,
                        prev: "/lookup",
                        sig: bg.signature
                      },
                      timeout: bg.opts.reqTimeout,
                    }));
                  });

                  addInterval = window.setInterval(function() {
                    var addsDone = false;
                    
                    $.each(reqs, function(index, value) {
                      addsDone = (value.readyState == 4);
                      
                      return addsDone;
                    });
                    
                    if (addsDone) {
                      reqs = null;
                      
                      window.clearInterval(addInterval);
                      
                      addInterval = null;
                      
                      addAllDialog.dialog("close");
                      
                      $("body").css("cursor", "default");
                      
                      reloadBookmarks();
                    }
                  },
                  500);
                });
              },
            },
            shareBookmark: {
              label: chrome.i18n.getMessage("email_bookmark"),
              icon: "email",
              visible: function (node, tree_obj) {
                return ($(node).attr("rel") == "bookmark" ? 1 : -1);
              },
              action: function(node, tree_obj) {
                chrome.tabs.create({ url: "http://api.addthis.com/oexchange/0.8/forward/email/offer?url=" + node.children("a:first").attr("href") + "&title=" + $.trim($(node).children("a:first").text()) });
              },
              separator_before: true,
            },
          }
        },
      },
      callback : {
        onselect: selectNode,
        onsearch: searchComplete,
        ondblclk: function(node, tree_obj) { },
        beforeopen: function(node, tree_obj) {
          if (bg.opts.singleExpand == true) {
            tree_obj.container.find("li.open").not($(node).parents("li")).toggleClass("open").toggleClass("closed");
            return true;
          }
        },
        onopen: function(node) {
          if (bg.opts.rememberExpanded) {
            bg.openFolders = $.grep(bg.openFolders, function(elem) {
              return elem != node.id;
            });
            
            bg.openFolders.push(node.id);
          }
        },
        onclose: function(node) {
          if (bg.opts.rememberExpanded) {
            bg.openFolders = $.grep(bg.openFolders, function(elem) {
              return elem != node.id;
            });
          }
        },
      },
      opened: (bg.opts.rememberExpanded == true ? bg.openFolders : [ ]),
      selected: false
    });
  } else {
    tree_inst.container.find("li[rel='bookmark'] > a").unbind("click", bmClick);
    tree_inst.container.find("li[rel='bookmark'] > a").unbind("mouseup", bmMouseUp);
    tree_inst.container.find("li[rel='label']").unbind("click", lblClick);
    tree_inst.container.find("li[rel='label']").unbind("mouseup", lblMouseUp);
    tree_inst.settings.data.opts["static"] = bms;
    tree_inst.settings.selected = false;
    tree_inst.settings.opened = (bg.opts.rememberExpanded == true ? bg.openFolders : [ ]);
    tree_inst.selected = null;
    tree_inst.refresh();
  }
  
  
  if (bg.error != null) {
    $("<span style='color: red; font-weight: bold;'>ERROR: " + bg.error + "</span>").appendTo(bmsDiv);
    
    return;
  }

  
  tree_inst.container.find("li > ul").css("margin-left", bg.opts.indent);
  tree_inst.container.find("li[rel='bookmark'] > a").bind("click", bmClick);
  tree_inst.container.find("li[rel='bookmark'] > a").bind("mouseup", bmMouseUp);
  tree_inst.container.find("li[rel='label']").bind("click", lblClick);
  tree_inst.container.find("li[rel='label']").bind("mouseup", lblMouseUp);
  
  if (bg.opts.hoverExpand == true) {
    tree_inst.container.find("li[rel='label']").hover(function() {
      tree_inst.toggle_branch(this);
    });
  }
  
  $("#bookmarks").children("ul:first").width("100%");

  /// temporary fix for disappearing label trees
  var w = $("#wrapper").width();
  $("#wrapper").css('width', w-1);
  $("#wrapper").css('width', w);

  if (isNewTab == "true") {
    $("#addCurrentImg").attr("src", "add_off.png").removeAttr("onClick").css("cursor", "default");
    $("#readLaterImg").attr("src", "read_later_off.png").removeAttr("onClick").css("cursor", "default");
    $("#optionsImg").attr("src", "options_off.png").removeAttr("onClick").css("cursor", "default");
  }
  
  getCurrentTab( function(tab) {
    var deleteCurrentImg = $("#deleteCurrentImg"),
        editCurrentImg = $("#editCurrentImg");
    
    if ($.inArray(tab.url, bg.urls) > -1) {
      deleteCurrentImg.attr("src", "delete_on.png").attr("onClick", "deleteCurrentBookmark();").css("cursor", "pointer");
      editCurrentImg.attr("src", "edit_on.png").attr("onClick", "editCurrentBookmark();").css("cursor", "pointer");
    } else {
      deleteCurrentImg.attr("src", "delete_off.png").removeAttr("onClick").css("cursor", "default");
      editCurrentImg.attr("src", "edit_off.png").removeAttr("onClick").css("cursor", "default");
    }
  });
}

function reloadBookmarks() {
  $("#bookmarks").empty().append($("<div>Loading...</div>"));
  $("#search").val("Search Bookmarks").css("color", "#D0D0D0");
  
  bg.reloadBookmarksRSS(this);
}

function addBookmark(url, title, notes, readLater) {
  var addNotes = $("#addNotes");
  
  addNotes.val(notes);
  
  if (readLater) {
    $("body").css("cursor", "wait");
    
    $.ajax({
      type: "POST",
      url: baseUrl2,
      data: {
        zx: (new Date()).getTime(),
        bkmk: url,
        title: title,
        annotation: addNotes.val(),
        labels: bg.opts.readLaterLabel,
        prev: "/lookup",
        sig: bg.signature
      },
      timeout: bg.opts.reqTimeout,
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        $("body").css("cursor", "default");
        
        reloadBookmarks();
      },
      success: function(data, textStatus) {
        $("body").css("cursor", "default");
        
        reloadBookmarks();
      }
    });
  } else {
    var addName = $("#addName"),
        addUrl = $("#addUrl"),
        addLabels = $("#addLabels");
        
    addName.val(title);
    addUrl.val(url);

    addLabels.flushCache();
    addLabels.autocomplete(
      bg.labels,
      {
        multiple: true,
        max: 10000,
        scrollHeight: 160,
        matchContains: (bg.opts.autocompleteMatch != "begins"),
        selectFirst: false,
        formatItem: function(item) {
          return item.display;
        },
        formatMatch: function(item) {
          return item.value;
        },
        formatResult: function(item) {
          return item.value;
        }
      }
    );
    
    if (addDialog == null) {
      addDialog = $("#addDialog");
      
      addDialog.dialog({
        autoOpen: false,
        modal: true,
        draggable: false,
        resizable: false,
        title: "Add Bookmark",
        open: function(event, ui) {
          addLabels.focus();
        },
        buttons: {
          "Add": function() {
            $("body").css("cursor", "wait");
            
            $.ajax({
              type: "POST",
              url: baseUrl2,
              data: {
                zx: (new Date()).getTime(),
                bkmk: addUrl.val(),
                title: addName.val(),
                annotation: addNotes.val(),
                labels: addLabels.val(),
                prev: "/lookup",
                sig: bg.signature
              },
              timeout: bg.opts.reqTimeout,
              error: function(XMLHttpRequest, textStatus, errorThrown) {
                $("body").css("cursor", "default");
                
                reloadBookmarks();
                
                closeDialog(null, addDialog);
              },
              success: function(data, textStatus) {
                $("body").css("cursor", "default");
                
                reloadBookmarks();
                
                closeDialog(null, addDialog);
              }
            });
          },
          Cancel: closeDialog,
        }
      });
    }
    
    addDialog.dialog("open");
  }
}

function bookmarkCurrentPage(readLater) {
  getCurrentTab( function(tab) {
    var url = tab.url.toLowerCase(),
        currBm = tree_inst.container.find("li[rel='bookmark'] > a[href='" + tab.url + "']").parent();
    
    if (currBm.length > 0) {
      renameNode(currBm, tree_inst);
    } else if ((url.indexOf("chrome") == 0) || (url.indexOf("https://chrome.google.com/extensions") == 0) ||
        (url.indexOf("https://chrome.google.com/webstore") == 0)) {
      addBookmark(tab.url, tab.title, "", readLater);
    } else {
      chrome.tabs.sendMessage(tab.id, { op: "GetSelection" }, function (response) {
        addBookmark(tab.url, tab.title, response.selectedText, readLater);
      });
    }
  });
}

function showOptions() {
  chrome.tabs.create({ url: chrome.extension.getURL("options.html"), selected: true });
  
  window.close();
}

function showHistory() {
  getCurrentTab( function(tab) {
    chrome.tabs.update(tab.id, { url: "chrome://history" });
  });
}

function showDownloads() {
  getCurrentTab( function(tab) {
    chrome.tabs.update(tab.id, { url: "chrome://downloads" });
  });
}

function logout() {
  bg.error = "Logged out";
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  switch(request.op) {
    case "ShowBookmarks":
      showBookmarks();
      break;
  }
});

$(document).ready(function () {
  bg = chrome.extension.getBackgroundPage();
  
  if (bg == null) {
    window.close();
  }

  if (isNewTab != "true")
  {
    $("body")
      .css("min-width", bg.opts.width + "px")
      .css("min-height", bg.opts.height + "px");
    $("#wrapper")
      .width(bg.opts.width + "px")
      .height(bg.opts.height + "px");
    $("#bookmarks").height($("#wrapper").height() - $("#title").outerHeight(true));
    $(".new_tab").hide();
  
    $(document).keyup(function(e) {
      if (bg.opts.newBookmarkShortcut &&
          (((bg.opts.newBookmarkShortcutMod == "alt") && e.altKey) || ((bg.opts.newBookmarkShortcutMod == "ctrl") && e.ctrlKey)) &&
          (e.which == bg.opts.newBookmarkShortcutKey.toUpperCase().charCodeAt(0))) {
        bookmarkCurrentPage(false);
      }
    });
  }

  $(document).keyup(function(e) {
    if (bg.opts.searchShortcut &&
        (((bg.opts.searchShortcutMod == "alt") && e.altKey) || ((bg.opts.searchShortcutMod == "ctrl") && e.ctrlKey)) &&
        (e.which == bg.opts.searchShortcutKey.toUpperCase().charCodeAt(0))) {
      $("#search").focus();
    }
  });

  $("body")
    .css("background-color", bg.opts.bgColor)
    .css("font-size", bg.opts.fontSize);
  $(".dialog input, .dialog textarea").css("font-size", bg.opts.fontSize);

  window.setTimeout(function() {
    if (bg.error != null) {
      reloadBookmarks();
    } else {
      showBookmarks();
    }
  },
  10);

  var search_bookmarks = chrome.i18n.getMessage("search_bookmarks");
  
  $("#search").focus(function() {
    if ($(this).val() == search_bookmarks) {
      $(this).val("").css("color", "black");
    }
  }).blur(function() {
    if ($.trim($(this).val()) == "") {
      $(this).val(search_bookmarks).css("color", "#D0D0D0");
    }
  }).keyup(function(evt) {
    if (searchTimeout != null) {
      window.clearTimeout(searchTimeout);
    }
    
    var term = $("#search").val();
    
    searchTimeout = window.setTimeout(function() {
      if (bg.opts.searchMethod == "highlight") {
        tree_inst.container.find(".search").removeClass("search");
      } else {
        tree_inst.container.find("a:not(.found)").parent().show();
        tree_inst.container.find(".found").removeClass("found");
      }
      
      tree_inst.close_all();
      tree_inst.search((term.length >= bg.opts.searchMinChars ? term : ""), "icontains");
    },
    bg.opts.searchDelay);
  });
  
  $("#search").focus();
});

// ****************************************************************************
// Case insensitive contains
// ****************************************************************************
$.expr[':'].icontains = function(obj, index, meta, stack) {
  return (obj.textContent || obj.innerText || jQuery(obj).text() || '').toLowerCase().indexOf(meta[3].toLowerCase()) >= 0;
};

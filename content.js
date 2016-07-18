var addDialog = null,
    labels = null,
    linkTitle = null,
    autocompleteMatch = true;

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.op == "GetSelection") {
    sendResponse({selectedText: document.getSelection().toString() });
  } else if (request.op == "BookmarkCurrentPage") {
    showDialog();
  } else if (request.op == "BookmarkLink") {
    showDialog(linkTitle, request.url);
  }
});

function closeDialog(event, ui) {
  if (ui == null) {
    $(this).dialog("close");
  } else {
    $(ui).dialog("close");
  }
}

function showDialog(title, url) {
  // Create the dialog window
  if (addDialog == null) {
    // Add the dialog
    $("body").append(
      '<div id="yagbe_addDialog" class="yagbe_dialog" style="display: none;">' +
        '<div>' +
          '<label for="yagbe_addName">Name:</label>&nbsp;' +
          '<input type="text" name="yagbe_addName" id="yagbe_addName" class="yagbe_ui-widget-content yagbe_ui-corner-all" /><br />' +
          '<label for="yagbe_addUrl" id="yagbe_addUrlLbl">Location (URL):</label>&nbsp;' +
          '<input type="text" name="yagbe_addUrl" id="yagbe_addUrl" class="yagbe_ui-widget-content yagbe_ui-corner-all" /><br />' +
          '<label for="yagbe_addLabels" id="yagbe_addLabelsLbl">Labels:</label>&nbsp;' +
          '<input type="text" name="yagbe_addLabels" id="yagbe_addLabels" class="yagbe_ui-widget-content yagbe_ui-corner-all" /><br />' +
          '<label for="yagbe_addNotes" id="yagbe_addNotesLbl">Notes:</label>&nbsp;' +
          '<textarea rows="3" cols="20" name="yagbe_addNotes" id="yagbe_addNotes" class="yagbe_ui-widget-content yagbe_ui-corner-all"></textarea>' +
        '</div>' +
      '</div>'
    );
  
    $("#yagbe_addLabels").autocomplete(
      labels,
      {
        multiple: true,
        max: 10000,
        scrollHeight: 160,
        matchContains: autocompleteMatch,
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
  
    addDialog = $("#yagbe_addDialog");
  
    // Create the dialog
    addDialog.dialog({
      autoOpen: false,
      modal: true,
      draggable: false,
      resizable: false,
      title: "YAGBE - Add Bookmark",
      open: function(event, ui) {
        $("#yagbe_addLabels").focus();
      },
      buttons: {
        "Add": function() {
          $("body").css("cursor", "wait");
          
          // Tell the background page to create the bookmark
          chrome.extension.sendMessage(
            {
              'op' : 'AddBookmark',
              'url': $("#yagbe_addUrl").val(),
              'title': $("#yagbe_addName").val(),
              'notes': $("#yagbe_addNotes").val(),
              'labels': $("#yagbe_addLabels").val() 
            },
            function(data) {
              $("body").css("cursor", "default");
              
              closeDialog(null, addDialog);
            }
          );
        },
        Cancel: closeDialog,
      }
    });
  }
  
  $("#yagbe_addName").val(title != null ? title : document.title);
  $("#yagbe_addUrl").val(url != null ? url : location.href);
  $("#yagbe_addNotes").val(document.getSelection().toString());
  
  addDialog.dialog("open");
  
  // Correct CSS URLs
  $(".yagbe_ui-dialog, .yagbe_ui-dialog input, .yagbe_ui-dialog textarea").css("font", "menu");
  $(".yagbe_ui-dialog, .yagbe_ui-dialog input, .yagbe_ui-dialog textarea").css("font-size", "9pt");
  $(".yagbe_ui-dialog input, .yagbe_ui-dialog textarea").css("width", "95%");
  $(".yagbe_ui-dialog input, .yagbe_ui-dialog textarea").css("margin-top", "2px");
  $(".yagbe_ui-dialog input, .yagbe_ui-dialog textarea").css("margin-bottom", "2px");
  $(".yagbe_ui-dialog").css("text-align", "left");
}

// Get the options from the background page
chrome.extension.sendMessage({ 'op' : 'GetOptions' }, function(data) {
  autocompleteMatch = (data.opts.autocompleteMatch != "begins");
  
  if (data.opts.newBookmarkShortcut) {
    labels = data.labels;
    
    $(document).keyup(function(e) {
      if (
        (((data.opts.newBookmarkShortcutMod == "alt") && e.altKey) || ((data.opts.newBookmarkShortcutMod == "ctrl") && e.ctrlKey)) &&
        (e.which == data.opts.newBookmarkShortcutKey.toUpperCase().charCodeAt(0))
        ) {
        e.preventDefault();
        
        showDialog();
      }
    });
  }
});

// Helper function to save title/text for right-clicked links (for context menu)
$("a").live("contextmenu", function(e) {
  var tmpThis = $(this);
  var tmpTitle = $.trim(tmpThis.attr("title"));
  var tmpText = $.trim(tmpThis.text());
  var tmpImg = tmpThis.children("img").first();
  
  if ((tmpTitle != null) && (tmpTitle.length > 0)) {
    linkTitle = tmpTitle;
  } else if ((tmpText != null) && (tmpText.length > 0)) {
    linkTitle = tmpText;
  } else if (tmpImg != null) {
    linkTitle = tmpImg.attr("alt");
  }
});

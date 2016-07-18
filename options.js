
$(document).ready(function(){
  $("#save").click(save_options);
});


var opts = new Options();

function save_options() {
  var checked = "checked",
      optSelected = "option:selected";
  
  opts.newTab = $("#newTab").attr(checked);
  opts.labelUnlabeled = $("#labelUnlabeled").attr(checked);
  opts.unlabeledLabel = $("#unlabeledLabel").val();
  opts.readLaterLabel = $("#readLaterLabel").val();
  opts.sortBy = $("#sortBy " + optSelected).val();
  opts.sortDir = $("#sortDir " + optSelected).val();
  opts.autocompleteMatch = $("#autocompleteMatch " + optSelected).val();
  opts.toolbarIcon = $("#toolbarIcon " + optSelected).val();
  opts.enableNotes = $("#enableNotes").attr(checked);
  opts.showVersionHistory = $("#showVersionHistory").attr(checked);
  opts.searchMethod = $("#searchMethod " + optSelected).val();
  opts.theme = $("#theme " + optSelected).val();
  opts.fontSize = $("#fontSize").val();
  opts.bgColor = $("#bgColor").val();
  opts.indent = $("#indent").val();
  opts.showDots = $("#showDots").attr(checked);
  opts.showFavs = $("#showFavs").attr(checked);
  opts.favsType = $("#favsType " + optSelected).val();
  opts.showLabelToolTips = $("#showLabelToolTips").attr(checked);
  opts.showToolTips = $("#showToolTips").attr(checked);
  opts.showNameToolTips = $("#showNameToolTips").attr(checked);
  opts.showLocToolTips = $("#showLocToolTips").attr(checked);
  opts.showLblToolTips = $("#showLblToolTips").attr(checked);
  opts.showNotesToolTips = $("#showNotesToolTips").attr(checked);
  opts.showTimeToolTips = $("#showTimeToolTips").attr(checked);
  opts.labelSep = $("#labelSep").val();
  opts.menuSpeed = parseInt($("#menuSpeed").val());
  opts.hoverExpand = $("#hoverExpand").attr(checked);
  opts.singleExpand = $("#singleExpand").attr(checked);
  opts.rememberExpanded = $("#rememberExpanded").attr(checked);
  opts.reqTimeout = parseInt($("#reqTimeout").val());
  opts.searchDelay = parseInt($("#searchDelay").val());
  opts.searchMinChars = parseInt($("#searchMinChars").val());
  opts.width = parseInt($("#width").val());
  opts.height = parseInt($("#height").val());
  opts.newBookmarkShortcut = $("#newBookmarkShortcut").attr(checked);
  opts.newBookmarkShortcutMod = $("#newBookmarkShortcutMod " + optSelected).val();
  opts.newBookmarkShortcutKey = $("#newBookmarkShortcutKey").val();
  opts.searchShortcut = $("#searchShortcut").attr(checked);
  opts.searchShortcutMod = $("#searchShortcutMod " + optSelected).val();
  opts.searchShortcutKey = $("#searchShortcutKey").val();
  opts.showContextMenu = $("#showContextMenu").attr(checked);
  localStorage.support = opts.support = !(document.getElementById("dontsupport").checked);///
  
  opts.save();
  
  $("#save").scrollIntoView();
  $("#saved").stop(false, true).fadeIn("fast").fadeOut(4000);
  
  chrome.extension.getBackgroundPage().reloadBookmarksRSS(null);
}

function restore_options() {
  var checked = "checked",
      selected = "selected";
  
  opts.load();
  
  $("#newTab").attr(checked, opts.newTab);
  $("#labelUnlabeled").attr(checked, opts.labelUnlabeled);
  $("#unlabeledLabel").val(opts.unlabeledLabel);
  $("#readLaterLabel").val(opts.readLaterLabel);
  $("#sortBy option[value='" + opts.sortBy + "']").attr(selected, selected);
  $("#sortDir option[value='" + opts.sortDir + "']").attr(selected, selected);
  $("#autocompleteMatch option[value='" + opts.autocompleteMatch + "']").attr(selected, selected);
  $("#toolbarIcon option[value='" + opts.toolbarIcon + "']").attr(selected, selected);
  $("#enableNotes").attr(checked, opts.enableNotes);
  $("#showVersionHistory").attr(checked, opts.showVersionHistory);
  $("#searchMethod option[value='" + opts.searchMethod + "']").attr(selected, selected);
  $("#theme option[value='" + opts.theme + "']").attr(selected, selected);
  $("#fontSize").val(opts.fontSize);
  $("#bgColor").val(opts.bgColor);
  $("#indent").val(opts.indent);
  $("#showDots").attr(checked, opts.showDots);
  $("#showFavs").attr(checked, opts.showFavs);
  $("#favsType option[value='" + opts.favsType + "']").attr(selected, selected);
  $("#showLabelToolTips").attr(checked, opts.showLabelToolTips);
  $("#showToolTips").attr(checked, opts.showToolTips);
  $("#showNameToolTips").attr(checked, opts.showNameToolTips);
  $("#showLocToolTips").attr(checked, opts.showLocToolTips);
  $("#showLblToolTips").attr(checked, opts.showLblToolTips);
  $("#showNotesToolTips").attr(checked, opts.showNotesToolTips);
  $("#showTimeToolTips").attr(checked, opts.showTimeToolTips);
  $("#labelSep").val(opts.labelSep);
  $("#menuSpeed").val(opts.menuSpeed);
  $("#hoverExpand").attr(checked, opts.hoverExpand);
  $("#singleExpand").attr(checked, opts.singleExpand);
  $("#rememberExpanded").attr(checked, opts.rememberExpanded);
  $("#reqTimeout").val(opts.reqTimeout);
  $("#searchDelay").val(opts.searchDelay);
  $("#searchMinChars").val(opts.searchMinChars);
  $("#width").val(opts.width);
  $("#height").val(opts.height);
  $("#newBookmarkShortcut").attr(checked, opts.newBookmarkShortcut);
  $("#newBookmarkShortcutMod option[value='" + opts.newBookmarkShortcutMod + "']").attr(selected, selected);
  $("#newBookmarkShortcutKey").val(opts.newBookmarkShortcutKey);
  $("#searchShortcut").attr(checked, opts.searchShortcut);
  $("#searchShortcutMod option[value='" + opts.searchShortcutMod + "']").attr(selected, selected);
  $("#searchShortcutKey").val(opts.searchShortcutKey);
  $("#showContextMenu").attr(checked, opts.showContextMenu);
  document.getElementById("dontsupport").checked = (localStorage.support == "false");///
}

$(document).ready(function () {
  $(document).keypress(function(e) {
    if (e.which == 13) {
      save_options();
    }
  });
  
  restore_options();
  
  $("#unlabeledLabel").attr("disabled", !$("#labelUnlabeled").attr("checked"));
  
  $("#labelUnlabeled").change(function() {
    $("#unlabeledLabel").attr("disabled", !$("#labelUnlabeled").attr("checked"));
  });
  
  $("#sortDir").attr("disabled", ($("#sortBy option:selected").val() == "none"));
  
  $("#sortBy").change(function() {
    $("#sortDir").attr("disabled", ($("#sortBy option:selected").val() == "none"));
  });
  
  $("#toolbarIcon").change(function() {
    var iconPath;
    
    switch ($("#toolbarIcon option:selected").val()) {
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

    $("#toolbarIconImgOn").css("background-image", "url('" + iconPath + "_on.png')");
    $("#toolbarIconImgOff").css("background-image", "url('" + iconPath + "_off.png')");
  });
  
  $("#toolbarIcon").change();
  
  $("#favsType").attr("disabled", !$("#showFavs").attr("checked"));
  
  $("#showFavs").change(function() {
    $("#favsType").attr("disabled", !$("#showFavs").attr("checked"));
  });
  
  $("#showNameToolTips").attr("disabled", !$("#showToolTips").attr("checked"));
  $("#showLocToolTips").attr("disabled", !$("#showToolTips").attr("checked"));
  $("#showLblToolTips").attr("disabled", !$("#showToolTips").attr("checked"));
  $("#showNotesToolTips").attr("disabled", !$("#showToolTips").attr("checked"));
  $("#showTimeToolTips").attr("disabled", !$("#showToolTips").attr("checked"));
  
  $("#showToolTips").change(function() {
    $("#showNameToolTips").attr("disabled", !$("#showToolTips").attr("checked"));
    $("#showLocToolTips").attr("disabled", !$("#showToolTips").attr("checked"));
    $("#showLblToolTips").attr("disabled", !$("#showToolTips").attr("checked"));
    $("#showNotesToolTips").attr("disabled", !$("#showToolTips").attr("checked"));
    $("#showTimeToolTips").attr("disabled", !$("#showToolTips").attr("checked"));
  });
  
  $("#newBookmarkShortcutMod").attr("disabled", !$("#newBookmarkShortcut").attr("checked"));
  $("#newBookmarkShortcutKey").attr("disabled", !$("#newBookmarkShortcut").attr("checked"));

  $("#newBookmarkShortcut").change(function() {
    $("#newBookmarkShortcutMod").attr("disabled", !$("#newBookmarkShortcut").attr("checked"));
    $("#newBookmarkShortcutKey").attr("disabled", !$("#newBookmarkShortcut").attr("checked"));
  });
  
  $("#searchShortcutMod").attr("disabled", !$("#searchShortcut").attr("checked"));
  $("#searchShortcutKey").attr("disabled", !$("#searchShortcut").attr("checked"));

  $("#searchShortcut").change(function() {
    $("#searchShortcutMod").attr("disabled", !$("#searchShortcut").attr("checked"));
    $("#searchShortcutKey").attr("disabled", !$("#searchShortcut").attr("checked"));
  });
  
  $("#bgColor").attachColorPicker();
  
  $("#nav li").click(function() {
    var obj = $(this);
    
    obj.siblings().removeClass("selected").addClass("notSelected");
    obj.addClass("selected").removeClass("notSelected");
    
    $("#content > div").hide().filter(obj.children("a").first().attr("hash")).show();
    
    return false;
  }).filter(":first").click();
  
  
});

// ****************************************************************************
// ScrollIntoView
// ****************************************************************************
(function($) {
  
  //lazy evaluate the scrolling element (needs to be evaluated after the body element exists)
  var html;
  
  // default for this plugin, outerWidth/Height  and offset is to include padding and border but exclude margin. This adjusts the measurements if the options are set to something different
  function propPx(el,opts, what){
  	return	Math.round(
  		(!opts.padding && -parseFloat(el.css('padding'+what) || 0)) +
  		(!opts.border && -parseFloat(el.css('border'+what+'Width') || 0)) +
  		(opts.margin && parseFloat(el.css('margin'+what) || 0))
  	);
  }
  
  // find the effective size of the window; the clientHeight/Width less the size of the element. This gives the width/height of the rectangle that the top left corner of the element can go in and still
  // leave room for the entire element
  function constrainPx (el, opts, what){
  	return document.documentElement['client'+what] - el['outer'+what]() -
  		(what == 'Height' ?
  			propPx(el,opts,'Top')+propPx(el,opts,'Bottom') :
  			propPx(el,opts,'Left')+propPx(el,opts,'Right')
  		);
  }
  
  $.fn.scrollIntoView = function(opts, easing, fn) {
  	// FF3 needs to scroll html; body.scrollHeight < html.scrollHeight
  	// Opera9 needs to scroll html (body works but flashes); body < html
  	// Chrome1 needs to scroll body; body >= html
  	// Safari3 needs to scroll body; body >= html
  	// IE7 in quirksmode needs to scroll body; body > html
  	// IE7 in standards mode needs to scroll html; body < html
  	html = html || ($('body')[0].scrollHeight >= $('html')[0].scrollHeight ? $('body')[0] : $('html')[0]);
  	
  	if (typeof opts != 'object') {
  	  opts = {duration: opts, easing: easing, complete: fn};
  	}
  	
  	opts = $.extend({}, $.fn.scrollIntoView.defaults, $.metadata && this.metadata()['scrollIntoView'], opts);
  	
  	if (opts.complete) {
  		// the animate is done on the html element; the callback needs to be done on the target.
  		var complete = opts.complete, self = this[0];
  		
  		opts.complete = function () {
  		  complete.apply(self, arguments);
  		};
  	}
  	
  	if (opts.margin) {
  	  opts.border = true; // make sure the properties are logically consistent
  	}
  	
  	if (opts.border) {
  	  opts.padding = true;
  	}
  	
  	var offset = this.offset(), // offset includes padding and border. We need to adjust
  	    h = Math.max(0, constrainPx(this, opts, 'Height')), // if the size is negative then the element will not fit.  Just scroll so the top left corner is maximally visible 
        w = Math.max(0, constrainPx(this, opts, 'Width'));
  	
  	offset.top -= propPx(this, opts, 'Top');
  	offset.left -= propPx(this, opts, 'Left');
  
    $(html).animate({
      scrollTop: Math.min(offset.top, Math.max(html.scrollTop, offset.top-h)),
      scrollLeft: Math.min(offset.left, Math.max(html.scrollLeft, offset.left-w))
    }, opts);
  
    return this;
  };
  
  $.fn.scrollIntoView.defaults = {
  	padding: true,
  	border: true,
  	margin: false
  };
})(jQuery);
// ****************************************************************************

  	// show thank you page upon first install
  	chrome.runtime.onInstalled.addListener(function (details) {
  		if (details.reason == 'install') {
  			chrome.tabs.create({
  			    url: chrome.extension.getURL('thank_you.html'),
  			    selected: true
  			 });
  		}
  	});
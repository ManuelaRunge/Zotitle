// Only create main object once
if (!Zotero.uppercase) {
	let loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
					.getService(Components.interfaces.mozIJSSubScriptLoader);
	loader.loadSubScript("chrome://zotero-zotitle/content/ChangeTitleCase.js");
}
// Startup -- load Zotero and constants
if (typeof Zotero === 'undefined') {
    Zotero = {};
}
Zotero.ChangeTitleCase = {};

// Definitions

const operations = [
    "upper", "lower", "title", "sentence"
];

const operationNames = {
    "upper": "changeToUpper",
    "lower": "changeToLower",
    "title": "changeToTitle",
    "sentence": "changeToSentence"
};



function changeTitleCase(item, tag) {
	//Slightly modified from Thieu: https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
	String.prototype.toTitleCase = function(){
		var newString = '';
		var lastEditedIndex;
		for (var i = 0; i < this.length; i++){
			if(i==0)newString += this[i].toUpperCase();
			else if(this[i] == ' ' || this[i] == '-' || this[i] == '_'){
				newString += this[i]
				newString += this[i+1].toUpperCase();
				lastEditedIndex = i+1;
			}
			else if(lastEditedIndex !== i) newString += this[i].toLowerCase();
		}
		return newString;
	}
		
	// see https://www.zotero.org/support/dev/client_coding/javascript_api#managing_citations_and_bibliographies
	var items = Zotero.getActiveZoteroPane().getSelectedItems();
	
	String.prototype.toSentenceCase = function(){
		var newString = '';
		var lastEditedIndex;
		for (var i = 0; i < this.length; i++){
			if(i==0)newString += this[i].toUpperCase();
			//to do, add exceptions
			else if(i>0) newString += this[i].toLowerCase();
		}
		return newString;
	}


	if (tag == 'changeToUpper') {
		let title = item.getField('title');
		item.setField('title', title.toUpperCase());
	}
	if (tag == 'changeToLower') {
		let title = item.getField('title');
		item.setField('title', title.toLowerCase());
	}
	if (tag == 'changeToTitle') {
		let title = item.getField('title');
		item.setField('title', title.toTitleCase());
	}
	if (tag == 'changeToSentence') {
		let title = item.getField('title');
		item.setField('title', title.toSentenceCase());
	}
}

async function checkTitleExist(item) {
    const doi = item.getField('DOI');
    if (!doi) {
        // There is no DOI; skip item
        return -1;
    }
    const edoi = encodeURIComponent(doi);

    let response = null;

    if (response === null) {
        const style = "vnd.citationstyles.csl+json";
        const xform = "transform/application/" + style;
        const url = "https://api.crossref.org/works/" + edoi + "/" + xform;
        response = await fetch(url)
            .then(response => response.json())
            .catch(err => null);
    }

    if (response === null) {
        const url = "https://doi.org/" + edoi;
        const style = "vnd.citationstyles.csl+json";
        response = await fetch(url, {
            headers: {
                "Accept": "application/" + style
            }
        })
            .then(response => response.json())
            .catch(err => null);
        }

    if (response === null) {
        // Something went wrong
        return -1;
    }

    let str = null;
    try {
        str = response['is-referenced-by-count'];
    } catch (err) {
        // There are no citation counts
        return -1;
    }

    const count = parseInt(str);
    return count;
}


// Preference managers

function getPref(pref) {
    return Zotero.Prefs.get('extensions.citationcounts.' + pref, true)
};

function setPref(pref, value) {
    return Zotero.Prefs.set('extensions.citationcounts.' + pref, value, true)
};

// Startup - initialize plugin

Zotero.ChangeTitleCase.init = function() {
    Zotero.ChangeTitleCase.resetState("initial");

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(
        Zotero.ChangeTitleCase.notifierCallback, ['item']);

    // Unregister callback when the window closes (important to avoid
    // a memory leak)
    window.addEventListener('unload', function(e) {
        Zotero.Notifier.unregisterObserver(notifierID);
    }, false);
};

Zotero.ChangeTitleCase.notifierCallback = {
    notify: function(event, type, ids, extraData) {
        if (event == 'add') {
            const operation = getPref("autoretrieve");
            Zotero.ChangeTitleCase.updateItems(Zotero.Items.get(ids), operation);
        }
    }
};



Zotero.ChangeTitleCase.resetState = function(operation) {
    if (operation == "initial") {
        if (Zotero.ChangeTitleCase.progressWindow) {
            Zotero.ChangeTitleCase.progressWindow.close();
        }
        Zotero.ChangeTitleCase.current = -1;
        Zotero.ChangeTitleCase.toUpdate = 0;
        Zotero.ChangeTitleCase.itemsToUpdate = null;
        Zotero.ChangeTitleCase.numberOfUpdatedItems = 0;
        Zotero.ChangeTitleCase.counter = 0;
        final_count_shown = false;
        return;
    } 

    if (!final_count_shown) {
        const icon = "chrome://zotero/skin/tick.png";
        Zotero.ChangeTitleCase.progressWindow = new Zotero.ProgressWindow({closeOnClick:true});
        Zotero.ChangeTitleCase.progressWindow.changeHeadline("Finished");
        Zotero.ChangeTitleCase.progressWindow.progress = new Zotero.ChangeTitleCase.progressWindow.ItemProgress(icon);
        Zotero.ChangeTitleCase.progressWindow.progress.setProgress(100);
        Zotero.ChangeTitleCase.progressWindow.progress.setText("Title case updated for " + Zotero.ChangeTitleCase.counter + " items.");
        Zotero.ChangeTitleCase.progressWindow.show();
        Zotero.ChangeTitleCase.progressWindow.startCloseTimer(4000);
        final_count_shown = true;
    }
};

Zotero.ChangeTitleCase.updateSelectedItems = function(operation) {
    Zotero.ChangeTitleCase.updateItems(ZoteroPane.getSelectedItems(), operation);
};

Zotero.ChangeTitleCase.updateItems = function(items0, operation) {
    const items = items0.filter(item => !item.isFeedItem);

    if (items.length === 0 ||
        Zotero.ChangeTitleCase.numberOfUpdatedItems <
        Zotero.ChangeTitleCase.toUpdate) {
        return;
    }

    Zotero.ChangeTitleCase.resetState("initial");
    Zotero.ChangeTitleCase.toUpdate = items.length;
    Zotero.ChangeTitleCase.itemsToUpdate = items;

    // Progress Windows
    Zotero.ChangeTitleCase.progressWindow =
        new Zotero.ProgressWindow({closeOnClick: false});
    Zotero.ChangeTitleCase.progressWindow.changeHeadline(
        "Title " + operationNames[operation]);
    Zotero.ChangeTitleCase.progressWindow.progress =
        new Zotero.ChangeTitleCase.progressWindow.ItemProgress(
            "Changing title case...");
    Zotero.ChangeTitleCase.updateNextItem(operation);
};

Zotero.ChangeTitleCase.updateNextItem = function(operation) {
    Zotero.ChangeTitleCase.numberOfUpdatedItems++;

    if (Zotero.ChangeTitleCase.current == Zotero.ChangeTitleCase.toUpdate - 1) {
        Zotero.ChangeTitleCase.progressWindow.close();
        Zotero.ChangeTitleCase.resetState(operation);
        return;
    }

    Zotero.ChangeTitleCase.current++;

    // Progress Windows
    const percent = Math.round(Zotero.ChangeTitleCase.numberOfUpdatedItems /
                               Zotero.ChangeTitleCase.toUpdate * 100);
    Zotero.ChangeTitleCase.progressWindow.progress.setProgress(percent);
    Zotero.ChangeTitleCase.progressWindow.progress.setText(
        "Item "+Zotero.ChangeTitleCase.current+" of "+
            Zotero.ChangeTitleCase.toUpdate);
    Zotero.ChangeTitleCase.progressWindow.show();

    Zotero.ChangeTitleCase.updateItem(
        Zotero.ChangeTitleCase.itemsToUpdate[Zotero.ChangeTitleCase.current],
        operation);
};


Zotero.ChangeTitleCase.updateItem = async function(item, operation) {
    if (operation == "upper") {

        const count = await checkTitleExist(item);
        if (count >= 0) {
            changeTitleCase(item, 'changeToUpper');
            item.saveTx();
            Zotero.ChangeTitleCase.counter++;
        }
        Zotero.ChangeTitleCase.updateNextItem(operation);

    } 
	if (operation == "lower") {

        const count = await checkTitleExist(item);
        if (count >= 0) {
            changeTitleCase(item, 'changeToLower');
            item.saveTx();
            Zotero.ChangeTitleCase.counter++;
        }
        Zotero.ChangeTitleCase.updateNextItem(operation);

    } 
	if (operation == "title") {

        const count = await checkTitleExist(item);
        if (count >= 0) {
            changeTitleCase(item, 'changeToTitle');
            item.saveTx();
            Zotero.ChangeTitleCase.counter++;
        }
        Zotero.ChangeTitleCase.updateNextItem(operation);

    } 
	if (operation == "sentence") {

        const count = await checkTitleExist(item);
        if (count >= 0) {
            changeTitleCase(item, 'changeToSentence');
            item.saveTx();
            Zotero.ChangeTitleCase.counter++;
        }
        Zotero.ChangeTitleCase.updateNextItem(operation);

    }
};


if (typeof window !== 'undefined') {
    window.addEventListener('load', function(e) {
        Zotero.ChangeTitleCase.init();
    }, false);
}

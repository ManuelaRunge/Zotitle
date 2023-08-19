// Startup -- load Zotero 
if (typeof Zotero === 'undefined') {
    Zotero = {};
}
Zotero.ChangeTitleCase = {};


function changeTitleCase(item, operation) {
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


	if (operation == 'to_upper') {
		let title = item.getField('title');
		item.setField('title', title.toUpperCase());
	}
	if (operation == 'to_lower') {
		let title = item.getField('title');
		item.setField('title', title.toLowerCase());
	}
	if (operation == 'to_title') {
		let title = item.getField('title');
		item.setField('title', title.toTitleCase());
	}
	if (operation == 'to_sentence') {
		let title = item.getField('title');
		item.setField('title', title.toSentenceCase());
	}
}




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
        "Title " + operation);
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

	if (item.getField('title')) {
		changeTitleCase(item, operation);
		item.saveTx();
		Zotero.ChangeTitleCase.counter++;
	}
	Zotero.ChangeTitleCase.updateNextItem(operation);

};



Zotero.ChangeTitleCase = new function() {

    this.currentStyle = "";

	/**
	* CHANGE TO UPPER CASE
	* @return {void}
	*/
	this.changeToUpper = async function(){
		Zotero.debug('zotero.testmr: changeToUpper');
		
		// see https://www.zotero.org/support/dev/client_coding/javascript_api#managing_citations_and_bibliographies
		var items = Zotero.getActiveZoteroPane().getSelectedItems();

        var ZoteroPane = Zotero.getActiveZoteroPane();
        // Get first selected item
        var selectedItems = ZoteroPane.getSelectedItems();

        for (var i = 0; i < selectedItems.length; i++){
            var item = selectedItems[i];
            // Proceed if an item is selected and it isn't a note
            if (item && item.isRegularItem()) {
                var title = item.getField('title');
                item.setField('title', title.toUpperCase());
                await item.saveTx(); 
            }
        }

		Zotero.debug('zotero.testmr: changeToUpper done');
	};

	/**
	* CHANGE TO LOWER CASE
	* @return {void}
	*/
	this.changeToLower = async function(){
		Zotero.debug('zotero.testmr: changeToLower');
		
		// see https://www.zotero.org/support/dev/client_coding/javascript_api#managing_citations_and_bibliographies
		var items = Zotero.getActiveZoteroPane().getSelectedItems();
		
        var ZoteroPane = Zotero.getActiveZoteroPane();
        // Get first selected item
        var selectedItems = ZoteroPane.getSelectedItems();

        for (var i = 0; i < selectedItems.length; i++){
            var item = selectedItems[i];
            // Proceed if an item is selected and it isn't a note
            if (item && item.isRegularItem()) {
                var title = item.getField('title');
                item.setField('title', title.toLowerCase());
                await item.saveTx(); 
            }
        }

		Zotero.debug('zotero.testmr: changeToLower done');
	};

    /**
	* CHANGE TO TITLE CASE
	* @return {void}
	*/
	this.changeToTitle = async function(){
		Zotero.debug('zotero.testmr: changeToLower');
		
		// see https://www.zotero.org/support/dev/client_coding/javascript_api#managing_citations_and_bibliographies
		var items = Zotero.getActiveZoteroPane().getSelectedItems();
		
        String.prototype.toTitleCase = function(){
            var newString = '';
            var lastEditedIndex;
            for (var i = 0; i < this.length; i++){
                if(i==0)newString += this[i].toUpperCase();
                //to do, add exceptions
                else if(i>0) newString += this[i].toLowerCase();
            }
            return newString;
        }


        var ZoteroPane = Zotero.getActiveZoteroPane();
        // Get first selected item
        var selectedItems = ZoteroPane.getSelectedItems();

        for (var i = 0; i < selectedItems.length; i++){
            var item = selectedItems[i];
            // Proceed if an item is selected and it isn't a note
            if (item && item.isRegularItem()) {
                var title = item.getField('title');
                item.setField('title', title.toTitleCase());
                await item.saveTx(); 
            }
        }

		Zotero.debug('zotero.testmr: changeToLower done');
	};

    /**
	* CHANGE TO CAMEL CASE
	* @return {void}
	*/
	this.changeToCamel = async function(){
		Zotero.debug('zotero.testmr: changeToCamel');
		
		// see https://www.zotero.org/support/dev/client_coding/javascript_api#managing_citations_and_bibliographies
		var items = Zotero.getActiveZoteroPane().getSelectedItems();
		
        //Slightly modified from Thieu: https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
        String.prototype.toCamelCase = function(){
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


        var ZoteroPane = Zotero.getActiveZoteroPane();
        // Get first selected item
        var selectedItems = ZoteroPane.getSelectedItems();

        for (var i = 0; i < selectedItems.length; i++){
            var item = selectedItems[i];
            // Proceed if an item is selected and it isn't a note
            if (item && item.isRegularItem()) {
                var title = item.getField('title');
                item.setField('title', title.toCamelCase());
                await item.saveTx(); 
            }
        }

		Zotero.debug('zotero.testmr: changeToCamel done');
	};


}




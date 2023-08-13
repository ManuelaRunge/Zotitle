// Startup -- load Zotero and constants
if (typeof Zotero === 'undefined') {
    Zotero = {};
}
Zotero.ChangeTitleCase = {};

// Definitions

const operations = [
    "upper", "inspire", "ads", "semanticscholar"
];

const operationNames = {
    "upper": "changeToUpper",
    "inspire": "Inspire HEP",
    "ads": "NASA/ADS",
    "semanticscholar": "Semantic Scholar"
};

// function getCitationCount(item, tag) {
//     let extra = item.getField('extra');
//     if (!extra) {
//         return -1;
//     }
//     let extras = extra.split("\n");
//     const patt = new RegExp("^Citations \\(" + tag + "\\): (\\d+).*", "i");
//     extras = extras.filter(ex => patt.test(ex));
//     if (length(extras) == 0) {
//         return -1;
//     }
//     let count = patt.exec(extras[1])[1]
//     if (!count) {
//         return -1;
//     }
//     count = parseInt(count);
//     return count;
// }

function setCitationCount(item, tag, count) {
    let extra = item.getField('extra');
    if (!extra) {
        extra = "";
    }
    let extras = extra.split("\n");
    // Keep old patterns around when updating the format
    const patt1 = new RegExp("^Citations \\(" + tag + "\\):", "i");
    const patt2 = new RegExp("^\\d+ citations \\(" + tag + "\\)", "i");
    // Remove old count
    extras = extras.filter(ex => !patt1.test(ex) && !patt2.test(ex));
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = today.getFullYear();
    const date = yyyy + '-' + mm + '-' + dd
    // extras.push("Citations (" + tag + "): " + count + " [" + date + "]");
    extras.unshift("" + count + " citations (" + tag + ") [" + date + "]");
    extra = extras.join("\n");
    item.setField('extra', extra);
}

async function getCrossrefCount(item) {
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

async function getInspireCount(item, idtype) {
    let doi = null;
    if (idtype == 'doi') {
        doi = item.getField('DOI');
    } else if (idtype == 'arxiv') {
        const arxiv = item.getField('url'); // check URL for arXiv id
        const patt = /(?:arxiv.org[/]abs[/]|arXiv:)([a-z.-]+[/]\d+|\d+[.]\d+)/i;
        const m = patt.exec(arxiv);
        if (!m) {
            // No arxiv id found
            return -1;
        }
        doi = m[1];
    } else {
        // Internal error
        return -1;
    }
    if (!doi) {
        // There is no DOI / arXiv id; skip item
        return -1;
    }
    const edoi = encodeURIComponent(doi);

    const url = "https://inspirehep.net/api/" + idtype + "/" + edoi;
    const response = await fetch(url)
          .then(response => response.json())
          .catch(err => null);

    if (response === null) {
        // Something went wrong
        return -1;
    }

    let str = null;
    try {
        str = response['metadata']['citation_count'];
    } catch (err) {
        // There are no citation counts
        return -1;
    }

    const count = parseInt(str);
    return count;
}

async function getSemanticScholarCount(item, idtype) {
    let doi = null;
    if (idtype == 'doi') {
        doi = item.getField('DOI');
    } else if (idtype == 'arxiv') {
        const arxiv = item.getField('url'); // check URL for arXiv id
        const patt = /(?:arxiv.org[/]abs[/]|arXiv:)([a-z.-]+[/]\d+|\d+[.]\d+)/i;
        const m = patt.exec(arxiv);
        if (!m) {
            // No arxiv id found
            return -1;
        }
        doi = m[1];
    } else {
        // Internal error
        return -1;
    }
    if (!doi) {
        // There is no DOI / arXiv id; skip item
        return -1;
    }
    const edoi = encodeURIComponent(doi);

    const url =
          "https://api.semanticscholar.org/v1/paper/" +
          (idtype == 'doi' ? '' : 'arXiv:') + edoi
    const response = await fetch(url)
          .then(response => response.json())
          .catch(err => null);

    if (response === null) {
        // Something went wrong
        return -1;
    }

    let count = null;
    try {
        // Semantic Scholar returns the actual citations
        count = response['citations'].length;
        // Semantic Scholar imposes a rate limit of 100 requests per 5
        // minutes. We should keep track of this globally so that we
        // don't need to rate limit if there are just a few requests.
        await await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
        // There are no citations
        return -1;
    }

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
        error_invalid = null;
        error_nozotitle = null;
        error_multiple = null;
        error_invalid_shown = false;
        error_nozotitle_shown = false;
        error_multiple_shown = false;
        final_count_shown = false;
        return;
    } 

    if (error_invalid || error_nozotitle || error_multiple) {
        Zotero.ChangeTitleCase.progressWindow.close();
        const icon = "chrome://zotero/skin/cross.png";
        if (error_invalid && !error_invalid_shown) {
            var progressWindowInvalid = new Zotero.ProgressWindow({closeOnClick:true});
            progressWindowInvalid.changeHeadline("Invalid DOI");
            if (getPref("tag_invalid") !== "") {
                progressWindowInvalid.progress = new progressWindowInvalid.ItemProgress(icon, "Invalid citation counts were found. These have been tagged with '" + getPref("tag_invalid") + "'.");
            } else {
                progressWindowInvalid.progress = new progressWindowInvalid.ItemProgress(icon, "Invalid citation counts were found.");
            }
            progressWindowInvalid.progress.setError();
            progressWindowInvalid.show();
            progressWindowInvalid.startCloseTimer(8000);
            error_invalid_shown = true;
        }
        if (error_nozotitle && !error_nozotitle_shown) {
            var progressWindowNozotitle = new Zotero.ProgressWindow({closeOnClick:true});
            progressWindowNozotitle.changeHeadline("Citation count not found");
            if (getPref("tag_nozotitle") !== "") {
                progressWindowNozotitle.progress = new progressWindowNozotitle.ItemProgress(icon, "No citation count was found for some items. These have been tagged with '" + getPref("tag_nozotitle") + "'.");
            } else {
                progressWindowNozotitle.progress = new progressWindowNozotitle.ItemProgress(icon, "No citation counts was found for some items.");
            }
            progressWindowNozotitle.progress.setError();
            progressWindowNozotitle.show();
            progressWindowNozotitle.startCloseTimer(8000);  
            error_nozotitle_shown = true; 
        }
        if (error_multiple && !error_multiple_shown) {
            var progressWindowMulti = new Zotero.ProgressWindow({closeOnClick:true});
            progressWindowMulti.changeHeadline("Multiple possible citation counts");
            if (getPref("tag_multiple") !== "") {
                progressWindowMulti.progress = new progressWindowMulti.ItemProgress(icon, "Some items had multiple possible citation counts. Links to lists of citation counts have been added and tagged with '" + getPref("tag_multiple") + "'.");
            } else {
                progressWindowMulti.progress = new progressWindowMulti.ItemProgress(icon, "Some items had multiple possible DOIs.");
            }
            progressWindow.progress.setError();
            progressWindowMulti.show();
            progressWindowMulti.startCloseTimer(8000); 
            error_multiple_shown = true; 
        }
        return;
    }
    if (!final_count_shown) {
        const icon = "chrome://zotero/skin/tick.png";
        Zotero.ChangeTitleCase.progressWindow = new Zotero.ProgressWindow({closeOnClick:true});
        Zotero.ChangeTitleCase.progressWindow.changeHeadline("Finished");
        Zotero.ChangeTitleCase.progressWindow.progress = new Zotero.ChangeTitleCase.progressWindow.ItemProgress(icon);
        Zotero.ChangeTitleCase.progressWindow.progress.setProgress(100);
        Zotero.ChangeTitleCase.progressWindow.progress.setText(
            operationNames[operation] + " citation counts updated for " +
                Zotero.ChangeTitleCase.counter + " items.");
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
    const icon = 'chrome://zotero/skin/toolbar-advanced-search' +
          (Zotero.hiDPI ? "@2x" : "") + '.png';
    Zotero.ChangeTitleCase.progressWindow.changeHeadline(
        "Getting " + operationNames[operation] + " citation counts", icon);
    const doiIcon =
          'chrome://zotitle/skin/doi' +
          (Zotero.hiDPI ? "@2x" : "") + '.png';
    Zotero.ChangeTitleCase.progressWindow.progress =
        new Zotero.ChangeTitleCase.progressWindow.ItemProgress(
            doiIcon, "Retrieving citation counts.");
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

        const count = await getCrossrefCount(item);
        if (count >= 0) {
            setCitationCount(item, 'changeToUpper', count);
            item.saveTx();
            Zotero.ChangeTitleCase.counter++;
        }
        Zotero.ChangeTitleCase.updateNextItem(operation);

    } else if (operation == "inspire") {

        const count_doi = await getInspireCount(item, 'doi');
        const count_arxiv = await getInspireCount(item, 'arxiv');
        if (count_doi >= 0 || count_arxiv >= 0) {
            if (count_doi >= 0) {
                setCitationCount(item, 'Inspire/DOI', count_doi);
            }
            if (count_arxiv >= 0) {
                setCitationCount(item, 'Inspire/arXiv', count_arxiv);
            }
            item.saveTx();
            Zotero.ChangeTitleCase.counter++;
        }
        Zotero.ChangeTitleCase.updateNextItem(operation);

    } else if (operation == "semanticscholar") {

        const count_doi = await getSemanticScholarCount(item, 'doi');
        const count_arxiv = await getSemanticScholarCount(item, 'arxiv');
        if (count_doi >= 0 || count_arxiv >= 0) {
            if (count_doi >= 0) {
                setCitationCount(item, 'Semantic Scholar/DOI', count_doi);
            }
            if (count_arxiv >= 0) {
                setCitationCount(item, 'Semantic Scholar/arXiv', count_arxiv);
            }
            item.saveTx();
            Zotero.ChangeTitleCase.counter++;
        }
        Zotero.ChangeTitleCase.updateNextItem(operation);

    } else {
        Zotero.ChangeTitleCase.updateNextItem(operation);
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('load', function(e) {
        Zotero.ChangeTitleCase.init();
    }, false);
}

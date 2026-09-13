var Zotitle = {
    id: null,

    operations: [
        { id: "upper", label: "UPPERCASE", operation: "to_upper" },
        { id: "lower", label: "lowercase", operation: "to_lower" },
        { id: "title", label: "Title Case", operation: "to_title" },
        { id: "headline", label: "Headline-style capitalization", operation: "to_headline" },
        { id: "sentence", label: "Sentence case", operation: "to_sentence" }
    ],

    startup({ id }) {
        this.id = id;

        for (let win of Zotero.getMainWindows()) {
            this.addToWindow(win);
        }
    },

    shutdown() {
        for (let win of Zotero.getMainWindows()) {
            this.removeFromWindow(win);
        }

        this.id = null;
    },

    addToWindow(win) {
        const doc = win.document;
        const itemMenu = doc.getElementById("zotero-itemmenu");

        if (!itemMenu || doc.getElementById("zotero-itemmenu-zotitle-menu")) {
            return;
        }

        const menu = doc.createXULElement("menu");
        menu.id = "zotero-itemmenu-zotitle-menu";
        menu.setAttribute("label", "Change title case");

        const popup = doc.createXULElement("menupopup");
        popup.id = "zotero-itemmenu-zotitle-menupopup";

        for (let config of this.operations) {
            const item = doc.createXULElement("menuitem");
            item.id = `zotero-itemmenu-zotitle-${config.id}`;
            item.setAttribute("label", config.label);
            item.addEventListener("command", () => this.updateSelectedItems(win, config.operation));
            popup.appendChild(item);
        }

        menu.appendChild(popup);
        itemMenu.appendChild(menu);

        itemMenu._zotitlePopupShowing = () => {
            menu.disabled = this.getSelectedItems(win).length === 0;
        };
        itemMenu.addEventListener("popupshowing", itemMenu._zotitlePopupShowing);
    },

    removeFromWindow(win) {
        const doc = win.document;
        const itemMenu = doc.getElementById("zotero-itemmenu");

        if (itemMenu?._zotitlePopupShowing) {
            itemMenu.removeEventListener("popupshowing", itemMenu._zotitlePopupShowing);
            delete itemMenu._zotitlePopupShowing;
        }

        doc.getElementById("zotero-itemmenu-zotitle-menu")?.remove();
    },

    getSelectedItems(win) {
        const pane = win.ZoteroPane || Zotero.getActiveZoteroPane();

        if (!pane?.getSelectedItems) {
            return [];
        }

        return pane.getSelectedItems().filter(item => item && !item.isFeedItem && item.getField("title"));
    },

    async updateSelectedItems(win, operation) {
        const items = this.getSelectedItems(win);

        if (!items.length) {
            return;
        }

        const progressWindow = new Zotero.ProgressWindow({ closeOnClick: false });
        progressWindow.changeHeadline("Changing title case");
        const progress = new progressWindow.ItemProgress("Changing title case...");
        progressWindow.show();

        let updated = 0;

        for (let [index, item] of items.entries()) {
            const title = item.getField("title");
            const nextTitle = this.transformTitle(title, operation);

            if (nextTitle !== title) {
                item.setField("title", nextTitle);
                await item.saveTx({
                    undoAction: "undo-action-edit-metadata",
                    undoActionArgs: { count: 1 }
                });
                updated++;
            }

            const percent = Math.round(((index + 1) / items.length) * 100);
            progress.setProgress(percent);
            progress.setText(`Item ${index + 1} of ${items.length}`);
        }

        progressWindow.changeHeadline("Finished");
        progress.setProgress(100);
        progress.setText(`Title case updated for ${updated} items.`);
        progressWindow.startCloseTimer(4000);
    },

    transformTitle(title, operation) {
        if (operation === "to_upper") {
            return title.toUpperCase();
        }

        if (operation === "to_lower") {
            return title.toLowerCase();
        }

        if (operation === "to_title") {
            return this.toTitleCase(title);
        }

        if (operation === "to_headline") {
            return this.toHeadlineStyle(title);
        }

        if (operation === "to_sentence") {
            return this.toSentenceCase(title);
        }

        return title;
    },

    toTitleCase(title) {
        return title
            .toLowerCase()
            .replace(/(^|[\s_-])(\S)/g, (match, separator, character) => separator + character.toUpperCase());
    },

    toHeadlineStyle(title) {
        const minorWords = new Set([
            "a", "an", "the",
            "and", "but", "or", "nor", "for", "so", "yet",
            "as", "at", "by", "from", "in", "of", "on", "per", "to", "up", "via", "with"
        ]);
        const tokens = title.match(/[A-Za-z0-9]+(?:'[sS])?|[^A-Za-z0-9]+/g) || [];
        const wordIndexes = tokens
            .map((token, index) => (this.isHeadlineWord(token) ? index : null))
            .filter(index => index !== null);
        const firstWord = wordIndexes[0];
        const lastWord = wordIndexes[wordIndexes.length - 1];

        return tokens
            .map((token, index) => {
                if (!this.isHeadlineWord(token)) {
                    return token;
                }

                if (this.isProtectedAbbreviation(token)) {
                    return token;
                }

                const lowerToken = token.toLowerCase();
                const followsColon = index > 0 && /:\s*$/.test(tokens[index - 1]);

                if (minorWords.has(lowerToken) && index !== firstWord && index !== lastWord && !followsColon) {
                    return lowerToken;
                }

                return lowerToken.charAt(0).toUpperCase() + lowerToken.slice(1);
            })
            .join("");
    },

    isHeadlineWord(token) {
        return /[A-Za-z0-9]/.test(token);
    },

    isProtectedAbbreviation(token) {
        const base = token.replace(/'[sS]$/, "");

        return /[A-Z]/.test(base) &&
            (/^[A-Z0-9]{2,}$/.test(base) || /^[A-Z0-9]{2,}s$/.test(base));
    },

    toSentenceCase(title) {
        if (!title) {
            return title;
        }

        return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
    }
};

function install() {}

function uninstall() {}

function startup(data, reason) {
    Zotitle.startup(data, reason);
}

function shutdown(data, reason) {
    Zotitle.shutdown(data, reason);
}

function onMainWindowLoad({ window }) {
    Zotitle.addToWindow(window);
}

function onMainWindowUnload({ window }) {
    Zotitle.removeFromWindow(window);
}

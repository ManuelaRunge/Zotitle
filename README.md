Zotitle
=================

Very simple Zotero plugin to change the titles of selected Zotero items into `UPPERCASE`, `lowercase`, `Sentence case`, `Title Case`, or `Headline-style capitalization`, and to italicize selected scientific terms.

Install by downloading the latest release from [GitHub releases](https://github.com/ManuelaRunge/Zotitle/releases).

Version 1.1.1 targets Zotero 10 and removes the old Zotero 6 RDF/XUL plugin code.

`Headline-style capitalization` keeps common minor words lowercase unless they are the first or last word. Minor words currently include articles (`a`, `an`, `the`), coordinating conjunctions (`and`, `but`, `or`, `nor`, `for`, `so`, `yet`), and short prepositions (`as`, `at`, `by`, `for`, `in`, `of`, `on`, `per`, `to`, `up`, `via`).

`Italicize scientific terms` wraps configured scientific terms in `<i>...</i>` while preserving the capitalization already present in the title. The default terms include common malaria/vector taxa such as `Anopheles`, `Aedes aegypti`, and `Plasmodium falciparum`.

This is my first Zotero plugin. 
If you find any issues or have any comments or suggestions, please let me know!


**Forthcoming updates:** 
- add preferences to:
   - allow user-defined exceptions to upper and lower case changes
   - enable to keep country names capitalized per default
   - allow user-defined scientific terms to italicize
   - allow user-defined minor words for headline-style capitalization


**Change log and credits:**
- September 2026: added an independent command to italicize configured scientific terms.
- September 2026: v1.1.1 removed legacy Zotero 6 RDF/XUL plugin code.
- September 2026: v1.1.1 added headline-style capitalization with lowercase minor words.
- September 2026: v1.1.0 updated plugin metadata and menu registration for Zotero 10 compatibility.
- August 2023: initial release for basic functionality
- August 2023: found this awesome zotero-plugin [eschnett/zotero-citationcounts](https://github.com/eschnett/zotero-citationcounts/tree/master), that I used as a template and learning guide.
- July 2023: found [dcartertod/zotero-plugins](https://github.com/dcartertod/zotero-plugins/tree/main) and borrowed temporarily `make-xpi.ps1`.
- later in 2022: tried using [hello-world](https://github.com/zotero/zotero-hello-world) (not working for me) and [Zotfile](https://github.com/jlegewie/zotfile) (amazing plugin but too complex for me). 
- January 2022: created intial plugin folder structure using the  [zotero plugin generator](https://www.npmjs.com/package/generator-zotero-plugin), 

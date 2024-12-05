"use strict";

var lexicon = null;
var results = [];

const listWords = (word, pageIndex, pageSize) => {
    if (!lexicon) return {"results": []};
    if (!word) word = '';
    let node = lexicon.index;
    let pos;
    for (pos = 0; pos < word.length; pos++) {
        let symbol = word[pos];
        if (node[2] && symbol in node[2]) node = node[2][symbol];
        else break;
    }
    if (!lexicon.data[node[0]].key.startsWith(word)) return {"results": []};
    results = [];
    let start = node[0];
    let end = node[1];
    pageSize = pageSize || 5;
    start += ((pageIndex || 1) - 1) * pageSize;
    let i;
    for (i = start; i <= end &&  i - start < pageSize; i++) {
        results.push({"id": i, "text": lexicon.data[i].word});
    }
    let r = {"results": results, "pagination": {"more": i <= end}};
    return r;
};

const fixIndentation = (indent, start, end, pad) => {
    if (start >= end) return;
    let level = 100;
    for (let i = start; i < end; i++) {
        level = Math.min(indent[i].level, level);
        indent[i].space += pad || 0;
    }
    let last = start;
    for (let i = start; i < end; i++) {
        if (indent[i].level == level) {
            fixIndentation(indent, last, i, 1);
            last = i + 1;
        }
    }
    fixIndentation(indent, last, end, 1);
}

const showEntry = (id) => {
    let $content = $("<div></div>");
    if (id != null) {
        let entries = lexicon.data[id].entry;
        let indent = {};
        for (let i = 1; i < entries.length; i++) {
            let prefix = entries[i].substr(0, entries[i].indexOf('.'));
            let level = 1; // I, II, III, ...
            if (/^[A-Z]$/.test(prefix) && (prefix != 'I' || i > 1)) level = 0;
            else if (/^\d+$/.test(prefix)) level = 2;
            else if (/^[a-z]$/.test(prefix)) level = 3;
            indent[i] = {'level': level, 'space': 0};
        }
        fixIndentation(indent, 1, entries.length);
        for (let i = 0; i < entries.length; i++) {
            let $entry = $("<p></p>");
            if (i > 0 && indent[i].space) $entry.addClass(`indent-${ indent[i].space }`);
            let formatted = entries[i].replace(/%([^%]*)%/g, "<span class='definition'>$1</span>");
            formatted = formatted.replace(/@([^@]*)@/g, "<span class='sense'>$1</span>");
            formatted = formatted.replace(/&([^&]*)&/g, "<span class='biblio'>$1</span>");
            formatted = formatted.replace(/#([^#]*)#/g, "<span class='title'>$1</span>");
            $entry.html(formatted);
            $content.append($entry);
        }
    }
    $("#content").empty();
    $("#content").append($content);
};

fetch($("body").data("lexicon"))
.then(response => response.blob())
.then(blob => new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))))
.then(response => response.blob())
.then(blob => blob.text())
.then(text => {
    lexicon = JSON.parse(text);
    console.log("Loaded lexicon");
    $(".loading i").removeClass("fa-spinner fa-spin fa-solid")
            .addClass("fa-regular fa-circle-check");
    $(".loading span").text("Lexicon loaded!");
});

$(() => {
    $.fn.select2.amd.require([
        'select2/data/array',
        'select2/utils',
        'select2/results',
        'select2/dropdown/infiniteScroll'
    ], function (ArrayData, Utils, ResultsList, InfiniteScroll) {
        function CustomData ($element, options) {
            CustomData.__super__.constructor.call(this, $element, options);
        }
        Utils.Extend(CustomData, ArrayData);
        CustomData.prototype.current = function (callback) {
            let index = this.$element.val();
            if (lexicon && index != null) {
                callback([{"id": index, "text": lexicon.data[index].word}]);
            } else callback([]);
        };
        CustomData.prototype.query = function (params, callback) {
            callback(listWords(params.term || "", params.page));
        }
        let CustomResultsList = ResultsList;
        CustomResultsList = Utils.Decorate(CustomResultsList, InfiniteScroll);

        $("#input").select2({
            "placeholder": "Type a word to start searching...",
            "width": "100%",
            "theme": "bootstrap-5",
            "dataAdapter": CustomData,
            "resultsAdapter": CustomResultsList,
        });
        $("#input").on("change", function () {
            showEntry($(this).val());
        });
    });
});

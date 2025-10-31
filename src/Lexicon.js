export const LETTERS = 'abgdevzhqiklmncoprstufxywj';
export const GREEK_LETTERS = 'αβγδεϝζηθικλμνξοπρστυφχψωϳ';


function convert(text, from, to) {
  let result = '';
  for (const letter of text.toLowerCase()) {
    let index = from.indexOf(letter);
    result += index >= 0 ? to[index] : letter;
  }
  return result;
}


export function convertToGreek(text) {
  return convert(text, LETTERS, GREEK_LETTERS)
      .replace(/[ς]/gu, 'σ').replace(/[σ]$/u, 'ς')
      .replace(' ', '');
}


export function convertFromGreek(text) {
  return convert(text.replace(/ς/g, 'σ'), GREEK_LETTERS, LETTERS)
      .replace(' ', '');
}


export class Lexicon {

  constructor(json) {
    this.json = json;
  }

  getInterval = (word) => {
    word = convertFromGreek(word ?? '');
    let node = this.json.index;
    for (let pos = 0; pos < word.length; pos++) {
        let symbol = word[pos];
        if (node[2] && symbol in node[2]) node = node[2][symbol];
        else break;
    }
    if (!this.json.data[node[0]].key.startsWith(word)) return [0, -1];
    return [node[0], node[1]];
  };

  filterWords = (filter, index = undefined, page = 10) => {
    let [start, end] = this.getInterval(filter);
    let i, results = [];
    for (i = index ?? start; i <= end && page > 0; i++, page--) {
      results.push({index: i, text: this.json.data[i].word});
    }
    return [results, i <= end, i];
  };

  getEntry(id) {
    const entry = {
      'word': this.json.data[id].word,
      'lines': this.json.data[id].entry,
    };

    entry.indent = {};
    let hasHache = false;
    for (const [i, line] of entry.lines.entries()) {
      let prefix = line.substr(0, line.indexOf('.'));
      let level = 1; // I, II, III, ...
      if (/^[A-Z]$/.test(prefix) &&
          prefix !== 'V' &&
          prefix !== 'X' &&
          prefix !== 'I') {
        hasHache |= prefix === 'H';
        level = 0;
      } else if (/^\d+$/.test(prefix)) {
        level = 2;
      } else if (/^[a-z]$/.test(prefix)) {
        level = 3;
      }
      if (hasHache && prefix === 'I') level = 0; // very unique case
      entry.indent[i] = {'level': level, 'space': 0};
    }

    const fixIndentation = (start, end, pad) => {
      if (start >= end) return;
      let level = 100;
      for (let i = start; i < end; i++) {
        level = Math.min(entry.indent[i].level, level);
        entry.indent[i].space += pad ?? 0;
      }
      let last = start;
      for (let i = start; i < end; i++) {
        if (entry.indent[i].level == level) {
          fixIndentation(last, i, 1);
          last = i + 1;
        }
      }
      fixIndentation(last, end, 1);
    }

    fixIndentation(1, entry.lines.length);

    return entry;
  }
}

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
      .replace(/[ς]/gu, 'σ').replace(/[σ]$/u, 'ς');
}


export function convertFromGreek(text) {
  return convert(text.replace(/ς/g, 'σ'), GREEK_LETTERS, LETTERS);
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
        else return [0, -1];
    }
    return [node[0], node[1]];
  };

  filterWords = (filter, index = undefined, page = 10) => {
    let [start, end] = this.getInterval(filter);
    let i, results = [];
    for (i = index ?? start; i <= end && page > 0; i++, page--) {
      results.push({index: i, text: this.json.data[i].word});
    }
    return [results, i <= end];
  };
}

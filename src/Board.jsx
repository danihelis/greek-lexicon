import { useState, useEffect } from 'react';
import { LETTERS, GREEK_LETTERS } from './Lexicon.js';

export function Board() {
  const elements = [];
  let line = 0, column = 0;

  for (const array of [LETTERS, GREEK_LETTERS]) {
    column = 0;
    line++;
    for (const symbol of array) {
      const bg = line % 2 ? (column % 2 ? 'bg-gray-500' : 'bg-gray-600') :
          (column % 2 ? 'bg-gray-200' : 'bg-gray-300');
      const color = line % 2 ? 'text-white' : 'text-black';
      elements.push(
        <div
          key={symbol}
          className={`${bg} ${color} font-serif text-center`}
        >
          {symbol}
        </div>
      );
      column++;
    }
  }

  return (
    <div className="m-2 grid grid-cols-26">
      {elements}
    </div>
  )
}

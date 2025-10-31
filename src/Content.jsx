import { useState, useEffect } from 'react';


const indentStyle = ['', 'pl-2', 'pl-4', 'pl-6', 'pl-8'];
const boundaries = ['%', '@', '&', '#'];
const boundaryStyle = {
  '%': 'font-bold text-lg', // definition
  '@': 'italic text-black', // sense
  '&': 'text-neutral-500', // bibliography
  '#': 'italic', // title
};

function Paragraph({line, indent}) {
  const content = [];
  const tokens = line.split(/([%@&#])/);

  const createSpans = (start, end) => {
    const inside = [];

    const intoSpan = (a, b) => {
      const text = tokens.slice(a, b).join('');
      if (text) return <span key={[a, b]}>{text}</span>;
      return null;
    };

    let position = start;
    while (position < end) {
      while (position < end && !boundaries.includes(tokens[position])) {
        position++;
      }
      if (position < end) {
        const boundary = tokens[position];
        let closing = position + 1;
        while (closing < end && tokens[closing] !== boundary) {
          closing++;
        }
        if (closing < end) {
          const span = intoSpan(start, position);
          if (span) inside.push(span);
          inside.push(
            <span key={[boundary, position, closing]} className={boundaryStyle[boundary]}>
              {createSpans(position + 1, closing)}
            </span>
          );
          start = position = closing + 1;
        } else {
          position++; // discard boundary
        }
      }
    }

    const span = intoSpan(start, end);
    if (span) inside.push(span);
    return <>{inside}</>;
  };

  return (
    <p className={`${indentStyle[indent] ?? ''} `}>
      {createSpans(0, tokens.length)}
    </p>
  );
}

export function Content({lexicon, entryId}) {

  const entry = lexicon.getEntry(entryId);
  const content = [];

  for (const [index, line] of entry.lines.entries()) {
    content.push(
      <Paragraph key={index} line={line} indent={entry.indent[index].space} />
    );
  }

  return (
    <div className="px-2 text-md flex flex-col gap-2 text-gray-800 overflow-y-auto h-full">
      {content}
    </div>
  )
}

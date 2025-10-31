import { useState, useEffect } from 'react';

function Link({link, label}) {
  return (
    <a href={link} className="underline decoration-dotted" >{label ?? link}</a>
  );
}


export function Footer() {
  const short = (
    <p>
      <span>Henry George Liddell, Robert Scott. </span>
      <i>A Greek-English Lexicon. </i>
      <span>Oxford, Clarendon Press: 1940. Text provided under a CC BY-SA license by </span>
      <Link link="http://www.perseus.tufts.edu" label="Perseus Digital Library" />
      <span>.</span>
    </p>
  );
  const long = (
      <p>
        <span>Henry George Liddell, Robert Scott. <i>A Greek-English Lexicon.</i>
        Revised and augmented throughout by Sir Henry Stuart Jones with the
        assistance of Roderick McKenzie. Oxford, Clarendon Press: 1940. Text
        provided under a CC BY-SA license by Perseus Digital Library, </span>
        <Link link="http://www.perseus.tufts.edu" />
        <span>, with funding from The
        National Endowment for the Humanities. Data accessed from </span>
        <Link link="https://github.com/PerseusDL/lexica/" />.
      </p>
  );

  return (
    <div className="bg-gray-200 text-gray-800 p-2 text-xs text-center">
      {short}
    </div>
  );
}

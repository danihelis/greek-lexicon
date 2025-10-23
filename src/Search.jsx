import { useState, useEffect, useRef, useCallback } from 'react';
import { Transition } from '@headlessui/react';
import { convertToGreek } from './Lexicon.js';


function Element({text, className, ref, selected}) {
  const style = selected ? 'bg-gray-400' : 'hover:bg-gray-300';

  return (
    <div ref={ref} className={`${style} p-1 px-2 rounded-md ${className}`}>
      {text}
    </div>
  );
}

function List({lexicon, search, current, setCurrent}) {
  const [results, setResults] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [lastIndex, setLastIndex] = useState(0);
  const ref = useRef(null);
  const focused = useRef(null);

  const loadMore = restart => {
    const [entries, hasMore, nextIndex] = lexicon.filterWords(
        search, restart ? undefined : lastIndex);
    setResults([...(restart ? [] : results), ...entries]);
    setHasMore(hasMore);
    setLastIndex(nextIndex);
  };

  const observerCallback = useCallback((entries) => {
    const target = entries[0];
    if (entries[0].isIntersecting) loadMore();
  }, [loadMore]);

  useEffect(() => {
    loadMore(true);
  }, [search]);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px',
      threshold: 1.0
    });
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [results, observerCallback]);

  useEffect(() => {
    if (current >= lastIndex) {
      if (hasMore) loadMore();
      else setCurrent(current % results.length);
    }
    if (focused.current) focused.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }, [results, current]);

  return (
    <div className="flex flex-col bg-gray-200 w-full p-2 items-strech gap-1 shadow-md overflow-y-scroll max-h-80">
      {results.map((e, i) => (
        <Element key={e.index} ref={current == i ? focused : null} value={e.index} text={e.text} selected={current == i} />
      ))}
      {results.length === 0 ? (
        <Element key="empty" value="empty" text="No entry found" className="text-gray-500" />
      ) : null}
      {hasMore ? (
        <Element ref={ref} key="more-down" value="more-down" text="Loading..." className="text-gray-400" />
      ) : null}
    </div>
  );
}


export function Search({lexicon}) {
  const [showList, setShowList] = useState(false);
  const [search, setSearch] = useState('');
  const [current, setCurrent] = useState(null);

  const handleFocus = (focus) => {
    setCurrent(null);
    setShowList(focus);
  };

  const handleChange = (e) => {
    setCurrent(null);
    setSearch(convertToGreek(e.target.value));
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowUp' && current > 0) {
      event.preventDefault();
      setCurrent(current - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCurrent(current === null ? 0 : current + 1);
    }
  };

  return (
    <div className="m-2 mt-4 relative font-serif">
      <input
        className="w-full bg-gray-100 inset-shadow-sm xxxinset-shadow-gray-800 p-2 rounded-md text-lg"
        placeholder="Type a letter to start searching..."
        value={search}
        onChange={handleChange}
        onFocus={() => handleFocus(true)}
        onBlur={() => handleFocus(false)}
        onKeyDown={handleKeyDown}
      />
      <Transition show={showList}>
        <div className="absolute w-full transition duration-200 ease-in data-closed:opacity-0">
          <List lexicon={lexicon} search={search} current={current} setCurrent={setCurrent} />
        </div>
      </Transition>
    </div>
  )
}

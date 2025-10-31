import { useState, useEffect, useRef, useCallback } from 'react';
import { Transition } from '@headlessui/react';
import { convertToGreek } from './Lexicon.js';


function Element({text, className, ref, selected, onClick}) {
  const style = selected ? 'bg-gray-600 text-white' : 'hover:bg-gray-300';

  return (
    <div ref={ref} className={`${style} p-1 px-2 rounded-md cursor-pointer ${className}`} onClick={onClick} >
      {text}
    </div>
  );
}

function List({lexicon, search, current, onList, onSelect}) {
  const [results, setResults] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [lastIndex, setLastIndex] = useState(0);
  const ref = useRef(null);
  const focused = useRef(null);

  const loadMore = (restart) => {
    const [entries, hasMore, nextIndex] = lexicon.filterWords(
        search, restart ? undefined : lastIndex);
    const newResults = [...(restart ? [] : results), ...entries];
    onList(hasMore ? undefined : newResults.length, newResults[0]?.index);
    setResults(newResults);
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
    if (hasMore && current >= results.length) {
      loadMore();
    }
    setTimeout(() => {
      if (focused.current) {
        focused.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }, 10);
  }, [current]);

  return (
    <div className="flex flex-col bg-gray-200 w-full p-2 items-strech gap-1 shadow-md overflow-y-scroll max-h-80">
      {results.map((e, i) => (
        <Element
          key={e.index}
          ref={current == i ? focused : null}
          value={e.index}
          text={e.text}
          selected={current == i}
          onClick={() => onSelect(e.index, i)}
        />
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


export function Search({lexicon, onSelect}) {
  const [showList, setShowList] = useState(false);
  const [search, setSearch] = useState('');
  const [current, setCurrent] = useState();
  const [size, setSize] = useState();
  const [head, setHead] = useState();
  const [last, setLast] = useState();

  const ref = useRef(null);

  const resetList = () => {
    setCurrent(null);
    setLast(null);
    setShowList(true);
  };

  const handleFocus = (focus) => {
    setCurrent(last);
    setShowList(focus);
  };

  const handleChange = (e) => {
    resetList();
    setSearch(convertToGreek(e.target.value));
  }

  const handleKeyDown = (event) => {
    if (!showList) {
      setShowList(true);
      return;
    }
    if (event.key === 'ArrowUp' && current && current > 0) {
      event.preventDefault();
      updateCurrent(current - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      updateCurrent((current ?? -1) + 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setShowList(false);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (head !== null && head !== undefined) {
        setShowList(false);
        onSelect(head + (current ?? 0));
        // ref.current.blur();
      }
    }
  };

  const updateCurrent = (value, mod) => {
    setLast(null);
    if (value !== undefined && value !== null) {
      setCurrent(Math.min(value, (mod ?? size ?? Infinity) - 1));
    }
  }

  const handleList = (size, head) => {
    setSize(size);
    setHead(head);
    updateCurrent(current, size);
  };

  const handleSelect = (entryId, index) => {
    setLast(index);
    onSelect(entryId);
  };

  return (
    <div className="mx-2 relative">
      <input
        ref={ref}
        className="w-full bg-gray-100 inset-shadow-sm xxxinset-shadow-gray-800 p-2 rounded-md text-lg"
        placeholder="Type to start searching..."
        value={search}
        onChange={handleChange}
        onFocus={() => handleFocus(true)}
        onBlur={() => handleFocus(false)}
        onKeyDown={handleKeyDown}
      />
      <Transition show={showList}>
        <div className="absolute w-full transition duration-200 ease-in data-closed:opacity-0">
          <List lexicon={lexicon} search={search} current={current} onList={handleList} onSelect={handleSelect} />
        </div>
      </Transition>
    </div>
  )
}

import { useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { convertToGreek } from './Lexicon.js';


function Element({text, className}) {

  return (
    <div className={`p-1 px-2 hover:bg-gray-300 rounded-md ${className}`}>
      {text}
    </div>
  );
}


function List({lexicon, search}) {
  let [results, setResults] = useState([]);
  let [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let [entries, hasMore] = lexicon.filterWords(search);
    let results = entries.map(e => (
      <Element key={e.index} value={e.index} text={e.text} />
    ));

    if (hasMore) results.push(
      <Element key="more-down" value="more-down" text="Loading..." className="text-gray-400" />
    );
    if (!results.length) results.push(
      <Element key="empty" value="empty" text="No entry found" className="text-gray-500" />
    );

    setResults(results);
    setHasMore(hasMore);
  }, [search]);

    /*
  useEffect(() => {

  }, [results]);

// State to track how many items are currently visible
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);

    // Ref for the invisible element at the end of the list
    const observerTargetRef = useRef(null);

    // Calculate the subset of data to render (Memoized for performance)
    const visibleItems = useMemo(() => {
        return ALL_DATA.slice(0, visibleCount);
    }, [visibleCount]);

    // Check if there are more items to load
    const hasMore = visibleCount < ALL_DATA.length;

    // --- Intersection Observer Logic ---
    useEffect(() => {
        // Only run observer if there are more items to load
        if (!hasMore) return;

        // 1. Define the callback function
        const observerCallback = (entries) => {
            const target = entries[0];

            // If the target is intersecting (visible), load the next batch
            if (target.isIntersecting) {
                // Load the next batch by incrementing the visibleCount
                setVisibleCount(prevCount => prevCount + ITEMS_PER_LOAD);
            }
        };

        // 2. Create the observer instance
        const observer = new IntersectionObserver(observerCallback, {
            root: null, // null means observing relative to the document viewport
            rootMargin: '0px',
            threshold: 1.0 // Trigger when 100% of the target is visible
        });

        // 3. Start observing the target element
        const currentTarget = observerTargetRef.current;

        if (currentTarget) {
            observer.observe(currentTarget);
        }

        // 4. Cleanup function: Stop observing when the component unmounts
        // or before the effect runs again (e.g., when hasMore becomes false)
        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };

    }, [hasMore]);

  */



  return (
    <div className="flex flex-col bg-gray-200 w-full p-2 items-strech gap-1 shadow-md overflow-y-scroll max-h-80">
      {results}
    </div>
  );
}


export function Search({lexicon}) {
  const [showList, setShowList] = useState(false);
  const [search, setSearch] = useState('');

  const handleFocus = (focus) => {
    setShowList(focus);
  };

  const handleChange = (e) => {
    setSearch(convertToGreek(e.target.value));
  }

  return (
    <div className="m-2 mt-4 relative font-serif">
      <input
        className="w-full bg-gray-100 inset-shadow-sm xxxinset-shadow-gray-800 p-2 rounded-md text-lg"
        placeholder="Type a letter to start searching..."
        value={search}
        onChange={handleChange}
        onFocus={() => handleFocus(true)}
        onBlur={() => handleFocus(false)}
      />
      <Transition show={showList}>
        <div className="absolute w-full transition duration-200 ease-in data-closed:opacity-0">
          <List lexicon={lexicon} search={search} />
        </div>
      </Transition>
    </div>
  )
}

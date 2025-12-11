import { useState, useEffect } from 'react';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Header } from './Header.jsx';
import { Board } from './Board.jsx';
import { Search } from './Search.jsx';
import { Content } from './Content.jsx';
import { Footer } from './Footer.jsx';
import { Lexicon } from './Lexicon.js';


export function Message({Icon, animation, text, extraText}) {

  return (
    <div className="py-50 flex flex-col items-center gap-2">
      <Icon className={`size-10 ${animation}`} />
      <span>{text}</span>
      {extraText && <span className="text-gray-500">{extraText}</span>}
    </div>
  );
}


export function LoadMessage() {

  return (
    <Message
      Icon={ClockIcon}
      animation="animate-bounce"
      text="Loading"
    />
  );
};


export function ErrorMessage() {

  return (
    <Message
      Icon={ExclamationTriangleIcon}
      text="Cannot load lexicon data"
      extraText="Reload the page to try again"
    />
  );
};


export default function App() {
  const [lexicon, setLexion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [entryId, setEntryId] = useState();

  useEffect(() => {
    const handlePopState = (event) => {
      const query = new URLSearchParams(window.location.search).get('q');
      if (query) handlePage(query);
    };
    window.addEventListener('popstate', handlePopState);
    handlePopState();
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handlePage = (entryId, pushState) => {
    if (entryId && pushState) {
      let url = `?q=${entryId}`;
      window.history.pushState({}, '', url);
    }
    if (entryId) setEntryId(entryId);
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const module = await import('./assets/lexicon.json');
        const fileData = module.default;
        if (isMounted) setLexion(new Lexicon(fileData));
      } catch (e) {
        console.error("Could not load the file chunk:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {isMounted = false};
  }, []);

  return (
    <div className="flex justify-center font-noto h-dvh">
      <div className="flex-1 flex flex-col max-w-2xl gap-4">
        <Header />
        {isLoading ? <LoadMessage /> : !lexicon ? <ErrorMessage /> : (
          <>
            <Board />
            <Search lexicon={lexicon} onSelect={(id) => handlePage(id, true)} />
            {entryId ? <Content entryId={entryId} lexicon={lexicon} /> :
              <span className="flex-grow" />}
          </>
        )}
      </div>
    </div>
  )
}

# greek-lexicon

https://danihelis.github.io/greek-lexicon/

This is a simple web interface to Perseus's LSJ Greek Lexicon. The source XML
(see license below) is processed to remove (almost) all mark-up text
and compress it into a gzipped json. A
[trie](https://en.wikipedia.org/wiki/Trie) is used to improve index search. A
custom betacode decoder is used, based on James Tauber's
[implementation](https://jtauber.com/blog/2005/02/10/updated_python_trie_implementation/).

## License

Text provided under a CC BY-SA license by Perseus Digital Library,
http://www.perseus.tufts.edu, with funding from The National Endowment for the
Humanities. Data accessed from https://github.com/PerseusDL/lexica/.

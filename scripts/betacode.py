# Based on original work by James Tauber (http://jtauber.com/)
import regex

class Betacode:
    mapping = ('abgdevzhqiklmncoprstufxywj', 'αβγδεϝζηθικλμνξοπρστυφχψωϳ')
    vowels = 'aehiouw'
    longs = 'ahiuw'
    accents, breaths, extra = ' /\\=', ' ()', ' |+'

    def __init__(self):
        self.root = [None, {}]
        for letter, symbol in zip(*self.mapping):
            self.add(letter, symbol)
            self.add('*' + letter, symbol.upper())
        for accent in self.accents:
            for breath in self.breaths:
                for extra in self.extra:
                    for index, vowel in enumerate(self.vowels):
                        match accent, breath, extra:
                            case ' ', ' ', ' ':
                                base = None
                            case '=', ' ', _ if vowel not in 'eo':
                                base = ord('ᾶ')
                                base += 0x1 if extra in '|+' else 0
                                base += self.longs.index(vowel) * 0x10
                                if ((vowel in 'iu' and extra == '|') or
                                        (vowel in 'ahw' and extra == '+')):
                                    base = None
                            case _, ' ', ' ' if accent != '=':
                                base = ord('ὰ')
                                base += 0x1 if accent == '/' else 0
                                base += 2 * index
                            case _, _, ' ' if not (
                                    accent == '=' and vowel in 'eo'):
                                base = ord('ἀ')
                                base += (0x2 if accent == '\\' else
                                         0x4 if accent == '/' else
                                         0x6 if accent == '=' else 0)
                                base += 0x1 if breath == '(' else 0
                                base += index * 0x10
                            case ' ', ' ', '+' if vowel in 'iu':
                                base = ord('ϊ' if vowel == 'i' else 'ϋ')
                            case _, ' ', _ if vowel not in 'eo':
                                base = ord('ᾳ')
                                base += (0x1 if accent == '/'
                                                and vowel not in 'iu' else
                                         -0x1 if accent == '\\' else 0)
                                base += self.longs.index(vowel) * 0x10
                                if ((vowel in 'iu' and extra == '|') or
                                        (vowel in 'ahw' and extra == '+')):
                                    base = None
                            case _, _, '|' if vowel in 'ahw':
                                base = ord('ᾀ')
                                base += (0x2 if accent == '\\' else
                                         0x4 if accent == '/' else
                                         0x6 if accent == '=' else 0)
                                base += 0x1 if breath == '(' else 0
                                base += (0x10 if vowel == 'h' else
                                         0x20 if vowel == 'w' else 0)
                            case _:
                                base = None
                        if base:
                            symbol = chr(base)
                            for p in self.permutation(accent, breath, extra):
                                self.add(f'{vowel}{p}', symbol)
                                self.add(f'*{p}{vowel}', symbol.upper())
        for extra in '_^':
            for vowel in 'aiu':
                base = ord('ᾰ') + (0x1 if extra == '_' else 0)
                base += 0x20 if vowel == 'i' else 0x30 if vowel == 'u' else 0
                symbol = chr(base)
                self.add(f'{vowel}{extra}', symbol)
                self.add(f'*{vowel}{extra}', symbol.upper())
                self.add(f'*{extra}{vowel}', symbol.upper())
        for breath, symbol in zip(')(', 'ῤῥ'):
            self.add(f'r{breath}', symbol)
            self.add(f'*{breath}r', symbol.upper())
            self.add(f'*r{breath}', symbol.upper())
        self.sigma = regex.compile(r'(?<!^|\s)(σ(?=[^-[\p{L}><]|]|$)|σ(?=\P{L}(\P{L}|$)))')
        self.reverted = self.create_reverted_map()
        self.reverted['ς'] = 's'

    def permutation(self, *args):
        if len(args) <= 1:
            return args
        values = set()
        for index, elem in enumerate(args):
            values |= set((elem + p).strip() for p in self.permutation(
                                *(args[:index] + args[index + 1:])))
        return values

    def add(self, key, value):
        curr_node = self.root
        for ch in key:
            curr_node = curr_node[1].setdefault(ch, [None, {}])
        curr_node[0] = value

    def create_reverted_map(self, key='', node=None):
        reverted = {}
        node = node or self.root
        if node[0] and key:
            reverted[node[0]] = key
        for ch, next_node in node[1].items():
            compose_key = key + (ch if ch in self.mapping[0] else '')
            reverted.update(self.create_reverted_map(compose_key, next_node))
        return reverted

    def convert(self, string):
        index = 0
        value = ''
        string = string.lower()
        while index < len(string):
            node = self.root
            last = (index,
                    string[index] if string[index] not in '\\/)(=|+_^' else '')
            while index < len(string) and string[index] in node[1]:
                node = node[1][string[index]]
                if node[0]:
                    last = (index, node[0])
                index += 1
            value += last[1]
            index = last[0] + 1
        return regex.sub(self.sigma, 'ς', value)

    def revert(self, string):
        return ''.join(map(lambda x: self.reverted.get(x, ''), string))


betacode = Betacode()

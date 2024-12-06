#!/usr/bin/env python

from collections import OrderedDict
import os
import regex as re
import sys
from xml import sax

from betacode import betacode
from progress import print_progress_bar


class Extractor(sax.handler.ContentHandler):
    MAXIMUM_ENTRIES = 116497  # Only used for display information

    def __init__(self):
        self.key = None
        self.stack = []
        self.results = []

    @property
    def top(self):
        return self.stack[-1]

    def parse(self, filename, count=0):
        self.count = count
        self.accepting = False
        sax.parse(filename, self)
        return self.results

    def characters(self, data):
        if self.stack and self.accepting:
            self.top['content'].append(data)

    def startElement(self, name, attrs):
        self.stack.append({
                'name': name, 'content': [], 'n': attrs.get('n', None),
                'greek': attrs.get('lang', None) == 'greek'})
        if name == 'entryFree':
            self.key = None
            self.entry = None
            self.accepting = True

    def endElement(self, name):
        element = self.stack.pop(-1)
        assert element['name'] == name
        if not self.accepting:
            return
        content = re.sub(r'\s+', ' ', ''.join(element['content']).strip())
        if element['greek'] and self.stack and not self.top['greek']:
            if not self.key and content:
                self.key = re.sub(r'[^a-z\s]', '', content)
                self.entry = re.sub(r'[^\p{L}\s]', '', betacode.convert(content))
            content = '$%s$' % (content and betacode.convert(content))
        if name == 'bibl':
            content = f'&{ content }&'
        elif name == 'orth':
            content = f'%{ content }%'
        elif name == 'tr':
            content = f'@{ content }@'
        elif name == 'title':
            content = f'#{ content }#'
        elif name == 'sense' and element['n'] != 'A':
            if content.startswith('. '):
                content = content[1:]
            content = '{%s} %s' % (element['n'], content)
        if name == 'entryFree':
            # fix source
            content = re.sub(r'<[*]>', r'', content)
            content = re.sub(r'[.](\s+[.])+', r'…', content)
            # indent senses
            content = re.sub(r'\s*{(\w+)}', r'\n\t\1.', content)
            # fix punctuation
            content = re.sub(r'([(])\s*[,.:]\s*', r'\1', content)
            # content = re.sub(r'\s*—\s*', r' ——  ', content)
            content = re.sub(r'\$', r'', content)
            match = re.match(r'^%[^%]*%\s+(\(\w\))', content)
            if match:
                self.entry = f'{ self.entry } { match.group(1) }'
            self.results.append({'key': self.key, 'entry': self.entry,
                                 'content': content})
            self.count += 1
            if self.count % 100 == 0:
                print_progress_bar('Extracting', self.count,
                                   self.MAXIMUM_ENTRIES)
            # self.accepting = False
        elif self.stack:
            self.top['content'].append(content)

    def dump(self, filename, mode='w'):
        with open(filename, mode) as stream:
            for result in self.results:
                print(f'{ result['key'] } | { result['entry'] }', file=stream)
                print('\t' + result['content'], file=stream)


if __name__ == '__main__':
    source = 'lexica/CTS_XML_TEI/perseus/pdllex/grc/lsj/grc.lsj.perseus-eng{}.xml'
    total = 0
    for index in range(27):
        filename = source.format(index + 1)
        extractor = Extractor()
        extractor.parse(filename, total)
        total = extractor.count
        extractor.dump('output.txt', mode='a' if index else 'w')
    print_progress_bar('Extracting', 1, 1, last=True)
    print(f'Extracted { total } entries into { "output.txt" }')

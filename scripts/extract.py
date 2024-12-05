#!/usr/bin/env python

from collections import OrderedDict
import os
import re
import sys
from xml import sax

from betacode import betacode

class Extractor(sax.handler.ContentHandler):

    def __init__(self):
        self.key = None
        self.stack = []
        self.result = OrderedDict()

    @property
    def top(self):
        return self.stack[-1]

    def parse(self, filename):
        sax.parse(filename, self)
        return self.result

    def characters(self, data):
        if self.stack and self.key:
            self.top['content'].append(data)

    def startElement(self, name, attrs):
        self.stack.append({
                'name': name, 'content': [], 'n': attrs.get('n', None),
                'greek': attrs.get('lang', None) == 'greek'})
        if name == 'entryFree':
            self.key = attrs.get('key', None)

    def endElement(self, name):
        element = self.stack.pop(-1)
        assert element['name'] == name
        if not self.key:
            return
            content = '~'
        content = re.sub(r'\s+', ' ', ''.join(element['content']).strip())
        if element['greek'] and self.stack and not self.top['greek']:
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
            content = re.sub(r'[.]\s[.]', r'…', content)
            # indent senses
            content = re.sub(r'\s*{(\w+)}', r'\n\t\1.', content)
            # clean punctuation to remove biblScope
            # content = re.sub(r'\.\s*([#@]?)\s*ß[^ß]*ß\s*([.])', r'.\1', content)
            # content = re.sub(r'\.\s*([#@]?)\s*ß[^ß]*ß\s*([,;:)])', r'.\1\2', content)
            # content = re.sub(r'\.\s*([#@]?)\s*ß[^ß]*ß(\s*[(]?)', r'.\1\2', content)
            # content = re.sub(r'[,;]\s*([#@]?)\s*ß[^ß]*ß\s*([.,;:)])', r'\1\2', content)
            # content = re.sub(r'[,;]\s*([#@]?)\s*ß[^ß]*ß(\s*[(])', r'\1\2', content)
            # content = re.sub(r'([#$])\s*ß[^ß]*ß\s*([.,;:)])', r'\1\2', content)
            # content = re.sub(r'([#$])\s*ß[^ß]*ß(\s*[(])', r'\1\2', content)
            # content = re.sub(r'ß', r'', content)
            # fix punctuation
            content = re.sub(r'([(])\s*[,.:]\s*', r'\1', content)
            # content = re.sub(r'\s*—\s*', r' ——  ', content)
            content = re.sub(r'\$', r'', content)
            self.result[self.key] = content
        elif self.stack:
            self.top['content'].append(content)

    def dump(self, filename, mode='w'):
        with open(filename, mode) as stream:
            for key in self.result.keys():
                print(key, betacode.convert(key), file=stream)
                print('\t' + self.result[key], file=stream)


if __name__ == '__main__':
    source = 'lexica/CTS_XML_TEI/perseus/pdllex/grc/lsj/grc.lsj.perseus-eng{}.xml'
    total = 0
    for index in range(27):
        filename = source.format(index + 1)
        extractor = Extractor()
        print('Processing %s' % filename)
        data = extractor.parse(filename)
        total += len(data)
        print('Extracted %d entries (total of %d)' % (len(data), total))
        extractor.dump('output.txt', mode='a' if index else 'w')

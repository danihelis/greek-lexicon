#!/usr/bin/env python

from collections import OrderedDict
import gzip
import json
import os
import re
import sys

from progress import print_progress_bar


class Lexicon:
    mapping = 'abgdevzhqiklmncoprstufxyw'

    class Index:
        superscript = '⁰¹²³⁴⁵⁶⁷⁸⁹'

        def __init__(self, lexicon):
            self.lexicon = lexicon
            self.root = [0, 0, {}]
            lexicon.entries.sort(key=lambda e: e['order'])
            total = len(lexicon.entries)
            for index, entry in enumerate(lexicon.entries):
                previous = lexicon.entries[index - 1] if index else None
                entry['script'] = 0
                if previous and previous['key'] == entry['key']:
                    if previous['script'] == 0:
                        previous['script'] = 1
                        previous['word'] += self.into_superscript(1)
                    entry['script'] = previous['script'] + 1
                    entry['word'] += self.into_superscript(entry['script'])
            for index, entry in enumerate(lexicon.entries):
                self.add_key(entry['key'], index)
                if index % 100 == 0:
                    print_progress_bar('Indexing', index, total)
            print_progress_bar('Indexing', total, total, last=True)
            self.prune(self.root)
            for entry in lexicon.entries:
                del entry['order']
                del entry['script']

        def into_superscript(self, number):
            script = ''
            while number > 0:
                script = self.superscript[number % 10] + script
                number = number // 10
            return script

        def add_key(self, key, index):
            node = self.root
            for symbol in key:
                node[1] = index
                node = node[-1].setdefault(symbol, [index, index, {}])

        def prune(self, node):
            if node[0] == node[1]:
                node[-1] = None
            else:
                for child in node[-1].values():
                    self.prune(child)


    def __init__(self, filename=None):
        if filename:
            self.create(filename)

    def create_entry(self, line):
        parts = line.split()
        word = ' '.join(parts[1:])
        key = ''
        order = ''
        number = 0
        for symbol in parts[0]:
            if symbol in self.mapping:
                order += chr(0x40 + self.mapping.index(symbol))
                key += symbol
            # else:
            #     self.discarded.add(symbol)
            #     if symbol in word and symbol not in '0123456789':
            #         print(line)
            #     if symbol == 'j':
            #         print(line)
        order += chr(0x20 + number) if number else ''
        word = re.sub(r'\d+', '', word).replace('<', '[').replace('>', ']')
        entry = {'key': key, 'order': order, 'word': word, 'entry': []}
        self.entries.append(entry)
        return entry

    def create(self, filename):
        self.discarded = set()
        self.entries = []
        self.keys = []
        entry = None
        with open(filename) as stream:
            lines = stream.readlines()
            total = len(lines)
            for index, line in enumerate(lines):
                if line.startswith('\t'):
                    entry['entry'].append(line[1:-1])
                else:
                    entry = self.create_entry(line)
                if index % 1000 == 0:
                    print_progress_bar('Reading', index, total)
        print_progress_bar('Reading', total, total, last=True)
        # print('Found %d entries' % len(self.entries))
        # print('Charactes discarted from keys:', self.discarded)
        self.index = self.Index(self)

    def into_json(self):
        return json.dumps({'index': self.index.root, 'data': self.entries})

    def compress(self, filename):
        with gzip.open(filename, 'wb') as stream:
            stream.write(str.encode(self.into_json()))


if __name__ == '__main__':
    filename = 'output.txt'
    print('Processing', filename)
    lexicon = Lexicon(filename)
    output = 'lexicon.json.gz'
    print('Compressing into', output)
    lexicon.compress(output)

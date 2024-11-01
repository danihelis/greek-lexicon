#!/usr/bin/env python

from collections import OrderedDict
import json
import os
import re
import sys


class Index:

    def __init__(self, heads):
        self.root = [0, 0, {}]
        heads.sort(key=lambda h: h[1])
        for index, head in enumerate(heads):
            self.add_key(head[0], index)
        self.entries = [h[-1] for h in heads]
        self.compress(self.root)

    def add_key(self, key, index):
        node = self.root
        for symbol in key:
            node[1] = index
            node = node[-1].setdefault(symbol, [index, index, {}])

    def compress(self, node):
        if node[0] == node[1]:
            node[-1] = None
        else:
            for child in node[-1].values():
                self.compress(child)

    def dump(self):
        return json.dumps({'index': self.root, 'data': self.entries})


discarded = set()

def create_head(line):
    parts = line.split()
    mapping = 'abgdevzhqiklmncoprstufxyw12345'
    key = ''
    order = ''
    for symbol in parts[0]:
        if symbol in mapping:
            order += chr(0x20 + mapping.index(symbol))
            key += symbol
        else:
            discarded.add(symbol)
    return key, order, ' '.join(parts[1:])


def process(filename):
    entries = {}
    heads = []
    entry = None
    with open(filename) as stream:
        for line in stream.readlines():
            if line.startswith('\t'):
                entry.append(line[1:])
            else:
                head = create_head(line)
                entry = entries[head[0]] = []
                heads.append(head)
    print('Found %d keys' % len(heads))
    index = Index(heads)
    return index, entries


if __name__ == '__main__':
    filename = 'output.txt'
    print('Processing', filename)
    index, data = process(filename)
    print(discarded)
    with open('data.json', 'w') as stream:
        stream.write(json.dumps(data))
    with open('index.json', 'w') as stream:
        stream.write(index.dump())

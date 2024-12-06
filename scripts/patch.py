#!/usr/bin/env python

import os
import regex as re

from betacode import betacode
from progress import print_progress_bar

def patch(input_filename, output_filename):
    with (open(input_filename) as input_stream,
          open(output_filename, 'w') as output_stream):
        lines = input_stream.readlines()
        total = len(lines)
        entries = []
        for index, line in enumerate(lines):
            line = line[:-1]
            if line.startswith('\t'):
                if not entry['content']:
                    match = re.match(r'\t%-([^%]+)%', line)
                    if match:
                        parent = entries[-2]
                        pattern = re.match(r'\t%([^-%]+)-[^%]+%',
                                           parent['content'][0])
                        if pattern:
                            prefix = pattern.group(1)
                            key, greek = entry['key'].split('|')
                            key = betacode.revert(prefix) + key.strip()
                            new_key = (key + ' | ' + prefix
                                       + greek.strip().lower())
                            new_line = (f'\t%{ prefix }-'
                                        f'{ match.group(1).lower() }%'
                                        + line[len(match.group(0)):])
                            # print(f'{ entry['key'] } ==> { new_key }\n'
                            #       f'{ line[:30] } ==> { new_line[:30] }\n',
                            #       file=output_stream)
                            entry['key'] = new_key
                            line = new_line
                        else:
                            new_line = (f'\t%{ match.group(1) }%'
                                        + line[len(match.group(0)):])
                            # print(f'{ entry['key'] } ==> UNCHANGED\n'
                            #       f'{ line[:30] } ==> { new_line[:30] }\n',
                            #       file=output_stream)
                            line = new_line
                entry['content'].append(line)
            else:
                entry = {'key': line.strip(), 'content': []}
                entries.append(entry)
            if index % 1000 == 0:
                print_progress_bar('Patching', index, total)
        print_progress_bar('Patching', 1, 1, last=True)
        total = len(entries)
        for index, entry in enumerate(entries):
            print(entry['key'], file=output_stream)
            for sense in entry['content']:
                print(sense, file=output_stream)
            if index % 1000 == 0:
                print_progress_bar('Writing', index, total)
        print_progress_bar('Writing', 1, 1, last=True)


if __name__ == '__main__':
    patch('output.txt', 'patched.txt')

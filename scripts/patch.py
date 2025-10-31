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
                    # Fix compounded definitions without prefix
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
                    # Separate multiple entries found in the same line
                    search_line, start = line, 0
                    while True:
                        match = re.search(r'(?<!\t)(\S+)\s+%([^%]+)%(?!\)|$)',
                                          search_line)
                        if not match:
                            break
                        previous = match.group(1)
                        must_include = ['.', '&']
                        must_exclude = ['%', ':', ';', ',', '—']
                        must_exclude_word = [
                                'also', 'Adj', 'cf', 'or', 'contr',
                                'Dor', 'and', 'Lacon', 'Ion', 'Ep',
                                'Subst', 'Aeol', 'fem', 'Boeot', 'Att',
                                'poet', 'v', 'from', 'Adv', 'but',
                                'nom', 'Lyr', 'freq', 'lengthd', 'Trag',
                                'gen', 'masc', 'Med', 'n', 'Pass',
                                'neut', 'Arc', 'Locr', 'Cret', 'Sup',
                                'pres', 'part', 'fut', 'Dim', 'compd',
                                'declens', 'pl', 'Thess', 'Dep', 'sts',
                                'sg', 'usu', 'aor', 'acc', 'Delph',
                                'Act', 'hyperdor', 'subj', 'p', 'leg',
                                'Comp', 'gr', 'inf', 'parox', 'perh',
                                'dat', 'lon', 'uncontr', 'Inscrr',
                                'opp', 'fort', 'imper', 'impf', 'orig',
                                'Arg', 'Gr', 'Cf', 'prob', 'Gramm',
                                'fin', 'dub', 'Cypr', 'i.e', 'shortd']
                        excluded = (
                                not any(exp in previous
                                        for exp in must_include)
                                or any(exp in previous
                                       for exp in must_exclude)
                                or any(re.search(r'\b%s\b' % exp, previous)
                                       for exp in must_exclude_word))
                        if excluded:
                            start += match.end(0)
                            search_line = search_line[match.end(0):]
                        else:
                            # print('===', line)
                            entry['content'].append(line[:start + match.end(1)])
                            # print(entry['key'], '<<<', entry['content'][0])
                            greek = re.sub(r'[^\p{L}\s]', '', match.group(2))
                            key = betacode.revert(greek)
                            entry = {'key': '%s | %s' % (key, greek),
                                     'content': []}
                            entries.append(entry)
                            line = '\t%' + search_line[match.start(2):]
                            search_line, start = line, 0
                            # print(entry['key'], '>>>', line)
                entry['content'].append(line)
            else:
                entry = {'key': line.strip(), 'content': []}
                entries.append(entry)
            if index % 1000 == 0:
                pass
                print_progress_bar('Patching', index, total)
        print_progress_bar('Patching', 1, 1, last=True)
        # return
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

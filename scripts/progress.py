def progress_bar(value, maximum, size):
    fractions = zip('▉▊▋▌▍▎▏', list(range(7, 0, -1)))
    bar = ''
    factor = maximum / size
    for i in range(size):
        symbol = None
        if value >= (i + 1) * factor:
            symbol = '█'
        elif value > i * factor:
            delta = (value - i * factor) / factor
            for symbol, f in fractions:
                if delta >= f / 8:
                    break
            else: # no break
                symbol = None
        bar += symbol if symbol else '⁚'
    return bar

def print_progress_bar(label, value, maximum, width=80, last=False):
    bar = progress_bar(value, maximum, max(1, width - 18))
    percentage = value * 100.0 / max(1, maximum)
    print('\r%-12s %s %3d%%' % (label, bar, percentage),
          end='\n' if last else '')

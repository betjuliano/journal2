import re, glob

# Tailwind-like scales
spacing = {
    '0': '0px', '0.5': '0.125rem', '1': '0.25rem', '1.5': '0.375rem', '2': '0.5rem', '2.5': '0.625rem',
    '3': '0.75rem', '3.5': '0.875rem', '4': '1rem', '5': '1.25rem', '6': '1.5rem', '7': '1.75rem',
    '8': '2rem', '9': '2.25rem', '10': '2.5rem', '11': '2.75rem', '12': '3rem', '14': '3.5rem',
    '16': '4rem', '20': '5rem', '24': '6rem', '28': '7rem', '32': '8rem', '36': '9rem', '40': '10rem',
    '48': '12rem', '56': '14rem', '64': '16rem', '72': '18rem', '80': '20rem', '96': '24rem'
}

colors = {
    'gray': {'50':'#f9fafb','100':'#f3f4f6','200':'#e5e7eb','300':'#d1d5db','400':'#9ca3af','500':'#6b7280','600':'#4b5563','700':'#374151','800':'#1f2937','900':'#111827'},
    'slate': {'50':'#f8fafc','100':'#f1f5f9','200':'#e2e8f0','300':'#cbd5e1','400':'#94a3b8','500':'#64748b','600':'#475569','700':'#334155','800':'#1e293b','900':'#0f172a'},
    'blue': {'50':'#eff6ff','100':'#dbeafe','200':'#bfdbfe','300':'#93c5fd','400':'#60a5fa','500':'#3b82f6','600':'#2563eb','700':'1d4ed8','800':'#1e40af','900':'#1e3a8a'},
    'indigo': {'50': '#eef2ff','100': '#e0e7ff','200': '#c7d2fe','300': '#a5b4fc','400': '#818cf8','500': '#6366f1','600': '#4f46e5','700': '#4338ca','800': '#3730a3','900': '#312e81'},
    'red': {'50':'#fef2f2','100':'#fee2e2','200':'#fecdd3','300':'#fca5a5','400':'#f87171','500':'#ef4444','600':'#dc2626','700':'#b91c1c','800':'#991b1b','900':'#7f1d1d'},
    'green': {'50':'#ecfdf3','100':'#d1fae5','200':'#a7f3d0','300':'#6ee7b7','400':'#34d399','500':'#22c55e','600':'#16a34a','700':'#15803d','800':'#166534','900':'#14532d'},
    'emerald': {'50':'#ecfdf3','100':'#d1fae5','200':'#a7f3d0','300':'#6ee7b7','400':'#34d399','500':'#10b981','600':'#059669','700':'#047857','800':'#065f46','900':'#064e3b'},
    'teal': {'50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a'},
    'violet': {'50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95'},
    'purple': {'50':'#faf5ff','100':'#f3e8ff','200':'#e9d5ff','300':'#d8b4fe','400':'#c084fc','500':'#a855f7','600':'#9333ea','700':'#7e22ce','800':'#6b21a8','900':'#581c87'},
    'orange': {'50':'#fff7ed','100':'#ffedd5','200':'#fed7aa','300':'#fdba74','400':'#fb923c','500':'#f97316','600':'#ea580c','700':'#c2410c','800':'#9a3412','900':'#7c2d12'},
    'amber': {'50':'#fffbeb','100':'#fef3c7','200':'#fde68a','300':'#fcd34d','400':'#fbbf24','500':'#f59e0b','600':'#d97706','700':'#b45309','800':'#92400e','900':'#78350f'},
    'primary': {'50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a'},
    'white': {'DEFAULT': '#ffffff'},
    'black': {'DEFAULT': '#000000'},
    'transparent': {'DEFAULT': 'transparent'}
}

font_sizes = {
    'xs': ('0.75rem','1rem'),
    'sm': ('0.875rem','1.25rem'),
    'base': ('1rem','1.5rem'),
    'lg': ('1.125rem','1.75rem'),
    'xl': ('1.25rem','1.75rem'),
    '2xl': ('1.5rem','2rem'),
    '3xl': ('1.875rem','2.25rem'),
    '4xl': ('2.25rem','2.5rem')
}

font_weights = {
    'light': 300,
    'normal': 400,
    'medium': 500,
    'semibold': 600,
    'bold': 700,
    'extrabold': 800,
}

radii = {
    'none': '0px',
    'sm': '0.125rem',
    '': '0.25rem',
    'md': '0.375rem',
    'lg': '0.5rem',
    'xl': '0.75rem',
    'full': '9999px'
}

shadows = {
    'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'md': '0 4px 6px -1px rgb(0 0 0 / 0.1),0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1),0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1),0 8px 10px -6px rgb(0 0 0 / 0.1)'
}

opacity_scale = {
    '0': '0', '10': '0.1', '20': '0.2', '25': '0.25', '30': '0.3', '40': '0.4', '50': '0.5',
    '60': '0.6', '70': '0.7', '75': '0.75', '80': '0.8', '90': '0.9', '95': '0.95', '100': '1'
}

z_index = {
    '0': '0', '10': '10', '20': '20', '30': '30', '40': '40', '50': '50'
}

transition_map = {
    'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
    'opacity': 'opacity',
    'shadow': 'box-shadow',
    'transform': 'transform',
    'all': 'all'
}

def escape_class(cls: str) -> str:
    escaped = ''
    for ch in cls:
        if ch.isalnum() or ch in ['-', '_']:
            escaped += ch
        else:
            escaped += '\\' + ch
    return escaped

def color_value(name, shade=None, alpha=None):
    palette = colors.get(name)
    if not palette:
        return None
    if shade is None:
        val = palette.get('DEFAULT') or next(iter(palette.values()))
    else:
        val = palette.get(shade)
    if not val:
        return None
    if alpha:
        val = to_rgba(val, alpha)
    return val


def to_rgba(hex_color, alpha):
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join(ch*2 for ch in hex_color)
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return f'rgba({r}, {g}, {b}, {alpha})'

rules = []

class_pattern = re.compile(r'(?:[a-z]+:)?[a-z0-9\[\]\/]+(?:-[a-z0-9\[\]\/]+)+', re.IGNORECASE)
classes=set()
for path in glob.glob('*.tsx')+glob.glob('components/*.tsx'):
    content = open(path).read()
    # Capture tokens inside JSX string attributes and template literals, ignoring interpolated expressions
    for token in class_pattern.findall(content):
        classes.add(token)
    for m in re.finditer(r'className="([^"]+)"', content):
        classes.update(m.group(1).split())

variant_prefixes = {'hover','focus','dark','sm','md','lg','disabled','group-hover','group-open'}


def add_rule(selector, declarations, media=None):
    rule = f"{selector}{{{';'.join(declarations)}}}"
    if media:
        rule = f"@media {media}{{{rule}}}"
    rules.append(rule)


def handle_base(cls):
    decs = []
    if cls.startswith('-m'):
        kind = 'm'
        rest = cls[2:]
        if rest.startswith('l-'):
            val_key = rest[2:]
            val = spacing.get(val_key) if val_key != 'px' else '1px'
            if val:
                decs.append(f'margin-left:-{val}')
        elif rest.startswith('x-'):
            val = spacing.get(rest[2:])
            if val:
                decs.append(f'margin-left:-{val}')
                decs.append(f'margin-right:-{val}')
        return decs
    if cls == 'block':
        decs.append('display:block')
    elif cls == 'group':
        decs.append('display:block')
    elif cls == 'inline-block':
        decs.append('display:inline-block')
    elif cls == 'inline-flex':
        decs.append('display:inline-flex')
    elif cls == 'flex':
        decs.append('display:flex')
    elif cls == 'flex-row':
        decs.append('flex-direction:row')
    elif cls == 'flex-row-reverse':
        decs.append('flex-direction:row-reverse')
    elif cls == 'grid':
        decs.append('display:grid')
    elif cls == 'hidden':
        decs.append('display:none')
    elif cls == 'flex-1':
        decs.append('flex:1 1 0%')
    elif cls == 'flex-none':
        decs.append('flex:none')
    elif cls == 'flex-grow':
        decs.append('flex-grow:1')
    elif cls == 'flex-shrink-0':
        decs.append('flex-shrink:0')
    elif cls == 'flex-col':
        decs.append('flex-direction:column')
    elif cls == 'flex-wrap':
        decs.append('flex-wrap:wrap')
    elif cls == 'items-center':
        decs.append('align-items:center')
    elif cls == 'items-start':
        decs.append('align-items:flex-start')
    elif cls == 'items-end':
        decs.append('align-items:flex-end')
    elif cls == 'justify-between':
        decs.append('justify-content:space-between')
    elif cls == 'justify-center':
        decs.append('justify-content:center')
    elif cls == 'justify-start':
        decs.append('justify-content:flex-start')
    elif cls == 'justify-end':
        decs.append('justify-content:flex-end')
    elif cls == 'text-left':
        decs.append('text-align:left')
    elif cls == 'text-center':
        decs.append('text-align:center')
    elif cls == 'text-right':
        decs.append('text-align:right')
    elif cls == 'normal-case':
        decs.append('text-transform:none')
    elif cls == 'underline':
        decs.append('text-decoration:underline')
    elif cls == 'decoration-dotted':
        decs.append('text-decoration-style:dotted')
    elif cls == 'uppercase':
        decs.append('text-transform:uppercase')
    elif cls == 'truncate':
        decs.append('overflow:hidden')
        decs.append('text-overflow:ellipsis')
        decs.append('white-space:nowrap')
    elif cls == 'whitespace-nowrap':
        decs.append('white-space:nowrap')
    elif cls == 'select-none':
        decs.append('user-select:none')
    elif cls == 'overflow-hidden':
        decs.append('overflow:hidden')
    elif cls == 'overflow-x-auto':
        decs.append('overflow-x:auto')
    elif cls == 'overflow-y-auto':
        decs.append('overflow-y:auto')
    elif cls == 'overflow-auto':
        decs.append('overflow:auto')
    elif cls == 'relative':
        decs.append('position:relative')
    elif cls == 'absolute':
        decs.append('position:absolute')
    elif cls == 'fixed':
        decs.append('position:fixed')
    elif cls == 'sticky':
        decs.append('position:sticky')
    elif cls == 'inset-0':
        decs.append('inset:0')
    elif cls == 'inset-y-0':
        decs.append('top:0')
        decs.append('bottom:0')
    elif cls.startswith('top-'):
        val = cls.split('-')[1]
        if val == '0': decs.append('top:0')
        elif val == '2': decs.append('top:0.5rem')
        elif val == '2.5': decs.append('top:0.625rem')
        elif val == '10': decs.append('top:2.5rem')
        else: pass
    elif cls.startswith('right-'):
        val = cls.split('-')[1]
        if val == '0': decs.append('right:0')
        elif val == '2': decs.append('right:0.5rem')
    elif cls.startswith('left-'):
        val = cls.split('-')[1]
        if val == '0': decs.append('left:0')
        elif val == '3': decs.append('left:0.75rem')
    elif cls.startswith('z-'):
        val = cls.split('-')[1]
        if val in z_index:
            decs.append(f'z-index:{z_index[val]}')
    elif cls == 'cursor-pointer':
        decs.append('cursor:pointer')
    elif cls == 'pointer-events-none':
        decs.append('pointer-events:none')
    elif cls.startswith('max-w-'):
        mapping = {'2xl':'42rem','3xl':'48rem','4xl':'56rem','5xl':'64rem','7xl':'80rem','md':'28rem','xl':'36rem'}
        key = cls.replace('max-w-','')
        if key in mapping:
            decs.append(f'max-width:{mapping[key]}')
    elif cls.startswith('min-w-'):
        mapping={'0':'0px','full':'100%'}
        key=cls.replace('min-w-','')
        if key in mapping:
            decs.append(f'min-width:{mapping[key]}')
    elif cls.startswith('min-h-'):
        if cls == 'min-h-screen':
            decs.append('min-height:100vh')
        elif cls == 'min-h-[200px]':
            decs.append('min-height:200px')
        elif cls == 'min-h-[3rem]':
            decs.append('min-height:3rem')
    elif cls.startswith('max-h-'):
        key = cls.replace('max-h-','')
        mapping = {'80':'20rem'}
        if key in mapping:
            decs.append(f'max-height:{mapping[key]}')
        elif key.startswith('[') and key.endswith(']'):
            decs.append(f'max-height:{key[1:-1]}')
    elif cls.startswith('h-'):
        key = cls.split('-')[1]
        if key in spacing:
            decs.append(f'height:{spacing[key]}')
        elif key == 'fit':
            decs.append('height:fit-content')
        elif key == 'full':
            decs.append('height:100%')
        elif key == 'screen':
            decs.append('height:100vh')
        elif key == '16':
            decs.append('height:4rem')
        elif key == '6':
            decs.append('height:1.5rem')
        elif key == '10':
            decs.append('height:2.5rem')
    elif cls.startswith('w-'):
        key = cls.split('-')[1]
        if key in spacing:
            decs.append(f'width:{spacing[key]}')
        elif key == 'full':
            decs.append('width:100%')
        elif key == 'auto':
            decs.append('width:auto')
        elif key == 'fit':
            decs.append('width:fit-content')
        elif key == '1/2':
            decs.append('width:50%')
        elif key == '1/3':
            decs.append('width:33.333333%')
        elif key == '1/4':
            decs.append('width:25%')
        elif key == '2/3':
            decs.append('width:66.666667%')
        elif key == '72':
            decs.append('width:18rem')
    elif cls.startswith('p') or cls.startswith('m'):
        # padding/margin utilities
        kind = cls[0]
        rest = cls[1:]
        if rest.startswith('x-'):
            val = spacing.get(rest[2:])
            if val: decs += [f'{"padding" if kind=="p" else "margin"}-left:{val}', f'{"padding" if kind=="p" else "margin"}-right:{val}']
        elif rest == 'x-auto' and kind == 'm':
            decs += ['margin-left:auto','margin-right:auto']
        elif rest.startswith('y-'):
            val = spacing.get(rest[2:])
            if val: decs += [f'{"padding" if kind=="p" else "margin"}-top:{val}', f'{"padding" if kind=="p" else "margin"}-bottom:{val}']
        elif rest.startswith('t-'):
            val = spacing.get(rest[2:])
            if val: decs.append(f'{"padding" if kind=="p" else "margin"}-top:{val}')
        elif rest.startswith('b-'):
            val = spacing.get(rest[2:])
            if val: decs.append(f'{"padding" if kind=="p" else "margin"}-bottom:{val}')
        elif rest.startswith('l-'):
            val = spacing.get(rest[2:])
            if val: decs.append(f'{"padding" if kind=="p" else "margin"}-left:{val}')
        elif rest.startswith('r-'):
            val = spacing.get(rest[2:])
            if val: decs.append(f'{"padding" if kind=="p" else "margin"}-right:{val}')
        elif rest.startswith('-'):
            val_key = rest[1:]
            val = spacing.get(val_key)
            if val:
                target = 'margin' if kind=='m' else 'padding'
                decs.append(f'{target}:-{val}')
        elif rest.startswith('['):
            # like p-[10px]
            num = rest.strip('[]')
            if num.endswith('px'):
                val = num
                decs.append(f'{"padding" if kind=="p" else "margin"}:{val}')
        else:
            val = spacing.get(rest)
            if val:
                decs.append(f'{"padding" if kind=="p" else "margin"}:{val}')
    elif cls.startswith('gap-'):
        val = spacing.get(cls.split('-')[1])
        if val: decs.append(f'gap:{val}')
    elif cls.startswith('space-x-'):
        val = spacing.get(cls.replace('space-x-',''))
        if val:
            decs.append(f'--tw-space-x-reverse:0')
            decs.append(f'margin-right:calc({val} * var(--tw-space-x-reverse))')
            decs.append(f'margin-left:calc({val} * calc(1 - var(--tw-space-x-reverse)))')
    elif cls.startswith('space-y-'):
        val = spacing.get(cls.replace('space-y-',''))
        if val:
            # handled separately as combinator rule
            pass
    elif cls == 'divide-y':
        decs.append('border-top-width:0')
        decs.append('border-bottom-width:0')
    elif cls.startswith('divide-'):
        # handled later
        pass
    elif cls.startswith('bg-opacity-'):
        val = opacity_scale.get(cls.replace('bg-opacity-',''))
        if val:
            decs.append(f'--tw-bg-opacity:{val}')
    elif cls.startswith('bg-'):
        rest = cls.replace('bg-','')
        if rest == 'transparent':
            decs.append('background-color:transparent')
        elif rest == 'white':
            decs.append('background-color:#ffffff')
        elif rest.startswith('gradient-to-'):
            direction = rest.replace('gradient-to-','')
            dir_map = {'r':'right','l':'left','t':'top','b':'bottom','tr':'top right','tl':'top left','br':'bottom right','bl':'bottom left'}
            decs.append(f'background-image:linear-gradient(to {dir_map.get(direction, direction)}, var(--tw-gradient-stops))')
        else:
            color_part = rest
            alpha = None
            if '/' in rest:
                color_part, alpha = rest.split('/')
                alpha = str(float(alpha)/100)
            if '-' in color_part:
                name, shade = color_part.split('-',1)
            else:
                name, shade = color_part, None
            val = color_value(name, shade, alpha)
            if val:
                decs.append(f'background-color:{val}')
    elif cls.startswith('from-'):
        color_part = cls.replace('from-','')
        alpha=None
        if '/' in color_part:
            color_part, alpha = color_part.split('/')
            alpha = str(float(alpha)/100)
        if '-' in color_part:
            name, shade = color_part.split('-',1)
        else:
            name, shade = color_part, None
        val = color_value(name, shade, alpha)
        if val:
            decs.append(f'--tw-gradient-from:{val}')
            decs.append('--tw-gradient-to:rgba(255,255,255,0)')
            decs.append('--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to)')
    elif cls.startswith('to-'):
        color_part = cls.replace('to-','')
        alpha=None
        if '/' in color_part:
            color_part, alpha = color_part.split('/')
            alpha = str(float(alpha)/100)
        if '-' in color_part:
            name, shade = color_part.split('-',1)
            val = color_value(name, shade, alpha)
            if val:
                decs.append(f'--tw-gradient-to:{val}')
                decs.append('--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to)')
    elif cls.startswith('text-'):
        rest = cls.replace('text-','')
        if rest in font_sizes:
            size, lh = font_sizes[rest]
            decs.append(f'font-size:{size}')
            decs.append(f'line-height:{lh}')
        else:
            alpha=None
            if '/' in rest:
                rest, alpha = rest.split('/')
                alpha = str(float(alpha)/100)
            if rest in ['white','black']:
                val = color_value(rest, None, alpha)
            elif '-' in rest:
                name, shade = rest.split('-',1)
                val = color_value(name, shade, alpha)
            else:
                val = None
            if val:
                decs.append(f'color:{val}')
    elif cls.startswith('placeholder-'):
        rest = cls.replace('placeholder-','')
        val = None
        if '-' in rest:
            name, shade = rest.split('-',1)
            val = color_value(name, shade)
        if val:
            decs.append(f'color:{val}')
    elif cls.startswith('font-'):
        weight = cls.replace('font-','')
        if weight in font_weights:
            decs.append(f'font-weight:{font_weights[weight]}')
        elif weight == 'mono':
            decs.append("font-family:'ui-monospace', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace")
        elif weight == 'sans':
            decs.append("font-family:'Inter', system-ui, -apple-system, sans-serif")
    elif cls.startswith('leading-'):
        lh = cls.replace('leading-','')
        mapping = {'tight':'1.25','snug':'1.375','normal':'1.5','relaxed':'1.625','5':'1.25rem','6':'1.5rem','7':'1.75rem','8':'2rem'}
        if lh in mapping:
            decs.append(f'line-height:{mapping[lh]}')
    elif cls.startswith('tracking-'):
        mapping={'wide':'0.025em','wider':'0.05em'}
        key=cls.replace('tracking-','')
        if key in mapping:
            decs.append(f'letter-spacing:{mapping[key]}')
    elif cls.startswith('border'):
        if cls == 'border':
            decs.append('border-width:1px')
        elif cls == 'border-2':
            decs.append('border-width:2px')
        elif cls == 'border-b':
            decs.append('border-bottom-width:1px')
        elif cls == 'border-t':
            decs.append('border-top-width:1px')
        elif cls == 'border-l-2':
            decs.append('border-left-width:2px')
        elif cls == 'border-l-4':
            decs.append('border-left-width:4px')
        elif cls == 'border-none':
            decs.append('border-width:0')
        elif cls.startswith('border-'):
            color_part = cls.replace('border-','')
            if color_part == 'transparent':
                decs.append('border-color:transparent')
            elif '-' in color_part:
                name, shade = color_part.split('-',1)
                val = color_value(name, shade)
                if val: decs.append(f'border-color:{val}')
    elif cls.startswith('divide-'):
        color_part = cls.replace('divide-','')
        if '-' in color_part:
            name, shade = color_part.split('-',1)
            val = color_value(name, shade)
            if val:
                decs.append(f'--tw-divide-y-reverse:0')
                decs.append(f'border-color:{val}')
    elif cls.startswith('rounded'):
        part = cls.replace('rounded','')
        if part.startswith('-'):
            piece = part[1:]
            # partial corners
            if piece in radii:
                decs.append(f'border-radius:{radii[piece]}')
            else:
                size = ''
                corner_key = piece
                if '-' in piece:
                    corner_key, size = piece.split('-',1)
                rad = radii.get(size, radii.get('', '0.25rem'))
                corner_map = {
                    'l': ('border-top-left-radius','border-bottom-left-radius'),
                    'r': ('border-top-right-radius','border-bottom-right-radius'),
                    't': ('border-top-left-radius','border-top-right-radius'),
                    'b': ('border-bottom-left-radius','border-bottom-right-radius'),
                    'bl': ('border-bottom-left-radius',),
                    'br': ('border-bottom-right-radius',),
                    'tl': ('border-top-left-radius',),
                    'tr': ('border-top-right-radius',)
                }
                for key, props in corner_map.items():
                    if key == corner_key:
                        for prop in props:
                            decs.append(f'{prop}:{rad}')
        else:
            rad = radii.get(part, radii[''])
            decs.append(f'border-radius:{rad}')
    elif cls.startswith('shadow'):
        key = cls.replace('shadow','')
        key = key.lstrip('-')
        if key in shadows:
            decs.append(f'box-shadow:{shadows[key]}')
    elif cls.startswith('opacity-'):
        val = opacity_scale.get(cls.replace('opacity-',''))
        if val:
            decs.append(f'opacity:{val}')
    elif cls.startswith('bg-opacity-'):
        val = opacity_scale.get(cls.replace('bg-opacity-',''))
        if val:
            decs.append(f'--tw-bg-opacity:{val}')
    elif cls == 'ring':
        decs.append('--tw-ring-offset-shadow:0 0 #0000')
        decs.append('--tw-ring-shadow:0 0 #0000')
        decs.append('box-shadow:var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)')
    elif cls.startswith('ring-'):
        val = cls.replace('ring-','')
        if val in ['0','1','2','4','8']:
            decs.append('--tw-ring-offset-width:0px')
            decs.append(f'--tw-ring-shadow:0 0 0 {val}px var(--tw-ring-color)')
            decs.append('box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)')
        elif val.startswith('offset-'):
            off = val.replace('offset-','')
            offset_val = spacing.get(off) or (off+'px' if off.isdigit() else None)
            if offset_val:
                decs.append(f'--tw-ring-offset-width:{offset_val}')
        elif val.startswith('opacity-'):
            opa = opacity_scale.get(val.replace('opacity-',''))
            if opa:
                decs.append(f'--tw-ring-opacity:{opa}')
        else:
            if '-' in val:
                name, shade = val.split('-',1)
                col = color_value(name, shade)
            else:
                col = color_value(val)
            if col:
                decs.append(f'--tw-ring-color:{col}')
                decs.append('box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), 0 0 0 3px var(--tw-ring-color), var(--tw-shadow, 0 0 #0000)')
    elif cls.startswith('transition'):
        key = cls.replace('transition-','')
        props = transition_map.get(key, 'all')
        decs.append(f'transition-property:{props}')
        decs.append('transition-duration:150ms')
        decs.append('transition-timing-function:cubic-bezier(0.4,0,0.2,1)')
    elif cls.startswith('duration-'):
        ms = int(cls.replace('duration-',''))
        decs.append(f'transition-duration:{ms}ms')
    elif cls.startswith('ease-'):
        mapping={'in':'cubic-bezier(0.4,0,1,1)','out':'cubic-bezier(0,0,0.2,1)','in-out':'cubic-bezier(0.4,0,0.2,1)'}
        key=cls.replace('ease-','')
        if key in mapping:
            decs.append(f'transition-timing-function:{mapping[key]}')
    elif cls == 'backdrop-blur':
        decs.append('backdrop-filter:blur(8px)')
    elif cls == 'bg-clip-text':
        decs.append('-webkit-background-clip:text')
        decs.append('color:transparent')
    elif cls.startswith('text-['):
        val = cls[5:-1]
        decs.append(f'font-size:{val}')
    elif cls == 'shadow-inner':
        decs.append('box-shadow:inset 0 2px 4px 0 rgb(0 0 0 / 0.06)')
    elif cls == 'font-mono':
        decs.append("font-family:'ui-monospace', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace")
    elif cls == 'font-sans':
        decs.append("font-family:'Inter', system-ui, -apple-system, sans-serif")
    elif cls == 'italic':
        decs.append('font-style:italic')
    elif cls == 'align-bottom':
        decs.append('vertical-align:bottom')
    elif cls == 'align-middle':
        decs.append('vertical-align:middle')
    elif cls == 'col-span-1':
        decs.append('grid-column:span 1 / span 1')
    elif cls.startswith('grid-cols-'):
        cols = cls.replace('grid-cols-','')
        if cols.isdigit():
            decs.append(f'grid-template-columns:repeat({cols}, minmax(0, 1fr))')
    elif cls == 'divide-y':
        decs.append('border-top-width:1px')
        decs.append('border-bottom-width:1px')
    elif cls.startswith('col-span-'):
        num = cls.replace('col-span-','')
        if num.isdigit():
            decs.append(f'grid-column:span {num} / span {num}')
    elif cls == 'text-ellipsis':
        decs.append('text-overflow:ellipsis')
    elif cls == 'bg-opacity-75':
        decs.append('--tw-bg-opacity:0.75')
    elif cls == 'backdrop-blur-sm':
        decs.append('backdrop-filter:blur(4px)')
    elif cls == 'bg-white/80':
        decs.append('background-color:rgba(255,255,255,0.8)')
    elif cls == 'bg-slate-900/60':
        decs.append('background-color:rgba(15,23,42,0.6)')
    elif cls == 'shadow-md':
        decs.append(shadows['md'])
    elif cls == 'divide-gray-200':
        decs.append('border-color:#e5e7eb')
    elif cls == 'divide-slate-700':
        decs.append('border-color:#334155')
    elif cls == 'border-dashed':
        decs.append('border-style:dashed')
    elif cls == 'border-emerald-200':
        decs.append('border-color:#a7f3d0')
    elif cls == 'border-emerald-300':
        decs.append('border-color:#6ee7b7')
    elif cls.startswith('line-clamp-'):
        amount = cls.split('-')[-1]
        decs.append('display:-webkit-box')
        decs.append('-webkit-box-orient:vertical')
        if amount.isdigit():
            decs.append(f'-webkit-line-clamp:{amount}')
        decs.append('overflow:hidden')
    elif cls == 'animate-spin':
        decs.append('animation:spin 1s linear infinite')
    elif cls == 'animate-fadeIn':
        decs.append('animation:fadeIn 0.3s ease-in-out')
    elif cls == 'list-none':
        decs.append('list-style:none')
    elif cls == 'outline-none':
        decs.append('outline:none')
    elif cls == 'transform':
        decs.append('transform:translateZ(0)')
    elif cls == 'rotate-180':
        decs.append('transform:rotate(180deg)')
    elif cls == 'form-checkbox':
        decs.append('appearance:none')
        decs.append('border:1px solid #d1d5db')
        decs.append('border-radius:0.25rem')
        decs.append('width:1rem')
        decs.append('height:1rem')
        decs.append('display:inline-block')
        decs.append('vertical-align:middle')
    elif cls == 'placeholder-gray-500':
        decs.append('color:#6b7280')
    elif cls == 'ring-indigo-500':
        decs.append('--tw-ring-color:#6366f1')
    return decs


def process_class(full_cls):
    variants = []
    base = full_cls
    while ':' in base:
        prefix, rest = base.split(':',1)
        if prefix in variant_prefixes:
            variants.append(prefix)
            base = rest
        else:
            break
    pseudo = ''
    selector = '.' + escape_class(base)
    if base.startswith('placeholder-'):
        pseudo = '::placeholder'
    decs = handle_base(base)
    selector += pseudo
    media = None
    if not decs:
        return
    for var in reversed(variants):
        if var == 'hover':
            selector += ':hover'
        elif var == 'focus':
            selector += ':focus'
        elif var == 'disabled':
            selector += ':disabled'
        elif var == 'dark':
            selector = '.dark ' + selector
        elif var == 'group-hover':
            selector = '.group:hover ' + selector
        elif var == 'sm':
            media = '(min-width:640px)'
        elif var == 'md':
            media = '(min-width:768px)'
        elif var == 'lg':
            media = '(min-width:1024px)'
        elif var == 'group-open':
            selector = '.group[open] ' + selector
    add_rule(selector, decs, media)

for cls in sorted(classes):
    if cls.startswith('space-y-'):
        val = spacing.get(cls.replace('space-y-',''))
        if val:
            selector = '.'+escape_class(cls.split(':')[-1])+' > :not([hidden]) ~ :not([hidden])'
            rule = f"margin-top:{val};margin-bottom:calc({val} * var(--tw-space-y-reverse,0))"
            media=None
            variants=[]
            base=cls
            while ':' in base:
                prefix, rest = base.split(':',1)
                if prefix in variant_prefixes:
                    variants.append(prefix)
                    base=rest
                else:
                    break
            selector='.'+escape_class(base)+' > :not([hidden]) ~ :not([hidden])'
            for var in reversed(variants):
                if var=='dark':
                    selector='.dark '+selector
                elif var=='sm':
                    media='(min-width:640px)'
            add_rule(selector,[rule],media)
    else:
        process_class(cls)

# ensure gradient variables exist
rules.insert(0, ':root{--tw-gradient-from:initial;--tw-gradient-to:initial;--tw-gradient-stops:initial;--tw-ring-color:rgba(59,130,246,0.5);}')
rules.insert(0, 'body{font-family:"Inter", system-ui, -apple-system, sans-serif;}')
rules.insert(0, '*{box-sizing:border-box;}')
rules.insert(0, '.custom-scrollbar::-webkit-scrollbar{width:8px;height:8px;} .custom-scrollbar::-webkit-scrollbar-track{background:transparent;} .custom-scrollbar::-webkit-scrollbar-thumb{background-color:#cbd5e1;border-radius:4px;} .dark .custom-scrollbar::-webkit-scrollbar-thumb{background-color:#475569;}')
rules.append('.list-none{list-style:none;}')
rules.append('.outline-none{outline:none;}')
rules.append('.transform{transform:translateZ(0);}')
rules.append('.rotate-180{transform:rotate(180deg);}')
rules.append('.animate-spin{animation:spin 1s linear infinite;}')
rules.append('.animate-fadeIn{animation:fadeIn 0.3s ease-in-out;}')
rules.append('@keyframes spin{to{transform:rotate(360deg);}}')
rules.append('@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}')
rules.append('.line-clamp-1{-webkit-line-clamp:1;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;}')
rules.append('.line-clamp-2{-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;}')
rules.append('.line-clamp-3{-webkit-line-clamp:3;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;}')
rules.append('.placeholder-gray-500::placeholder{color:#6b7280;opacity:1;}')
rules.append('.form-checkbox{appearance:none;border:1px solid #d1d5db;border-radius:0.25rem;width:1rem;height:1rem;display:inline-block;vertical-align:middle;}')
rules.append('.border-dashed{border-style:dashed;}')
rules.append('.divide-gray-200 > :not([hidden]) ~ :not([hidden]){border-color:#e5e7eb;}')
rules.append('.divide-slate-700 > :not([hidden]) ~ :not([hidden]){border-color:#334155;}')
rules.append('.mx-auto{margin-left:auto;margin-right:auto;}')
rules.append('.ring-indigo-500{--tw-ring-color:#6366f1;}')
rules.append('.text-\\[10px\\]{font-size:10px;}')
rules.append('.border-dashed{border-style:dashed;}')
rules.append('.divide-gray-200 > :not([hidden]) ~ :not([hidden]){border-color:#e5e7eb;}')
rules.append('.divide-slate-700 > :not([hidden]) ~ :not([hidden]){border-color:#334155;}')
rules.append('.mx-auto{margin-left:auto;margin-right:auto;}')
rules.append('.ring-indigo-500{--tw-ring-color:#6366f1;}')
rules.append('.text-\\[10px\\]{font-size:10px;}')

open('styles.css','w').write('\n'.join(rules))
print('generated', len(rules),'rules')

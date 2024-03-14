class ConsoleLogger {
  closeByNewLine = false;

  useIcons = true;

  logsTitle = 'LOGS';

  warningsTitle = 'WARNINGS';

  errorsTitle = 'ERRORS';

  informationsTitle = 'INFORMATIONS';

  successesTitle = 'SUCCESS';

  debugsTitle = 'DEBUG';

  assertsTitle = 'ASSERT';

  #colorReset = '\x1b[0m';

  #fgcDefault = '\x1b[37m';

  #getColor(foregroundColor = '', backgroundColor = '') {
    let fgc = this.#fgcDefault;
    switch (foregroundColor.trim().toLowerCase()) {
      case 'black': fgc = '\x1b[30m'; break;
      case 'red': fgc = '\x1b[31m'; break;
      case 'green': fgc = '\x1b[32m'; break;
      case 'yellow': fgc = '\x1b[33m'; break;
      case 'blue': fgc = '\x1b[34m'; break;
      case 'magenta': fgc = '\x1b[35m'; break;
      case 'cyan': fgc = '\x1b[36m'; break;
      case 'white': fgc = '\x1b[37m'; break;
          // no default
    }

    let bgc = '';
    switch (backgroundColor.trim().toLowerCase()) {
      case 'black': bgc = '\x1b[40m'; break;
      case 'red': bgc = '\x1b[44m'; break;
      case 'green': bgc = '\x1b[44m'; break;
      case 'yellow': bgc = '\x1b[43m'; break;
      case 'blue': bgc = '\x1b[44m'; break;
      case 'magenta': bgc = '\x1b[45m'; break;
      case 'cyan': bgc = '\x1b[46m'; break;
      case 'white': bgc = '\x1b[47m'; break;
          // no default
    }

    return `${fgc}${bgc}`;
  }

  #getColorReset() {
    return `${this.#colorReset}`;
  }

  clear() {
    console.clear();
    return this;
  }

  print({
    fg = 'white',
    bg = 'black',
    type = 'log',
    single = true,
    icon,
    value,
  } = {}) {
    const c = this.#getColor(fg, bg);

    const timestamp = (new Date()).toISOString().replace('T', ' ').substring(0, 23);
    if (single) {
      console[type](c, `[${timestamp}]`, icon, value, this.#getColorReset());
    } else {
      console[type](c, `[${timestamp}]`, value, this.#getColorReset());
    }

    if (this.closeByNewLine) console[type]('');
  }

  printGroup({
    fg,
    bg,
    title,
    icon,
    type = 'log',
    values = [],
  } = {}) {
    const c = this.#getColor(fg, bg);
    const nl = this.closeByNewLine;

    console.group(c, (this.useIcons ? icon : '') + title);
    this.closeByNewLine = false;

    values.forEach((value) => {
      this.print({
        fg, bg, single: false, value, type,
      });
    });

    this.closeByNewLine = nl;
    console.groupEnd();

    if (nl) console.log();
  }

  log(...strings) {
    const fg = 'white';
    const bg = '';
    const icon = '\u25ce';

    if (strings.length > 1) {
      this.printGroup({
        fg, bg, title: this.logsTitle, values: strings, icon,
      });
    } else {
      this.print({
        fg, bg, icon, value: strings[0],
      });
    }
  }

  warn(...strings) {
    const fg = 'yellow';
    const bg = '';
    const icon = '\u26a0';

    if (strings.length > 1) {
      this.printGroup({
        fg, bg, title: this.warningsTitle, values: strings, icon,
      });
    } else {
      this.print({
        fg, bg, icon, value: strings[0],
      });
    }
  }

  error(...strings) {
    const fg = 'red';
    const bg = '';
    const icon = '\u26D4';

    if (strings.length > 1) {
      this.printGroup({
        fg, bg, title: this.errorsTitle, values: strings, icon,
      });
    } else {
      this.print({
        fg, bg, icon, value: strings[0],
      });
    }
  }

  info(...strings) {
    const fg = 'blue';
    const bg = '';
    const icon = '\u2139';

    if (strings.length > 1) {
      this.printGroup({
        fg, bg, title: this.informationsTitle, values: strings, icon,
      });
    } else {
      this.print({
        fg, bg, icon, value: strings[0],
      });
    }
  }

  success(...strings) {
    const fg = 'green';
    const bg = '';
    const icon = '\u2713';

    if (strings.length > 1) {
      this.printGroup({
        fg, bg, title: this.successesTitle, values: strings, icon,
      });
    } else {
      this.print({
        fg, bg, icon, value: strings[0],
      });
    }
  }

  debug(...strings) {
    const fg = 'magenta';
    const bg = '';
    const icon = '\u1367';

    if (strings.length > 1) {
      this.printGroup({
        fg, bg, title: this.debugsTitle, values: strings, icon,
      });
    } else {
      this.print({
        fg, bg, icon, value: strings[0],
      });
    }
  }

  assert(...strings) {
    const fg = 'cyan';
    const bg = '';
    const icon = '\u0021';

    if (strings.length > 1) {
      this.printGroup({
        fg, bg, title: this.assertsTitle, values: strings, icon,
      });
    } else {
      this.print({
        fg, bg, icon, value: strings[0],
      });
    }
  }
}

export default new ConsoleLogger();

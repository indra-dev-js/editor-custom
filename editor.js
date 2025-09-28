class Editor {
  constructor(container) {
    this.editor = ace.edit('editor');

    this.langTools = ace.require('ace/ext/language_tools');
    this.editor.setOptions(this.defaultOptions());
  }

  set mode(mode) {
    this.editor.session.setMode(mode);
  }
  get currentScope() {
    return this.editor.session.$modeId;
  }
  defaultOptions() {
    return {
      theme: 'ace/theme/github_dark',
      scrollPastEnd: 0.75,
      dragEnabled: false,
      enableBasicAutocompletion: false,
      enableLiveAutocompletion: true,
      enableSnippets: true,
      cursorStyle: 'smooth',
      tabSize: 2,
      showPrintMargin: false,
      highlightActiveLine: false,
      keyboardHandler: 'ace/keyboard/sublime',
      wrap: true,
      fixedWidthGutter: true,
      keepTextAreaAtCursor: false,
    };
  }
}
class TouchCursors extends Editor {
  constructor() {
    super();
    this.editor = this.editor;
    this.renderer = this.editor.renderer;
    this.cursorLayer = this.renderer.$cursorLayer.element;
    this.container = this.editor.container; // <-- perbaikan di sini
    this.renderer.$keepTextAreaAtCursor = false;
    this.caretCursor = this.createCursor('se-caret-cursor');
    this.leftCursor = this.createCursor('se-left-cursor');
    this.rightCursor = this.createCursor('se-right-cursor');
    this.cursorText = this.buildDom(
      'div',
      {
        class: 'ace_cursor',
      },
      this.caretCursor,
    );
    this.cursorRight = this.buildDom(
      'div',
      { class: 'ace_cursor' },
      this.rightCursor,
    );
    this.cursorLeft = this.buildDom(
      'div',
      { class: 'ace_cursor' },
      this.leftCursor,
    );

    this.touching = null; // 'c' | 'l' | 'r' | null
    this.editor.selection.$cursorChanged = false;

    this.initEventListeners();
    this.updateOnRender();
    this.editor.on('blur', () => {
      this.hideCursor(this.cursorText);
    });
    this.editor.on('focus', () => {
      this.showCursor(this.cursorText);
    });
  }

  createCursor(className) {
    const el = document.createElement('div');
    el.className = className;
    el.style.position = 'absolute';
    el.style.display = 'none';
    this.cursorLayer.appendChild(el);
    return { element: el };
  }
  buildDom(name, attr = {}, parent) {
    const el = document.createElement(name ? name : 'div');
    if (arguments[1]) {
      Object.entries(attr).forEach(([prop, value]) => {
        el.setAttribute(prop, value);
      });
    }

    if (parent) parent.element.append(el);

    return { element: el };
  }
  showCursor(cursor) {
    cursor.element.style.display = 'block';
  }

  hideCursor(cursor) {
    cursor.element.style.display = 'none';
  }

  updateOnRender() {
    this.renderer.on('afterRender', () => {
      this.updateCursors();

      //  this.renderer.updateTextAreaPosition();
    });
  }

  updateCursors() {
    if (this.touching === 'c' || this.touching === 'l' || this.touching === 'r')
      return;
    const renderer = this.renderer;
    const { lineHeight } = renderer.layerConfig;
    const cursorPos = renderer.$cursorLayer.$pixelPos;
    const caretCursor = this.caretCursor.element;
    const rightCursor = this.rightCursor.element;
    const leftCursor = this.leftCursor.element;

    if (!cursorPos) return;

    // update caretCursor position
    caretCursor.style.left = cursorPos.left - 13 + 'px';
    Object.assign(this.cursorText.element.style, {
      top: `${-lineHeight}px`,
      left: 'calc(10px + 3px)',
      height: `${lineHeight}px`,
      display: 'none',
    });

    caretCursor.style.top = cursorPos.top + lineHeight + 'px';
    this.showCursor(this.caretCursor);

    // update leftCursor and rightCursor positions
    const range = this.editor.selection.getRange();
    const hasSelection = !range.isEmpty();

    if (hasSelection) {
      const leftPos = this.renderer.$cursorLayer.getPixelPosition(
        range.start,
        true,
      );

      const rightPos = this.renderer.$cursorLayer.getPixelPosition(
        range.end,
        true,
      );

      if (this.touching !== 'l') {
        leftCursor.style.left = `${leftPos.left - 28}px`;
        leftCursor.style.top = `${leftPos.top + lineHeight}px`;
        Object.assign(this.cursorLeft.element.style, {
          top: `${-lineHeight}px`,
          left: '27px',
          height: `${lineHeight}px`,
          display: 'block',
        });

        this.showCursor(this.leftCursor);
      }

      if (this.touching !== 'r') {
        rightCursor.style.left = `${rightPos.left}px`;
        rightCursor.style.top = `${rightPos.top + lineHeight}px`;
        Object.assign(this.cursorRight.element.style, {
          top: `${-lineHeight}px`,
          height: `${lineHeight}px`,
          display: 'block',
        });

        this.showCursor(this.rightCursor);
      }

      this.hideCursor(this.caretCursor);
      this.hideCursor(this.cursorText);
    } else {
      // kalau belum ada selection, jangan tampilkan handle
      this.hideCursor(this.leftCursor);
      this.hideCursor(this.cursorLeft);
      this.hideCursor(this.cursorRight);
      this.hideCursor(this.rightCursor);
    }
  }

  initEventListeners() {
    this.caretCursor.element.addEventListener(
      'touchstart',
      e => {
        e.preventDefault();
        this.touching = 'c';
      },
      { passive: false },
    );

    // Drag caret cursor
    this.caretCursor.element.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[touchmove] caret', this.touching); // ✅ debug
      if (this.touching !== 'c') return;
      const touch = e.changedTouches[0];
      if (touch) {
        // console.log('[handleCaretMove] pos', touch.clientX, touch.clientY); // ✅ debug
        this.handleCaretMove(touch.clientX, touch.clientY);
        this.showCursor(this.cursorText);
      }
    });

    this.caretCursor.element.addEventListener('touchend', e => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      if (touch) {
        this.onDragEnd(touch.clientX, touch.clientY);
      } else {
        this.onDragEnd();
      }
    });

    this.caretCursor.element.addEventListener('touchcancel', e => {
      e.preventDefault();

      if (this.touching === 'c') this.touching = null;
    });

    // Drag right cursor
    this.rightCursor.element.addEventListener(
      'touchstart',
      e => {
        e.preventDefault();
        e.stopPropagation();
        this.touching = 'r'; // Menandai bahwa drag dimulai pada right cursor
        const touch = e.touches[0];
        this.initialTouch = { x: touch.clientX, y: touch.clientY };
      },
      { passive: false },
    );

    // Drag right cursor

    this.rightCursor.element.addEventListener(
      'touchmove',
      e => {
        e.preventDefault();
        e.stopPropagation();
        if (this.touching !== 'r') return;
        if (!e.target.closest('.se-right-cursor')) return;

        const touch = e.changedTouches[0];
        if (!touch) return;

        const rect = this.renderer.$cursorLayer.element.getBoundingClientRect();
        const x = touch.clientX - rect.left - 15;
        const y = touch.clientY - rect.top - 15;
        const { lineHeight } = this.renderer.layerConfig;

        // 1️⃣ Update posisi visual bebas (handle tetap mengikuti jari)
        Object.assign(this.rightCursor.element.style, {
          top: `${y}px`,
          left: `${x}px`,
        });

        // 2️⃣ Update selection sementara jika touch di area text
        const coords = this.renderer.screenToTextCoordinates(
          touch.clientX - 20,
          touch.clientY - 0.5 * (34 + lineHeight + 20),
        );
        if (!coords) return;

        const range = this.editor.selection.getRange();
        const tempCoords = { row: coords.row, column: coords.column };

        // End tidak boleh melewati start
        if (
          tempCoords.row > range.start.row ||
          (tempCoords.row === range.start.row &&
            tempCoords.column >= range.start.column)
        ) {
          range.end = tempCoords;

          // 3️⃣ Set range dan scroll otomatis ke posisi selection akhir
          this.editor.selection.setRange(range);

          // Scroll ke end selection supaya terlihat saat drag
          this.editor.renderer.scrollCursorIntoView(range.end, 0.5);
          // sembunyikan caretleft pada saat drag cursorRight di move
          this.hideCursor(this.leftCursor);
        }
      },
      { passive: false },
    );

    // Drag left cursor
    this.leftCursor.element.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();
      if (this.touching !== 'l') return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      // const rect = this.renderer.scroller.getBoundingClientRect();
      const rect = this.renderer.$cursorLayer.element.getBoundingClientRect();
      const x = touch.clientX - rect.left - 14;
      const y = touch.clientY - rect.top - 11;
      const { lineHeight } = this.renderer.layerConfig;
      const style = this.leftCursor.element.style;
      Object.assign(style, {
        top: `${y}px`,
        left: `${x}px`,
      });

      const coords = this.renderer.screenToTextCoordinates(
        touch.clientX + 15,
        touch.clientY - 0.5 * (34 + lineHeight),
      );
      if (!coords) return;

      const range = this.editor.selection.getRange();
      const tempCoords = { row: coords.row, column: coords.column };
      // Start tidak boleh melewati end
      if (
        tempCoords.row < range.end.row ||
        (tempCoords.row === range.end.row &&
          tempCoords.column <= range.end.column)
      ) {
        range.start = tempCoords;
        this.editor.selection.setRange(range);
        // Scroll ke end selection supaya terlihat saat drag
        this.editor.renderer.scrollCursorIntoView(range.start, 0.5);
        // sembunyikan caretright pada saat drag cursorLeft di move
        this.hideCursor(this.rightCursor);
      }
    });

    // touchend → kembalikan handle ke posisi selection valid
    const resetHandlePosition = () => {
      const range = this.editor.selection.getRange();
      this.syncHandleToCaret(range);
    };

    this.leftCursor.element.addEventListener('touchend', e => {
      e.preventDefault();
      this.touching = null;
      resetHandlePosition();
    });

    this.rightCursor.element.addEventListener('touchend', e => {
      e.preventDefault();
      if (this.touching === 'r') this.touching = null;
      const touch = e.changedTouches[0];
      if (touch) this.onDragEnd(touch.clientX, touch.clientY);
      this.hideCursor(this.caretCursor);
      this.hideCursor(this.cursorText);
    });

    this.rightCursor.element.addEventListener('touchcancel', e => {
      e.preventDefault();
      if (this.touching === 'r') this.touching = null;
    });

    // Drag left cursor
    this.leftCursor.element.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      this.touching = 'l'; // Menandai bahwa drag dimulai pada left cursor
      const touch = e.touches[0];
      this.initialTouch = { x: touch.clientX, y: touch.clientY };
      // ⬇ tambahan
      const pos = this.leftCursor.getPosition
        ? this.leftCursor.getPosition()
        : this.editor.renderer.screenToTextCoordinates(
            this.leftCursor.element.offsetLeft,
            this.leftCursor.element.offsetTop,
          );
    });

    this.leftCursor.element.addEventListener('touchend', e => {
      e.preventDefault();
      if (this.touching === 'l') this.touching = null;
      const touch = e.changedTouches[0];
      if (touch) this.onDragEnd(touch.clientX, touch.clientY);
      this.hideCursor(this.caretCursor);
      this.hideCursor(this.cursorText);
    });

    this.leftCursor.element.addEventListener('touchcancel', e => {
      e.preventDefault();
      if (this.touching === 'l') this.touching = null;
    });

    let lastT = 0;
    let startX,
      startY,
      touchStartT = 0;
    let clickCount = 0;

    // --- Matikan drag select default Ace ---

    this.container.addEventListener('touchstart', e => {
      const touches = e.touches;
      if (!touches || touches.length > 1) return; // ignore multi-touch

      //e.preventDefault();
      //e.stopPropagation();

      const touch = touches[0];
      const { lineHeight: h } = this.editor.renderer.layerConfig;

      const t = e.timeStamp;

      // Reset clickCount jika jarak terlalu jauh (swipe)
      if (
        Math.abs(startX - touch.clientX) + Math.abs(startY - touch.clientY) >
        h
      ) {
        touchStartT = -1;
        clickCount = 0;
      }

      startX = touch.clientX;
      startY = touch.clientY;

      // Deteksi double tap
      if (t - touchStartT < 300 && touches.length === 1) {
        clickCount++;
        e.button = 0;

        // Panggil handler double tap
        this.onDoubleTap(e);

        // Reset waktu untuk tap berikutnya
        touchStartT = 0;
      } else {
        clickCount = 0;
        touchStartT = t;
      }

      lastT = t;
    });

    this.editor.on('blur', () => {
      this.hideCursor(this.caretCursor);
      this.hideCursor(this.leftCursor);
      this.hideCursor(this.rightCursor);
      this.touching = null;
    });

    this.editor.on('focus', () => {
      setTimeout(() => this.updateCursors(), 1);
    });
  }

  // ---  onDoubleTap ---

  _clientToRendererCoords(clientX, clientY) {
    // Ambil posisi bounding editor di layar
    const rect = this.container.getBoundingClientRect();

    // Konversi posisi touch → relatif ke editor
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    return { x, y };
  }

  getTouchPos(e) {
    // Ambil touch pertama
    const touch = e.touches[0];

    // Patch posisi biar MouseEvent Ace ngerti
    e.clientX = touch.clientX;
    e.clientY = touch.clientY;

    // Gunakan MouseEvent dari Ace
    const MouseEvent = ace.require('ace/mouse/mouse_event').MouseEvent;

    const ev = new MouseEvent(e, this.editor);

    // Ambil posisi dokumen (row, column)
    return ev.getDocumentPosition();
  }

  onDoubleTap(e) {
    const pos = this.getTouchPos(e);
    const selection = this.editor.selection;

    // Pindah cursor ke posisi tap
    selection.moveToPosition(pos);

    // Pilih satu kata
    selection.selectWord();
    this.hideCursor(this.caretCursor);
    // Scroll biar kelihatan
    this.editor.renderer.scrollCursorIntoView(pos);
  }

  onDragEnd(clientX, clientY) {
    // Simpan handle yang sedang di-drag
    const active = this.touching;
    this.touching = null;

    if (clientX !== undefined && clientY !== undefined) {
      // Dapatkan koordinat valid dalam text
      const coords = this.renderer.screenToTextCoordinates(clientX, clientY);

      if (coords) {
        const range = this.editor.selection.getRange();

        if (active === 'r') {
          // Update end selection
          if (
            coords.row > range.start.row ||
            (coords.row === range.start.row &&
              coords.column >= range.start.column)
          ) {
            range.end = coords;
          }
        } else if (active === 'l') {
          // Update start selection
          if (
            coords.row < range.end.row ||
            (coords.row === range.end.row && coords.column <= range.end.column)
          ) {
            range.start = coords;
          }
        }

        // Terapkan range
        this.editor.selection.setRange(range);

        // Kembalikan handle ke posisi valid
        this.syncHandleToCaret(range);
      } else {
        // Jika drag keluar area text, kembalikan handle ke posisi terakhir valid
        const range = this.editor.selection.getRange();
        this.syncHandleToCaret(range);
      }
    }

    // Update posisi visual left/right
    this.updateCursors();

    // caretCursor tetap terlihat
    this.showCursor(this.caretCursor);
  }

  handleCaretMove(clientX, clientY) {
    const rect = this.renderer.$cursorLayer.element.getBoundingClientRect();
    const { lineHeight } = this.renderer.layerConfig;
    //indra
    // Offset agar caret tepat di posisi sentuh
    const x = clientX - rect.left - 14 + 1;
    const y = clientY - rect.top - 17;

    // Update style caret element (water drop)
    this.caretCursor.element.style.left = x + 'px';
    this.caretCursor.element.style.top = y + 'px';

    // Hitung posisi text berdasarkan offset yang disesuaikan
    const coords = this.renderer.screenToTextCoordinates(
      clientX + 1,
      clientY - 0.5 * (34 + lineHeight),
    );

    if (coords) {
      this.editor.moveCursorTo(coords.row, coords.column);
      this.editor.selection.clearSelection();
      // ⚡ Auto scroll biar caret selalu kelihatan
      this.editor.renderer.scrollCursorIntoView(
        { row: coords.row, column: coords.column },
        0.5, // margin (optional) → 0.5 artinya jaga di tengah layar
      );

      this.updateCursors();
    }
  }

  syncHandleToCaret(range) {
    const renderer = this.renderer;
    renderer.$cursorLayer.getPixelPosition(range.start, true);
    this.showCursor(this.leftCursor);
    renderer.$cursorLayer.getPixelPosition(range.end, true);
    this.showCursor(this.rightCursor);

    this.hideCursor(this.caretCursor);
  }
}
Editor.prototype.updateEditorMaxLines = function updateEditorMaxLines() {
  console.warn(this.editor); //ada container

  const parent = this.editor.container.parentElement;
  if (!parent) return;
  this.editor.resize(true);
  const parentHeight = parent.clientHeight;
  const lineHeight = this.editor.renderer.lineHeight;
  const lines = Math.floor(parentHeight / lineHeight);
  this.editor.setOptions({ minLines: lines });
  this.editor.resize(true);
};
Editor.prototype.setFontSize = function setFontSize(size) {
  this.editor.setFontSize(size || 14);
  this.editor.resize(true);
  this.updateEditorMaxLines();
};
var ternWorker = new Worker('tern-worker.js');
// masukkan ternCompleter ke prototype
Editor.prototype.ternCompleter = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    const cursor = editor.getCursorPosition();
    const end = editor.session.doc.positionToIndex(cursor);
    const line = session.getLine(pos.row);
    if (line.slice(0, pos.column).match(/('|")/)) return callback(null, []);
    function handleMsg(e) {
      if (!e.data) return;
      const resp = e.data;
      if (resp.completions) {
        const completions = resp.completions
          .filter(c => c.name)
          .map(c => {
            console.log(c.type);

            let item = {
              value: c.name,
              meta: 'tern', // ngk perlu
              score: 20000,
            };
            const code = editor.getValue();
            if (c.type?.startsWith('fn(')) {
              if (new RegExp(`\\bclass\\s+${c.name}\\b`).test(code)) {
                item.type = 'class'; // benar-benar class user
              } else {
                item.type = 'function';
              }
            } else if (
              c.type === '?' ||
              c.type === '<top>' ||
              c.type.startsWith('Document') ||
              c.type.startsWith('Array')
            ) {
              item.type = 'property';
            } else if (c.type.startsWith('bool')) {
              item.type = 'keyword';
            } else {
              item.type = 'property'; // fallback default
            }
            console.log(c);
            return item;
          });
        callback(null, completions);
      }
      ternWorker.removeEventListener('message', handleMsg);
    }
    ternWorker.addEventListener('message', handleMsg);

    ternWorker.postMessage({
      type: 'completion',
      code: editor.getValue(),
      pos: end,
    });
  },
};

// init tooltip -> taruh di prototype juga
Editor.prototype.initTernTooltip = function initTernTooltip() {
  const editor = this.editor;
  let tooltip = editor.container.querySelector('.ace_tooltip');

  function hideTooltip() {
    if (tooltip) {
      tooltip.style.display = 'none';
      tooltip.innerHTML = '';
    }
  }

  // sembunyikan tooltip saat cursor pindah
  editor.selection.on('changeCursor', hideTooltip);

  // listen perubahan text
  editor.getSession().on('change', e => {
    const code = editor.getValue();
    const cursor = editor.getCursorPosition();
    const line = editor.session.getLine(cursor.row);

    if (!line.includes(')')) return hideTooltip();
    const end = editor.session.doc.positionToIndex(cursor);

    function handleTooltip(e) {
      const t = e.data.tooltip;
      if (!t || !t.exprName) return hideTooltip();

      const curPos = editor.getCursorPosition();
      const line = editor.session.getLine(curPos.row);
      if (!line.includes(')')) return hideTooltip();

      const funcName = t.exprName;
      const info = t.doc || t.type || '';

      tooltip.innerHTML = info.replace(
        new RegExp(`\\b${funcName}\\b`, 'g'),
        `<span style="color:#e06c6b;font-weight:bold">${funcName}</span>`,
      );

      const coords = editor.renderer.textToScreenCoordinates(
        curPos.row,
        curPos.column,
      );
      tooltip.style.left = coords.pageX + 'px';
      tooltip.style.top = coords.pageY + 30 + 'px';
      tooltip.style.display = 'block';

      ternWorker.removeEventListener('message', handleTooltip);
    }

    ternWorker.addEventListener('message', handleTooltip, { once: true });

    ternWorker.postMessage({ type: 'addFile', name: 'file1.js', text: code });
    ternWorker.postMessage({ type: 'tooltip', code: code, pos: end });
  });
};

Editor.prototype.autocomplete = {
  register: function register(val) {
    this.langTools = ace.require('ace/ext/language_tools');

    this.langTools.setCompleters(val);
  },
};

Editor.prototype.init = function init(options = {}) {
  this.editor.setOptions(this.defaultOptions());
  this.mode = BranchModeJs.mode();

  this.autocomplete.register([
    this.keywordCompleter,
    this.customsnippet,
    this.autocompleteNativejs,
    this.keywordJs,
    this.bebekComplete,
    this.ternCompleter,
  ]);
  this.initTernTooltip();
  window.addEventListener('resize', () => this.updateEditorMaxLines());
};

Editor.prototype.touchCursors = new TouchCursors();

Editor.prototype.customsnippet = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    if (!editor.session.$modeId.includes('javascript'))
      return callback(null, []);

    const line = session.getLine(pos.row);
    const startCol = pos.column - prefix.length;
    const charBefore = startCol > 0 ? line[startCol - 1] : null;

    // ❌ Jangan muncul jika prefix diawali titik
    if (charBefore === '.' || /('|")/.test(line.slice(0, pos.column)))
      return callback(null, []);

    const snippets = [
      {
        caption: 'cl',
        snippet: 'console.log(${0})',
        meta: 'log',
        score: 99999,
      },
      {
        caption: 'cw',
        snippet: 'console.warn(${0})',
        meta: 'warn',
        score: 99999,
      },
      {
        caption: 'ce',
        snippet: 'console.error(${0})',
        meta: 'error',
        score: 99999,
      },
      {
        caption: 'cd',
        snippet: 'console.debug(${0})',
        meta: 'debug',
        score: 99999,
      },
    ];

    const filtered = snippets.filter(c => c.caption.startsWith(prefix));
    callback(null, filtered);
  },
};

Editor.prototype.keywordCompleter = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    // keyword dipisah pakai "|"
    const keywords =
      'if|else|class|function|new|return|var|let|const|try|catch|finally|throw|switch|case|break|continue|for|while|do|import|export|default|async|await|typeof|instanceof|delete|in|of|with|void|yield';
    const keywordList = keywords.split('|');
    const line = session.getLine(pos.row);
    if (line.slice(0, pos.column).match(/('|")/)) return callback(null, []);
    if (!prefix) return callback(null, []);

    // filter keyword berdasarkan prefix
    const matches = keywordList.filter(kw => kw.startsWith(prefix));

    // mapping ke format Ace
    const completions = matches.map(kw => ({
      caption: kw,
      value: kw,
      meta: kw,
      score: 15000, // tinggi biar nongol duluan
    }));

    callback(null, completions);
  },
};

Editor.prototype.autocompleteNativejs = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    // console.log("=== autocompleteNativejs start ===");

    const line = session.getLine(pos.row);

    // Dapatkan konten penuh dari editor
    const fullContent = session.getValue();
    console.log(fullContent);
    // Uji keberadaan arguments

    const domEvents = [
      'click',
      'dblclick',
      'mousedown',
      'mouseup',
      'mousemove',
      'mouseenter',
      'mouseleave',
      'keydown',
      'keyup',
      'keypress',
      'touchstart',
      'touchend',
      'touchmove',
    ];

    // ✅ case 1: tanpa string → kasih quoted
    const ifEventNoString =
      /(addEventListener|removeEventListener)\s*\(\s*([A-Za-z]*)$/;

    // ✅ case 2: sudah dalam string → kasih plain
    const ifEventWithString =
      /(addEventListener|removeEventListener)\s*\(\s*(['"])([^'"]*)$/;

    const codeBefore = line.slice(0, pos.column);
    let matchNoStr = ifEventNoString.exec(codeBefore);
    if (matchNoStr) {
      const prefix = matchNoStr[2] || '';

      const completions = domEvents.map(event => ({
        caption: `"${event}"`,
        value: `"${event}"`,
        meta: 'event',
        score: event.startsWith(prefix) ? 500000 : 200000,
        type: 'constant',
      }));

      return callback(null, completions, prefix); // ⚡ tambahkan prefix sebagai arg ketiga
    }

    // --- ada string → kasih plain
    if (ifEventWithString.test(codeBefore)) {
      return callback(
        null,
        domEvents.map(event => ({
          caption: event,
          value: event,
          meta: 'event',
          score: 250000,
          type: 'constant',
        })),
      );
    } else {
      return callback(null, []);
    }
  },
};

Editor.prototype.bebekComplete = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    const line = session.getLine(pos.row);
    const before = line.slice(0, pos.column);
    console.log(before);
    const ignore = /(?:^|\s)\./; // cega jika hanya . tanpa awalan
    //callback ke null, [] jika ighnore match
    if (ignore.test(before)) return callback(null, []);
    else if (/('|")/.test(before)) return callback(null, []);

    // cek dot sederhana
    const match = before.match(/([\w\.]+)\.$/);

    // cek apakah lagi di dalam tanda kurung -> reset
    const insideParen = /\(.*$/.test(before);

    // ambil segmen terakhir setelah ( atau , atau spasi
    const exprBefore = before.split(/[\(\,\{\s]/).pop();

    // cari ekspresi dot terakhir
    const beforeDotMatch =
      exprBefore.match(/([\w\.]+)\.$/) || exprBefore.match(/([\w\.]+)\./);

    // if (beforeDotMatch === null) return callback(null, []);

    let obj;

    if (!beforeDotMatch) {
      // fallback: ambil global object
      obj =
        typeof window !== 'undefined'
          ? window
          : typeof self !== 'undefined'
          ? self
          : typeof globalThis !== 'undefined'
          ? globalThis
          : {};
    } else {
      console.log(beforeDotMatch);
      const path = beforeDotMatch[1].split('.');
      if (path[0] === '') return callback(null, []);

      let currentObj =
        typeof window !== 'undefined' ? window : globalThis || {};

      // telusuri chain path (misal: Object.keys)
      for (let i = 0; i < path.length; i++) {
        const key = path[i];
        if (Object.prototype.hasOwnProperty.call(currentObj, key)) {
          currentObj = currentObj[key];
        } else {
          currentObj = null;
          break;
        }
      }
      obj = currentObj; // hasil akhir

      // ⚡ special case agar lebih stabil
      const last = path[path.length - 1];

      switch (last) {
        case 'Object':
          obj = Object;
          break;
        case 'Array':
          obj = Array;
          break;
        case 'console':
          obj = console;
          break;
        case 'window':
          obj = window ? window : globalThis;
          break;
        case 'document':
          obj = document;
          break;
        case 'Window':
          obj = Window;
          break;
      }
    }

    // helper: tentukan tipe native
    function getNativeType(val) {
      try {
        if (val === null) return 'null';
        if (Array.isArray(val)) return 'array';
        if (val === Object) return 'object'; // override
        if (typeof val === 'function') return 'function';
        if (typeof val === 'object') return 'object';
        return 'property'; // string, number, boolean, ...
      } catch {
        return 'unknown';
      }
    }

    // list penting biar naik di prioritas
    const important = new Set([
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'clearInterval',
      'fetch',
      'alert',
      'addEventListener',
      'removeEventListener',
      'console',
      'document',
      'navigator',
      'location',
      'indexedDB',
      'focus',
      'blur',
      'open',
      'Worker',
      'this',
    ]);
    if (typeof window === 'undefined' || typeof this === 'undefined') {
      important.add('globalThis');
    } else important.add('window');
    // generate daftar properti
    const props = getAllProps(obj)
      .filter(n => !/^(__.*__$|constructor$|callee$|__proto__$)/.test(n))
      .map(name => {
        const item = {
          caption: name,
          value: name,
          meta: '',
          score: important.has(name) ? 20000 : 10000, // prioritas
        };
        try {
          item.type = getNativeType(obj[name]);
        } catch (error) {}
        return item;
      });

    callback(null, props);
  },
};

Editor.prototype.keywordJs = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    const fullContent = session.getValue();
    const cursorIndex = session.doc.positionToIndex(pos);

    // regex untuk ambil semua function dan body-nya
    const functionRegex =
      /function\s*[a-zA-Z0-9_$]*\s*\(([\s\S]*?)\)\s*\{([\s\S]*?)\}/g;
    let match;
    const line = session.getLine(pos.row);
    while ((match = functionRegex.exec(fullContent)) !== null) {
      const bodyStart = match.index + match[0].indexOf('{') + 1;
      const bodyEnd = match.index + match[0].lastIndexOf('}');

      // cek apakah cursor berada di dalam body function
      if (cursorIndex >= bodyStart && cursorIndex <= bodyEnd) {
        console.log(line);
        // if (line.slice(0, pos.column))
        // tampilkan arguments
        return callback(null, [
          {
            meta: 'keyword',
            caption: 'arguments',
            value: 'arguments',
            score: 10000000000,
          },
        ]);
      }
    }

    // jika tidak ada function valid, kosongkan autocomplete
    return callback(null, []);
  },
  id: 'keywordCompleter',
};

function getAllProps(obj) {
  const props = new Set();
  let current = obj;
  while (current) {
    Object.getOwnPropertyNames(current).forEach(p => props.add(p));
    current = Object.getPrototypeOf(current);
  }
  return [...props];
}

const app = new Editor();

app.init();

app.setFontSize(16);

// app.$add.completer(objectCompleter);

// addValue('http://127.0.0.1:5500/editor.js');

// async function addValue(url = '') {
//   try {
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.text();
//     editor.setValue(data, -1);
//   } catch (e) {
//     console.error('Error fetching data:', e);
//   }
// }
// // editor.setOptions(defaultSettings);

// const objectCompleter = {
//   getCompletions: function (editor, session, pos, prefix, callback) {
//     const langTools = ace.require('ace/ext/language_tools');
//     const scope = session.$modeId;
//     const line = session.getLine(pos.row);
//     const before = line.slice(0, pos.column);
//     const match = before.match(/([\w\.]+)\.$/);

//     function customCompleterJs() {
//       if (!match) {
//         // fallback ke bawaan Ace (keyword, snippet, text)
//         return langTools.keyWordCompleter.getCompletions(
//           editor,
//           session,
//           pos,
//           prefix,
//           callback,
//         );
//         // }
//         return callback(null, []);
//       }

//       const path = match[1].split('.');
//       let obj = window;

//       for (let i = 0; i < path.length; i++) {
//         if (obj && path[i] in obj) {
//           obj = obj[path[i]];
//         } else {
//           obj = null;
//           break;
//         }
//       }

//       if (!obj) return callback(null, []);

//       const props = getAllProps(obj).filter(
//         name => !/^(__.*__$|prototype$|constructor$)/.test(name),
//       );

//       const list = props.map(name => {
//         let meta = 'property';
//         try {
//           if (typeof obj[name] === 'function') {
//           }
//         } catch (e) {
//           // jangan error kalau properti tidak bisa diakses
//         }
//         return {
//           caption: name,
//           value: name,
//           meta,
//           score: 9999,
//         };
//       });
//       callback(null, list);
//     }
//     if (scope.includes('javascript')) customCompleterJs();
//   },
// };

// const langTools = ace.require('ace/ext/language_tools');
// // langTools.setCompleters([]); // kosongkan dulu
// // langTools.setCompleters([objectCompleter]); // jangan di ganggu yang ini <--
// const customCompleter = {
//   getCompletions: function (editor, session, pos, prefix, callback) {
//     const line = session.getLine(pos.row).slice(0, pos.column);
//     // Regex kasar untuk mendeteksi:
//     // 1. Setelah 'function ' -> menulis nama fungsi
//     // 2. Di dalam kurung () setelah function -> menulis parameter
//     const insideFunctionName = /function\s+[a-zA-Z_$][\w$]*?$/.test(line);
//     const insideFunctionParams = /function\s+[a-zA-Z_$][\w$]*\([^)]*$/.test(
//       line,
//     );

//     if (insideFunctionName || insideFunctionParams) {
//       // jangan tampilkan snippet atau saran Ace bawaan
//       return callback(null, []);
//     }
//     const customWords = [
//       {
//         caption: 'cl',
//         snippet: 'console.log(${1})${2}', // langsung jadi console.
//         meta: 'snippet',
//         type: 'snippet',
//         score: 99999,
//       },
//       {
//         caption: 'cw',
//         snippet: 'console.warn(${1})${2}',
//         meta: 'snippet',
//         type: 'snippet',
//       },
//       {
//         caption: 'ce',
//         snippet: 'console.error(${1})${2}',
//         meta: 'snippet',
//         type: 'snippet',
//       },
//       {
//         caption: 'fun',
//         snippet: 'function ${1}(${2}) {\n${3}\n}',
//         meta: 'snippet',
//         type: 'snippet',
//       },
//     ];

//     const filtered = customWords.filter(c => c.caption.startsWith(prefix));
//     callback(null, filtered);
//   },
// };
// // langTools.setCompleters([]); // kosongkan dulu

// // Hanya pakai completer custom ini
// langTools.setCompleters([
//   objectCompleter,
//   customCompleter, // jangan di ganggu yang ini <--
// ]);

// editor.setOptions({
//   enableBasicAutocompletion: true,
//   enableLiveAutocompletion: true,
// });

// var ternWorker = new Worker('tern-worker.js');

// var ternCompleter = {
//   getCompletions: function (editor, session, pos, prefix, callback) {
//     // Konversi posisi cursor ke Tern format
//     var cursor = editor.getCursorPosition();
//     var end = editor.session.doc.positionToIndex(cursor);

//     // listen response sekali
//     function handleMsg(e) {
//       if (!e.data) return;
//       const resp = e.data;
//       if (resp.completions) {
//         const completions = resp.completions
//           .filter(c => c.name) // buang yang tidak ada name
//           .map(c => ({
//             value: c.name,
//             meta: c.type || 'tern',
//           }));
//         callback(null, completions);
//       }
//       ternWorker.removeEventListener('message', handleMsg);
//     }
//     ternWorker.addEventListener('message', handleMsg);

//     // kirim request ke worker
//     ternWorker.postMessage({
//       type: 'completion',
//       code: editor.getValue(),
//       pos: end,
//     });
//   },
// };

// // global reference tooltip bawaan Ace
// let tooltip = editor.container.querySelector('.ace_tooltip');
// let tooltipHideTimeout = null;
// function hideTooltip() {
//   if (tooltip) {
//     //bagian sini jika gw remove bisa hilang tapi tooltip yang di () hilang, dan jika hanya innerHtml = '' itu ngk membuathkan hasil
//     tooltip.style.display = 'none';
//     tooltip.innerHTML = '';
//   }
// }

// // hide tooltip otomatis saat cursor bergerak
// editor.selection.on('changeCursor', hideTooltip);
// // editor.getSession().on('change', hideTooltip);

// // event untuk ) baru
// editor.getSession().on('change', function (e) {
//   const code = editor.getValue();
//   const cursor = editor.getCursorPosition();
//   const line = editor.session.getLine(cursor.row);

//   // hide tooltip kalau line tidak ada ')'
//   if (!line.includes(')')) return hideTooltip();

//   const end = editor.session.doc.positionToIndex(cursor);

//   function handleTooltip(e) {
//     const t = e.data.tooltip;
//     if (!t || !t.exprName) return hideTooltip();

//     // cek posisi cursor sekarang
//     const curPos = editor.getCursorPosition();
//     const line = editor.session.getLine(curPos.row);
//     if (!line.includes(')')) return hideTooltip(); // kalau cursor udah pindah, jangan tampilkan

//     const funcName = t.exprName;
//     const info = t.doc || t.type || '';

//     tooltip.innerHTML = info.replace(
//       new RegExp(`\\b${funcName}\\b`, 'g'),
//       `<span style="color:#e06c6b;font-weight:bold">${funcName}</span>`,
//     );

//     const coords = editor.renderer.textToScreenCoordinates(
//       curPos.row,
//       curPos.column,
//     );
//     tooltip.style.left = coords.pageX + 'px';
//     tooltip.style.top = coords.pageY + 30 + 'px';
//     tooltip.style.display = 'block';

//     ternWorker.removeEventListener('message', handleTooltip);
//   }

//   ternWorker.addEventListener('message', handleTooltip, { once: true });

//   // add file dulu kalau perlu
//   ternWorker.postMessage({
//     type: 'addFile',
//     name: 'file1.js',
//     text: code,
//   });

//   // baru request tooltip
//   ternWorker.postMessage({
//     type: 'tooltip',
//     code: code,
//     pos: end,
//   });
// });

// // global reference ke tooltip aktif
// let activeTooltip = null;
// editor.selection.on('changeCursor', function () {
//   const tooltip = editor.container.querySelector('.ace_tooltip');
//   if (tooltip) tooltip.style.display = 'none';
// });

// // 1️⃣ Daftar event DOM
// const domEvents = [
//   'click',
//   'dblclick',
//   'mousedown',
//   'mouseup',
//   'mousemove',
//   'mouseenter',
//   'mouseleave',
//   'keydown',
//   'keyup',
//   'keypress',
//   'touchstart',
//   'touchend',
//   'touchmove',
// ];

// // 2️⃣ Custom completer
// const eventCompleter = {
//   getCompletions: function (editor, session, pos, prefix, callback) {
//     const line = session.getLine(pos.row);
//     const col = pos.column;

//     // 🔥 Regex: deteksi cursor di dalam parameter pertama addEventListener
//     // match addEventListener("...cursor..."   atau addEventListener('...cursor...'
//     const regex = /addEventListener\s*\(\s*(['"])([^'"]*)$/;
//     const match = line.slice(0, col).match(regex);

//     if (match) {
//       // cursor ada di dalam string parameter pertama
//       callback(
//         null,
//         domEvents.map(e => ({
//           caption: e,
//           value: e,
//           // meta: "DOM Event",

//           score: 9999,
//         })),
//       );
//     } else {
//       callback(null, []); // di luar string, autocomplete tidak muncul
//     }
//   },
// };
// langTools.addCompleter(eventCompleter);
// langTools.addCompleter(ternCompleter);

// // === kunci biar popup muncul setelah titik ===
// editor.commands.on('afterExec', function (e) {
//   if (e.command.name === 'insertstring' && e.args === '.') {
//     editor.execCommand('startAutocomplete');
//   }
// });

// // load file contoh

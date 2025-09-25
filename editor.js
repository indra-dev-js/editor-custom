const editor = ace.edit('editor');
class Editor {
  constructor(container) {
    this.container = container || null
    this.defaultOptions(this)
    this.name = "er"
  }
  defaultOptions() {
    
  }
  

}


editor.renderer.$keepTextAreaAtCursor = false;

editor.renderer.setAnimatedScroll(false);
editor.setOptions({
  hScrollBarAlwaysVisible: false,
  vScrollBarAlwaysVisible: false,
  highlightActiveLine: true,
  highlightGutterLine: true
});

class TouchCursors {
  constructor(editor, options = {}) {
    this.editor = editor;
    this.renderer = editor.renderer;
    this.cursorLayer = this.renderer.$cursorLayer.element;
    this.container = editor.container; // <-- perbaikan di sini
    this.keepTextAreaAtCursor = !options.keepTextAreaAtCursor || false;

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

    this.rightCursor.element.addEventListener('touchmove', e => {
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
    });

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
// Editor.prototype.$touchCursor = new TouchCursors("")
// Inisialisasi dan aktifkan TouchCursors pada editor Ace Anda
const touchCursors = new TouchCursors(editor, { keepTextAreaAtCursor: false });
const ee = new Editor()

// Sembunyikan cursor saat editor blur
editor.on('blur', () => {
  touchCursors.hideCursor(touchCursors.caretCursor);
  touchCursors.hideCursor(touchCursors.leftCursor);
  touchCursors.hideCursor(touchCursors.rightCursor);
});
editor.on('focus', () => {
  touchCursors.showCursor(touchCursors.caretCursor);
  touchCursors.showCursor(touchCursors.leftCursor);
  touchCursors.showCursor(touchCursors.rightCursor);
});

editor.session.setMode(BranchModeHtml.mode());
addValue('http://127.0.0.1:5500/editor.html'|| 'http://localhost:7700/');
//const editor ada di atas
const defaultSettings = {
  //mode: 'ace/mode/javascript',
  theme: 'ace/theme/github_dark',
  scrollPastEnd: 0.75,
  dragEnabled: false,
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  enableSnippets: false,
  cursorStyle: 'smooth',
  tabSize: 2,
  showPrintMargin: false,
  highlightActiveLine: false,
  keyboardHandler: 'ace/keyboard/sublime',
  wrap: true,
  fixedWidthGutter: true,
};
editor.setOptions(defaultSettings);

const langTools = ace.require('ace/ext/language_tools');

function getAllProps(obj) {
  const props = new Set();
  let current = obj;
  while (current) {
    Object.getOwnPropertyNames(current).forEach(p => props.add(p));
    current = Object.getPrototypeOf(current);
  }
  return [...props];
}

const objectCompleter = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    const line = session.getLine(pos.row);
    const before = line.slice(0, pos.column);
    const match = before.match(/([\w\.]+)\.$/);
    console.log(prefix);
    if (!match) {
      // fallback ke bawaan Ace (keyword, snippet, text)
      return langTools.keyWordCompleter.getCompletions(
        editor,
        session,
        pos,
        prefix,
        callback,
      );
      // }
      // return callback(null, []);
    }

    const path = match[1].split('.');
    let obj = window;

    for (let i = 0; i < path.length; i++) {
      if (obj && path[i] in obj) {
        obj = obj[path[i]];
      } else {
        obj = null;
        break;
      }
    }

    if (!obj) return callback(null, []);

    const props = getAllProps(obj).filter(
      name => !/^(__.*__$|prototype$|constructor$)/.test(name),
    );

    const list = props.map(name => {
      let meta = 'property';
      try {
        if (typeof obj[name] === 'function') {
          meta = 'method';
        }
      } catch (e) {
        // properti terlarang → biarin aja jadi property
        meta = 'property';
      }
      return {
        caption: name,
        value: name,
        meta,
        score: 9999,
      };
    });
    callback(null, list);
  },
};

const customCompleter = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    const line = session.getLine(pos.row).slice(0, pos.column);
    // Regex kasar untuk mendeteksi:
    // 1. Setelah 'function ' -> menulis nama fungsi
    // 2. Di dalam kurung () setelah function -> menulis parameter
    const insideFunctionName = /function\s+[a-zA-Z_$][\w$]*?$/.test(line);
    const insideFunctionParams = /function\s+[a-zA-Z_$][\w$]*\([^)]*$/.test(
      line,
    );

    if (insideFunctionName || insideFunctionParams) {
      // jangan tampilkan snippet atau saran Ace bawaan
      return callback(null, []);
    }
    const customWords = [
      {
        caption: 'cl',
        snippet: 'console.log(${1})${2}', // langsung jadi console.
        meta: 'snippet',
        type: 'snippet',
        score: 99999,
      },
      {
        caption: 'cw',
        snippet: 'console.warn(${1})${2}',
        meta: 'snippet',
        type: 'snippet',
      },
      {
        caption: 'ce',
        snippet: 'console.error(${1})${2}',
        meta: 'snippet',
        type: 'snippet',
      },
      {
        caption: 'fun',
        snippet: 'function ${1}(${2}) {\n${3}\n}',
        meta: 'snippet',
        type: 'snippet',
      },
    ];

    const filtered = customWords.filter(c => c.caption.startsWith(prefix));
    callback(null, filtered);
  },
};
// langTools.setCompleters([]); // kosongkan dulu

// Hanya pakai completer custom ini
langTools.setCompleters([
  objectCompleter,
  customCompleter, // jangan di ganggu yang ini <--
]);

editor.setOptions({
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
});

var ternWorker = new Worker('tern-worker.js');

var ternCompleter = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    // Konversi posisi cursor ke Tern format
    var cursor = editor.getCursorPosition();
    var end = editor.session.doc.positionToIndex(cursor);

    // listen response sekali
    function handleMsg(e) {
      if (!e.data) return;
      const resp = e.data;
      if (resp.completions) {
        const completions = resp.completions
          .filter(c => c.name) // buang yang tidak ada name
          .map(c => ({
            value: c.name,
            meta: c.type || 'tern',
          }));
        callback(null, completions);
      }
      ternWorker.removeEventListener('message', handleMsg);
    }
    ternWorker.addEventListener('message', handleMsg);

    // kirim request ke worker
    ternWorker.postMessage({
      type: 'completion',
      code: editor.getValue(),
      pos: end,
    });
  },
};

// global reference tooltip bawaan Ace
let tooltip = editor.container.querySelector('.ace_tooltip');
let tooltipHideTimeout = null;
function hideTooltip() {
  if (tooltip) {
    //bagian sini jika gw remove bisa hilang tapi tooltip yang di () hilang, dan jika hanya innerHtml = '' itu ngk membuathkan hasil
    tooltip.style.display = 'none';
    tooltip.innerHTML = '';
  }
}

// hide tooltip otomatis saat cursor bergerak
editor.selection.on('changeCursor', hideTooltip);
// editor.getSession().on('change', hideTooltip);

// event untuk ) baru
editor.getSession().on('change', function (e) {
  const code = editor.getValue();
  const cursor = editor.getCursorPosition();
  const line = editor.session.getLine(cursor.row);

  // hide tooltip kalau line tidak ada ')'
  if (!line.includes(')')) return hideTooltip();

  const end = editor.session.doc.positionToIndex(cursor);

  function handleTooltip(e) {
    const t = e.data.tooltip;
    if (!t || !t.exprName) return hideTooltip();

    // cek posisi cursor sekarang
    const curPos = editor.getCursorPosition();
    const line = editor.session.getLine(curPos.row);
    if (!line.includes(')')) return hideTooltip(); // kalau cursor udah pindah, jangan tampilkan

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

  // add file dulu kalau perlu
  ternWorker.postMessage({
    type: 'addFile',
    name: 'file1.js',
    text: code,
  });

  // baru request tooltip
  ternWorker.postMessage({
    type: 'tooltip',
    code: code,
    pos: end,
  });
});

// global reference ke tooltip aktif
let activeTooltip = null;
editor.selection.on('changeCursor', function () {
  const tooltip = editor.container.querySelector('.ace_tooltip');
  if (tooltip) tooltip.style.display = 'none';
});

// 1️⃣ Daftar event DOM
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

// 2️⃣ Custom completer
const eventCompleter = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    const line = session.getLine(pos.row);
    const col = pos.column;

    // 🔥 Regex: deteksi cursor di dalam parameter pertama addEventListener
    // match addEventListener("...cursor..."   atau addEventListener('...cursor...'
    const regex = /addEventListener\s*\(\s*(['"])([^'"]*)$/;
    const match = line.slice(0, col).match(regex);

    if (match) {
      // cursor ada di dalam string parameter pertama
      callback(
        null,
        domEvents.map(e => ({
          caption: e,
          value: e,
          // meta: "DOM Event",

          score: 9999,
        })),
      );
    } else {
      callback(null, []); // di luar string, autocomplete tidak muncul
    }
  },
};
langTools.addCompleter(eventCompleter);
langTools.addCompleter(ternCompleter);

// === kunci biar popup muncul setelah titik ===
editor.commands.on('afterExec', function (e) {
  if (e.command.name === 'insertstring' && e.args === '.') {
    editor.execCommand('startAutocomplete');
  }
});

// load file contoh
async function addValue(url = "") {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    editor.setValue(data, -1);
  } catch (e) {
    console.error('Error fetching data:', e);
  }
}


// fungsi untuk mengatur maxLines sesuai tinggi Parent
function updateEditorMaxLines() {
  const parent = document.getElementById('editor').parentElement;

  // pastikan editor udah render biar lineHeight valid
  editor.resize(true);

  // ambil tinggi parent container
  const parentHeight = parent.clientHeight;

  // ambil lineHeight aktual dari Ace
  const lineHeight = editor.renderer.lineHeight;

  // hitung jumlah baris yang muat
  const lines = Math.floor(parentHeight / lineHeight);
  console.log(lines);
  // set min dan max agar penuh mengikuti parent
  editor.setOptions({
    minLines: lines,
    //  maxLines: lines,
  });

  editor.resize(true);
}

// set ukuran font + hitung ulang
function setEditorFontSize(size) {
  editor.setFontSize(size);
  editor.resize(true);
  updateEditorMaxLines();
}

// set default font size
setEditorFontSize(15);

// update kalau parent berubah ukuran
window.addEventListener('resize', updateEditorMaxLines);

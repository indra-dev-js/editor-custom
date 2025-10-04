class Editor {
  constructor(container) {
    try {
      this.editor = ace.edit('editor');

      this.langTools = ace.require('ace/ext/language_tools');
      this.editor.setOptions(this.defaultOptions());
    } catch (error) {
      console.warn(error);
    }
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
    this.dragScrolling = false;
    this.dragThreshold = 2; // pixel
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

          const rect = this.container.getBoundingClientRect();
          const cursorY = touch.clientY;

          // buffer atas & bawah sebelum scroll jalan
          const BUFFER_TOP = 100;
          const BUFFER_BOTTOM = 100;

          let scrollDelta = 0;

          // jika handle mendekati batas atas
          if (cursorY - rect.top < BUFFER_TOP) {
            scrollDelta = -Math.max(BUFFER_TOP - (cursorY - rect.top), 0);
          }
          // jika handle mendekati batas bawah
          else if (cursorY - rect.top > rect.height - BUFFER_BOTTOM) {
            scrollDelta = Math.max(
              cursorY - rect.top - (rect.height - BUFFER_BOTTOM),
              0,
            );
          }

          // scroll halus
          const SPEED = 0.15; // bisa lo tweak
          if (scrollDelta !== 0) {
            this.editor.renderer.scrollBy(0, scrollDelta * SPEED);
          }

          // scroll bawaan ace
          // this.editor.renderer.scrollCursorIntoView(range.end, OFFSET, VIEW_MARGIN);

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
    this.editor.renderer.scrollCursorIntoView(pos, 0.5);
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
            // console.log(c.type);

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
            // console.log(c);
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

  function highlightTooltip(info, funcName, params = []) {
    // bikin regex untuk param user
    const paramRegex = params.length
      ? new RegExp(`\\b(${params.join('|')})\\b`, 'g')
      : null;

    // daftar rules highlight
    const rules = [
      {
        regex: new RegExp(`\\b${funcName}\\b`, 'g'),
        wrap: m => `<span class="ace_support ace_function">${m}</span>`,
      },
      {
        regex: /\b(listener|this|ev|evt|options|type)\b/g,
        wrap: m => `<span class="ace_variable ace_parameter">${m}</span>`,
      },
      {
        regex: /\b(void|keyof|boolean|any|string|number)\b/g,
        wrap: m => `<span class="ace_keyword">${m}</span>`,
      },
    ];

    // tambahin rule highlight untuk param user kalau ada
    if (paramRegex) {
      rules.push({
        regex: paramRegex,
        wrap: m =>
          `<span class="ace_variable ace_parameter" style="text-decoration: underline;">${m}</span>`,
      });
    }

    // jalankan sequential
    let highlighted = info;
    for (const { regex, wrap } of rules) {
      highlighted = highlighted.replace(regex, wrap);
    }
    return highlighted;
  }

  // helper: hapus komentar & string supaya 'return' di komentar/string ngga ngaruh
  function stripCommentsAndStrings(code = '') {
    // hapus komentar dulu
    let noComments = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    // hapus string literal ('', "", ``) sederhana (tidak sempurna 100% untuk semua edgecases, tapi cukup untuk case umum)
    noComments = noComments.replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '');
    return noComments;
  }

  // helper: cari posisi penutup brace matching dari posisi buka '{'
  function findMatchingBrace(code, startIndex) {
    let depth = 0;
    for (let i = startIndex; i < code.length; i++) {
      const ch = code[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  // helper: cari body fungsi luar berdasarkan nama fungsi (support: function name, var/let/const assignment, arrow)
  function findOuterFunctionBody(cleanCode, funcName) {
    if (!funcName) return null;
    const patterns = [
      new RegExp(`\\bfunction\\s+${funcName}\\s*\\([^)]*\\)\\s*{`, 'm'),
      new RegExp(`\\b${funcName}\\s*=\\s*function\\s*\\([^)]*\\)\\s*{`, 'm'),
      new RegExp(`\\b${funcName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*{`, 'm'),
    ];

    for (const pat of patterns) {
      const m = pat.exec(cleanCode);
      if (m && typeof m.index === 'number') {
        const braceStart = cleanCode.indexOf('{', m.index);
        if (braceStart >= 0) {
          const braceEnd = findMatchingBrace(cleanCode, braceStart);
          if (braceEnd > braceStart) {
            return cleanCode.slice(braceStart + 1, braceEnd);
          }
        }
      }
    }
    return null;
  }

  // helper: dari outerBody cari inner function yang di-return (function() { ... } atau (...) => { ... })
  function findReturnedInnerFunctionBody(outerBody) {
    if (!outerBody) return null;

    // cari "return function (...) {"
    let pat = /return\s+function\s*(?:\w*\s*)?\([^)]*\)\s*{/m;
    let m = pat.exec(outerBody);
    if (m && typeof m.index === 'number') {
      const braceStart = outerBody.indexOf('{', m.index);
      if (braceStart >= 0) {
        const braceEnd = findMatchingBrace(outerBody, braceStart);
        if (braceEnd > braceStart) {
          return outerBody.slice(braceStart + 1, braceEnd);
        }
      }
    }

    // cari "return (...) => {"
    pat = /return\s*\([^)]*\)\s*=>\s*{/m;
    m = pat.exec(outerBody);
    if (m && typeof m.index === 'number') {
      const braceStart = outerBody.indexOf('{', m.index);
      if (braceStart >= 0) {
        const braceEnd = findMatchingBrace(outerBody, braceStart);
        if (braceEnd > braceStart) {
          return outerBody.slice(braceStart + 1, braceEnd);
        }
      }
    }

    // fallback: cari "return {" langsung (anonymous returned object or arrow implicit) — skip
    return null;
  }

  // main: parse fn signature string (raw) dan buat formatted result + paramNames
  function formatFnString(raw, funcName, sourceCode = '') {
    if (!raw) return { formatted: '', paramNames: [] };

    // non-greedy supaya '-> fn()' ke-split bener
    const match = raw.match(/^fn\((.*?)\)\s*(?:->\s*(.*))?$/);
    if (!match) return { formatted: raw, paramNames: [] };

    const paramsStr = (match[1] || '').trim();
    let returnType = match[2] ? match[2].trim() : '';

    // parse params
    const params = paramsStr
      ? paramsStr
          .split(',')
          .map(p => {
            let [name, type] = p.split(':').map(s => s.trim());
            if (!name) return null;
            if (!type || type === '?') type = 'any'; // fallback param -> any
            return { name, type, str: `${name}: ${type}` };
          })
          .filter(Boolean)
      : [];

    // === HANDLE RETURN ===
    if (!returnType) {
      // bersihin dulu biar gak false positive dari comment/string
      const cleanSource = stripCommentsAndStrings(sourceCode || '');

      // 🔎 cek arrow inline const fn = (...) => expr;
      const arrowRegex = new RegExp(
        `\\b${funcName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*([^\\{;]+)`,
      );
      const arrowMatch = cleanSource.match(arrowRegex);

      if (arrowMatch) {
        returnType = 'any'; // inline arrow expression selalu return value
      } else {
        const outerBody = findOuterFunctionBody(cleanSource, funcName);
        if (outerBody) {
          const innerBody = findReturnedInnerFunctionBody(outerBody);
          if (innerBody != null) {
            const hasReturnInner = /\breturn\b/.test(innerBody);
            returnType = hasReturnInner ? 'any' : 'void';
          } else {
            returnType = /\breturn\b/.test(outerBody) ? 'any' : 'void';
          }
        } else {
          returnType = /\breturn\b/.test(cleanSource) ? 'any' : 'void';
        }
      }
    } else if (returnType === '?') {
      returnType = 'any';
    } else if (returnType.startsWith('fn(')) {
      // return-nya adalah function lagi -> parse recursively
      const innerMatch = returnType.match(/^fn\((.*?)\)\s*(?:->\s*(.*))?$/);
      if (innerMatch) {
        const innerParamsStr = (innerMatch[1] || '').trim();
        const innerParams = innerParamsStr
          ? innerParamsStr
              .split(',')
              .map(p => {
                const [n, t] = p.split(':').map(s => s.trim());
                const type = !t || t === '?' ? 'any' : t;
                return `${n}: ${type}`;
              })
              .filter(Boolean)
          : [];

        let innerRet = innerMatch[2] ? innerMatch[2].trim() : '';

        if (!innerRet) {
          // try to detect inner function's return by scanning sourceCode (best-effort)
          const cleanSource = stripCommentsAndStrings(sourceCode || '');
          const outerBody = findOuterFunctionBody(cleanSource, funcName);
          const innerBody = findReturnedInnerFunctionBody(outerBody);
          if (innerBody != null) {
            innerRet = /\breturn\b/.test(innerBody) ? 'any' : 'void';
          } else {
            // fallback: unknown -> choose 'any' (safer when we can't determine)
            innerRet = 'any';
          }
        } else if (innerRet === '?') {
          innerRet = 'any';
        } else if (innerRet.startsWith('fn(')) {
          // nested deeper: recursively format innerRet
          const deeper = formatFnString(innerRet, '', sourceCode);
          // deeper.formatted -> "(: ...): type" so convert to arrow
          innerRet = deeper.formatted
            .replace(/^[^(]*\(/, '(')
            .replace(/\):/, ') =>');
        }

        returnType = `(${innerParams.join(', ')}) => ${innerRet}`;
      }
    }

    const formatted = `${funcName}(${params
      .map(p => p.str)
      .join(', ')}): ${returnType}`;
    return { formatted, paramNames: params.map(p => p.name) };
  }

  // console.log(formatFnString('fn(name: ?) -> fn()', 'addUser'));
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
      // const info = t.doc || t.type || '';
      // tooltip.innerHTML = highlightTooltip(info, funcName);

      const info = t.doc || t.type || '';

      if (t.doc) {
        // bawaan native
        tooltip.innerHTML = highlightTooltip(t.doc, t.exprName);
      } else if (t.type) {
        // user-defined
        const { formatted, paramNames } = formatFnString(
          t.type,
          t.exprName,
          code,
        );
        tooltip.innerHTML = highlightTooltip(formatted, t.exprName, paramNames);
        // console.log('user fn:', formatted);
      } else {
        hideTooltip();
      }

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

// === DOM Completer Khusus ===
// ====== DOM Completer khusus createElement("tag"). ======

Editor.prototype.domCompleter = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    const line = session.getLine(pos.row);
    const beforeCursor = line.slice(0, pos.column);

    // ===== Phase 1: tangkap nama tag (partial) =====
    const tagMatch = beforeCursor.match(
      /document\.createElement\(\s*(['"])([^\)'"]*)$/,
    );

    if (tagMatch) {
      const partialTag = tagMatch[2];
      console.log('Tag partial:', partialTag); // debug
      return callback(null, []); // phase 1, jangan munculin method dulu
    }

    // ===== Phase 2: setelah dot =====
    const dotMatch = beforeCursor.match(
      /document\.createElement\(\s*(['"])([^\)'"]+)\1\s*\)\.([a-zA-Z0-9_$]*)$/,
    );
    if (!dotMatch) return callback(null, []);

    const tagName = dotMatch[2];
    const propPrefix = dotMatch[3] || '';
    console.log('Tag detected:', tagName, 'Prefix method:', propPrefix);

    let tempEl;
    try {
      tempEl = document.createElement(tagName);
    } catch {
      return callback(null, []);
    }

    const props = new Set();
    let current = tempEl;
    while (current) {
      Object.getOwnPropertyNames(current).forEach(p => props.add(p));
      current = Object.getPrototypeOf(current);
    }

    // Helper untuk tentuin tipe properti
    function getType(val) {
      try {
        if (typeof val === 'function') return 'function';
        if (val === null) return 'property';
        if (Array.isArray(val)) return 'array';
        if (typeof val === 'object') return 'object';
        if (typeof val === 'boolean') return 'property';
        if (typeof val === 'string') return 'property';
        if (typeof val === 'number') return 'constant';
        console.log(typeof val);
        return typeof val; // string, number, boolean, symbol, undefined
      } catch {
        return 'unknown';
      }
    }

    const completions = [...props]
      .filter(name => name.startsWith(propPrefix))
      .map(name => {
        let type = 'unknown';
        try {
          type = getType(tempEl[name]);
        } catch {}
        return {
          caption: name,
          value: name,
          meta: type, // function / object / string / number / etc
          score: 10000,
          type,
        };
      });

    callback(null, completions);
  },
};

// ====== Helper (kopi dari lo) - simpan kalau belum ada ======

function getAllProps(obj) {
  const props = new Set();
  let current = obj;
  while (current) {
    try {
      Object.getOwnPropertyNames(current).forEach(p => props.add(p));
    } catch (e) {}
    current = Object.getPrototypeOf(current);
  }
  return [...props];
}

// ====== Modifikasi init: daftarkan domCompleter via addCompleter & pasang afterExec trigger ======

Editor.prototype.touchCursors = new TouchCursors();

Editor.prototype.init = function init(options = {}) {
  this.editor.setOptions(this.defaultOptions());
  this.mode = BranchModeJs.mode();

  this.autocomplete.register([
    this.keywordCompleter,
    this.customsnippet,
    this.autocompleteNativejs,
    this.keywordJs,
    this.bebekComplete,
    this.domCompleter,
    this.ternCompleter,
  ]);

  this.initTernTooltip();
  window.addEventListener('resize', () => this.updateEditorMaxLines());
};
Editor.prototype.tsCompleter = function () {
  const ts = window.ts;
  const files = {
    'main.js': this.editor.getValue(),
  };

  // buat LanguageService
  const services = ts.createLanguageService(
    {
      getScriptFileNames: () => Object.keys(files),
      getScriptVersion: () => '1',
      getScriptSnapshot: fileName => {
        if (files[fileName])
          return ts.ScriptSnapshot.fromString(files[fileName]);
        return undefined;
      },
      getCurrentDirectory: () => './',
      getCompilationSettings: () => ({ allowJs: true }),
      getDefaultLibFileName: () => 'lib.d.ts',
    },
    ts.createDocumentRegistry(),
  );
  const tsCompleter = {
    getCompletions: function (editor, session, pos, prefix, callback) {
      // update file content
      files['main.js'] = session.getValue();

      const offset = session.getDocument().positionToIndex(pos, 0);
      const completions =
        services.getCompletionsAtPosition('main.js', offset, {
          includeExternalModuleExports: true,
        }) || [];

      callback(
        null,
        completions.entries.map(entry => ({
          caption: entry.name,
          value: entry.name,
          meta: entry.kind,
        })),
      );
    },
  };
  this.autocomplete.register([tsCompleter]);
};
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
      {
        caption: 'function (anon)',
        snippet: 'function ${1}() {\n\t${2}\n}',
        meta: 'snippets',
        score: 99999,
      },
      {
        caption: 'function =>',
        snippet: '() => {\n\t${1}\n}',
        meta: 'snippets',
        score: 99999,
      },
      {
        caption: 'for (loop)',
        snippet:
          'for (let ${1:index} = ${1:0}; ${1:index} < ${2:array.length}; ${1:index}++) {\n\tconst element = ${2:array}[${1:index}]\n\n}',
        meta: 'snippets',
        score: 99999,
      },
    ];

    // for (let index = 0; index < array.length; index++) {
    //   const element = array[index];

    // }
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
    console.log(line.slice(0, pos.column));

    const ignore = /(?:^|\s)\./; // cega jika hanya . tanpa awalan
    // //callback ke null, [] jika ighnore match
    // sebelumnya: const ignore = /(?:^|\s)\./;
    //document.createElement()
    console.log(ignore.test(before));
    if (ignore.test(before)) return callback(null, []);
    else if (/('|")/.test(before)) return callback(null, []);
    // di atas filter string!
    //const match = str.match(/\(\s*(['"])(.*?)\1\s*\)/);
    // if (match) {
    //   console.log(match[2]); // → div
    // }

    session.on('change', () => {
      const cursor = editor.getCursorPosition();
      const line = session.getLine(cursor.row);
      const beforeCursor = line.slice(0, cursor.column);

      // cek partial createElement
      const match = beforeCursor.match(
        /document\.createElement\(\s*(['"]?)([^\)'"]*)$/,
      );

      if (match) {
        const elementName = match[2]; // string partial user
        if (!elementName) return; // skip kalau kosong

        const tempEl = document.createElement(elementName);
        // ambil semua properti/method
        const props = [];
        let obj = tempEl;
        while (obj) {
          Object.getOwnPropertyNames(obj).forEach(p => props.push(p));
          obj = Object.getPrototypeOf(obj);
        }
        // hapus duplikat
        const uniqueProps = [...new Set(props)];

        console.log('Methods/props:', uniqueProps);
      }
    });

    const fullContent = session.getValue();
    console.log(fullContent);
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
          console.log(currentObj[key]);
        } else {
          currentObj = null;
          break;
        }
      }
      obj = currentObj; // hasil akhir

      // ⚡ special case agar lebih stabil
      const last = path[path.length - 1];
      console.log(last);
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
        case 'document.createElement':
          obj = document.createElement;
          alert();
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
function getAllProps(obj) {
  const props = new Set();
  let current = obj;
  while (current) {
    Object.getOwnPropertyNames(current).forEach(p => props.add(p));
    current = Object.getPrototypeOf(current);
  }
  return [...props];
}
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
        // console.log(line);
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

const app = new Editor();

app.init();

app.setFontSize(16);
app.editor.setValue('document.createElement("div")', -1);
// app.$add.completer(objectCompleter);

addValue('http://127.0.0.1:5500/editor.js');

async function addValue(url = '') {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    app.editor.setValue(data, -1);
  } catch (e) {
    console.error('Error fetching data:', e);
  }
}
// editor.setOptions(defaultSettings);

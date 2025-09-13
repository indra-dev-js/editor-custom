const editor = ace.edit('editor');

// Inisialisasi TouchCursors seperti SPCK Editor
editor.renderer.$keepTextAreaAtCursor = false;

//$anchorChanged
// :
// true
// $cursorChanged
// :
// true
class TouchCursors {
  constructor(editor, options = {}) {
    this.editor = editor;
    this.renderer = editor.renderer;
    this.cursorLayer = this.renderer.$cursorLayer.element;
    this.container = editor.container; // <-- perbaikan di sini
    this.keepTextAreaAtCursor = !options.keepTextAreaAtCursor || false;
    
    this.renderer.$keepTextAreaAtCursor = true;
    this.caretCursor = this.createCursor('se-caret-cursor');
    this.leftCursor = this.createCursor('se-left-cursor');
    this.rightCursor = this.createCursor('se-right-cursor');


    this.touching = null; // 'c' | 'l' | 'r' | null

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
        console.log('l');
        leftCursor.style.left = `${leftPos.left - 27}px`;
        leftCursor.style.top = `${leftPos.top + lineHeight}px`;
        this.showCursor(this.leftCursor);
      }

      if (this.touching !== 'r') {
        console.log('r');
        rightCursor.style.left = `${rightPos.left}px`;
        rightCursor.style.top = `${rightPos.top + lineHeight}px`;
        this.showCursor(this.rightCursor);
      }

      this.hideCursor(this.caretCursor);
    } else {
      // kalau belum ada selection, jangan tampilkan handle
      this.hideCursor(this.leftCursor);
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
      this.touching = null;
      resetHandlePosition();
    });

    this.rightCursor.element.addEventListener('touchend', e => {
      e.preventDefault();
      if (this.touching === 'r') this.touching = null;
      const touch = e.changedTouches[0];
      if (touch) this.onDragEnd(touch.clientX, touch.clientY);
      this.hideCursor(this.caretCursor);
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
    });

    this.leftCursor.element.addEventListener('touchend', e => {
      e.preventDefault();
      if (this.touching === 'l') this.touching = null;
      const touch = e.changedTouches[0];
      if (touch) this.onDragEnd(touch.clientX, touch.clientY);
      this.hideCursor(this.caretCursor);
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

    // this.editor.on('focus', () => {
    //   setTimeout(() => this.updateCursors(), 1);
    // });
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

  // onDoubleTap(e) {
  //   const touch = e.touches && e.touches[0];
  //   if (!touch) return;

  //   // Konversi ke koordinat editor
  //   const { x, y } = this._clientToRendererCoords(touch.clientX, touch.clientY);
  //   const pos = this.renderer.screenToTextCoordinates(x, y);
  //   if (!pos) return;

  //   const session = this.editor.getSession();
  //   const selection = this.editor.selection;

  //   // Dapatkan range word di posisi touch
  //   let range = session.getWordRange(pos.row, pos.column);

  //   // Jika double tap kedua atau lebih, pilih seluruh line
  //   if (this.lastTapTime && e.timeStamp - this.lastTapTime < 500) {
  //     range = selection.getLineRange(pos.row);
  //   }

  //   // Set selection ke range yang sesuai
  //   selection.setRange(range);

  //   // Scroll ke row
  //   this.editor.renderer.scrollToRow(pos.row);

  //   // Update posisi cursor (sesuai implementasi Ace)
  //   this.showCursor(this.leftCursor);
  //   this.showCursor(this.rightCursor);
  //   this.hideCursor(this.caretCursor);

  //   // Simpan waktu tap terakhir untuk menghitung double tap
  //   this.lastTapTime = e.timeStamp;
  // }


getTouchPos(e) {
  // Ambil touch pertama
  const touch = e.touches[0];

  // Patch posisi biar MouseEvent Ace ngerti
  e.clientX = touch.clientX;
  e.clientY = touch.clientY;

  // Gunakan MouseEvent dari Ace
  const MouseEvent = ace.require("ace/mouse/mouse_event").MouseEvent;
  console.log(MouseEvent)
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

// Inisialisasi dan aktifkan TouchCursors pada editor Ace Anda
const touchCursors = new TouchCursors(editor, { keepTextAreaAtCursor: false });

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

//editor.session.setMode('ace/mode/html');
let defaultSettings = {
  mode: 'ace/mode/javascript',
  scrollPastEnd: 0.75,
  dragEnabled: true,
  theme: 'ace/theme/github_dark',
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  enableSnippets: true,
  cursorStyle: 'smooth',
  tabSize: 4,
  showPrintMargin: false,
  highlightActiveLine: false,
  keyboardHandler: 'ace/keyboard/sublime',
  wrap: true
};

editor.setOptions(defaultSettings);

//editor.focus();
// Set default value
// editor.setValue(
//   `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Document</title>
// </head>
// <body>
//     <script type="text/javascript" charset="utf-8">
//         // Contoh kode default
//         function hello() {
//             console.log("Halo dunia!");
//         }
//     </script>
// </body>
// </html>`,
//   -1,
// );

// Opsional: aktifkan wrap
//editor.session.setUseWrapMode(true);

// editor.setKeyboardHandler("ace/keyboard/vscode");

// --- SESUAIKAN MAX LINES EDITOR ---
function updateEditorMaxLines() {
  const parent = document.getElementById('editor').parentElement;

  // pastikan editor udah render biar lineHeight valid
  editor.resize(true);

  // ambil tinggi parent container
  const parentHeight = parent.clientHeight;

  // ambil lineHeight aktual dari Ace
  const lineHeight = editor.renderer.lineHeight;

  // hitung jumlah baris yang muat
  const lines = Math.floor(parentHeight  / lineHeight);
console.log(lines)
  // set min dan max agar penuh mengikuti parent
  editor.setOptions({
    minLines: lines ,
    maxLines: lines
  });

  editor.resize(true);
}

// set ukuran font + hitung ulang
function setEditorFontSize(size) {
  editor.setFontSize(size);
  editor.resize(true);
  updateEditorMaxLines();
}

// awal
setEditorFontSize(18);

// update kalau parent berubah ukuran
window.addEventListener('resize', updateEditorMaxLines);

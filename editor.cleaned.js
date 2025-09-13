const editor = window.ace.edit('editor');

// Inisialisasi TouchCursors seperti SPCK Editor
editor.renderer.$keepTextAreaAtCursor = !0;

//$anchorChanged
// :
// true
// $cursorChanged
// :
// true
class TouchCursors {
  constructor(editor, options = {}) {
    (this.editor = editor),
      (this.renderer = editor.renderer),
      (this.cursorLayer = this.renderer.$cursorLayer.element),
      (this.container = editor.container), // <-- perbaikan di sini
      (this.keepTextAreaAtCursor = !options.keepTextAreaAtCursor || !1),
      (this.renderer.$keepTextAreaAtCursor = !0),
      (this.caretCursor = this.createCursor('se-caret-cursor')),
      (this.leftCursor = this.createCursor('se-left-cursor')),
      (this.rightCursor = this.createCursor('se-right-cursor')),
      (this.touching = null), // 'c' | 'l' | 'r' | null
      this.initEventListeners(),
      this.updateOnRender();
  }
  createCursor(className) {
    const el = document.createElement('div');
    return (
      (el.className = className),
      (el.style.position = 'absolute'),
      (el.style.display = 'none'),
      this.cursorLayer.appendChild(el),
      {
        element: el,
      }
    );
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
    if ('c' === this.touching || 'l' === this.touching || 'r' === this.touching)
      return;
    const renderer = this.renderer,
      { lineHeight: lineHeight } = renderer.layerConfig,
      cursorPos = renderer.$cursorLayer.$pixelPos,
      caretCursor = this.caretCursor.element,
      rightCursor = this.rightCursor.element,
      leftCursor = this.leftCursor.element;
    if (!cursorPos) return;
    // update caretCursor position
    (caretCursor.style.left = cursorPos.left - 13 + 'px'),
      (caretCursor.style.top = cursorPos.top + lineHeight + 'px'),
      this.showCursor(this.caretCursor);
    // update leftCursor and rightCursor positions
    const range = this.editor.selection.getRange();
    if (!range.isEmpty()) {
      const leftPos = this.renderer.$cursorLayer.getPixelPosition(
          range.start,
          !0,
        ),
        rightPos = this.renderer.$cursorLayer.getPixelPosition(range.end, !0);
      'l' !== this.touching &&
        (console.log('l'),
        (leftCursor.style.left = leftPos.left - 27 + 'px'),
        (leftCursor.style.top = `${leftPos.top + lineHeight}px`),
        this.showCursor(this.leftCursor)),
        'r' !== this.touching &&
          (console.log('r'),
          (rightCursor.style.left = `${rightPos.left}px`),
          (rightCursor.style.top = `${rightPos.top + lineHeight}px`),
          this.showCursor(this.rightCursor)),
        this.hideCursor(this.caretCursor);
    }
    // kalau belum ada selection, jangan tampilkan handle
    else this.hideCursor(this.leftCursor), this.hideCursor(this.rightCursor);
  }
  initEventListeners() {
    this.caretCursor.element.addEventListener(
      'touchstart',
      e => {
        e.preventDefault(), (this.touching = 'c');
      },
      {
        passive: !1,
      },
    ),
      // Drag caret cursor
      this.caretCursor.element.addEventListener('touchmove', e => {
        // ✅ debug
        if (
          (e.preventDefault(),
          e.stopPropagation(),
          console.log('[touchmove] caret', this.touching),
          'c' !== this.touching)
        )
          return;
        const touch = e.changedTouches[0];
        touch &&
          // console.log('[handleCaretMove] pos', touch.clientX, touch.clientY); // ✅ debug
          this.handleCaretMove(touch.clientX, touch.clientY);
      }),
      this.caretCursor.element.addEventListener('touchend', e => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        touch ? this.onDragEnd(touch.clientX, touch.clientY) : this.onDragEnd();
      }),
      this.caretCursor.element.addEventListener('touchcancel', e => {
        e.preventDefault(), 'c' === this.touching && (this.touching = null);
      }),
      // Drag right cursor
      this.rightCursor.element.addEventListener(
        'touchstart',
        e => {
          e.preventDefault(), e.stopPropagation(), (this.touching = 'r');
          // Menandai bahwa drag dimulai pada right cursor
          const touch = e.touches[0];
          this.initialTouch = {
            x: touch.clientX,
            y: touch.clientY,
          };
        },
        {
          passive: !1,
        },
      ),
      // Drag right cursor
      this.rightCursor.element.addEventListener('touchmove', e => {
        if ((e.preventDefault(), e.stopPropagation(), 'r' !== this.touching))
          return;
        if (!e.target.closest('.se-right-cursor')) return;
        const touch = e.changedTouches[0];
        if (!touch) return;
        // const rect = this.renderer.scroller.getBoundingClientRect();
        const rect = this.renderer.$cursorLayer.element.getBoundingClientRect(),
          x = touch.clientX - rect.left - 15,
          y = touch.clientY - rect.top - 15,
          { lineHeight: lineHeight } = this.renderer.layerConfig;
        // 1️⃣ Update posisi visual bebas (handle tetap mengikuti jari)
        Object.assign(this.rightCursor.element.style, {
          top: `${y}px`,
          left: `${x}px`,
        });
        // 2️⃣ Update selection sementara jika touch di area text
        //coords untuk mengatur jarak sentuhan dari selection biar ngk nutup selection end
        const coords = this.renderer.screenToTextCoordinates(
          touch.clientX - 20,
          touch.clientY - 0.5 * (34 + lineHeight + 20),
        );
        if (!coords) return;
        const range = this.editor.selection.getRange(),
          tempCoords = {
            row: coords.row,
            column: coords.column,
          };
        // End tidak boleh melewati start
        (tempCoords.row > range.start.row ||
          (tempCoords.row === range.start.row &&
            tempCoords.column >= range.start.column)) &&
          (range.end = tempCoords),
          this.editor.selection.setRange(range);
      }),
      // Drag left cursor
      this.leftCursor.element.addEventListener('touchmove', e => {
        if ((e.preventDefault(), e.stopPropagation(), 'l' !== this.touching))
          return;
        const touch = e.changedTouches[0];
        if (!touch) return;
        // const rect = this.renderer.scroller.getBoundingClientRect();
        const rect = this.renderer.$cursorLayer.element.getBoundingClientRect(),
          x = touch.clientX - rect.left - 14,
          y = touch.clientY - rect.top - 11,
          { lineHeight: lineHeight } = this.renderer.layerConfig,
          style = this.leftCursor.element.style;
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
        // Start tidak boleh melewati end
        (coords.row < range.end.row ||
          (coords.row === range.end.row &&
            coords.column <= range.end.column)) &&
          ((range.start = coords), this.editor.selection.setRange(range));
      });
    // touchend → kembalikan handle ke posisi selection valid
    const resetHandlePosition = () => {
      const range = this.editor.selection.getRange();
      this.syncHandleToCaret(range);
    };
    this.leftCursor.element.addEventListener('touchend', e => {
      e.preventDefault(), (this.touching = null), resetHandlePosition();
    }),
      this.rightCursor.element.addEventListener('touchend', e => {
        e.preventDefault(), (this.touching = null), resetHandlePosition();
      }),
      this.rightCursor.element.addEventListener('touchend', e => {
        e.preventDefault(), 'r' === this.touching && (this.touching = null);
        const touch = e.changedTouches[0];
        touch && this.onDragEnd(touch.clientX, touch.clientY),
          this.hideCursor(this.caretCursor);
      }),
      this.rightCursor.element.addEventListener('touchcancel', e => {
        e.preventDefault(), 'r' === this.touching && (this.touching = null);
      }),
      // Drag left cursor
      this.leftCursor.element.addEventListener('touchstart', e => {
        e.preventDefault(), e.stopPropagation(), (this.touching = 'l');
        // Menandai bahwa drag dimulai pada left cursor
        const touch = e.touches[0];
        this.initialTouch = {
          x: touch.clientX,
          y: touch.clientY,
        };
      }),
      this.leftCursor.element.addEventListener('touchend', e => {
        e.preventDefault(), 'l' === this.touching && (this.touching = null);
        const touch = e.changedTouches[0];
        touch && this.onDragEnd(touch.clientX, touch.clientY),
          this.hideCursor(this.caretCursor);
      }),
      this.leftCursor.element.addEventListener('touchcancel', e => {
        e.preventDefault(), 'l' === this.touching && (this.touching = null);
      });
    let lastTap = 0;
    this.container.addEventListener('touchstart', e => {
      e.preventDefault(), e.stopPropagation(), e.stopP;
      const currentTime = new Date().getTime(),
        tapLength = currentTime - lastTap;
      tapLength < 300 && tapLength > 0 && this.onDoubleTap(e),
        (lastTap = currentTime);
    }),
      this.editor.on('blur', () => {
        this.hideCursor(this.caretCursor),
          this.hideCursor(this.leftCursor),
          this.hideCursor(this.rightCursor),
          (this.touching = null);
      }),
      this.editor.on('focus', () => {
        setTimeout(() => this.updateCursors(), 1);
      });
  }
  _clientToRendererCoords(clientX, clientY) {
    // Ambil posisi bounding editor di layar
    const rect = this.container.getBoundingClientRect();
    // Konversi posisi touch → relatif ke editor
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }
  _updateHandlePosition(handle, pos) {
    if (!pos) return;
    // konversi row/col ke pixel yang benar
    const pixel = this.renderer.$cursorLayer.getPixelPosition(pos, !0),
      rect = this.renderer.scroller.getBoundingClientRect();
    // set style absolut handle di dalam editor
    (handle.style.left = pixel.left - rect.left + 'px'),
      (handle.style.top = pixel.top - rect.top + 'px');
  }
  // ---  onDoubleTap ---
  onDoubleTap(e) {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const { x: x, y: y } = this._clientToRendererCoords(
        touch.clientX,
        touch.clientY,
      ),
      pos = this.renderer.screenToTextCoordinates(x, y);
    if (!pos) return;
    const range = this.editor.getSession().getWordRange(pos.row, pos.column);
    this.editor.selection.setRange(range),
      this.editor.renderer.scrollToRow(pos.row),
      this.showCursor(this.leftCursor),
      this.showCursor(this.rightCursor),
      this.hideCursor(this.caretCursor);
  }
  onDragEnd(clientX, clientY) {
    // Simpan handle yang sedang di-drag
    const active = this.touching;
    if (((this.touching = null), void 0 !== clientX && void 0 !== clientY)) {
      // Dapatkan koordinat valid dalam text
      const coords = this.renderer.screenToTextCoordinates(clientX, clientY);
      if (coords) {
        const range = this.editor.selection.getRange();
        'r' === active
          ? // Update end selection
            (coords.row > range.start.row ||
              (coords.row === range.start.row &&
                coords.column >= range.start.column)) &&
            (range.end = coords)
          : 'l' === active &&
            (coords.row < range.end.row ||
              (coords.row === range.end.row &&
                coords.column <= range.end.column)) &&
            (range.start = coords),
          // Terapkan range
          this.editor.selection.setRange(range),
          // Kembalikan handle ke posisi valid
          this.syncHandleToCaret(range);
      } else {
        // Jika drag keluar area text, kembalikan handle ke posisi terakhir valid
        const range = this.editor.selection.getRange();
        this.syncHandleToCaret(range);
      }
    }
    // Update posisi visual left/right
    this.updateCursors(),
      // caretCursor tetap terlihat
      this.showCursor(this.caretCursor);
  }
  handleCaretMove(clientX, clientY) {
    const rect = this.renderer.$cursorLayer.element.getBoundingClientRect(),
      { lineHeight: lineHeight } = this.renderer.layerConfig,
      x = clientX - rect.left - 14 + 1,
      y = clientY - rect.top - 17;
    // Update style caret element (water drop)
    (this.caretCursor.element.style.left = x + 'px'),
      (this.caretCursor.element.style.top = y + 'px');
    // Hitung posisi text berdasarkan offset yang disesuaikan
    const coords = this.renderer.screenToTextCoordinates(
      clientX + 1,
      clientY - 0.5 * (34 + lineHeight),
    );
    coords &&
      (this.editor.moveCursorTo(coords.row, coords.column),
      this.editor.selection.clearSelection(),
      // ⚡ Auto scroll biar caret selalu kelihatan
      this.editor.renderer.scrollCursorIntoView(
        {
          row: coords.row,
          column: coords.column,
        },
        0.5,
      ),
      this.updateCursors());
  }
  handleRightMove(clientX, clientY) {
    // Ambil range sekarang, tapi jangan ubah selection
    // Konversi touch ke pixel
    const rect = this.renderer.scroller.getBoundingClientRect(),
      x = clientX - rect.left - 14,
      y = clientY - rect.top;
    // Update posisi visual float rightCursor
    (this.rightCursor.element.style.left = `${x}px`),
      (this.rightCursor.element.style.top = `${y}px`),
      this.showCursor(this.rightCursor);
  }
  handleLeftMove(clientX, clientY) {
    // const range = this.editor.selection.getRange();
    const rect = this.renderer.scroller.getBoundingClientRect(),
      x = clientX - rect.left,
      y = clientY - rect.top;
    alert(),
      // Update posisi visual float leftCursor
      (this.leftCursor.element.style.left = `${x}px`),
      (this.leftCursor.element.style.top = `${y}px`),
      this.showCursor(this.leftCursor);
  }
  syncHandleToCaret(range) {
    const renderer = this.renderer;
    renderer.$cursorLayer.getPixelPosition(range.start, !0),
      this.showCursor(this.leftCursor),
      renderer.$cursorLayer.getPixelPosition(range.end, !0),
      this.showCursor(this.rightCursor),
      // Sembunyikan caretCursor saat drag handle
      this.hideCursor(this.caretCursor);
  }
}

// Inisialisasi dan aktifkan TouchCursors pada editor Ace Anda
const touchCursors = new TouchCursors(editor, {
  keepTextAreaAtCursor: !1,
});

// Tampilkan cursor saat editor fokus
// editor.on('focus', () => {
//   touchCursors.updateCursors();
// });
// Sembunyikan cursor saat editor blur
// --- SESUAIKAN MAX LINES EDITOR ---
function updateEditorMaxLines() {
  // ambil parent langsung dari #editor
  editor.resize(!0), // refresh agar lineHeight terbaru
    // pakai tinggi parent
    editor.setOptions({
      maxLines: 20,
      minLines: 1,
    });
}

// jalankan sekali
function setEditorFontSize(size) {
  editor.setFontSize(size),
    editor.resize(!0), // refresh ukuran & lineHeight
    updateEditorMaxLines();
}

editor.on('blur', () => {
  touchCursors.hideCursor(touchCursors.caretCursor),
    touchCursors.hideCursor(touchCursors.leftCursor),
    touchCursors.hideCursor(touchCursors.rightCursor);
}),
  editor.session.setMode('ace/mode/html'),
  //  editor.setTheme('ace/theme/github_dark');
  editor.setTheme('ace/theme/dracula'),
  editor.setOptions({
    enableBasicAutocompletion: !0,
    // auto-suggest dari keyword bawaan mode
    enableLiveAutocompletion: !0,
    // real-time suggestion saat ngetik
    enableSnippets: !0,
  }),
  editor.focus(),
  // Set default value
  editor.setValue(
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <script type="text/javascript" charset="utf-8">\n        // Contoh kode default\n        function hello() {\n            console.log("Halo dunia!");\n        }\n    </script>\n</body>\n</html>',
    -1,
  ),
  // Opsional: aktifkan wrap
  editor.session.setUseWrapMode(!0),
  editor.setOption('dragEnabled', !1),
  updateEditorMaxLines(),
  setEditorFontSize(18),
  // update kalau layar resize
  window.addEventListener('resize', updateEditorMaxLines);

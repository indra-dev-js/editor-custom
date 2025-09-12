const editor = ace.edit('editor');
const aceLayer = editor.renderer.$cursorLayer.element;
// Inisialisasi TouchCursors seperti SPCK Editor
editor.renderer.$keepTextAreaAtCursor = false;
editor.selection.$anchorChanged = false;
editor.selection.$cursorChanged = false;
//$anchorChanged
// :
// true
// $cursorChanged
// :
// true
class TouchCursors {
  constructor(editor, options = {}) {
    if (editor) this.editor = editor;
    this.renderer = editor.renderer;
    this.cursorLayer = this.renderer.$cursorLayer.element;

    this.container = editor.container; // <-- perbaikan di sini
    this.keepTextAreaAtCursor = !options.keepTextAreaAtCursor || false;
    this.renderer.$keepTextAreaAtCursor = false;
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
    const cursorPos = renderer.$cursorLayer.$pixelPos;
    // console.log(renderer.$cursorLayer);
    if (!cursorPos) return;

    // update caretCursor position
    this.caretCursor.element.style.left = cursorPos.left - 13 + 'px';
    this.caretCursor.element.style.top = cursorPos.top + 21 + 'px';
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
      // const rect = this.renderer.scroller.getBoundingClientRect(); jangan dipakai

      if (this.touching !== 'l') {
        console.log('l');
        this.leftCursor.element.style.left = `${leftPos.left - 27}px`;
        this.leftCursor.element.style.top = `${leftPos.top + -26}px`;
        // this.showCursor(this.leftCursor);
      }

      if (this.touching !== 'r') {
        console.log('r');
        this.rightCursor.element.style.left = `${rightPos.left}px`;
        this.rightCursor.element.style.top = `${rightPos.top + 20}px`;
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
    // this.editor.remo
    // Mulai drag caret cursor
    //kode yang berfungsi baik di sini sampai ---
    // this.
    this.editor.removeDefaultHandler('touchstart');
    this.editor.removeEventListener('touchstart', this.cursorLayer);
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

    // Akhiri drag caret cursor
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
    //---sini <-

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
    // Drag right cursor
    // this.rightCursor.element.addEventListener('touchmove', e => {
    //   e.preventDefault();
    //   e.stopPropagation();
    //   if (this.touching !== 'r') return;

    //   const touch = e.changedTouches[0];
    //   if (!touch) return;

    //   // 1️⃣ update posisi visual bebas
    //   const rect = this.renderer.scroller.getBoundingClientRect();
    //   this.rightCursor.element.style.left = (touch.clientX - rect.left) + "px";
    //   this.rightCursor.element.style.top = (touch.clientY - rect.top) + "px";

    //   // 2️⃣ update selection jika touch di area text
    //   const coords = this.renderer.screenToTextCoordinates(touch.clientX, touch.clientY);
    //   if (!coords) return;

    //   const range = this.editor.selection.getRange();
    //   if (coords.row > range.start.row || (coords.row === range.start.row && coords.column >= range.start.column)) {
    //     range.end = coords;
    //     this.editor.selection.setRange(range);
    //     this.syncHandleToCaret(range); // sinkronisasi handle ke selection valid
    //   }
    // });

    // Drag left cursor
    this.leftCursor.element.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();
      if (this.touching !== 'l') return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      // 1️⃣ update posisi visual bebas
      const rect = this.renderer.scroller.getBoundingClientRect();
      this.leftCursor.element.style.left = touch.clientX - rect.left + 'px';
      this.leftCursor.element.style.top = touch.clientY - rect.top + 'px';

      // 2️⃣ update selection jika touch di area text
      const coords = this.renderer.screenToTextCoordinates(
        touch.clientX,
        touch.clientY,
      );
      if (!coords) return;

      const range = this.editor.selection.getRange();
      if (
        coords.row < range.end.row ||
        (coords.row === range.end.row && coords.column <= range.end.column)
      ) {
        range.start = coords;
        this.editor.selection.setRange(range);
        this.syncHandleToCaret(range); // sinkronisasi handle ke selection valid
      }
    });

    // Drag right cursor
    // Drag right cursor

    this.rightCursor.element.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();
      if (this.touching !== 'r') return;
      console.log(e.target.closest('.se-right-cursor') ? true : false);
      const touch = e.changedTouches[0];
      if (!touch) return;

      const rect = this.renderer.scroller.getBoundingClientRect();

      // 1️⃣ Update posisi visual bebas (handle tetap mengikuti jari)
      this.rightCursor.element.style.left = touch.clientX - 50 + 'px';
      this.rightCursor.element.style.top = touch.clientY + 20 + 'px';

      // 2️⃣ Update selection sementara jika touch di area text
      // const coords = this.renderer.screenToTextCoordinates(
      //   touch.clientX,
      //   touch.clientY,
      // );

      const coords = this.renderer.screenToTextCoordinates(
        touch.clientX,
        touch.clientY, // + this.renderer.scrollTop,
      );
      if (!coords) return;

      const range = this.editor.selection.getRange();

      // Tambahkan +1 baris untuk selection end visual (tanpa memindahkan handle)
      const tempCoords = { row: coords.row, column: coords.column }; //-harus -1 biar drag ngk ke timpa cursor dan selection

      // End tidak boleh melewati start
      if (
        tempCoords.row > range.start.row ||
        (tempCoords.row === range.start.row &&
          tempCoords.column >= range.start.column)
      ) {
        range.end = tempCoords;
        this.editor.selection.setRange(range);
        // Jangan panggil syncHandleToCaret → handle tetap bebas
      }
    });

    // Drag left cursor
    this.leftCursor.element.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();
      if (this.touching !== 'l') return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const rect = this.renderer.scroller.getBoundingClientRect();

      // 1️⃣ Update posisi visual bebas (floating)
      this.leftCursor.element.style.left = touch.clientX - 70 + 'px';
      this.leftCursor.element.style.top = touch.clientY - rect.top - 28 + 'px';

      // 2️⃣ Update selection sementara jika berada di area text
      const coords = this.renderer.screenToTextCoordinates(
        touch.clientX,
        touch.clientY,
      );
      if (!coords) return;

      const range = this.editor.selection.getRange();

      // Start tidak boleh melewati end
      if (
        coords.row < range.end.row ||
        (coords.row === range.end.row && coords.column <= range.end.column)
      ) {
        range.start = coords;
        this.editor.selection.setRange(range);
        // Jangan panggil syncHandleToCaret selama drag → biarkan bebas
      }
    });

    // touchend → kembalikan handle ke posisi selection valid
    const resetHandlePosition = () => {
      const range = this.editor.selection.getRange();
      this.syncHandleToCaret(range); // Update handle ke posisi valid selection
      // caretCursor tetap tidak disentuh
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
    // Double tap detection on editor container
    let lastTap = 0;
    this.container.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      e.stopP;

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 200 && tapLength > 0) {
        this.onDoubleTap(e);
      }
      lastTap = currentTime;
    });

    this.editor.on('blur', () => {
      this.hideCursor(this.caretCursor);
      this.hideCursor(this.leftCursor);
      this.hideCursor(this.rightCursor);
      this.touching = null;
    });

    this.editor.on('focus', () => {
      setTimeout(() => this.updateCursors(), 10);
    });
  }

  _clientToRendererCoords(clientX, clientY) {
    // Ambil posisi bounding editor di layar
    const rect = this.container.getBoundingClientRect();

    // Konversi posisi touch → relatif ke editor
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    return { x, y };
  }

  _updateHandlePosition(handle, pos) {
    if (!pos) return;

    // konversi row/col ke pixel yang benar
    const pixel = this.renderer.$cursorLayer.getPixelPosition(pos, true);
    const rect = this.renderer.scroller.getBoundingClientRect();

    // set style absolut handle di dalam editor
    handle.style.left = pixel.left - rect.left + 'px';
    handle.style.top = pixel.top - rect.top + 'px';
  }

  // ---  onDoubleTap ---

  onDoubleTap(e) {
    const touch = e.touches && e.touches[0];
    if (!touch) return;

    const { x, y } = this._clientToRendererCoords(touch.clientX, touch.clientY);
    const pos = this.renderer.screenToTextCoordinates(x, y);
    if (!pos) return;

    const session = this.editor.getSession();
    const range = session.getWordRange(pos.row, pos.column);
    this.editor.selection.setRange(range);
    this.editor.renderer.scrollToRow(pos.row);
    console.log(pos.row);
    this.showCursor(this.leftCursor);
    this.showCursor(this.rightCursor);
    this.hideCursor(this.caretCursor);

    // scroll biar selection terlihat
  }

  // onDragEnd(clientX, clientY) {
  //   this.touching = null;
  //   const active = this.touching; // simpan dulu sebelum reset
  //   if (clientX !== undefined && clientY !== undefined) {
  //     const rect = this.renderer.$cursorLayer.element.getBoundingClientRect();
  //     const { lineHeight } = this.renderer.layerConfig;

  //     const coords = this.renderer.screenToTextCoordinates(
  //       clientX + 1,
  //       clientY - 0.5 * (34 + lineHeight),
  //     );

  //     if (clientX !== undefined && clientY !== undefined) {
  //       const coords = this.renderer.screenToTextCoordinates(clientX, clientY);
  //       if (coords) {
  //         const range = this.editor.selection.getRange();
  //         if (active === 'r') {
  //          range.end = coords;
  //         } else if (active === 'l') {
  //           range.start = coords;
  //         }
  //         this.editor.selection.setRange(range);
  //       }
  //     }

  //     // Setelah drag selesai, baru sinkronisasi semua cursor
  //     this.updateCursors();
  //     this.showCursor(this.caretCursor);
  //   }

  //   // Update posisi leftCursor dan rightCursor, tanpa mengubah caretCursor
  //   this.updateCursors();

  //   // Tampilkan kembali caretCursor setelah drag selesai
  //   this.showCursor(this.caretCursor);
  //   // Sembunyikan handle selection setelah drag selesai
  //   // this.hideCursor(this.leftCursor);
  //   // this.hideCursor(this.rightCursor);
  // }

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

  // handleRightMove(clientX, clientY) {
  //   const range = this.editor.selection.getRange();
  //   const coords = this.renderer.screenToTextCoordinates(clientX, clientY);
  //   if (!coords) return;

  //   // Magnet: jangan melewati start
  //   if (coords.row > range.start.row || (coords.row === range.start.row && coords.column >= range.start.column)) {
  //   // if (coords.row > range.start.row) {
  //     range.end = coords;
  //     this.editor.selection.setRange(range);
  // console.log(coords.row);
  //     // Sinkronisasi handle visual seperti caretCursor
  //     this.syncHandleToCaret(range);
  //     // Scroll agar handle terlihat
  //     this.editor.renderer.scrollCursorIntoView(coords, 0.5);
  //   }
  // }

  // handleLeftMove(clientX, clientY) {
  //   const range = this.editor.selection.getRange();
  //   const coords = this.renderer.screenToTextCoordinates(clientX, clientY);
  //   if (!coords) return;

  //   // Magnet: jangan melewati end
  //   if (coords.row < range.end.row || (coords.row === range.end.row && coords.column <= range.end.column)) {
  //     range.start = coords;
  //     this.editor.selection.setRange(range);

  //     // Sinkronisasi handle visual seperti caretCursor
  //     this.syncHandleToCaret(range);
  //     // Scroll agar handle terlihat
  //     this.editor.renderer.scrollCursorIntoView(coords, 0.5);
  //   }
  // }

  // helper sinkronisasi visual handle dengan caretCursor

  handleRightMove(clientX, clientY) {
    // Ambil range sekarang, tapi jangan ubah selection
    const range = this.editor.selection.getRange();

    // Konversi touch ke pixel
    const rect = this.renderer.scroller.getBoundingClientRect();

    const x = clientX - rect.left - 14;
    const y = clientY - rect.top;

    // Update posisi visual float rightCursor
    this.rightCursor.element.style.left = `${x}px`;
    this.rightCursor.element.style.top = `${y}px`;
    this.showCursor(this.rightCursor);

    // caretCursor tetap muncul, jangan sembunyikan
  }

  handleLeftMove(clientX, clientY) {
    const range = this.editor.selection.getRange();

    const rect = this.renderer.scroller.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Update posisi visual float leftCursor
    this.leftCursor.element.style.left = `${x}px`;
    this.leftCursor.element.style.top = `${y}px`;
    this.showCursor(this.leftCursor);

    // caretCursor tetap muncul, jangan sembunyikan
  }

  syncHandleToCaret(range) {
    const rect = this.renderer.scroller.getBoundingClientRect();

    // Left handle
    const leftPos = this.renderer.$cursorLayer.getPixelPosition(
      range.start,
      true,
    );
    alert();
    this.leftCursor.element.style.left = `${leftPos.left - 28}px`;
    this.leftCursor.element.style.top = `${leftPos.top + 20}px`;
    this.showCursor(this.leftCursor);

    // Right handle
    const rightPos = this.renderer.$cursorLayer.getPixelPosition(
      range.end,
      true,
    );
    this.rightCursor.element.style.left = `${rightPos.left}px`;
    this.rightCursor.element.style.top = `${rightPos.top + 20}px`;
    this.showCursor(this.rightCursor);
    console.log(
      '[SYNC] leftPos',
      leftPos,
      'rightPos',
      rightPos,
      'rect.top',
      rect.top,
    );
    // Sembunyikan caretCursor saat drag handle
    this.hideCursor(this.caretCursor);
  }
}

// Inisialisasi dan aktifkan TouchCursors pada editor Ace Anda
const touchCursors = new TouchCursors(editor, { keepTextAreaAtCursor: false });

// Tampilkan cursor saat editor fokus
editor.on('focus', () => {
  touchCursors.updateCursors();
});

// Sembunyikan cursor saat editor blur
editor.on('blur', () => {
  touchCursors.hideCursor(touchCursors.caretCursor);
  touchCursors.hideCursor(touchCursors.leftCursor);
  touchCursors.hideCursor(touchCursors.rightCursor);
});

editor.session.setMode('ace/mode/html');
//  editor.setTheme('ace/theme/github_dark');
editor.setOptions({
  enableBasicAutocompletion: true, // auto-suggest dari keyword bawaan mode
  enableLiveAutocompletion: true, // real-time suggestion saat ngetik
  enableSnippets: true, // dukung snippet bawaan
});

// Set default value
editor.setValue(
  `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <script type="text/javascript" charset="utf-8">
        // Contoh kode default
        function hello() {
            console.log("Halo dunia!");
        }
    </script>
</body>
</html>`,
  -1,
);

// Opsional: aktifkan wrap
editor.session.setUseWrapMode(true);
editor.setOption('dragEnabled', false);
// --- SESUAIKAN MAX LINES EDITOR ---
function updateEditorMaxLines() {
  // ambil parent langsung dari #editor
  const parentEl = document.getElementById('editor').parentElement;

  editor.resize(true); // refresh agar lineHeight terbaru
  // pakai tinggi parent
  const availableHeight = parentEl.clientHeight;
  // console.log(availableHeight);
  const lineHeight = editor.renderer.lineHeight;

  let maxLines = Math.floor(availableHeight / lineHeight);

  editor.setOptions({ maxLines: 20, minLines: 1 });
}

// editor = instance Ace Editor
editor.selection.on('changeSelection', () => {
  const pos = editor.getCursorPosition(); // {row: 0-based, column: 0-based}
  // console.log('Cursor berada di baris:', pos.row, 'kolom:', pos.column);
  // console.log(editor.renderer.$cursorLayer);
  // customCursor(editor.renderer.$cursorLayer.element);
  // posisi pixel relatif ke viewport
});
editor.selection.on('changeCursor', () => {
  const pixelPos = editor.renderer.$cursorLayer.$pixelPos;
  // console.log("Cursor pixel:", pixelPos); // {left, top}
});

// jalankan sekali
updateEditorMaxLines();
function setEditorFontSize(size) {
  editor.setFontSize(size);
  editor.resize(true); // refresh ukuran & lineHeight
  updateEditorMaxLines(); // hitung ulang maxLines
}
setEditorFontSize(16);
// update kalau layar resize
window.addEventListener('resize', updateEditorMaxLines);

// onDoubleTap(e) {
//   const touch = e.touches && e.touches[0];
//   if (!touch) return;

//   const { x, y } = this._clientToRendererCoords(touch.clientX, touch.clientY);
//   const pos = this.renderer.screenToTextCoordinates(x, y);
//   if (!pos) return;

//   const session = this.editor.getSession();
//   const range = session.getWordRange(pos.row, pos.column);
//   this.editor.selection.setRange(range);

//   const leftPos = this.renderer.$cursorLayer.getPixelPosition(range.start, true);
//   const rightPos = this.renderer.$cursorLayer.getPixelPosition(range.end, true);

//   // ambil bounding rect scroller
//   const rect = this.renderer.scroller.getBoundingClientRect();
//   const scrollTop = this.renderer.scrollTop;

//   // tambahkan scrollTop biar konsisten di semua line
//   this.leftCursor.element.style.left = `${leftPos.left - 28}px`;
//   this.leftCursor.element.style.top = `${leftPos.top - rect.top - scrollTop}px`;

//   this.rightCursor.element.style.left = `${rightPos.left}px`;
//   this.rightCursor.element.style.top = `${rightPos.top - rect.top - scrollTop}px`;

//   this.showCursor(this.leftCursor);
//   this.showCursor(this.rightCursor);
//   this.hideCursor(this.caretCursor);

//   this.editor.renderer.scrollCursorIntoView(range.start, 0.5);
// }

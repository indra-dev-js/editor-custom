// const editor = ace.edit("editor");

// function customCursor() {
//   const caret = document.createElement('div');
//   caret.className = 'se-caret-cursor';
//   caret.style.display = 'none';

//   const leftSel = document.createElement('div');
//   leftSel.className = 'se-left-cursor';
//   leftSel.style.display = 'none';

//   const rightSel = document.createElement('div');
//   rightSel.className = 'se-right-cursor';
//   rightSel.style.display = 'none';

//   // append ke cursorLayer Ace
//   editor.renderer.$cursorLayer.element.append(caret, leftSel, rightSel);

//   function setHandlePosition(el, row, col, isCaret = false) {
//     const pos = editor.renderer.textToScreenCoordinates(row, col);
//     const rect = editor.container.getBoundingClientRect();
//     const lineHeight = editor.renderer.lineHeight;

//     el.style.position = 'absolute';
//     el.style.left = (pos.pageX - rect.left + (isCaret ? -8 : -14)) + 'px';
//     el.style.top = (pos.pageY - rect.top + (isCaret ? lineHeight : -34)) + 'px';
//   }

//   function screenToCursor(clientX, clientY) {
//     const rect = editor.container.getBoundingClientRect();
//     const x = clientX - rect.left;
//     const y = clientY - rect.top;
//     return editor.renderer.screenToTextCoordinates(x, y);
//   }

//   let offsetX = 0;
//   let offsetY = 0;
//   let isDraggingCaret = false;

//   // ======= touch events di caret =======
// caret.addEventListener('touchstart', (e) => {
//     const touch = e.touches[0];
//     const rect = caret.getBoundingClientRect();

//     // hitung offset relatif jari ke kiri-atas caret
//     offsetX = touch.clientX - rect.left;
//     offsetY = touch.clientY - rect.top;

//     isDraggingCaret = true;
//     e.stopPropagation();
//     e.preventDefault(); // cegah scroll saat drag
// });

//   caret.addEventListener('touchmove', (e) => {
//     if (!isDraggingCaret) return;

//     const touch = e.touches[0];
//     const rect = editor.container.getBoundingClientRect();

//     // posisi caret = posisi jari - offset
//     const newLeft = touch.clientX - rect.left - offsetX;
//     const newTop = touch.clientY - rect.top - offsetY;

//     caret.style.left = newLeft + 'px';
//     caret.style.top = newTop + 'px';

//     // update Ace cursor real-time
//     const pos = editor.renderer.screenToTextCoordinates(newLeft, newTop);
//     editor.moveCursorToPosition(pos);
//     editor.selection.clearSelection();

//     e.stopPropagation();
//     e.preventDefault();
// });
// caret.addEventListener('touchend', () => {
//     isDraggingCaret = false;
// });
// caret.addEventListener('touchcancel', () => {
//     isDraggingCaret = false;
// });
//   // ===============================================================
//   // Update visual caret dan selection sesuai logika asli
//   editor.renderer.on('afterRender', () => {
//     if (!editor.isFocused()) return;

//     const sel = editor.getSelection();
//     const isSelecting = !sel.isEmpty();

//     if (isSelecting) {
//       caret.style.display = 'none';
//       leftSel.style.display = 'block';
//       rightSel.style.display = 'block';

//       const range = sel.getRange();
//       setHandlePosition(leftSel, range.start.row, range.start.column);
//       setHandlePosition(rightSel, range.end.row, range.end.column);
//     } else {
//       caret.style.display = 'block';
//       leftSel.style.display = 'none';
//       rightSel.style.display = 'none';

//       const caretPos = editor.getCursorPosition();
//       setHandlePosition(caret, caretPos.row, caretPos.column, true);
//     }
//   });

//   editor.on('blur', () => {
//     caret.style.display = 'none';
//     leftSel.style.display = 'none';
//     rightSel.style.display = 'none';
//   });
// }

// editor.renderer.on('afterRender', customCursor);

// let aceCursor = aceLayer.querySelector('.ace_cursor');
// function customCursor() {
//   // Cek apakah custom cursor sudah ada. Jika ya, hentikan eksekusi.
//   // Ini adalah cara paling efektif untuk mencegah duplikasi.
//   if (document.querySelector('.se-caret-cursor')) {
//     console.log('Custom cursor sudah ada, tidak perlu dibuat lagi.');
//     return;
//   }

//   const caret = document.createElement('div');
//   caret.className = 'se-caret-cursor';
//   caret.style.display = 'none';

//   const leftSel = document.createElement('div');
//   leftSel.className = 'se-left-cursor';
//   leftSel.style.display = 'none';
//   leftSel.style.position = 'absolute';
//   const rightSel = document.createElement('div');
//   rightSel.className = 'se-right-cursor';
//   rightSel.style.display = 'none';
//   rightSel.style.position = 'absolute';

//   // append ke cursorLayer Ace
//   aceLayer.append(caret, leftSel, rightSel);

//   // function setHandlePosition(el, row, col, isCaret = false) {
//   //   const pos = editor.renderer.textToScreenCoordinates(row, col);
//   //   const rect = editor.container.getBoundingClientRect();
//   //   const lineHeight = editor.renderer.lineHeight;

//   //   el.style.position = 'absolute';

//   //   if (isCaret) {
//   //     el.style.left = pos.pageX - rect.left - 60 + 'px';
//   //   } else {
//   //     el.style.left = pos.pageX - rect.left - 14 + 'px';
//   //   }

//   //   el.style.top = pos.pageY - rect.top + (isCaret ? lineHeight : -34) + 'px';
//   // }

//   function setHandlePosition(el, row, col, isCaret = false) {
//     const pos = editor.renderer.textToScreenCoordinates(row, col);
//     const rect = editor.container.getBoundingClientRect();
//     const lineHeight = editor.renderer.lineHeight;

//     el.style.position = 'absolute';

//     if (isCaret) {
//         // kasih offset agar waterdrop berada di bawah line, tidak nutup cursor
//         el.style.left = (pos.pageX - rect.left - 60) + 'px';
//         el.style.top = (pos.pageY - rect.top + lineHeight - 2) + 'px'; // -2 px biar pas di bawah
//     } else {
//         el.style.left = (pos.pageX - rect.left - 14) + 'px';
//         el.style.top = (pos.pageY - rect.top - 34) + 'px';
//     }
// }

//   function screenToCursor(clientX, clientY) {
//     const rect = editor.container.getBoundingClientRect();
//     const x = clientX - rect.left;
//     const y = clientY - rect.top;
//     return editor.renderer.screenToTextCoordinates(x, y);
//   }

//   let isDraggingCaret = false;
//   let isDraggingLeft = false;
//   let isDraggingRight = false;

//   // ======= touch events di caret =======
//   caret.addEventListener('touchstart', e => {
//     e.stopPropagation();
//     e.preventDefault();
//     if (e.touches.length !== 1) return;
//     aceCursor.style.pointerEvents = 'none';
//     isDraggingCaret = true;
//     editor.selection.clearSelection();
//   });
//   let lastHandleScreen = { x: 0, y: 0 };
// caret.addEventListener('touchmove', (e) => {
//     e.stopPropagation();
//     e.preventDefault();
//     if (!isDraggingCaret) return;

//     const touch = e.touches[0];
//     const rect = editor.container.getBoundingClientRect();

//     // Hitung posisi visual bebas
//     const x = touch.clientX - rect.left;
//     const y = touch.clientY - rect.top;
// console.log();
//     // Update posisi handle tanpa batasan text
//   caret.style.top = y + "px";
//   caret.style.left = x + "px";
//   console.log(editor.selection.getRange());
//   console.log(editor.renderer.$cursorLayer.$pixelPos);

//     // scroll viewport agar handle tetap terlihat
// const rowApprox = editor.renderer.screenToTextCoordinates(x, y).row;
//     const safeRow = Math.max(0, Math.min(rowApprox, editor.session.getLength() - 1));
//     //editor.renderer.scrollCursorIntoView({row: safeRow, column: 0}, 0.5);
// });
// caret.addEventListener('touchend', () => {
//     isDraggingCaret = false;

//     const rect = editor.container.getBoundingClientRect();
//     const finalX = lastHandleScreen.x + rect.left;
//     const finalY = lastHandleScreen.y + rect.top;

//     // konversi screen ke row/column Ace
//     const finalPos = screenToCursor(finalX, finalY);

//     // update Ace cursor sekali
//     editor.moveCursorToPosition(finalPos);

//     // reset visual handle ke posisi row/column Ace (magnet effect)
//     setHandlePosition(caret, finalPos.row, finalPos.column, true);
// });

//   // caret.addEventListener('touchmove', (e) => {
//   //   e.stopPropagation();
//   //   e.preventDefault();
//   //   if (!isDraggingCaret) return;
//   //   aceCursor.style.pointerEvents = "none"
//   //     const touch = e.touches[0];
//   //   const newPos = screenToCursor(touch.clientX, touch.clientY);
//   //   console.log(e.target, "why");

//   //   editor.moveCursorToPosition(newPos);//ubah ini agar pas drag caret ngk membuat caret ke ikut tersu ke cursor yang bikin cursor event nya hilang atau pindah ke caret ini penyebab nya
//   //     setHandlePosition(caret, newPos.row, newPos.column, true);
//   // });

//   // ======= touch events di left handle selection =======
//   leftSel.addEventListener('touchstart', e => {
//     if (e.touches.length !== 1) return;
//     isDraggingLeft = true;
//     e.stopPropagation();
//     e.preventDefault();
//   });

//   leftSel.addEventListener('touchmove', e => {
//     if (!isDraggingLeft) return;
//     const touch = e.touches[0];
//     const newPos = screenToCursor(touch.clientX, touch.clientY);
//     const range = editor.getSelection().getRange();
//     range.setStart(newPos.row, newPos.column);
//     editor.getSelection().setSelectionRange(range);
//     e.stopPropagation();
//     e.preventDefault();
//   });

//   leftSel.addEventListener('touchend', () => {
//     isDraggingLeft = false;
//   });

//   // ======= touch events di right handle selection =======
//   rightSel.addEventListener('touchstart', e => {
//     if (e.touches.length !== 1) return;
//     isDraggingRight = true;
//     e.stopPropagation();
//     e.preventDefault();
//   });

//   rightSel.addEventListener('touchmove', e => {
//     if (!isDraggingRight) return;
//     const touch = e.touches[0];
//     const newPos = screenToCursor(touch.clientX, touch.clientY);
//     const range = editor.getSelection().getRange();
//     range.setEnd(newPos.row, newPos.column);
//     editor.getSelection().setSelectionRange(range);
//     e.stopPropagation();
//     e.preventDefault();
//   });

//   rightSel.addEventListener('touchend', () => {
//     isDraggingRight = false;
//   });

//   // =========================================================

//   // Update visual caret dan selection sesuai logika asli
//   editor.renderer.on('afterRender', () => {
//     if (!editor.isFocused()) {
//       caret.style.display = 'none';
//       leftSel.style.display = 'none';
//       rightSel.style.display = 'none';
//       return;
//     }

//     const sel = editor.getSelection();
//     const isSelecting = !sel.isEmpty();

//     // Hindari pembaruan posisi saat sedang drag
//     if (isDraggingCaret || isDraggingLeft || isDraggingRight) {
//       return;
//     }

//     if (isSelecting) {
//       caret.style.display = 'none';
//       leftSel.style.display = 'block';
//       rightSel.style.display = 'block';

//       const range = sel.getRange();
//       setHandlePosition(leftSel, range.start.row, range.start.column);
//       setHandlePosition(rightSel, range.end.row, range.end.column);
//     } else {
//       caret.style.display = 'block';
//       leftSel.style.display = 'none';
//       rightSel.style.display = 'none';

//       const caretPos = editor.getCursorPosition();
//       setHandlePosition(caret, caretPos.row, caretPos.column, true);
//     }
//   });

//   editor.on('blur', () => {
//     caret.style.display = 'none';
//     leftSel.style.display = 'none';
//     rightSel.style.display = 'none';
//   });
// }

// // Panggil fungsi customCursor() sekali saja setelah editor dimuat
// customCursor();

const editor = ace.edit('editor');
const aceLayer = editor.renderer.$cursorLayer.element;
// Inisialisasi TouchCursors seperti SPCK Editor
class TouchCursors {
  constructor(editor, options = {}) {
    this.editor = editor;
    this.renderer = editor.renderer;
    this.cursorLayer = this.renderer.$cursorLayer.element;
    this.container = editor.container; // <-- perbaikan di sini
    this.keepTextAreaAtCursor = options.keepTextAreaAtCursor || false;

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
    });
  }

  updateCursors() {
    if (this.touching === 'c' || this.touching === 'l' || this.touching === 'r')
      return;

    const cursorPos = this.renderer.$cursorLayer.$pixelPos;
    if (!cursorPos) return;

    // update caretCursor position
    this.caretCursor.element.style.left = cursorPos.left - 12 + 'px';
    this.caretCursor.element.style.top = cursorPos.top + 21 + 'px';
    this.showCursor(this.caretCursor);

    // update leftCursor and rightCursor positions
    const range = this.editor.selection.getRange();
    const leftPos = this.renderer.$cursorLayer.getPixelPosition(range.start);
    const rightPos = this.renderer.$cursorLayer.getPixelPosition(range.end);
    if (this.touching !== 'r') {
      this.rightCursor.element.style.left = rightPos.left + 'px';
      this.rightCursor.element.style.top = rightPos.top + 'px';
      this.showCursor(this.rightCursor);
    }
    if (this.touching !== 'l') {
      this.leftCursor.element.style.left = leftPos.left + 'px';
      this.leftCursor.element.style.top = leftPos.top + 'px';
      this.showCursor(this.leftCursor);
    }
  }

  initEventListeners() {
    // Mulai drag caret cursor
    //kode yang berfungsi baik di sini sampai ---
    this.caretCursor.element.addEventListener('touchstart', e => {
      e.preventDefault();
      this.touching = 'c';
    });

    // Drag caret cursor
    this.caretCursor.element.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[touchmove] caret', this.touching); // ✅ debug
      if (this.touching !== 'c') return;
      const touch = e.changedTouches[0];
      if (touch) {
        console.log('[handleCaretMove] pos', touch.clientX, touch.clientY); // ✅ debug
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

    //bagian sini yang belum berfungsi saat drag
    // Drag right cursor
    this.rightCursor.element.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      this.touching = 'r'; // Menandai bahwa drag dimulai pada right cursor
      const touch = e.touches[0];
      this.initialTouch = { x: touch.clientX, y: touch.clientY };
    });

    // Drag right cursor
    this.rightCursor.element.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();

      const touch = e.changedTouches[0];
      if (this.touching === 'r' && touch) {
        // Sembunyikan caretCursor saat melakukan drag selection
        this.hideCursor(this.caretCursor);

        // Update posisi rightCursor sesuai dengan touch position
        this.handleRightMove(touch.clientX, touch.clientY);
      }
    });

    this.rightCursor.element.addEventListener('touchend', e => {
      e.preventDefault();
      if (this.touching === 'r') this.touching = null;
      const touch = e.changedTouches[0];
      if (touch) this.onDragEnd(touch.clientX, touch.clientY);
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

    // Drag left cursor
    this.leftCursor.element.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();

      const touch = e.changedTouches[0];
      if (this.touching === 'l' && touch) {
        // Sembunyikan caretCursor saat melakukan drag selection
        this.hideCursor(this.caretCursor);

        // Update posisi leftCursor sesuai dengan touch position
        this.handleLeftMove(touch.clientX, touch.clientY);
      }
    });

    this.leftCursor.element.addEventListener('touchend', e => {
      e.preventDefault();
      if (this.touching === 'l') this.touching = null;
      const touch = e.changedTouches[0];
      if (touch) this.onDragEnd(touch.clientX, touch.clientY);
    });

    this.leftCursor.element.addEventListener('touchcancel', e => {
      e.preventDefault();
      if (this.touching === 'l') this.touching = null;
    });
    // Double tap detection on editor container
    let lastTap = 0;
    this.container.addEventListener('touchstart', e => {
      e.stopP;

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 200 && tapLength > 0) {
        this.onDoubleTap(e);
      }
      lastTap = currentTime;
      console.log(e.target);
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
  onDoubleTap(e) {
    const touch = e.touches[0];
    const pos = this.renderer.screenToTextCoordinates(
      touch.clientX,
      touch.clientY,
    );

    const session = this.editor.getSession();
    const range = session.getWordRange(pos.row, pos.column);
    this.editor.selection.setRange(range);

    const leftPos = this.renderer.$cursorLayer.getPixelPosition(range.start);
    const rightPos = this.renderer.$cursorLayer.getPixelPosition(range.end);

    setTimeout(() => {
      this.leftCursor.element.style.left = `${leftPos.left}px`;
      this.leftCursor.element.style.top = `${leftPos.top}px`;

      this.rightCursor.element.style.left = `${rightPos.left}px`;
      this.rightCursor.element.style.top = `${rightPos.top}px`;

      this.showCursor(this.leftCursor);
      this.showCursor(this.rightCursor);
    }, 0); // ⚠️ delay 1 frame untuk pastikan cursor bisa disentuh
  }

  // onDragEnd(clientX, clientY) {
  //   this.touching = null;

  //   if (clientX !== undefined && clientY !== undefined) {
  //     const rect = this.renderer.$cursorLayer.element.getBoundingClientRect();
  //     const { lineHeight } = this.renderer.layerConfig;

  //     const coords = this.renderer.screenToTextCoordinates(
  //       clientX + 1,
  //       clientY - 0.5 * (34 + lineHeight),
  //     );

  //     if (coords) {
  //       this.editor.moveCursorTo(coords.row, coords.column);
  //       this.editor.selection.clearSelection();
  //     }
  //   }

  //   this.updateCursors();
  // }

  onDragEnd(clientX, clientY) {
    this.touching = null;

    if (clientX !== undefined && clientY !== undefined) {
      const rect = this.renderer.$cursorLayer.element.getBoundingClientRect();
      const { lineHeight } = this.renderer.layerConfig;

      const coords = this.renderer.screenToTextCoordinates(
        clientX + 1,
        clientY - 0.5 * (34 + lineHeight),
      );

      if (coords) {
        const range = this.editor.selection.getRange();

        if (this.touching === 'r') {
          range.end = coords; // Update hanya range.end untuk rightCursor
        } else if (this.touching === 'l') {
          range.start = coords; // Update hanya range.start untuk leftCursor
        }

        this.editor.selection.setRange(range);
        this.editor.selection.clearSelection();
      }
    }

    // Update posisi leftCursor dan rightCursor, tanpa mengubah caretCursor
    this.updateCursors();

    // Tampilkan kembali caretCursor setelah drag selesai
    this.showCursor(this.caretCursor);
    // Sembunyikan handle selection setelah drag selesai
    this.hideCursor(this.leftCursor);
    this.hideCursor(this.rightCursor);
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
      this.updateCursors();
    }
  }

  handleRightMove(clientX, clientY) {
    const range = this.editor.selection.getRange();
    const coords = this.renderer.screenToTextCoordinates(clientX, clientY);

    // Update hanya range.end untuk rightCursor
    if (
      coords.row > range.start.row ||
      (coords.row === range.start.row && coords.column > range.start.column)
    ) {
      range.end = coords; // Hanya update rightCursor (range.end)
      this.editor.selection.setRange(range);

      // Update posisi rightCursor saja
      const rightPos = this.renderer.$cursorLayer.getPixelPosition(range.end);
      this.rightCursor.element.style.left = `${rightPos.left}px`;
      this.rightCursor.element.style.top = `${rightPos.top}px`;

      // Pastikan leftCursor tidak bergerak
      this.updateCursors();
    }
  }

  handleLeftMove(clientX, clientY) {
    const range = this.editor.selection.getRange();
    const coords = this.renderer.screenToTextCoordinates(clientX, clientY);

    if (
      coords.row < range.end.row ||
      (coords.row === range.end.row && coords.column < range.end.column)
    ) {
      range.start = coords;
      this.editor.selection.setRange(range);

      // Update posisi leftCursor hanya
      const leftPos = this.renderer.$cursorLayer.getPixelPosition(range.start);
      this.leftCursor.element.style.left = `${leftPos.left}px`;
      this.leftCursor.element.style.top = `${leftPos.top}px`;

      this.updateCursors(); // Memastikan kanan tidak ikut
    }
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
// editor.setTheme('ace/theme/github_dark');
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

// --- SESUAIKAN MAX LINES EDITOR ---
function updateEditorMaxLines() {
  // ambil parent langsung dari #editor
  const parentEl = document.getElementById('editor').parentElement;

  editor.resize(true); // refresh agar lineHeight terbaru
  // pakai tinggi parent
  const availableHeight = parentEl.clientHeight;
  // console.log(availableHeight);
  const lineHeight = editor.renderer.lineHeight;

  const maxLines = Math.floor(availableHeight / lineHeight);

  editor.setOptions({ maxLines, minLines: 1 });
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
setEditorFontSize(14);
// update kalau layar resize
window.addEventListener('resize', updateEditorMaxLines);

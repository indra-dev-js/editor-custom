      event.addListener(
        el,
        'touchmove',
        function (e) {
          if (longTouchTimer) {
            clearTimeout(longTouchTimer);
            longTouchTimer = null;
          }
          var touches = e.touches;
          if (touches.length > 1 || mode == 'zoom') return;
          var touchObj = touches[0];
          var wheelX = startX - touchObj.clientX;
          var wheelY = startY - touchObj.clientY;
          if (mode == 'wait') {
            if (wheelX * wheelX + wheelY * wheelY > 4) mode = 'cursor';
            else return e.preventDefault();
          }
          startX = touchObj.clientX;
          startY = touchObj.clientY;
          e.clientX = touchObj.clientX;
          e.clientY = touchObj.clientY;
          var t = e.timeStamp;
          var dt = t - lastT;
          lastT = t;
          if (mode == 'scroll') {
            var mouseEvent = new MouseEvent(e, editor);
            mouseEvent.speed = 1;
            mouseEvent.wheelX = wheelX;
            mouseEvent.wheelY = wheelY;
            if (10 * Math.abs(wheelX) < Math.abs(wheelY)) wheelX = 0;
            if (10 * Math.abs(wheelY) < Math.abs(wheelX)) wheelY = 0;
            if (dt != 0) {
              const speedMultiplier = 40;

              vX = (wheelX / dt) * speedMultiplier;
              vY = (wheelY / dt) * speedMultiplier;
              // ===== DETEKSI SWIPE =====
              const speed = Math.sqrt(vX * vX + vY * vY);
              let swipeType;
              if (speed < 0.5) swipeType = 'slow';
              else if (speed < 5) swipeType = 'medium';
              else swipeType = 'fast';
              editor.swipeType = swipeType;
              output2.textContent = `Swipe speed:', ${
                (speed.toFixed(2), swipeType)
              }`;
    
            }
            editor._emit('mousewheel', mouseEvent);
            if (!mouseEvent.propagationStopped) {
              vX = vY = 0;
            }
            // animate();
            e.preventDefault();
          } else {
            var ev = new MouseEvent(e, editor);
            var pos = ev.getDocumentPosition();
            // if (mode == 'cursor') editor.selection.moveCursorToPosition(pos);
            // else if (mode == 'anchor')
            //   editor.selection.setSelectionAnchor(pos.row, pos.column);
            // editor.renderer.scrollCursorIntoView(pos);
            e.preventDefault();
          }
        },
        editor,
      );

      function animate() {

        if (animationFrame) cancelAnimationFrame(animationFrame);

        function step() {
          // stop hanya kalau hampir 0 atau terlalu lama jalan

            if (Math.abs(vX) < 0.8 && Math.abs(vY) < 0.8) {
              vX = 0;
              vY = 0;
              output.style.color = 'red';
              output.textContent = vY;
              animationFrame = null;
              return;
            }

            editor.renderer.scrollBy(vX, vY);
           // output2.textContent = vY;
            // friction
            vX *= 0.8;
            vY *= 0.8;

          animationFrame = requestAnimationFrame(step);
        }

        step();
      }

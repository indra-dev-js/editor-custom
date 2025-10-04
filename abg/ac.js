    event.addListener(el, "touchstart", function (e) {
        var touches = e.touches;
        if (longTouchTimer || touches.length > 1) {
            clearTimeout(longTouchTimer);
            longTouchTimer = null;
            touchStartT = -1;
            mode = "zoom";
            return;
        }
        pressed = editor.$mouseHandler.isMousePressed = true;
        var h = editor.renderer.layerConfig.lineHeight;
        var w = editor.renderer.layerConfig.lineHeight;
        var t = e.timeStamp;
        lastT = t;
        var touchObj = touches[0];
        var x = touchObj.clientX;
        var y = touchObj.clientY;
        if (Math.abs(startX - x) + Math.abs(startY - y) > h)
            touchStartT = -1;
        startX = e.clientX = x;
        startY = e.clientY = y;
        
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    vX = 0;
    vY = 0;
        // vX = vY = 0;
        var ev = new MouseEvent(e, editor);
        pos = ev.getDocumentPosition();
        if (t - touchStartT < 500 && touches.length == 1 && !animationSteps) {
            clickCount++;
            e.preventDefault();
            e.button = 0;
            switchToSelectionMode();
        }
        else {
            clickCount = 0;
            var cursor = editor.selection.cursor;
            var anchor = editor.selection.isEmpty() ? cursor : editor.selection.anchor;
            var cursorPos = editor.renderer.$cursorLayer.getPixelPosition(cursor, true);
            var anchorPos = editor.renderer.$cursorLayer.getPixelPosition(anchor, true);
            var rect = editor.renderer.scroller.getBoundingClientRect();
            var offsetTop = editor.renderer.layerConfig.offset;
            var offsetLeft = editor.renderer.scrollLeft;
            var weightedDistance = function (x, y) {
                x = x / w;
                y = y / h - 0.75;
                return x * x + y * y;
            };
            if (e.clientX < rect.left) {
                mode = "zoom";
                return;
            }
            var diff1 = weightedDistance(e.clientX - rect.left - cursorPos.left + offsetLeft, e.clientY - rect.top - cursorPos.top + offsetTop);
            var diff2 = weightedDistance(e.clientX - rect.left - anchorPos.left + offsetLeft, e.clientY - rect.top - anchorPos.top + offsetTop);
            if (diff1 < 3.5 && diff2 < 3.5)
                mode = diff1 > diff2 ? "cursor" : "anchor";
            if (diff2 < 3.5)
                mode = "anchor";
            else if (diff1 < 3.5)
                mode = "cursor";
            else
                mode = "scroll";
            longTouchTimer = setTimeout(handleLongTap, 450);
        }
        touchStartT = t;
    }, editor);
    event.addListener(el, "touchend", function (e) {
        pressed = editor.$mouseHandler.isMousePressed = false;
        if (animationTimer)
            clearInterval(animationTimer);
        if (mode == "zoom") {
            mode = "";
            animationSteps = 0;
        }
        else if (longTouchTimer) {
            editor.selection.moveToPosition(pos);
            animationSteps = 0;
            //showContextMenu();
        }
else if (mode == "scroll") {

            // ************** PERBAIKAN DI SINI **************
            // Tentukan ambang batas minimum kecepatan untuk memicu inersia
            // Coba mulai dari 5.0. Ini akan mengabaikan kecepatan 'sisa'.
            const MIN_VELOCITY_FOR_FLICK = 6.0; 
            
            // Hitung kecepatan gabungan
            const velocityMagnitude = Math.sqrt(vX * vX + vY * vY);

            if (velocityMagnitude > MIN_VELOCITY_FOR_FLICK) {
                // Kecepatan cukup kuat, picu inersia
                animate();
            } else {
                // Kecepatan terlalu pelan (sisa), hentikan total
                vX = 0;
                vY = 0;
            }
            // ***********************************************
        }
        
        clearTimeout(longTouchTimer);
        longTouchTimer = null;
    }, editor);
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
           else  return e.preventDefault();
          }
          startX = touchObj.clientX;
          startY = touchObj.clientY;
          e.clientX = touchObj.clientX;
          e.clientY = touchObj.clientY;
         var t = e.timeStamp;
          
          
         var dt = t - lastT;
          lastT = t;
      
    /*      
       if (mode == 'scroll') {
            var mouseEvent = new MouseEvent(e, editor);
            mouseEvent.speed = 1;
            mouseEvent.wheelX = wheelX;
            mouseEvent.wheelY = wheelY;
            if (10 * Math.abs(wheelX) < Math.abs(wheelY)) wheelX = 0;
            if (10 * Math.abs(wheelY) < Math.abs(wheelX)) wheelY = 0;
if (dt !== 0) {
    const ALPHA = 0.5; // Faktor smoothing. 0.5 berarti 50% nilai baru, 50% nilai lama.
    const RAW_MULTIPLIER = 1000; // Nilai mentah, lebih besar.

    // Hitung kecepatan mentah
    let rawVX = (wheelX / dt) * RAW_MULTIPLIER;
    let rawVY = (wheelY / dt) * RAW_MULTIPLIER;

    // Smoothing: Gabungkan dengan kecepatan sebelumnya
    // Ini mengurangi efek "putus-putus" akibat dt yang tidak stabil
    vX = ALPHA * rawVX + (1 - ALPHA) * vX;
    vY = ALPHA * rawVY + (1 - ALPHA) * vY;

    // Batasi kecepatan maksimum (opsional, untuk mencegah bug kecepatan tak terbatas)
    const MAX_V = 100;
    vX = Math.min(Math.max(vX, -MAX_V), MAX_V);
    vY = Math.min(Math.max(vY, -MAX_V), MAX_V);
        }   
            
            

editor._emit('mousewheel', mouseEvent)
            
        e.preventDefault();
          }   
          */
          
/*if (mode == 'scroll') {
            var mouseEvent = new MouseEvent(e, editor);
            mouseEvent.speed = 1;
            mouseEvent.wheelX = wheelX;
            mouseEvent.wheelY = wheelY; // Nilai scroll langsung
            if (10 * Math.abs(wheelX) < Math.abs(wheelY)) wheelX = 0;
            if (10 * Math.abs(wheelY) < Math.abs(wheelX)) wheelY = 0;
            
            // LOG 1: Perintah Scroll Langsung
            console.log("SCROLL LANGSUNG (wheelY):", mouseEvent.wheelY); 
            
if (dt !== 0) {
    const ALPHA = 0.5;
    const RAW_MULTIPLIER = 200;

    // Hitung kecepatan mentah
    let rawVX = (wheelX / dt) * RAW_MULTIPLIER;
    let rawVY = (wheelY / dt) * RAW_MULTIPLIER;

    // Smoothing
    vX = ALPHA * rawVX + (1 - ALPHA) * vX;
    vY = ALPHA * rawVY + (1 - ALPHA) * vY;

    // Batasi kecepatan maksimum
    const MAX_V = 100;
    vX = Math.min(Math.max(vX, -MAX_V), MAX_V);
    vY = Math.min(Math.max(vY, -MAX_V), MAX_V);
        }   
            
            // LOG 2: Kecepatan Inersia
            console.log("INERSIA TRACKER (vY):", vY);
            
editor._emit('mousewheel', mouseEvent)
            
        e.preventDefault();
          }
// ...
          
      */    
      
      
      // ... di dalam event.addListener(el, 'touchmove', ...)
// ...

          if (mode == 'scroll') {

            // TENTUKAN AMBANG BATAS: 2.5 pixel per frame (2.5 * 2.5 = 6.25)
            const MIN_MOVEMENT_THRESHOLD_SQUARED = 9.0; 
            const currentMovementSquared = wheelX * wheelX + wheelY * wheelY;
            
            // 1. VELOCITY TRACKER (Selalu hitung vX/vY untuk inersia)
            if (dt !== 0) {
                const ALPHA = 0.5;
                const RAW_MULTIPLIER = 200; // NILAI YANG SUDAH ANDA PERBAIKI

                let rawVX = (wheelX / dt) * RAW_MULTIPLIER;
                let rawVY = (wheelY / dt) * RAW_MULTIPLIER;

                vX = ALPHA * rawVX + (1 - ALPHA) * vX;
                vY = ALPHA * rawVY + (1 - ALPHA) * vY;

                const MAX_V = 100;
                vX = Math.min(Math.max(vX, -MAX_V), MAX_V);
                vY = Math.min(Math.max(vY, -MAX_V), MAX_V);
            }   

            // 2. FILTER JITTER: Hanya scroll jika pergerakan melewati ambang batas
            if (currentMovementSquared > MIN_MOVEMENT_THRESHOLD_SQUARED) {

                var mouseEvent = new MouseEvent(e, editor);
                mouseEvent.speed = 1;
                mouseEvent.wheelX = wheelX;
                mouseEvent.wheelY = wheelY;
                if (10 * Math.abs(wheelX) < Math.abs(wheelY)) wheelX = 0;
                if (10 * Math.abs(wheelY) < Math.abs(wheelX)) wheelY = 0;
                
                editor._emit('mousewheel', mouseEvent); // ✅ Scroll Langsung

            }
            
            e.preventDefault();
          } 
// ...
          
          else {
            var ev = new MouseEvent(e, editor);
            
            var pos = ev.getDocumentPosition();

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


         const FRICTION = 0.83; 
vX *= FRICTION;
vY *= FRICTION;
          /*  vX *= 0.8;
            vY *= 0.8;*/
            editor.renderer.scrollBy(vX, vY);
          animationFrame = requestAnimationFrame(step);
        }

        step();
      }
      

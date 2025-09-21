// importScripts('lib/acorn.js');
// importScripts('lib/acorn-loose.js');
// importScripts('lib/walk.js');

// importScripts('lib/signal.js');
// importScripts('lib/tern.js');
// importScripts('lib/def.js');
// importScripts('lib/infer.js');
// importScripts('lib/comment.js');

// let server = null;

// Promise.all([
//     fetch('lib/defs/ecmascript.json').then(res => res.json()),
//     fetch('lib/defs/browser.json').then(res => res.json())
// ])
// .then(defs => {
//     // defs sekarang adalah array dari kedua objek JSON yang dimuat
//     server = new tern.Server({ defs: defs });
//     postMessage({ ready: true });
// });

// onmessage = function(e) {
//   if (!server) return; // <-- jangan lanjut kalau belum siap

//   const { type, code, pos } = e.data;

//   if (type === "completion") {
//     try { server.delFile("file1.js"); } catch(_) {}
//     server.addFile("file1.js", code);

//     server.flush(() => {
//       server.request({
//         query: {
//           type: "completions",
//           file: "file1.js",
//           end: pos,
//           types: true,
//           depths: true,
//           docs: true
//         }
//       }, (err, resp) => {
//         postMessage(resp);
//       });
//     });
//   }

//   // ✨ Tambah tooltip
//     if (type === "tooltip") {
//         try { server.delFile("file1.js"); } catch(_) {}
//         server.addFile("file1.js", code);

//         server.flush(() => {
//             server.request({
//                 query: {
//                     type: "type",
//                     file: "file1.js",
//                     end: pos,
//                     types: true,
//                     docs: true
//                 }
//             }, (err, resp) => {
//                 postMessage({ tooltip: resp });
//             });
//         });
//     }

// };

importScripts(
  'lib/acorn.js',
  'lib/acorn-loose.js',
  'lib/walk.js',
  'lib/signal.js',
  'lib/tern.js',
  'lib/def.js',
  'lib/infer.js',
  'lib/comment.js',
  'lib/plugin/complete_strings.js', // <-- plugin string autocomplete
);

let server = null;

Promise.all([
  fetch('lib/defs/ecmascript.json').then(res => res.json()),
  fetch('lib/defs/browser.json').then(res => res.json()),
]).then(defs => {
  // aktifkan plugin saat bikin server
  server = new tern.Server({
    defs: defs,
    plugins: {
      complete_strings: {}, // aktifkan plugin
    },
  });
  postMessage({ ready: true });
});

onmessage = function (e) {
  if (!server) return;

  const { type, code, pos } = e.data;

  if (type === 'completion') {
    try {
      server.delFile('file1.js');
    } catch (_) {}
    server.addFile('file1.js', code);

    server.flush(() => {
      server.request(
        {
          query: {
            type: 'completions',
            file: 'file1.js',
            end: pos,
            types: true,
            depths: true,
            docs: true,
          },
        },
        (err, resp) => {
          postMessage(resp);
        },
      );
    });
  }

  if (type === 'tooltip') {
    try {
      server.delFile('file1.js');
    } catch (_) {}
    server.addFile('file1.js', code);

    server.flush(() => {
      server.request(
        {
          query: {
            type: 'type',
            file: 'file1.js',
            end: pos,
            types: true,
            docs: true,
          },
        },
        (err, resp) => {
          if (typeof resp === 'undefined' || resp.type === '?') return;

          postMessage({ tooltip: resp });
          console.log(resp);
        },
      );
    });
  }
};

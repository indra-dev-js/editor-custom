class BranchModeJs {
  static rulesJs(_this) {
    // safety check awal
    if (!_this || !_this.$rules) return;
    const rules = _this.$rules;

    // ambil komentar kalau ada, atau array kosong
    const comments = Array.isArray(rules.comment) ? [...rules.comment] : [];

    const method_name =
      '[a-zA-Z\\$_\u00a1-\uffff][a-zA-Z\\d\\$_\u00a1-\uffff]*';

    // pastikan state2 yang bakal kita pakai ada
    rules['no_regex'] = rules['no_regex'] || [];
    rules['property'] = rules['property'] || [];
    rules['object_class'] = rules['object_class'] || [];

    // daftar builtins
    
const builtins = [
    "Array",
    "ArrayBuffer",
    "arguments",
    "BigInt",
    "Boolean",
    "Date",
    "decodeURI",
    "decodeURIComponent",
    "Document",
    "encodeURI",
    "encodeURIComponent",
    "Error",
    "eval",
    "EvalError",
    "Float32Array",
    "Float64Array",
    "Function",
    "Int16Array",
    "Int32Array",
    "Int8Array",
    "InternalError",
    "Intl",
    "isFinite",
    "isNaN",
    "Iterator",
    "JSON",
    "Map",
    "Math",
    "NaN",
    "Namespace",
    "Number",
    "Object",
    "parseFloat",
    "parseInt",
    "Promise",
    "prototype",
    "Proxy",
    "QName",
    "RangeError",
    "ReferenceError",
    "Reflect",
    "RegExp",
    "Set",
    "StopIteration",
    "String",
    "Symbol",
    "SyntaxError",
    "this",
    "TypeError",
    "Uint16Array",
    "Uint32Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "URIError",
    "WeakMap",
    "WeakSet",
  "window",
    "document",
    "Window",
    "XML",
    "XMLList"
];
    
    

    const builtinsRe = '\\b(?:' + builtins.join('|') + ')\\b';

    // rules: class names (exclude builtins) + builtins styling
    rules['no_regex'].unshift({
      token: 'entity.name.class',
      regex: '(?!' + builtinsRe + ')\\b[A-Z][A-Za-z0-9_$]*\\b',
    });

    rules['no_regex'].unshift({
      token: 'variable.language',
      regex: builtinsRe,
    });

    // method call + single-dot operator
    rules['no_regex'].unshift(
      {
        token: ['entity.name.function', 'text', 'paren.lparen'],
        regex: '(' + method_name + ')(\\s*)(\\()',
        next: 'default_parameter',
      },
      {
        token: 'punctuation.operator',
        regex: /[.](?![.])/,
      },
    );

    // keyword -> masuk ke object_class state
    rules['no_regex'].unshift({
      token: 'keyword',
      regex: '\\b(class|constructor|if|else|extends|for)\\b',
      next: 'object_class',
    });

    // bangun object_class state — sisipkan komentar jika ada
    rules['object_class'].unshift(
      ...(comments.length ? comments : []),
      { token: 'text', regex: '\\s+' },
      {
        token: 'entity.name.class',
        regex: '(' + method_name + ')',
        next: 'no_regex',
      },
      { token: 'punctuation.operator', regex: '$' },
      { token: 'empty', regex: '', next: 'no_regex' },
    );

    // property tweaks
    rules['property'].unshift({
      token: 'constant.language.boolean',
      regex: '\\b(?:true|false)\\b',
    });

    // filter property safely (handle token array/string)
    rules['property'] = rules['property'].filter(rule => {
      if (!rule) return false;
      const tok = rule.token;
      const tokens = Array.isArray(tok) ? tok : [tok];
      return (
        !tokens.includes('support.function.dom') &&
        !tokens.includes('support.constant')
      );
    });

    // recompute/compile rules supaya Ace nge-apply perubahan
    // if (typeof _this.normalizeRules === 'function') {
    //   _this.normalizeRules();
    // }
  }
  
  static getClasses() {
    return this.mode();
  } 
  /** Mode JS custom */
static mode() {
  const JavaScriptMode = ace.require('ace/mode/javascript').Mode;
  const JsHighlight = ace.require(
    'ace/mode/javascript_highlight_rules',
  ).JavaScriptHighlightRules;

  class CustomJsRules extends JsHighlight {
    constructor() {
      super();
      BranchModeJs.rulesJs(this);
      this.normalizeRules();
    }
  }

  class CustomJsMode extends JavaScriptMode {
    constructor() {
      super();
      this.HighlightRules = CustomJsRules;
    }
  }

  // ✅ return dua-duanya
  return new CustomJsMode();
}

}

class BranchModeHtml {
  /** Mode HTML custom dengan embedded JS custom */
  static rulesJs(_this) {
    // safety check awal
    if (!_this || !_this.$rules) return;
    const rules = _this.$rules;

    // ambil komentar kalau ada, atau array kosong
    const comments = Array.isArray(rules.comment) ? [...rules.comment] : [];

    const method_name =
      '[a-zA-Z\\$_\u00a1-\uffff][a-zA-Z\\d\\$_\u00a1-\uffff]*';

    // pastikan state2 yang bakal kita pakai ada
    rules['js-no_regex'] = rules['js-no_regex'] || [];
    rules['js-property'] = rules['js-property'] || [];
    rules['js-object_class'] = rules['js-object_class'] || [];

    // daftar builtins
    const builtins = [
      'Window',
      'Document',
      'Math',
      'JSON',
      'Array',
      'Object',
      'String',
      'Number',
      'Boolean',
      'Function',
      'Error',
      'RegExp',
      'Date',
      'Promise',
      'Set',
      'Map',
      'WeakSet',
      'WeakMap',
      'Symbol',
      'BigInt',
      'Reflect',
      'Proxy',
      'Intl',
      'NaN',
    ];
    const builtinsRe = '\\b(?:' + builtins.join('|') + ')\\b';

    // rules: class names (exclude builtins) + builtins styling
    rules['js-no_regex'].unshift({
      token: 'entity.name.class',
      regex: '(?!' + builtinsRe + ')\\b[A-Z][A-Za-z0-9_$]*\\b',
    });

    rules['js-no_regex'].unshift({
      token: 'variable.language',
      regex: builtinsRe,
    });

    // method call + single-dot operator
    rules['js-no_regex'].unshift(
      {
        token: ['entity.name.function', 'text', 'paren.lparen'],
        regex: '(' + method_name + ')(\\s*)(\\()',
        next: 'js-default_parameter',
      },
      {
        token: 'punctuation.operator',
        regex: /[.](?![.])/,
      },
    );

    // keyword -> masuk ke object_class state
    rules['js-no_regex'].unshift({
      token: 'keyword',
      regex: '\\b(class|constructor|if|else|extends)\\b',
      next: 'js-object_class',
    });

    // bangun object_class state — sisipkan komentar jika ada
    rules['js-object_class'].unshift(
      ...(comments.length ? comments : []),
      { token: 'text', regex: '\\s+' },
      {
        token: 'entity.name.class',
        regex: '(' + method_name + ')',
        next: 'js-no_regex',
      },
      { token: 'punctuation.operator', regex: '$' },
      { token: 'empty', regex: '', next: 'js-no_regex' },
    );

    // property tweaks
    rules['js-property'].unshift({
      token: 'constant.language.boolean',
      regex: '\\b(?:true|false)\\b',
    });

    // filter property safely (handle token array/string)
    rules['js-property'] = rules['js-property'].filter(rule => {
      if (!rule) return false;
      const tok = rule.token;
      const tokens = Array.isArray(tok) ? tok : [tok];
      return (
        !tokens.includes('support.function.dom') &&
        !tokens.includes('support.constant')
      );
    });

    // recompute/compile rules supaya Ace nge-apply perubahan
    // if (typeof _this.normalizeRules === 'function') {
    //   _this.normalizeRules();
    // }
  }
  /** Mode HTML custom dengan embedded JS custom */
  static mode() {
    const HtmlMode = ace.require("ace/mode/html").Mode;
    const HtmlHighlightRules = ace.require("ace/mode/html_highlight_rules").HtmlHighlightRules;


  

    // Custom JS rules class



    // HTML highlight rules
class CustomHtmlHighlightRules extends HtmlHighlightRules {
  constructor() {
    super();
    // apply custom JS rules
    BranchModeHtml.rulesJs(this);


    // embed JS custom rules
    // this.embedTagRules(CustomJsRules, "script", "js-"); // ⚡ panggil embed

    this.normalizeRules();
  }
}




    // HTML mode class
    class CustomHtmlMode extends HtmlMode {
      constructor() {
        super();
        this.HighlightRules = CustomHtmlHighlightRules; //cukup pakai rules custom
  
      }
    }

    // ⚡️ KEMBALIKAN INSTANCE, BUKAN CLASS
    return new CustomHtmlMode(); 
  }
}


// export default BranchModeJs;
// export const BranchMode = {  






// const BranchMode = {
//   js: BranchModeJs.mode(),
//   // bisa tambah mode CSS atau lainnya di sini dengan cara sama
// };

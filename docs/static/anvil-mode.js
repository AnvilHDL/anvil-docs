(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["codemirror"], mod);
    else 
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    CodeMirror.defineMode("anvil", function(config) {
        // Definition keywords
        var definitionKeywords = new Set([
            "const", "struct", "enum", "type", "func", "let",  
            "reg", "spawn", "proc", "loop", "recursive", "chan"
        ]);
        // Module keywords
        var moduleKeywords = new Set(["import"]);
        // Modifiers
        var modifiers = new Set(["extern"]);
        // Control keywords
        var controlKeywords = new Set([
            "if", "else", "match", "generate", "call", "generate_seq",
            "recurse", "dprint", "dfinish", "set",
        ]);

        var otherKeywords = new Set([
            "send", "recv", "sync", "cycle", "put", "ready", "try", "left", "right", 
            
        ]);

        function tokenBase(stream, state) {
            var ch = stream.peek();

            // Line comments
            if (ch === "/" && stream.match("//")) {
                stream.skipToEnd();
                return "comment";
            }

            // Block comments
            if (ch === "/" && stream.match("/*")) {
                state.tokenize = tokenBlockComment;
                return tokenBlockComment(stream, state);
            }

            // Strings
            if (ch === '"') {
                stream.next();
                state.tokenize = tokenString;
                return tokenString(stream, state);
            }

            // BitString (binary/hex literals like 0b1010, 0xFF, etc.)
            if (stream.match(/^0[bB][01_]+/) || stream.match(/^0[xX][0-9a-fA-F_]+/) || stream.match(/^0[oO][0-7_]+/)) {
                return "number";
            }

            // Numbers
            if (stream.match(/^[0-9][0-9_]*/)) {
                return "number";
            }

            // Multi-char operators
            if (stream.match(/^(>>|<<|<= |@|#|>=|==|!=|&&|\|\||->|=>|::|\.\.\.?|:=)/)) {
                return "operator";
            }

            // Single char operators
            if (stream.match(/^[+\-*/%&|^!<>=]/)) {
                return "operator";
            }

            // Brackets
            if (ch === '(' || ch === ')') {
                stream.next();
                return "bracket";
            }
            if (ch === '[' || ch === ']') {
                stream.next();
                return "bracket";
            }
            if (ch === '{' || ch === '}') {
                stream.next();
                return "bracket";
            }

            // Punctuation
            if (stream.match(/^[,;:]/)) {
                return "punctuation";
            }

            // Identifiers and keywords
            if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
                var word = stream.current();
                
                if (definitionKeywords.has(word)) {
                    return "keyword";
                }
                if (moduleKeywords.has(word)) {
                    return "keyword";
                }
                if (modifiers.has(word)) {
                    return "keyword";
                }
                if (controlKeywords.has(word)) {
                    return "keyword";
                }
                if (otherKeywords.has(word)) {
                    return "keyword";
                }
                

                // Check if this is followed by ( for function/proc names
                if (stream.peek() === "(") {
                    return "def";
                }
                
                return "variable";
            }

            stream.next();
            return null;
        }

        function tokenString(stream, state) {
            var escaped = false, ch;
            while ((ch = stream.next()) != null) {
                if (ch === '"' && !escaped) {
                    state.tokenize = tokenBase;
                    return "string";
                }
                escaped = !escaped && ch === "\\";
            }
            return "string";
        }

        function tokenBlockComment(stream, state) {
            var maybeEnd = false, ch;
            while ((ch = stream.next()) != null) {
                if (maybeEnd && ch === "/") {
                    state.tokenize = tokenBase;
                    return "comment";
                }
                maybeEnd = (ch === "*");
            }
            return "comment";
        }

        return {
            startState: function() {
                return { tokenize: tokenBase };
            },
            token: function(stream, state) {
                if (stream.eatSpace()) return null;
                return state.tokenize(stream, state);
            },
            lineComment: "//",
            blockCommentStart: "/*",
            blockCommentEnd: "*/"
        };
    });

    CodeMirror.defineMIME("text/x-anvil", "anvil");
});

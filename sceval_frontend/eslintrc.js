module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": [],
    "rules": {
        "@typescript-eslint/class-name-casing": "error",
        "@typescript-eslint/indent": "error",
        "@typescript-eslint/interface-name-prefix": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-use-before-declare": "error",
        "@typescript-eslint/type-annotation-spacing": "error",
        "curly": "error",
        "default-case": "error",
        "dot-notation": "error",
        "eol-last": "off",
        "guard-for-in": "error",
        "member-ordering": "error",
        "no-bitwise": "error",
        "no-caller": "error",
        "no-console": [
            "off",
            {
                "allow": [
                    "log",
                    "error",
                    "debug",
                    "info",
                    "time",
                    "timeEnd",
                    "trace"
                ]
            }
        ],
        "no-debugger": "off",
        "no-empty": "error",
        "no-empty-functions": "error",
        "no-eval": "error",
        "no-fallthrough": "error",
        "no-multiple-empty-lines": "error",
        "no-new-wrappers": "error",
        "no-unused-labels": "error",
        "radix": "error",
        "@typescript-eslint/tslint/config": [
            "error",
            {
                "rules": {
                    "align": [
                        true,
                        "parameters",
                        "arguments",
                        "statements"
                    ],
                    "comment-format": [
                        true,
                        "check-space"
                    ],
                    "jsdoc-format": true,
                    "max-line-length": [
                        true,
                        120
                    ],
                    "no-duplicate-variable": true,
                    "no-shadowed-variable": true,
                    "no-unused-expression": true,
                    "one-line": [
                        true,
                        "check-catch",
                        "check-else",
                        "check-open-brace",
                        "check-whitespace"
                    ],
                    "quotemark": [
                        true,
                        "single",
                        "jsx-double"
                    ],
                    "semicolon": [
                        true,
                        "always"
                    ],
                    "triple-equals": [
                        true,
                        "allow-null-check"
                    ],
                    "typedef": [
                        true,
                        "parameter",
                        "property-declaration"
                    ],
                    "variable-name": [
                        true,
                        "ban-keywords",
                        "check-format",
                        "allow-leading-underscore",
                        "allow-pascal-case"
                    ],
                    "whitespace": [
                        true,
                        "check-branch",
                        "check-decl",
                        "check-module",
                        "check-operator",
                        "check-separator",
                        "check-type",
                        "check-typecast"
                    ]
                }
            }
        ]
    },
    "globals": {},
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "parser": "@typescript-eslint/parser",
    "plugins": [
        "@typescript-eslint",
        "@typescript-eslint/tslint"
    ]
};

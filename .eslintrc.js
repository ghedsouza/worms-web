module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module"
    },
    "rules": {
        "no-var": [
            "error",
        ],
        "indent": [
            "error",
            4
        ],
        "max-len": [
            "error",
            {
                "ignoreComments": true,
                "ignoreUrls": true,
                "ignoreTrailingComments": true,
            },
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": [
            "off"
        ],
        "no-unused-vars": [
            "warn"
        ],
        "no-inner-declarations": [
            "off"
        ],
    }
};

# Worms

## Running the game

Open `worms.html` in your browser.

## Development Notes

### Requirements:

You need a recent version of node/npm installed.
Install the latest node from https://nodejs.org/en/ to get both.

### Build steps:

After cloning project, run

1. `npm install`
1. `npm run compile`

### Project structure

The game code is all in `src` and written in [ES6](http://www.ecma-international.org/ecma-262/6.0/ECMA-262.pdf). The build steps above use babel and webpack to convert all the ES6 code and node modules into a single browser-compatible ES5 file (`out.js`), which gets included in the shell HTML entrypoint file (`worms.html`). The code creates a single global function `window.run`, which gets executed in a script tag in `worms.html` to start the game.

## References:

- https://stemkoski.github.io/Three.js/ (has refraction example)
- http://asciiflow.com/ (convert diagrams to ascii)
- http://ghostinthecode.net/2016/08/17/fire.html (fire simulation guide)

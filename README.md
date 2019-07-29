# Worms

## [Play game](http://ghedsouza.github.io/worms-web/worms.html)

## Development Notes

### Requirements:

You need a recent version of node and npm installed.
You can get both by installing the latest node from https://nodejs.org/en/.

### Build steps:

New:
- Run `./node_modules/.bin/webpack --watch`

Old:

- Run `npm install` to install dependencies.
- Run `npm run compile` to build `out.js` from the current `src`
  (or, if you have bash, `./compile` is a bit faster).

### Running the game

Run `npm run serve` and then open `localhost:8080` in your browser.

*Note*: Running a web server for the game instead of just opening `worms.html`
directly is necessary because of cross-origin security restrictions that prevent
textures from loading in the context of a local file.


### Project structure

The game code is all in `src` and written in
[ES6](http://www.ecma-international.org/ecma-262/6.0/ECMA-262.pdf).

The build steps above use babel and webpack to convert all the ES6 code and
node modules into a single browser-compatible ES5 file (`out.js`),
which gets included in the shell HTML entrypoint file (`worms.html`).

The code in `src/main.js` creates a single global function `window.run`,
which gets executed in a script tag in `worms.html` to start the game.

## References:

- https://stemkoski.github.io/Three.js/ (has refraction example)
- http://asciiflow.com/ (convert diagrams to ascii)
- http://ghostinthecode.net/2016/08/17/fire.html (fire simulation guide)

# Dev Notes

## Console helpers
Use THREE.js on http://threejs.org/examples/#canvas_lines.

## Blogs
https://phoboslab.org/log/2018/09/underrun-making-of

```
function v3(a,b,c){ return new THREE.Vector3(a,b,c) }
```

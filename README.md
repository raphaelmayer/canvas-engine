# Canvas Game Engine
A light wrapper around the **browser canvas API** to create (mainly) 2D animations and small games.

I often found myself rewriting lots of canvas boilerplate whenever I had a small idea to implement or toy with.
So I wrote this very basic engine to be able to quickly play around with stuff.

**Tested on Firefox, Chrome and Edge**


## Quick Start
This is completely free of any dependencies and the engine is contained in a single file ```CanvasEngine.js```.
You only require CanvasEngine.js and a html file to get started, but it is preferable to also have a separate main.js file for your javascript code. 
Clone this repository and start editing main.js.

If you do not want to clone this repository, you need to copy CanvasEngine.js and handle files and imports yourself.
A minimal setup could look like this, assuming all files are in the same directory:

**index.html**
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
</head>

<body>
    <script src="./CanvasEngine.js"></script>
    <script src="./main.js"></script>
</body>
</html>
```

**main.js**
```
// define some important window constants
const WINDOW_WIDTH = 640;
const WINDOW_HEIGHT= 480;
const PIXEL_SIZE = 10;           // optional, defaults to 1

// initialize new game
const game = new CanvasEngine("EngineDemo", WINDOW_WIDTH, WINDOW_HEIGHT, PIXEL_SIZE);

game.onStart = (game) => {      // runs once before the very first frame
    return true;                // otherwise abort
}

game.onUpdate = (game) => {     // runs on every frame
    return true;                // otherwise abort
}

game.start();                   // start the update loop
```

Firstly create a new CanvasEngine object.
You then need to overwrite ```onStart()``` and ```onUpdate()```.
The last thing to do is to call ```start()```.

See the the documenation below or look into the EXAMPLES folder for more details on how to use this project.


## Basic Usage
### CanvasEngine class
```CanvasEngine``` requires 3 arguments to initialize:
- title - name of the project
- window width - the window width in pixels
- window height - the window height in pixels
- pixel size (optional) - adjust resolution, **defaults to 1.**

*Note: 1 pixel equals pixel size * pixel size actual pixels.*

```
const game = new CanvasEngine("EngineDemo", WINDOW_WIDTH, WINDOW_HEIGHT, PIXEL_SIZE);
```

Two methods need to be overwritten, namely ```game.onStart``` and ```game.onUpdate```.
**game.onStart** runs once before the very first frame. Has to return true else the engine aborts.
If you need to do some async operations you may also return a Promise and resolve it with true when you are done.
**game.onUpdate** runs every frame. If it does not return true, the engine aborts.
A single call to ```game.start()``` will then initiate the loop.

The engine provides the following attributes, which can be accessed via ```game.<attribute>```:
- title
- windowWidth
- windowHeight 
- pixelSize
- rWidth - the resolution width (i.e. ```windowWidth / pixelSize```)
- rHeight - the resolution height (i.e. ```windowHeight / pixelSize```)
- timePreviousFrame - time since the previous frame
- fps - frames per second
- draws - number of individual draw-type function calls per frame
- (experimental) timeBetweenFrames - add a delay between each frame (in ms); **defaults to 0** 

Note, that these attributes should not be overwritten by the user, once the engine has been initialized. (Might be worth it to make them *private* in the future)

### Drawing to the screen
**TODO**

### Listening for User Input
Listening for input events is handled for you. Listening for key input:
```
if (game.keys["w"].pressed || game.keys["w"].held)
    // do something
```

Mouse keys follow the same pattern:
```
if (game.keys["mouse0"].pressed)    // listen for left mouse click
    // do something
```
The names for mouse keys are:
mouse0 = left mouse
mouse1 = middle mouse
mouse2 = right mouse

Additionally the engine exposes the mouse coordinates via ```game.mouse.x``` and ```game.mouse.y```.
For now, one must check, whether game.keys["..."] exists. This is subject to change.

*Note: game.keys[(...)].pressed is true for the single frame following the key release.*

## Examples
You can try out different examples by editing index.html and importing a script from the examples folder instead of main.js, i.e. ```<script src="./EXAMPLES/gameoflife.js"></script>```.
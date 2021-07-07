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
    game.clearWindow();         

    return true;                // otherwise abort
}

game.start();                   // start the update loop
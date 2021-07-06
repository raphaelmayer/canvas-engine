"use strict";

const WW = 800;
const WH = 600;
const CELL_SIZE = 10;
const game = new CanvasEngine("NoiseDemo", WW, WH, CELL_SIZE);
const rand = (min, max) => Math.floor(Math.random() * max) + min;

game.onStart = (game) => {
    return true;
};

game.onUpdate = (game) => {
    for (let i = 0; i < game.rHeight; i++)
        for (let j = 0; j < game.rWidth; j++)
            game.drawRect(j, i, 1, 1, { color: "#2" + rand(10, 99) });

    return true;
};

game.start();
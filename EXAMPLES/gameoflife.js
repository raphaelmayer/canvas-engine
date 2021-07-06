(() => {
    "use strict";

    const WW = 1000;
    const WH = 600;
    const CELL_SIZE = 5;
    const NUM_CELLS = (WW / CELL_SIZE) * (WH / CELL_SIZE);

    const game = new CanvasEngine("Conway's Game of Life", WW, WH, CELL_SIZE);
    const cells = [];
    const newCells = [];
    let selectedCells = {};
    let previousFigure = {};

    game.onStart = (game) => {
        let strIndex = 0;
        const wow = "01111111101111100011100000011111110111110"; // pattern to initialize cells with
        const center = Math.floor(game.rWidth * (game.rHeight / 2)) + game.rWidth / 2; // roughly the center of the window

        for (let i = 0; i < NUM_CELLS; ++i)
            if (center < i && i < center + wow.length)
                cells[i] = wow[strIndex++] === "1";

        const controls = document.getElementById("controls");
        controls.innerHTML = controlsHtmlString();

        return true;
    };

    game.onUpdate = (game) => {
        game.clearWindow();

        // update cell states
        for (let i = 0; i < NUM_CELLS; ++i) {
            const nNeighbors = numNeighbors(cells, i, game.rWidth);
            newCells[i] = false;

            if (cells[i] && 2 <= nNeighbors && nNeighbors <= 3)
                newCells[i] = true;

            if (!cells[i] && nNeighbors === 3)
                newCells[i] = true;
        }

        // draw cells to canvas
        for (let i = 0; i < NUM_CELLS; ++i) {
            if (newCells[i]) {
                const [x, y] = coords2d(i, game.rWidth);
                game.drawRect(x, y, 1, 1, { color: newCells[i] ? "black" : "white" });
            }
            if (cells[i] && !newCells[i]) {
                const [x, y] = coords2d(i, game.rWidth);
                game.drawRect(x, y, 1, 1, { color: "red" });
            }
            cells[i] = newCells[i];
        }

        // draw grid
        for (let i = 0; i < game.rWidth; i++)
            game.drawLine(i, 0, i, game.rHeight, { color: "black", lineWidth: 0.01 });

        for (let i = 0; i < game.rHeight; i++)
            game.drawLine(0, i, game.rWidth, i, { color: "black", lineWidth: 0.01 });

        Object.keys(previousFigure).forEach(index => {
            const [x, y] = coords2d(index, game.rWidth);
            game.drawRect(x, y, 1, 1, { color: "green" });
        });

        Object.keys(selectedCells).forEach(index => {
            const [x, y] = coords2d(index, game.rWidth);
            game.drawRect(x, y, 1, 1, { color: "blue" });
        });

        // draw mouse
        const x = Math.floor(game.mouse.x / game.pixelSize);
        const y = Math.floor(game.mouse.y / game.pixelSize);
        game.drawRect(x, y, 1, 1, { color: "skyblue" });

        // handle user input
        if (game.keys["mouse0"] && (game.keys["mouse0"].held || game.keys["mouse0"]?.pressed)) { // handle mouse click or hold
            if (selectedCells[game.rWidth * y + x])
                selectedCells[game.rWidth * y + x] = false;
            else
                selectedCells[game.rWidth * y + x] = true;
        }

        if (game.keys["Enter"]?.pressed && selectedCells !== {}) {
            previousFigure = selectedCells;
            Object.keys(selectedCells).forEach(index => {
                cells[index] = true;
            });
            selectedCells = {};
        }

        if (game.keys["r"]?.pressed) game.reset();

        return true;
    };

    game.start();
})()

function coords2d(i, w) {
    return [i % w, Math.floor(i / w)];
}

function numNeighbors(cells, i, w) {
    const neighborIndices1d = [
        i - 1 - w, i - w, i + 1 - w,
        i - 1, /*i,*/ i + 1,
        i - 1 + w, i + w, i + 1 + w
    ];

    let count = 0;
    neighborIndices1d.forEach(ni => cells[ni] ? count += 1 : null);
    return count;
}

function controlsHtmlString() {
    return `
        <h3>Controls</h3>
        <p>Left click cells to select them.</p>
        <p>Hold the mouse button to select multiple cells at once.</p>
        <p>Press enter to activate the selected cells.</p>
    `;
}
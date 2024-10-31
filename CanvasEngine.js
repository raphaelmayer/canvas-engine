class CanvasEngine {
    constructor(title, windowWidth, windowHeight, pixelSize = 1) {
        if (!title || !windowWidth || !windowHeight || !pixelSize)
            throw new Error("Could not instantiate CanvasEngine due to missing parameters.");

        document.title = title;

        // Window constants
        this.title = title;
        this.windowWidth = windowWidth;
        this.windowHeight = windowHeight;
        this.pixelSize = pixelSize;
        this.rWidth = windowWidth / pixelSize;
        this.rHeight = windowHeight / pixelSize;

        this.canvas = createCanvas(windowWidth, windowHeight);
        this.context = this.canvas.getContext("2d");

        // Apply global scaling
        this.context.scale(this.pixelSize, this.pixelSize);

        // Internal engine attributes
        this.debug = true;
        this.internalEventHandlers = []; // Used for this.destroy function

        // Public engine attributes
        this.mouse = { x: 0, y: 0 };
        this.keys = {};
        this.timePreviousFrame = 0;
        this.fps = 0;
        this.draws = 0;
        this.timeoutBetweenFrames = 0; // Experimental
    }

    /**
     * This method is to be overwritten by the user. It is called exactly once before the first frame.
     * Aborts, if false is returned.
     * @param {*} game
     * @returns
     */
    onStart = (game) => {
        return false;
    };

    /**
     * This method is to be overwritten by the user. It is called on every new frame.
     * Aborts, if false is returned.
     * @param {*} game
     * @returns
     */
    onUpdate = (game) => {
        return false;
    };

    start = async () => {
        console.log(
            `window size: ${this.windowWidth} * ${this.windowHeight}\n` +
                `pixel ratio: 1:${this.pixelSize}, resolution: ${this.rWidth} * ${this.rHeight}`
        );

        registerKeyboardAndMouseEvents(this);

        // Run user's start function once before the very first frame and await
        // in case the user has to do async stuff in the onStart function. Otherwise has no effect
        if (await this.onStart(this)) requestAnimationFrame(this.update);
    };

    update = (timeCurrentFrame) => {
        if (this.onUpdate(this)) {
            // Calculate deltaTime and FPS
            const now = performance.now();
            this.fps = calculateFps(this.timePreviousFrame, now);
            this.timePreviousFrame = now;

            // Handle built-in debug toggle
            if (this.keys["0"]?.pressed) {
                console.log(this.debug ? "debug off" : "debug on");
                this.debug = !this.debug; // Built-in debug feature
            }

            // Draw debug info if enabled
            if (this.debug) drawDebugInfo(this);

            // Reset keys' pressed and released states
            Object.keys(this.keys).forEach((key) => {
                this.keys[key].pressed = false;
                this.keys[key].released = false;
            });

            // Reset draws counter
            this.draws = 0;

            // Request next frame
            if (this.timeoutBetweenFrames && Number(this.timeoutBetweenFrames))
                setTimeout(() => requestAnimationFrame(this.update), this.timeoutBetweenFrames);
            else requestAnimationFrame(this.update);
        }
    };

    destroy = () => {
        this.internalEventHandlers.forEach((eventListener) => {
            document.removeEventListener(eventListener.type, eventListener.handler);
        });
        this.internalEventHandlers = [];
    };

    /**
     * Draw routines
     */
    clearWindow(color) {
        if (color) this.drawRect(0, 0, this.rWidth, this.rHeight, { color });
        else {
            this.draws++;
            this.context.clearRect(0, 0, this.rWidth, this.rHeight);
        }
    }

    drawArc(x, y, radius, startAngle, endAngle, opts = {}) {
        checkArgsOrThrow("drawArc", arguments);
        this.draws++;

        if (opts.color) this.context.strokeStyle = opts.color;
        if (opts.lineWidth && Number(opts.lineWidth)) this.context.lineWidth = opts.lineWidth;

        this.context.beginPath();
        this.context.arc(x, y, radius, startAngle, endAngle);
        this.context.stroke();
    }

    drawCircle(x, y, radius, opts = {}) {
        checkArgsOrThrow("drawCircle", arguments);

        // TODO: add fill option
        this.drawArc(x, y, radius, 0, 2 * Math.PI, opts);
    }

    drawLine(sx, sy, ex, ey, opts = {}) {
        checkArgsOrThrow("drawLine", arguments);
        this.draws++;

        if (opts.color) this.context.strokeStyle = opts.color;
        if (opts.lineWidth && Number(opts.lineWidth)) this.context.lineWidth = opts.lineWidth;

        this.context.beginPath();
        this.context.moveTo(sx, sy);
        this.context.lineTo(ex, ey);
        this.context.stroke();
    }

    drawRect(x, y, w, h, opts = {}) {
        checkArgsOrThrow("drawRect", arguments);
        this.draws++;

        const fill = opts.fill !== false;
        if (opts.color) this.context.fillStyle = opts.color;
        if (opts.color) this.context.strokeStyle = opts.color;

        if (fill) this.context.fillRect(x, y, w, h);
        else {
            if (opts.lineWidth && Number(opts.lineWidth)) this.context.lineWidth = opts.lineWidth;
            this.context.strokeRect(x, y, w, h);
        }
    }

    drawText(text, x, y, fontSize, opts = {}) {
        checkArgsOrThrow("drawText", arguments);
        this.draws++;

        const font = opts.font ? opts.font : "Arial";
        if (opts.color) this.context.fillStyle = opts.color;

        this.context.save(); // Save the current context state
        // Reset transformations to draw in screen space
        this.context.setTransform(1, 0, 0, 1, 0, 0);

        // Manually scale position, so text position does scale, but font size does not
        const scaledX = x * this.pixelSize;
        const scaledY = y * this.pixelSize;

        y += fontSize; // Adjust y-position for text baseline

        this.context.font = `${fontSize}px ${font}`;
        this.context.fillText(text, scaledX, scaledY + fontSize);

        this.context.restore(); // Restore the context state
    }
}

function calculateFps(timePreviousFrame, timeCurrentFrame) {
    if (!timePreviousFrame) return 0;

    const delta = (timeCurrentFrame - timePreviousFrame) / 1000;
    return (1 / delta).toFixed(0);
}

function registerKeyboardAndMouseEvents(engine) {
    const { debug, canvas } = engine;

    const keydown_handler = (e) => {
        debug && console.log("down:", e.key);
        if (!engine.keys[e.key]) {
            engine.keys[e.key] = { pressed: true, held: true, released: false };
        } else {
            if (!engine.keys[e.key].held) {
                engine.keys[e.key].pressed = true;
            }
            engine.keys[e.key].held = true;
            engine.keys[e.key].released = false;
        }
    };

    const keyup_handler = (e) => {
        debug && console.log("up:", e.key);
        if (engine.keys[e.key]) {
            engine.keys[e.key].held = false;
            engine.keys[e.key].released = true;
        }
    };

    const mousedown_handler = (e) => {
        const key = `mouse${e.button}`;
        debug && console.log(`down: ${key}`);
        if (!engine.keys[key]) {
            engine.keys[key] = { pressed: true, held: true, released: false };
        } else {
            if (!engine.keys[key].held) {
                engine.keys[key].pressed = true;
            }
            engine.keys[key].held = true;
            engine.keys[key].released = false;
        }
    };

    const mouseup_handler = (e) => {
        const key = `mouse${e.button}`;
        debug && console.log(`up: ${key}`);
        if (engine.keys[key]) {
            engine.keys[key].held = false;
            engine.keys[key].released = true;
        }
    };

    const mousemove_handler = (e) => {
        const rect = canvas.getBoundingClientRect();
        engine.mouse.x = (e.clientX - rect.left) / engine.pixelSize;
        engine.mouse.y = (e.clientY - rect.top) / engine.pixelSize;
    };

    document.addEventListener("keydown", keydown_handler);
    document.addEventListener("keyup", keyup_handler);
    document.addEventListener("mousedown", mousedown_handler);
    document.addEventListener("mouseup", mouseup_handler);
    document.addEventListener("mousemove", mousemove_handler);

    engine.internalEventHandlers.push(
        { type: "keydown", handler: keydown_handler },
        { type: "keyup", handler: keyup_handler },
        { type: "mousedown", handler: mousedown_handler },
        { type: "mouseup", handler: mouseup_handler },
        { type: "mousemove", handler: mousemove_handler }
    );
}

function drawDebugInfo(engine) {
    const { context, windowHeight, fps, mouse, draws } = engine;
    const fontSize = 14;
    const padding = 8; // In pixels
    const width = 18; // Approximate width in characters
    const numLines = 4; // Number of debug menu lines

    // Calculate box dimensions
    const boxWidth = width * (fontSize * 0.6) + padding * 2;
    const boxHeight = numLines * fontSize + padding * 3;

    context.save(); // Save the current context state
    // Reset transformations to draw in screen space
    context.setTransform(1, 0, 0, 1, 0, 0);

    // Draw semi-transparent background
    context.fillStyle = "rgba(20,20,20,0.7)";
    context.fillRect(0, windowHeight - boxHeight, boxWidth, boxHeight);

    // Set text style
    context.fillStyle = "white";
    context.font = `${fontSize}px monospace`;

    // Calculate text positions
    const baseY = windowHeight - boxHeight + padding + fontSize;

    // Draw debug text
    context.fillText("FPS: " + fps, padding, baseY);
    context.fillText(`Mouse X: ${mouse.x.toFixed(2)}`, padding, baseY + fontSize);
    context.fillText(`Mouse Y: ${mouse.y.toFixed(2)}`, padding, baseY + fontSize * 2);
    context.fillText(`Draws/frame: ${draws}`, padding, baseY + fontSize * 3);

    context.restore(); // Restore the context state
}

function createCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    document.body.insertBefore(canvas, document.body.childNodes[0]);
    return canvas;
}

function checkArgsOrThrow(fname, args) {
    for (let i = 0; i < args.length - 1; i++) {
        if (args[i] === undefined || args[i] === null) throw new Error(`${fname}: Argument ${i} is undefined or null.`);
    }
}

class CanvasEngine {
    constructor(title, windowWidth, windowHeight, pixelSize = 1) {
        if (!title || !windowWidth || !windowHeight || !pixelSize)
            throw new Error("Could not instantiate CanvasEngine due to missing parameters.");

        document.title = title;

        // window constants
        this.title = title;
        this.windowWidth = windowWidth;
        this.windowHeight = windowHeight;
        this.pixelSize = pixelSize;
        this.rWidth = windowWidth / pixelSize;
        this.rHeight = windowHeight / pixelSize;

        this.canvas = createCanvas(windowWidth, windowHeight);
        this.context = this.canvas.getContext("2d");

        // internal engine attributes
        this.debug = true;
        this.internalEventHandlers = []; // used for this.destroy function

        // public engine attributes
        this.mouse = { x: 0, y: 0 };
        this.keys = {};
        this.timePreviousFrame = 0;
        this.fps = 0;
        this.draws = 0;
        this.timeoutBetweenFrames = 0; // experimental
    }

    /**
     * This method is to be overwritten by the user. It is called exactly once before the first frame.
     * Aborts, if false is returned.
     * @param {*} game 
     * @returns 
     */
    onStart = game => {
        return false;
    };

    /**
     * This method is to be overwritten by the user. It is called on every new frame.
     * Aborts, if false is returned.
     * @param {*} game 
     * @returns 
     */
    onUpdate = game => {
        return false;
    };

    start = async () => {
        console.log(`window size: ${this.windowWidth} * ${this.windowHeight}\n` +
            `pixel ratio: 1:${this.pixelSize}, resolution: ${this.rWidth} * ${this.rHeight}`);

        registerKeyboardAndMouseEvents(this);

        // run user's start function once before the very first frame and await
        // in case the user has to do async stuff in the onStart function. otherwise has no effect
        if (await this.onStart(this))
            requestAnimationFrame(this.update);
    }

    update = () => {
        if (this.onUpdate(this)) {
            const now = performance.now();
            this.fps = calculateFps(this.timePreviousFrame, now);
            this.timePreviousFrame = now;

            if (this.keys["0"]?.pressed) {
                console.log(this.debug ? "debug off" : "debug on");
                this.debug = !this.debug; // built-in debug feature
            }
            if (this.debug) drawDebugInfo(this);

            this.keys = persistMouseKeyStates(this);
            this.draws = 0;

            if (this.timeoutBetweenFrames && Number(this.timeoutBetweenFrames))
                setTimeout(() => requestAnimationFrame(this.update), this.timeoutBetweenFrames);
            else
                requestAnimationFrame(this.update);
        }
    }

    destroy = () => {
        this.internalEventHandlers.forEach(
            eventListener => document.removeEventListener(eventListener));
        this.internalEventHandlers = [];
    }

    /**
     * draw routines 
     */
    clearWindow(color) {
        if (color)
            this.drawRect(0, 0, this.rWidth, this.rHeight, { color });
        else {
            this.draws++;
            this.context.clearRect(0, 0, this.windowWidth, this.windowHeight);
        }
    }

    drawArc(x, y, radius, startAngle, endAngle, opts = {}) {
        checkArgsOrThrow("drawArc", arguments);
        this.draws++;

        if (opts.color) this.context.strokeStyle = opts.color;
        if (opts.lineWidth && Number(opts.lineWidth))
            this.context.lineWidth = opts.lineWidth * this.pixelSize;

        x = x * this.pixelSize;
        y = y * this.pixelSize;
        radius *= this.pixelSize;

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
        if (opts.lineWidth && Number(opts.lineWidth))
            this.context.lineWidth = opts.lineWidth * this.pixelSize;

        sx *= this.pixelSize;
        sy *= this.pixelSize;
        ex *= this.pixelSize;
        ey *= this.pixelSize;

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

        x *= this.pixelSize;
        y *= this.pixelSize;
        w *= this.pixelSize;
        h *= this.pixelSize;

        if (fill)
            this.context.fillRect(x, y, w, h);
        else {
            if (opts.lineWidth && Number(opts.lineWidth))
                this.context.lineWidth = opts.lineWidth * this.pixelSize;
            this.context.strokeRect(x, y, w, h);
        }
    }

    drawText(text, x, y, fontSize, opts = {}) {
        checkArgsOrThrow("drawText", arguments);
        this.draws++;

        const font = opts.font ? opts.font : "Arial";
        if (opts.color) this.context.fillStyle = opts.color;

        x *= this.pixelSize;
        y = y * this.pixelSize + fontSize;

        this.context.font = `${fontSize}px ${font}`;
        this.context.fillText(text, x, y);
    }
}

function calculateFps(timePreviousFrame, timeCurrentFrame) {
    if (!timePreviousFrame) return 0;

    const delta = (timeCurrentFrame - timePreviousFrame) / 1000;
    return (1 / delta).toFixed(0);
}

function registerKeyboardAndMouseEvents(engine) {
    const { debug, keys, mouse, canvas } = engine;

    const keydown_event = document.addEventListener("keydown", e => {
        debug && console.log("down:", e.key);
        keys[e.key] = { held: true, pressed: false };
    });
    const mousedown_event = document.addEventListener("mousedown", e => {
        debug && console.log(`down: mouse${e.button}`);
        keys[`mouse${e.button}`] = { held: true, pressed: false };
    });
    const keyup_event = document.addEventListener("keyup", e => {
        debug && console.log("up:", e.key);
        keys[e.key] = { held: false, pressed: true };
    });
    const mouseup_event = document.addEventListener("mouseup", e => {
        debug && console.log(`up: mouse${e.button}`);
        keys[`mouse${e.button}`] = { held: false, pressed: true };
    });
    const mousemove_event = document.addEventListener("mousemove", e => {
        mouse.x = e.x + Math.round(window.scrollX) - canvas.offsetLeft; // is round even sensible?
        mouse.y = e.y + Math.round(window.scrollY) - canvas.offsetTop; // is round even sensible?
    });

    engine.internalEventHandlers.push(keydown_event, mousedown_event, keyup_event, mouseup_event, mousemove_event);
}

/**
 * Contrary to regular keyboard keys, held mouse buttons do not retrigger a mousedown event on each frame.
 * So we need to manually persist the .held attribute of all pressed and held mouse keys across iterations.
 * @param {*} engine 
 * @returns 
 */
function persistMouseKeyStates(engine) {
    const mouseKeyState = {};
    Object.keys(engine.keys).forEach(key => {
        if (key.substring(0, 5) === "mouse" && engine.keys[key].held)
            mouseKeyState[key] = engine.keys[key];
    });
    return mouseKeyState;
}

function drawDebugInfo(engine) {
    const { windowHeight, fps, mouse, draws } = engine;
    const fontSize = 14;
    const padding = 8;                  // in pixels
    const width = 144 / 12;             // this number determines the width of the box and is determined by the text to be displayed
    const numLines = 4;                 // number of debug menu lines; for easy adjustment

    // we are using the canvas API directly to be able to draw the window nicely
    engine.context.fillStyle = "rgba(20,20,20,0.7)";
    engine.context.fillRect(0,
                            windowHeight - ((numLines - 0) * fontSize + padding),
                            width * fontSize + padding * 2,             // padding needs to be doubled to offset the x - padding
                            numLines * fontSize + padding * 3);         // padding needs to be doubled to offset the x - padding + padding for better GUI
    engine.context.fillStyle = "white";
    engine.context.font = `${fontSize}px monospace`;
    engine.context.fillText("FPS: " + fps, padding, windowHeight - ((numLines - 0) * fontSize - padding));
    engine.context.fillText(`mouse x: ${mouse.x}`, padding, windowHeight - ((numLines - 1) * fontSize - padding));
    engine.context.fillText(`mouse y: ${mouse.y}`, padding, windowHeight - ((numLines - 2) * fontSize - padding));
    engine.context.fillText(`draws / frame: ${draws}`, padding, windowHeight - ((numLines - 3) * fontSize - padding));
}

function createCanvas(h, w) {
    const canvas = document.createElement("canvas");
    canvas.width = h;
    canvas.height = w;
    document.body.insertBefore(canvas, document.body.childNodes[0]);
    return canvas;
}

function checkArgsOrThrow(fname, args) {
    for (let i = 0; i < args.length - 1; i++) {
        if (!args[i] && args[i] !== 0) 
            throw new Error(`${fname}: Argument ${i} is undefined or null.`);
    }
}
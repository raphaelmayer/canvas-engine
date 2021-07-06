class CanvasEngine {
    constructor(title, windowWidth, windowHeight, pixelSize = 1) {
        if (!title || !windowWidth || !windowHeight || !pixelSize)
            return console.error("Error: Could not construct due to missing parameters.");

        // window constants
        this.title = title;
        this.windowWidth = windowWidth;
        this.windowHeight = windowHeight;
        this.pixelSize = pixelSize;
        this.rWidth = windowWidth / pixelSize;
        this.rHeight = windowHeight / pixelSize;

        createHtml(this);
        this.canvas = createCanvas(windowWidth, windowHeight);
        this.context = this.canvas.getContext("2d");
        this.buffer = document.createElement("canvas");
        this.buffer.width = windowWidth;
        this.buffer.height = windowHeight;
        this.bufferContext = this.buffer.getContext("2d");

        // engine constants
        this.mouse = { x: 0, y: 0 };
        this.keys = {};
        this.timePreviousFrame = 0;
        this.fps = 0;
        this.debug = false;
        this.timeoutBetweenFrames = 0; // experimental
        this.paused = false;
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

        const returnValue = await this.onStart(this); // run user's start function once before the very first frame
        if (returnValue)
            requestAnimationFrame(this.update);
    }

    update = () => {

        if (this.keys["0"]) this.debug = !this.debug; // built-in debug feature

        this.context.drawImage(this.buffer, 0, 0);

        const now = performance.now();
        this.fps = calculateFps(this.timePreviousFrame, now);
        this.timePreviousFrame = now;

        if (this.onUpdate(this)) {
            outputDebugInfo(this);

            if (this.timeoutBetweenFrames && Number(this.timeoutBetweenFrames))
                setTimeout(() => requestAnimationFrame(this.update), this.timeoutBetweenFrames);
            else
                requestAnimationFrame(this.update);
        }

        const keysToKeep = {}; // held mouse buttons do not retrigger mouse down
        Object.keys(this.keys).forEach(key => {
            if (key.substring(0, 5) === "mouse" && this.keys[key].held)
                keysToKeep[key] = { held: true, pressed: false };
        });
        this.keys = keysToKeep;
    }


    pause = () => {
        this.paused = true;
    }

    // resume does not work for some reason
    resume = () => {
        if (this.paused) {
            this.paused = false;
            console.log("resume");
            requestAnimationFrame(this.update);
        }
    }

    reset = () => {
        this.paused = false;
        this.onStart(this);
    }


    /**
     * draw routines 
     */
    clearWindow(color = "white") {
        // this.bufferContext.clearRect(0, 0, this.windowWidth, this.windowHeight);
        this.drawRect(0, 0, this.rWidth, this.rHeight, { color });
    }

    drawCircle(x, y, radius, opts = {}) {
        if (opts.color) this.bufferContext.strokeStyle = opts.color;
        if (opts.lineWidth && Number(opts.lineWidth))
            this.bufferContext.lineWidth = opts.lineWidth * this.pixelSize;

        x = x * this.pixelSize;
        y = y * this.pixelSize;
        radius *= this.pixelSize;

        this.bufferContext.beginPath();
        this.bufferContext.arc(x, y, radius, 0, 2 * Math.PI);
        this.bufferContext.stroke();
    }

    drawLine(sx, sy, ex, ey, opts = {}) {
        if (opts.color) this.bufferContext.strokeStyle = opts.color;
        if (opts.lineWidth && Number(opts.lineWidth))
            this.bufferContext.lineWidth = opts.lineWidth * this.pixelSize;

        sx *= this.pixelSize;
        sy *= this.pixelSize;
        ex *= this.pixelSize;
        ey *= this.pixelSize;

        this.bufferContext.beginPath();
        this.bufferContext.moveTo(sx, sy);
        this.bufferContext.lineTo(ex, ey);
        this.bufferContext.stroke();

    }

    drawRect(x, y, w, h, opts = {}) {
        const fill = opts.fill !== false;
        if (opts.color) this.bufferContext.fillStyle = opts.color;
        if (opts.color) this.bufferContext.strokeStyle = opts.color;

        x *= this.pixelSize;
        y *= this.pixelSize;
        w *= this.pixelSize;
        h *= this.pixelSize;

        if (fill)
            this.bufferContext.fillRect(x, y, w, h);
        else {
            if (opts.lineWidth && Number(opts.lineWidth))
                this.bufferContext.lineWidth = opts.lineWidth * this.pixelSize;
            this.bufferContext.strokeRect(x, y, w, h);
        }
    }

    drawText(text, x, y, fontsize, opts = {}) {
        const font = opts.font ? opts.font : "Arial";
        if (opts.color) this.bufferContext.fillStyle = opts.color;

        x *= this.pixelSize;
        y *= this.pixelSize;

        this.bufferContext.font = `${fontsize}px ${font}`;
        this.bufferContext.fillText(text, x, y);
    }

    /**
        * Takes any game object (entity, tile, etc) and draws the corresponding sprite to its position.
        * @param {*} gameObject - any tile or entity
        * @param {*} ctx - this.context to draw to (multiple canvases)
        * @param {*} overrideX - override target x coordinate
        * @param {*} overrideY - override target y coordinate
        * eig sollts wohl so aufgrufen werden: drawSprite(tile.x, tile.y)
        */
    drawSprite(gameObject, overrideX, overrideY) { // besserer name statt gameObject ha
        //     if (!gameObject) {
        //         console.error("drawSprite(): Insufficient params");
        //         gameObject && console.log(gameObject);
        //         return;
        //     }
        //     const { color, sprite } = gameObject;
        //     const x = overrideX >= 0 ? overrideX : gameObject.x;
        //     const y = overrideY >= 0 ? overrideY : gameObject.y;
        //     // this.bufferContext.drawImage(image, image-offset.x, image-offset.y, image.width canvas.x, canvas.y);
        //     if (gameObject) {
        //         if (sprite) {
        //             this.bufferContext.drawImage(spriteSheet, pixelSize * sprite.x, pixelSize * sprite.y, pixelSize, pixelSize, x, y, pixelSize, pixelSize);
        //         } else {
        //             this.bufferContext.fillstyle = color;
        //             this.bufferContext.fillRect(x, y, pixelSize, pixelSize);
        //         }
        //     }
    }

    drawPolygon() {
        // TODO
    }
}

function calculateFps(timePreviousFrame, now) {
    if (!timePreviousFrame) return 0;

    let delta = (now - timePreviousFrame) / 1000;
    return (1 / delta).toFixed(0);
}

function registerKeyboardAndMouseEvents(engine) {
    // maybe we dont even want to handle event listeners engine-side.
    const keydown_event = document.addEventListener("keydown", e => {
        console.log("down:", e.key);
        engine.keys[e.key] = { held: true, pressed: false };
    });
    const mousedown_event = document.addEventListener("mousedown", e => {
        console.log(`down: mouse${e.button}`);
        engine.keys[`mouse${e.button}`] = { held: true, pressed: false };
    });
    const keyup_event = document.addEventListener("keyup", e => {
        console.log("up:", e.key);
        // engine.keysPressed[e.key] = true;
        engine.keys[e.key] = { held: false, pressed: true };
    });
    const mouseup_event = document.addEventListener("mouseup", e => {
        console.log(`up: mouse${e.button}`);
        engine.keys[`mouse${e.button}`] = { held: false, pressed: true };
    });
    const mousemove_event = document.addEventListener("mousemove", e => {
        engine.mouse.x = e.x + window.scrollX;
        engine.mouse.y = e.y + window.scrollY;
    });

    // properly remove event listeners?
    // window.onclose(e => {
    //     document.removeEventListener(keydown_event);
    //     document.removeEventListener(keyup_event);
    //     document.removeEventListener(mousemove_event);
    //     document.removeEventListener(mousedown_event);
    //     document.removeEventListener(mouseup_event);
    // });
}

function outputDebugInfo(engine) {
    const debugNode = document.getElementById("debug");
    if (debugNode) {
        debugNode.innerHTML = `<div>FPS: ${engine.fps}<br />mouse x: ${engine.mouse.x}<br />mouse y: ${engine.mouse.y}</div>`;
        if (engine.debug) {
            const fontSize = 20;
            console.log(engine.fps + " fps");
            engine.drawText("FPS: " + engine.fps, 2, engine.rHeight - (3 * (fontSize / engine.pixelSize)), fontSize, { color: "black" });
            engine.drawText(`mouse x: ${engine.mouse.x}, mouse y: ${engine.mouse.y}`, 2, engine.rHeight - (2 * (fontSize / engine.pixelSize)), fontSize, { color: "black" });
        }
    }
}

function createHtml(engine) {
    const bodyContent = document.createElement("div");
    bodyContent.innerHTML =
        `<div style="margin: 10px">
            <div id="debug"></div>
            <h2 id="title"></h2>
            <div id="controls"></div>
        </div>`;

    document.body.insertBefore(bodyContent, document.body.childNodes[0]);

    // miscellaneous dom manipulation
    document.title = engine.title;
    document.getElementById("title").innerText = engine.title;
    document.body.style.margin = 0;
}

function createCanvas(h, w) {
    const canvas = document.createElement("canvas");
    canvas.width = h;
    canvas.height = w;
    document.body.insertBefore(canvas, document.body.childNodes[0]);
    return canvas;
}
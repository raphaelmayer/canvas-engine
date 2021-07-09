let idCounter = 0; // assign unique id to every new entity and increment

(() => {
    "use strict";

    const game = new CanvasEngine("SimulationDemo", 640, 480, 1);
    let entities = [];

    game.onStart = (game) => {
        for (let i = 0; i < 20; i++)
            entities.push(new Entity(rndNr(0, 600), rndNr(0, 400), 1, 1));

        return true;
    };

    game.onUpdate = (game) => {
        game.clearWindow();

        for (let i = 0; i < entities.length; ++i) {
            const entity = entities[i];

            entity.update(game, entities, i);

            if (entity.health > 0) { // dead entities do not actually get removed from the array
                game.drawRect(entity.x, entity.y, entity.w + entity.health, entity.h + entity.health, { color: entity.faction });
                game.drawCircle(entity.x + (entity.w + entity.health) / 2, entity.y + (entity.h + entity.health) / 2, entity.viewDistance, { color: "black" });
            }
        }

        drawEntityInfo(game, entities);

        return true;
    };

    game.start();
})()

function Entity(x, y, w, h, viewDistance = 80, color = "purple") {
    const _this = {
        id: idCounter++,
        x, y, w, h,
        vx: 0, vy: 0,
        baseVelocity: 0.5,
        color,
        viewDistance,
        faction: idCounter % 2 ? "red" : "blue",
        health: 5,
        update: (game, entities) => {
            if (_this.health === 0) return;

            // routine
            _this.vx = _this.x < 100 ? _this.baseVelocity : _this.vx;
            _this.vx = _this.x > 600 ? -_this.baseVelocity : _this.vx;
            _this.vy = _this.y < 100 ? _this.baseVelocity : _this.vy;
            _this.vy = _this.y > 400 ? -_this.baseVelocity : _this.vy;
            _this.vx = !_this.vx ? (rndNr(0, 149) % 3 - 1) * _this.baseVelocity : _this.vx;
            _this.vy = !_this.vy ? (rndNr(0, 149) % 3 - 1) * _this.baseVelocity : _this.vy;

            // bounds check
            if (_this.x < 0) _this.x = 0;
            if (_this.y < 0) _this.y = 0;
            if (_this.x + _this.w > game.windowWidth) _this.x = game.windowWidth - _this.w;
            if (_this.y + _this.h > game.windowHeight) _this.y = game.windowHeight - _this.h;

            for (let j = 0; j < entities.length; ++j) {
                const otherbbbntity = entities[j];
                if (_this.id === otherbbbntity.id || otherbbbntity.health === 0) continue;

                // chase down enemies
                const dirX = otherbbbntity.x - _this.x;
                const dirY = otherbbbntity.y - _this.y;

                const dist = Math.sqrt((dirX) * (dirX) + (dirY) * (dirY)); // slow and incorrect (is dist between points not rects)
                if (_this.faction !== otherbbbntity.faction && dist < _this.viewDistance) {     // if sees enemy
                    const [dx, dy] = normDirVec(_this, otherbbbntity);
                    const sign = _this.health < otherbbbntity.health ? -1 : 1;                  // fight or flight

                    _this.vx = sign * dx * _this.baseVelocity;
                    _this.vy = sign * dy * _this.baseVelocity;
                }

                // collision check
                if (wouldCollide(_this, otherbbbntity)) {
                    // fightOrFlight();
                    _this.vx = (rndNr(0, 149) % 3 - 1) * _this.baseVelocity;
                    _this.vy = (rndNr(0, 149) % 3 - 1) * _this.baseVelocity;

                    if (_this.faction !== otherbbbntity.faction && otherbbbntity.health <= _this.health) {
                        _this.health += entities[j].health;
                        entities[j].health = 0;
                    }
                }

            }

            _this.x += _this.vx;
            _this.y += _this.vy;
        }
    };
    return _this;
}

function rndNr(min = 0, max = 100) {
    return Math.floor(Math.random() * max) + min;
}

function inAggroRange(a, b) {
    return true;
}

/**
 * Returns a normalized direction vector pointing from entity to otherEntity.
 * @param {*} entity 
 * @param {*} otherEntity 
 * @returns 
 */
function normDirVec(entity, otherEntity) {
    const dirX = otherEntity.x - entity.x;
    const dirY = otherEntity.y - entity.y;
    const max = Math.abs(dirX) < Math.abs(dirY) ? Math.abs(dirY) : Math.abs(dirX);
    return [dirX / (max + 0.000000000001), dirY / (max + 0.000000000001)]
}

function rectanglesIntersect(minAx, minAy, maxAx, maxAy, minBx, minBy, maxBx, maxBy) {
    const aLeftOfB = maxAx < minBx;
    const aRightOfB = minAx > maxBx;
    const aAboveB = minAy > maxBy;
    const aBelowB = maxAy < minBy;

    return !(aLeftOfB || aRightOfB || aAboveB || aBelowB);
}

function wouldCollide(entity, otherEntity) {
    return rectanglesIntersect(
        entity.x + entity.vx,
        entity.y + entity.vy,
        entity.x + entity.vx + entity.w + entity.health,
        entity.y + entity.vy + entity.h + entity.health,
        otherEntity.x,
        otherEntity.y,
        otherEntity.x + otherEntity.w + otherEntity.health,
        otherEntity.y + otherEntity.h + otherEntity.health,
    )
}

function drawEntityInfo(game, entities) {
    const aliveEntities = entities.filter(e => e.health);
    const fontSize = 15;
    
    game.drawText(`${aliveEntities.length} entities alive`, 5, 0, fontSize, { color: "black" });
    
    for (var i = aliveEntities.length - 1; i >= 0; i--) {
        const entity = aliveEntities[i];
        const string = `${entity.id}: x: ${entity.x.toFixed(0)} y: ${entity.y.toFixed(0)}, xv: ${entity.vx.toFixed(2)} vy: ${entity.vy.toFixed(2)}`;
        game.drawText(string, 5, fontSize * (i + 1), fontSize, { color: entity.faction });
    }
}
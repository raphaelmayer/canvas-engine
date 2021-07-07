"use strict";

let idCounter = 0;

(() => {
    "use strict";

    const game = new CanvasEngine("SimulationDemo", 640, 480, 1);
    let entities = [];

    game.onStart = (game) => {
        for (let i = 0; i < 20; i++) {
            entities.push(new Entity(rndNr(0, 600), rndNr(0, 400), 1, 1));
        }

        return true;
    };

    game.onUpdate = (game) => {
        game.drawRect(0, 0, game.windowWidth, game.windowHeight, { color: "#eee" });

        for (let i = 0; i < entities.length; ++i) {
            const entity = entities[i];

            if (entity.health === 0) continue;

            // routine
            entity.vx = entity.x < 100 ? 1 : entity.vx;
            entity.vx = entity.x > 600 ? -1 : entity.vx;
            entity.vy = entity.y < 100 ? 1 : entity.vy;
            entity.vy = entity.y > 400 ? -1 : entity.vy;
            entity.vx = !entity.vx ? rndNr(0, 149) % 3 - 1 : entity.vx;
            entity.vy = !entity.vy ? rndNr(0, 149) % 3 - 1 : entity.vy;
            // entity.vy = entity.y < 100 ? 4 : -4;

            for (let j = 0; j < entities.length; ++j) {
                const otherEntity = entities[j];
                if (entity.id === otherEntity.id || otherEntity.health === 0) continue;

                // chase down enemies
                const dist = Math.sqrt((otherEntity.x - entity.x) * (otherEntity.x - entity.x) + (otherEntity.y - entity.y) * (otherEntity.y - entity.y)); // slow and incorrect (is dist between points not rects)
                if (entity.faction !== otherEntity.faction && dist < entity.viewDistance) {
                    entity.vx = otherEntity.x - entity.x;
                    entity.vy = otherEntity.y - entity.y;
                    const max = Math.abs(entity.vx) < Math.abs(entity.vy) ? Math.abs(entity.vy) : Math.abs(entity.vx);

                    const sign = entity.health < otherEntity.health ? -1 : 1;

                    entity.vx = sign * entity.vx / (max + 0.000000000001);
                    entity.vy = sign * entity.vy / (max + 0.000000000001);
                }

                // collision check
                if (wouldCollide(entity, otherEntity)) {
                    entity.vx = rndNr(0, 149) % 3 - 1;
                    entity.vy = rndNr(0, 149) % 3 - 1;

                    if (entity.faction !== otherEntity.faction && otherEntity.health <= entity.health) {
                        entities[i].health += entities[j].health;
                        entities[j].health = 0;
                    }
                }

            }

            // bounds check
            if (entity.x < 0) entity.x = 0;
            if (entity.y < 0) entity.y = 0;
            if (entity.x + entity.w > game.windowWidth) entity.x = game.windowWidth - entity.w;
            if (entity.y + entity.h > game.windowHeight) entity.y = game.windowHeight - entity.h;

            entity.x += entity.vx;
            entity.y += entity.vy;

            game.drawRect(entity.x, entity.y, entity.w + entity.health, entity.h + entity.health, { color: entity.faction });
            game.drawCircle(entity.x + (entity.w + entity.health) / 2, entity.y + (entity.h + entity.health) / 2, entity.viewDistance, { color: "black" });
        }

        // debug stuff
        const aliveEntities = entities.filter(e => e.health);
        game.drawText(`${aliveEntities.length} entities alive`, 20, 20, 20, { color: "black" });
        for (var i = aliveEntities.length - 1; i >= 0; i--) {
            const string = `x:${aliveEntities[i].x.toFixed(2)} y:${aliveEntities[i].y.toFixed(2)}, xv:${aliveEntities[i].vx.toFixed(2)} vy:${aliveEntities[i].vy.toFixed(2)}`;
            game.drawText(string, 20, 20 * (i + 2), 20, { color: aliveEntities[i].faction });
        }

        return true;
    };

    game.start();
})()

function Entity(x, y, w, h, viewDistance = 80, color = "purple") {
    const _this = {
        id: idCounter++,
        x, y, w, h,
        vx: 0, vy: 0,
        color,
        viewDistance,
        faction: idCounter % 2 ? "red" : "blue",
        health: 5
    };
    return _this;
}

function rndNr(min = 0, max = 100) {
    return Math.floor(Math.random() * max) + min;
}

function inAggroRange(a, b) {
    return true;
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
window.requestAnimationFrame =
    window.__requestAnimationFrame || window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function (callback, element) {
        var lastTime = element.__lastTime || 0;
        var currTime = Date.now();
        var timeToCall = Math.max(1, 33 - (currTime - lastTime));
        window.setTimeout(callback, timeToCall);
        element.__lastTime = currTime + timeToCall;
    };

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));

var init = function () {
    var mobile = window.isDevice;
    var koef = mobile ? 0.5 : 1;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = koef * innerWidth;
    var height = canvas.height = koef * innerHeight;
    var rand = Math.random;

    var heartPosition = function (rad) {
        return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };

    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    var pointsOrigin = [];
    var dr = mobile ? 0.3 : 0.1;
    for (var i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, -80));
    for (var i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 110, 6.5, 0, -80));
    for (var i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 70, 4, 0, -80));
    var heartCount = pointsOrigin.length;

    var getTextPoints = function(text, targetCount) {
        var tc = document.createElement('canvas');
        var tCtx = tc.getContext('2d', { willReadFrequently: true });
        tc.width = 800; tc.height = 300;
        
        tCtx.fillStyle = "black";
        tCtx.fillRect(0, 0, tc.width, tc.height);
        tCtx.font = "italic 110px Arial, sans-serif"; 
        tCtx.fillStyle = "white";
        tCtx.textAlign = "center";
        tCtx.textBaseline = "middle";
        tCtx.fillText(text, tc.width / 2, tc.height / 2);

        var imgData = tCtx.getImageData(0, 0, tc.width, tc.height).data;
        var validPixels = [];
        
        for (var p = 0; p < imgData.length; p += 4) {
            if (imgData[p] > 128) { 
                var px = (p / 4) % tc.width;
                var py = Math.floor((p / 4) / tc.width);
                validPixels.push([px - tc.width / 2, py - tc.height / 2 + 150]);
            }
        }

        if (validPixels.length === 0) validPixels.push([0, 150]); 

        var sampledPoints = [];
        var step = Math.max(1, Math.floor(validPixels.length / targetCount));
        for (var j = 0; j < validPixels.length && sampledPoints.length < targetCount; j += step) {
            sampledPoints.push(validPixels[j]);
        }
        return sampledPoints;
    };

    var textPoints = getTextPoints("Sophia", 250); 
    pointsOrigin = pointsOrigin.concat(textPoints);
    var totalCount = pointsOrigin.length;

    var targetPoints = [];
    var e = [];
    var traceCount = mobile ? 12 : 25;

    for (var i = 0; i < totalCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        e[i] = {
            vx: 0, vy: 0, R: 2,
            speed: rand() * 3 + 4,
            q: ~~(rand() * totalCount),
            D: 2 * (i % 2) - 1,
            force: 0.15 * rand() + 0.75,
            f: "rgba(122, 0, 255, 1)",
            trace: Array.from({length: traceCount}, () => ({x: x, y: y}))
        };
    }

    var config = { traceK: 0.35, timeDelta: 0.012 };
    var time = 0;

    var loop = function () {
        var n = -Math.cos(time);
        var kx = (1 + n) * 0.5;
        var ky = (1 + n) * 0.5;
        time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? 0.2 : 1) * config.timeDelta;

        ctx.fillStyle = "rgba(0,0,0, 0.15)";
        ctx.fillRect(0, 0, width, height);

        for (var i = 0; i < totalCount; i++) {
            targetPoints[i] = [
                (i < heartCount ? kx : 1) * pointsOrigin[i][0] + width / 2,
                (i < heartCount ? ky : 1) * pointsOrigin[i][1] + height / 2
            ];
        }

        for (var i = e.length; i--;) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            
            var length = Math.sqrt(dx * dx + dy * dy);
            length = Math.max(0.1, length); 

            if (10 > length) {
                if (0.95 < rand()) u.q = ~~(rand() * totalCount);
                else {
                    if (0.99 < rand()) u.D *= -1;
                    u.q = (u.q + u.D + totalCount) % totalCount;
                }
            }

            u.vx += -dx / length * u.speed;
            u.vy += -dy / length * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;

            for (var k = 0; k < u.trace.length - 1; k++) {
                var T = u.trace[k];
                var N = u.trace[k + 1];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }

            ctx.fillStyle = u.f;
            for (var k = 0; k < u.trace.length; k++) {
                ctx.fillRect(u.trace[k].x, u.trace[k].y, 2, 2);
            }
        }
        window.requestAnimationFrame(loop, canvas);
    };

    window.addEventListener('resize', function () {
        width = canvas.width = koef * innerWidth;
        height = canvas.height = koef * innerHeight;
    });

    loop();
};

if (document.readyState === 'complete' || document.readyState === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);

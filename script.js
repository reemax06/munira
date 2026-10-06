window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime;
            if (lastTime === undefined) {
                lastTime = 0;
            }
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));
var loaded = false;

var init = function () {
    if (loaded) return;
    loaded = true;
    var mobile = window.isDevice;
    var koef = mobile ? 0.5 : 1;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = koef * innerWidth;
    var height = canvas.height = koef * innerHeight;
    var rand = Math.random;
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, width, height);

    var heartPosition = function (rad) {
        return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };

    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    var pointsOrigin = [];
    var i;
    var dr = mobile ? 0.35 : 0.15;
    
    // Heart particles
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, -60)); // Offset upward slightly to make space
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 110, 6.5, 0, -60));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 70, 4, 0, -60));

    // Get cursive text points underneath
    var nameToPrint = "Sophia"; // CHANGE THIS NAME HERE
    var textPoints = getTextPoints(nameToPrint, 60); 
    
    // Shift text coordinates so they sit below the heart
    for (var p = 0; p < textPoints.length; p++) {
        pointsOrigin.push([textPoints[p][0], textPoints[p][1] + 180]); // Adjusted downwards
    }

    var heartPointsCount = pointsOrigin.length;
    var targetPoints = [];
    var pulse = function (kx, ky) {
        for (i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [];
            // Pulsing only applied to the upper particles (heart-based), static fine cursive details remain legible
            var isHeart = (i < heartPointsCount - textPoints.length);
            var scaleX = isHeart ? kx : 1.0;
            var scaleY = isHeart ? ky : 1.0;
            targetPoints[i][0] = scaleX * pointsOrigin[i][0] + width / 2;
            targetPoints[i][1] = scaleY * pointsOrigin[i][1] + height / 2;
        }
    };

    var e = [];
    var traceCount = mobile ? 12 : 35; // Lower traceCount to keep small cursive letters sharp
    for (i = 0; i < heartPointsCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        e[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() * 3 + 4,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.15 * rand() + 0.75,
            f: "rgba(122, 0, 255, 1)", // Keep it bright purple
            trace: []
        };
        for (var k = 0; k < traceCount; k++) e[i].trace[k] = { x: x, y: y };
    }

    var config = {
        traceK: 0.35,
        timeDelta: 0.012
    };

    var time = 0;
    var loop = function () {
        var n = -Math.cos(time);
        pulse((1 + n) * .5, (1 + n) * .5);
        time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? .2 : 1) * config.timeDelta;
        ctx.fillStyle = "rgba(0,0,0, 0.15)"; // Leave glowing, fading trails
        ctx.fillRect(0, 0, width, height);

        for (i = e.length; i--;) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);
            if (10 > length) {
                if (0.95 < rand()) {
                    u.q = ~~(rand() * heartPointsCount);
                } else {
                    if (0.99 < rand()) {
                        u.D *= -1;
                    }
                    u.q += u.D;
                    u.q %= heartPointsCount;
                    if (0 > u.q) {
                        u.q += heartPointsCount;
                    }
                }
            }
            u.vx += -dx / length * u.speed;
            u.vy += -dy / length * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;
            for (k = 0; k < u.trace.length - 1;) {
                var T = u.trace[k];
                var N = u.trace[++k];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }
            ctx.fillStyle = u.f;
            for (k = 0; k < u.trace.length; k++) {
                ctx.fillRect(u.trace[k].x, u.trace[k].y, 2, 2); // Slightly thicker for bright, sharp visibility
            }
        }
        window.requestAnimationFrame(loop, canvas);
    };

    // Helper to generate precise coordinates from cursive text 
    function getTextPoints(text, size) {
        var tempCanvas = document.createElement('canvas');
        var tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = 600;
        tempCanvas.height = 150;
        
        // Beautiful cursive Google font fallback styling
        tempCtx.font = "italic " + size + "px 'Brush Script MT', 'Dancing Script', 'Alex Brush', cursive";
        tempCtx.fillStyle = "white";
        tempCtx.textAlign = "center";
        tempCtx.textBaseline = "middle";
        tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);

        var imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        var pts = [];
        var step = mobile ? 5 : 3; // Step controls particle density (lower = denser, prettier text)

        for (var y = 0; y < tempCanvas.height; y += step) {
            for (var x = 0; x < tempCanvas.width; x += step) {
                var index = (y * tempCanvas.width + x) * 4;
                if (imgData.data[index + 3] > 120) { // Check if pixel is part of text
                    pts.push([x - tempCanvas.width / 2, y - tempCanvas.height / 2]);
                }
            }
        }
        return pts;
    }

    window.addEventListener('resize', function () {
        width = canvas.width = koef * innerWidth;
        height = canvas.height = koef * innerHeight;
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fillRect(0, 0, width, height);
    });

    loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);

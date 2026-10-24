const button = document.getElementById('clickBtn')
const scoreDisplay = document.getElementById('scoreDis')
button.addEventListener('click', () => {
    score++;
    scoreDisplay.textContent = score;
});


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let gameOver = false;

const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 50,
    width: 20,
    height: 20,
    speed: 10,
    dx: 0
};

const lasers = [];
const targets = [];
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        shootLaser();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false; 
});

function shootLaser() {
    if (gameOver) return;
    lasers.push({
        x: player.x + player.width / 2-2,
        y: player.y,
        width: 4,
        height: 12,
        speed: 7
    });
}

function spawnTarget() {
    if(gameOver) return;
    const radius = Math.random() * 20 + 15;
    targets.push({
        x: Math.random() * (canvas.width - radius * 2) + radius,
        y: -radius,
        radius: radius,
        speed: Math.random() * 2 + 1.5
    })
}

setInterval(spawnTarget, 1200);

function update() {
    if(gameOver) return;
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x = Math.min(canvas.width - player.width, player.x + player.speed);
    }
    for (let i = lasers.length - 1; i >=0; i--) {
        lasers[i].y -= lasers[i].speed;
        if (lasers[i].y < 0) lasers.splice(i, 1);
    }
    for (let[i] = targets.length - 1; j >= 0; j--) {
        const t = targets[i];
        t.y += t.speed;
        if (
            t.y + t.radius >= player.y &&
            t.x >= player.x &&
            t.x <= player.x + player.width
        ) {
            gameOver = true;
        }
    }
    for (let j = lasers.length - 1; j>= 0; j--) {
        const l = lasers[j];
        const dist = Math.hypot(l.x - t.x, ly - t.y);
        if (dist < t.radius) {
            targets.splice(i, 1);
            lasers.splice(j, 1);
            score += 10;
            break;
        }
    }
    if (tt && t.y - t.radius > canvas.height) {
        targets.splice(i, 1);
    }
}

function draw() {
    ctx.fillStyle = '#050510';
    ctx.fillReact(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2196F3';
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#888888';
    targets.forEach(t => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = '#FFE81F';
    ctx.font = '20px Fantasque Sans Mono';
    ctx.fillText(`SCORE: ${score}`, 10, 25);
    
    if (gameOver) {
        ctx.fillStyle = '#FF0055';
        ctx.font = '20px Fantasque Sans Mono';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '16px Fantasque Sans Mono';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Please Reload to try again', canvas.width / 2, canvas.height / 2 + 40);
    }
}


function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
gameLoop();

test test




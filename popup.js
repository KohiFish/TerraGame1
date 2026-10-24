window.addEventListener('load', () => {
    // Sound system up here
    class SoundSystem {
        constructor() {
            this.ctx = null;
            this.enabled = true;
        }
        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) {
                    console.error('Web Audio API is not supported in this browser.');
                    return false;
                }
                this.ctx = new AudioCtx();
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch((error) => {
                    console.error('Unable to resume the audio context:', error);
                });
            }
            return true;
        }

        playerLaser(isEnemy = false) {
            if (!this.enabled || !this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = isEnemy ? 'sawtooth' : 'square';
            const now = this.ctx.currentTime;
            if (isEnemy) {
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
            } else {
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(110, now +0.12);
            }
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now +0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        }

        playExplosion(isLarge = false) {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const duration = isLarge ? 0.6 : 0.3;
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(isLarge ? 400 : 800, now);
            filter.frequency.exponentialRampToValueAtTime(30, now + duration);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
            noise.stop(now + duration);
        }
    }
    const sound = new SoundSystem();

    // Game logic down here
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const GAME_WIDTH = canvas.width;
    const GAME_HEIGHT = canvas.height;

    let score = 0;
    let lives = 3
    let gameOver = false;
    let frameCount = 0;

    const player = {
        x: canvas.width / 2 - 10,
        y: canvas.height - 50,
        width: 20,
        height: 20,
        speed: 8,
        invulnerable: 0
    };

    const lasers = [];
    const targets = [];
    const keys = {};
    const shootInterval = 400;
    let lastShotTime = -shootInterval;

    function resetGame() {
        score = 0;
        lives = 3;
        gameOver= false;
        frameCount = 0;
        player.x = canvas.width / 2 - player.width / 2;
        player.invulnerable = 0;
        lasers.length = 0;
        target.length = 0;
        lastShotTime = -shootInterval;
    }

    window.addEventListener('keydown', (event) => {
        keys[event.code] = true;

        if (event.code === 'Space') {
            event.preventDefault();
            if (!event.repeat) sound.init();
        }
        if (event.code === 'Enter') {
            sound.init();
            resetGame();
        }
    });

    window.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });

    function shootLaser() {
        if (gameOver) return;
        lasers.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 12,
            speed: 7
        });
        sound.playerLaser();
    }

    function spawnTarget() {
        if (gameOver) return;

        const radius = Math.random() * 20 + 15;
        targets.push({
            x: Math.random() * (canvas.width - radius * 2) + radius,
            y: -radius,
            radius,
            speed: Math.random() * 2 + 1.5
        });
    }

    function circleTouchesRect(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        return Math.hypot(circle.x - closestX, circle.y - closestY) < circle.radius;
    }

    function update() {
        if (gameOver) return;

        if (keys.ArrowLeft || keys.KeyA) {
            player.x = Math.max(0, player.x - player.speed);
        }
        frameCount++;
        if (frameCount % 72 === 0) spawnTarget();
        if (player.invulnerable > 0) player.invulnerable--;

        if (keys.ArrowRight || keys.KeyD) {
            player.x = Math.min(canvas.width - player.width, player.x + player.speed);
        }

        const now = performance.now();
        if (keys.Space && now - lastShotTime >= shootInterval) {
            lastShotTime = now;
            shootLaser();
        }

        for (let i = lasers.length - 1; i >= 0; i--) {
            lasers[i].y -= lasers[i].speed;
            if (lasers[i].y + lasers[i].height < 0) {
                lasers.splice(i, 1);
            }
        }

        for (let i = targets.length - 1; i >= 0; i--) {
            const target = targets[i];
            target.y += target.speed;

            if (player.invulnerable === 0 && circleTouchesRect(target, player)) {
                targets.splice(i, 1);
                lives--;
                sound.playExplosion(true);
                if (lives <= 0) {
                    gameOver = true;
                    return;
                }
                player.invulnerable = 90;
                continue;
            }

            let hit = false;
            for (let j = lasers.length - 1; j >= 0; j--) {
                if (circleTouchesRect(target, lasers[j])) {
                    targets.splice(i, 1);
                    lasers.splice(j, 1);
                    score += 10;
                    sound.playExplosion();
                    hit = true;
                    break;
                }
            }

            if (!hit && target.y - target.radius > canvas.height) {
                targets.splice(i, 1);
            }
        }
    }

    function draw() {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);


        if (player.invulnerable % 6 <= 3) {
            ctx.fillStyle = '#2196F3';
            ctx.beginPath();
            ctx.moveTo(player.x + player.width / 2, player.y);
            ctx.lineTo(player.x, player.y + player.height);
            ctx.lineTo(player.x + player.width, player.y + player.height);
            ctx.closePath();
            ctx.fill();
        }
        

        ctx.fillStyle = '#FFE81F';
        lasers.forEach((laser) => {
            ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        });

        ctx.fillStyle = '#888888';
        targets.forEach((target) => {
            ctx.beginPath();
            ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = '#FFE81F';
        ctx.font = '20px Fantasque Sans Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 10, 25);
        ctx.textAlign = 'right';
        ctx.fillText(`LIVES: ${lives}`, canvas.width - 10, 25);

        if (gameOver) {
            ctx.fillStyle = '#FF0055';
            ctx.font = '20px Fantasque Sans Mono';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
            ctx.font = '16px Fantasque Sans Mono';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Press ENTER to try again', canvas.width / 2, canvas.height / 2 + 40);
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});
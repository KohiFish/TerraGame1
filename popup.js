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
    const FONT = '"Fantasque Sans Mono", monospace';

    function drawThrusters(color, y, spots) {
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        spots.forEach(([x, w]) => ctx.fillRect(x, y, w, 8 + Math.random() * 6));
        ctx.shadowBlur = 0;
    }

    const ships = [
        {
            name: 'E-Wing',
            cannons: [-24,24],
            draw() {
                drawThrusters('#00e1ff', 18, [[-12, 6], [6,6]]);
                ctx.fillStyle = '#e2e8f0';
                ctx.beginPath();
                ctx.moveTo(0, -24);
                ctx.lineTo(8, -8);
                ctx.lineTo(8, 20);
                ctx.lineTo(-8, 20);
                ctx.lineTo(-8, -8);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#475569';
                ctx.beginPath();
                ctx.moveTo(0, -24);
                ctx.lineTo(4, -10);
                ctx.lineTo(-4, -10);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(-3, -8, 6, 10);
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(8, -2, 16, 4);
                ctx.fillRect(22, -18, 4, 20);
                ctx.fillRect(-24, -2, 16, 4);
                ctx.fillRect(-26, -18, 4, 20);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(12, 0, 6, 2);
                ctx.fillRect(-18, 0, 6, 2);
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(23, -24, 2, 10);
                ctx.fillRect(-25, -24, 2, 10);
            }
        },
        {
            name: 'A-Wing',
            cannons: [-22, 22],
            draw() {
                drawThrusters('#fb923c', 17, [[-9, 5], [4, 5]]);
                ctx.fillStyle = '#f1f5f9';
                ctx.beginPath();
                ctx.moveTo(0, -26);
                ctx.lineTo(6, -4);
                ctx.lineTo(22, 16);
                ctx.lineTo(8, 20);
                ctx.lineTo(-8, 20);
                ctx.lineTo(-22, 16);
                ctx.lineTo(-6, -4);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.moveTo(8, 4);
                ctx.lineTo(19, 14);
                ctx.lineTo(8, 14);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-8, 4);
                ctx.lineTo(-19, 14);
                ctx.lineTo(-8, 14);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(-3, -14, 6, 14);
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(21, 4, 2, 14);
                ctx.fillRect(-23, 4, 2, 14);
            }
        },
        {
            name: "Freighter",
            cannons: [-9, 9],
            draw() {
                drawThrusters('#60a5fa', 20, [[-10, 6], [4,6]]);
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(-13, -26, 8, 20);
                ctx.fillRect(5, -26, 8, 20);
                ctx.fillStyle = '#64748b';
                ctx.fillRect(12, -12, 6, 16);
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(15, -13, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#cbd5e1';
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 4, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#94a3b8';
                ctx.beginPath();
                ctx.arc(0, 4, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#e2e8f0';
                ctx.fillRect(-10, -30, 2, 6);
                ctx.fillRect(8, -30, 2, 6);
            }
        }
    ];
    
    const shipCards = ships.map((ship, i) => {
        const row = i < 3 ? 0 : 1;
        const col = i < 3 ? i : i - 3;
        return {
            x: (row === 0 ? 20 : 85) + col * 130,
            y: row === 0 ? 90 : 230,
            width: 100,
            height: 120
        };
    });

    const settingButton = { x: canvas.width / 2 - 45, y: 8, width: 90, height: 26 };
    const closeButton = { x: canvas.width / 2 - 100, y: 400, width: 200, height: 44 };
    function inRect(pos, rect) {
        return pos.x >= rect.x && pos.x <= rect.x + rect.width &&
               pos.y >= rect.y && pos.y <= rect.y + rect.height;
    }

    let score = 0;
    let lives = 3
    let gameOver = false;
    let frameCount = 0;
    let selectedShip = 0;
    let settingsOpen = false;
    let mouse = { x: -1, y: -1 };

    const player = {
        x: canvas.width / 2 - 10,
        y: canvas.height - 100,
        width: 44,
        height: 48,
        speed: 8,
        invulnerable: 0
    };

    const lasers = [];
    const targets = [];
    const ties = [];
    const enemyLaser = [];
    const keys = {};
    const shootInterval = 550;
    let lastShotTime = -shootInterval;

    const stars = [];
    for (let i = 0; i < 120; i++) {
        stars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 3 + 0.5,
            alpha: Math.random() * 0.8 + 0.2
        })
    }

    function resetGame() {
        score = 0;
        lives = 3;
        gameOver= false;
        frameCount = 0;
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - 100;
        player.invulnerable = 0;
        lasers.length = 0;
        targets.length = 0;
        ties.length = 0;
        enemyLaser.length = 0;
        lastShotTime = -shootInterval;
    }

    window.addEventListener('keydown', (event) => {
        keys[event.code] = true;
        if (event.code == 'Escape' && !event.repeat) settingsOpen = !settingsOpen;
        console.log(event.code);
        if (event.code === 'Space') {
            event.preventDefault();
            if (!event.repeat) sound.init();
        }
        if (event.code.startsWith('Arrow')) {
            event.preventDefault();
        }
    });
    
    const restartButton = { x: canvas.width / 2 - 100, y: 250, width: 200, height: 44};
    let hoveringButton = false;
    function getMousePos(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (canvas.width / rect.width),
            y: (event.clientY - rect.top) * (canvas.height / rect.height)
        } ;
    }

        canvas.addEventListener('mousemove', (event) => {
            mouse = getMousePos(event);
            hoveringButton = !settingsOpen && gameOver && inRect(mouse, restartButton);
            const overClickable = settingsOpen
                ? inRect(mouse, closeButton) || shipCards.some((card) => inRect(mouse, card))
                : inRect(mouse, settingButton) || hoveringButton;
            canvas.style.cursor = overClickable ? 'pointer' : 'default';
        });
        canvas.addEventListener('click', (event) =>{
            const pos = getMousePos(event);
            if (settingsOpen) {
                shipCards.forEach((card, i) => {
                    if (inRect(pos, card)) selectedShip = i;
                });
                if (inRect(pos, closeButton)) settingsOpen = false;
                return;
            }
            if (inRect(pos, settingButton)) {
                settingsOpen = true;
                return;
            }
            if (gameOver && inRect(pos, restartButton)) {
                sound.init();
                resetGame();
                hoveringButton = false;
                canvas.style.cursor = 'default';
            }
        });
    window.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });

    function shootLaser() {
        if (gameOver) return;
        const centerX = player.x + player.width / 2;
        ships[selectedShip].cannons.forEach((cannonX) => {
            lasers.push({
                x: centerX + cannonX - 2,
                y: player.y,
                width: 4,
                height: 12,
                speed: 7
             });
        });
        sound.playerLaser();
    }

    function spawnTarget() {
        if (gameOver) return;

        const radius = Math.random() * 20 + 15;
        const points = [];
        const numPoints = 8 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const dist = radius * (0.7 + Math.random() * 0.5);
            points.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }); 
        }
        targets.push({
            x: Math.random() * (canvas.width - radius * 2) + radius,
            y: -radius,
            radius,
            speed: Math.random() * 2 + 1.5,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            points
        });
    }

    function spawnTieFighter() {
        if (gameOver) return;
        const startX = Math.random() * (canvas.width - 36 - 120) + 60;
        ties.push({
            width: 36,
            height: 36,
            x: startX,
            y: -50,
            startX,
            speedY: Math.random() * 1.5 + 2,
            sineFreq: Math.random() * 0.04 + 0.02,
            sineAmp: Math.random() * 2 + 1,
            shootCooldown: Math.floor(Math.random() * 60) + 40
        });
    }

    function circleTouchesRect(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        return Math.hypot(circle.x - closestX, circle.y - closestY) < circle.radius;
    }

    function update() {
        stars.forEach((star) => {
            star.y += star.speed;
            if (star.y > GAME_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * GAME_WIDTH;
            }
        });

        if (gameOver || settingsOpen) return;

        if (keys.ArrowLeft || keys.KeyA) {
            player.x = Math.max(0, player.x - player.speed);
        }
        frameCount++;
        if (frameCount % 72 === 0) spawnTarget();
        if (frameCount % 150 === 0) spawnTieFighter();
        if (player.invulnerable > 0) player.invulnerable--;

        if (keys.ArrowRight || keys.KeyD) {
            player.x = Math.min(canvas.width - player.width, player.x + player.speed);
        }
        if (keys.ArrowUp || keys.KeyW) {
            player.y = Math.max(100, player.y - player.speed);
        }
        if (keys.ArrowDown || keys.KeyS) {
            player.y = Math.min(canvas.height - player.height - 20, player.y + player.speed);
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

        for (let i = enemyLaser.length - 1; i >= 0; i--) {
            const laser = enemyLaser[i];
            laser.y += laser.speed;
            if (laser.y > canvas.height) {
                enemyLaser.splice(i, 1);
                continue;
            }
            if (player.invulnerable === 0 &&
                laser.x < player.x + player.width &&
                laser.x + laser.width > player.x &&
                laser.y < player.y + player.height &&
                laser.y + laser.height > player.y) {
                    enemyLaser.splice(i, 1);
                    lives--;
                    sound.playExplosion(true);
                    if (lives <= 0) {
                        gameOver = true;
                        return;
                    }
                    player.invulnerable = 90;
                }
            
        }

        for (let i = targets.length - 1; i >= 0; i--) {
            const target = targets[i];
            target.y += target.speed;
            target.rotation += target.rotSpeed;

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
        for (let i = ties.length - 1; i >= 0; i--) {
            const tie = ties[i];
            tie.y +=tie.speedY;
            tie.x = tie.startX + Math.sin(tie.y * tie.sineFreq) * tie.sineAmp * 20;
            tie.shootCooldown--;
            if (tie.shootCooldown <= 0 && tie.y > 50 && tie.y < canvas.height - 200) {
                enemyLaser.push({
                    x: tie.x + tie.width / 2 - 2,
                    y: tie.y + tie.height,
                    width: 4,
                    height: 16,
                    speed: 7
                });
                sound.playerLaser(true);
                tie.shootCooldown = Math.floor(Math.random() * 80) + 60;
            }
            const body = {
                x: tie.x + tie.width / 2,
                y: tie.y + tie.height / 2,
                radius: tie.width / 2
            };
            if (player.invulnerable === 0 && circleTouchesRect(body, player)) {
                ties.splice(i, 1);
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
                if (circleTouchesRect(body, lasers[j])) {
                    ties.splice(i ,1);
                    lasers.splice(j, 1);
                    score += 30;
                    sound.playExplosion();
                    hit = true;
                    break;
                }
            }
            if (!hit && tie.y > canvas.height + 50) {
                ties.splice(i, 1);
            }
        }
    }
    
    function drawSettingsButton() {
        const hover = inRect(mouse, settingButton);
        ctx.fillStyle = hover ? '#af9e00' : '#000000';
        ctx.fillRect(settingButton.x, settingButton.y, settingButton.width, settingButton.height);
        ctx.strokeStyle = '#FFE81F';
        ctx.lineWidth = 2;
        ctx.strokeRect(settingButton.x, settingButton.y, settingButton.width, settingButton.height);
        ctx.fillStyle = hover ? '#000000' : '#FFE81F';
        ctx.font = `12px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('SETTINGS', settingButton.x + settingButton.width / 2, settingButton.y + 18);
    }
    function drawSettingsMenu() {
        const cx = canvas.width / 2;
        ctx.fillStyle = '#000000e6'
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFE81F';
        ctx.font = `24px ${FONT}`;
        ctx.fillText('SELECT YOU SHIP', cx, 55);
        ships.forEach((ship, i) => {
            const card = shipCards[i];
            const selected = i === selectedShip;
            const hover = inRect(mouse, card);
            ctx.fillStyle = hover ? '#af9e0033' : '#0a0a14';
            ctx.fillRect(card.x, card.y, card.width, card.height);
            ctx.strokeStyle = selected ? '#FFE81F' : '#475569';
            ctx.lineWidth = selected ? 3 : 1.5;
            ctx.strokeRect(card.x, card.y, card.width, card.height);
            ctx.save();
            ctx.translate(card.x + card.width / 2, card.y + 52);
            ship.draw();
            ctx.restore();
            ctx.fillStyle = selected ? '#FFE81F' : '#ffffff';
            ctx.font = `12px ${FONT}`;
            ctx.textAlign = 'center';
            ctx.fillText(ship.name, card.x + card.width / 2, card.y + 105);
        });
        ctx.fillStyle = '#facc15';
        ctx.font = `12px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('Click a ship to select (ESC to close)', cx, 378);

        const closeHover = inRect(mouse, closeButton);
        ctx.fillStyle = closeHover ? '#af9e00' : '#000000';
        ctx.fillRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height);
        ctx.strokeStyle = '#FFE81F';
        ctx.lineWidth = 2;
        ctx.strokeRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height);
        ctx.fillStyle = closeHover ? '#000000' : '#FFE81F';
        ctx.font = `16px ${FONT}`;
        ctx.fillText('CLOSE', cx, closeButton.y + 28);
    }

    function drawPlayer() {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ships[selectedShip].draw();
        ctx.restore();
    }

    function drawTie(tie) {
        ctx.save();
        ctx.translate(tie.x + tie.width / 2, tie.y + tie.height / 2);
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 1.5;
        ctx.fillRect(-18, -16, 4, 32);
        ctx.strokeRect(-18, -16, 4, 32);
        ctx.fillRect(14, -16, 4, 32);
        ctx.strokeRect(14, -16, 4, 32);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-14, -2, 28, 4);
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

    }

    function draw() {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        stars.forEach((star) => {
            ctx.globalAlpha = star.alpha;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        ctx.globalAlpha = 1;

        if (player.invulnerable % 6 <= 3) {
            drawPlayer();
        }
        

        ctx.fillStyle = '#00ff0d';
        lasers.forEach((laser) => {
            ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        });

        ctx.save();
        ctx.fillStyle = '#ff0044';
        ctx.shadowColor = '#ff0044';
        ctx.shadowBlur = 10;
        enemyLaser.forEach((laser) => {
            ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        });
        ctx.restore();

        targets.forEach((target) => {
            ctx.save();
            ctx.translate(target.x, target.y);
            ctx.rotate(target.rotation);
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(target.points[0].x, target.points [0].y);
            for (let i = 1; i < target.points.length; i++) {
                ctx.lineTo(target.points[i].x, target.points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        ties.forEach(drawTie);

        ctx.fillStyle = '#FFE81F';
        ctx.font = '20px "Fantasque Sans Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 10, 25);
        ctx.textAlign = 'right';
        ctx.fillText(`LIVES: ${lives}`, canvas.width - 10, 25);

        if (gameOver) {
            ctx.fillStyle = '#000000cc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FF0055';
            ctx.font = '30px "Fantasque Sans Mono", monospace';
            ctx.fillText('DEFEATED', canvas.width / 2, 150);
            ctx.fillStyle = '#FFE81F';
            ctx.font = '16px "Fantasque Sans Mono", monospace';
            ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, 195);

            ctx.fillStyle = hoveringButton ? '#af9e00' : '#000000';
            ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
            ctx.strokeStyle= '#FFE81F';
            ctx.lineWidth = 2;
            ctx.strokeRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
            ctx.fillStyle = hoveringButton ? '#000000' : '#FFE81F';
            ctx.fillText('REPLAY', canvas.width / 2, restartButton.y + 28);
        }
        drawSettingsButton();
        if (settingsOpen) {
            drawSettingsMenu();
        }
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});
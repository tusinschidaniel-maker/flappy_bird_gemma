const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const shopScreen = document.getElementById('shopScreen');
const scoreDisplay = document.getElementById('scoreDisplay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const shopBtn1 = document.getElementById('shopBtn1');
const shopBtn2 = document.getElementById('shopBtn2');
const closeShopBtn = document.getElementById('closeShopBtn');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const shopStarsEl = document.getElementById('shopStars');
const shopGridEl = document.getElementById('shopGrid');
const globalStarsEl = document.getElementById('globalStars');
const shopBadges = document.querySelectorAll('.shop-badge');

// Game Constants
const GRAVITY = 0.4;
const JUMP_STRENGTH = -7;
const PIPE_SPEED = 3;
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const BIRD_RADIUS = 15;

// Game State
let state = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let bestScore = parseInt(localStorage.getItem('simplisticFlappyBest')) || 0;
let totalStars = parseInt(localStorage.getItem('simplisticFlappyStars')) || 0;
let frames = 0;
let animationId;

// Shop & Skins
const SKINS = [
    { id: 'default', name: 'Default', color: '#ff6b6b', price: 0 },
    { id: 'sky_blue', name: 'Sky Blue', color: '#4fd1c5', price: 25 },
    { id: 'golden', name: 'Golden Glow', color: '#f6e05e', price: 50 },
    { id: 'obsidian', name: 'Obsidian', color: '#2d3748', price: 100 }
];

let unlockedSkins = JSON.parse(localStorage.getItem('simplisticFlappySkins')) || ['default'];
let currentSkinId = localStorage.getItem('simplisticFlappySkinId') || 'default';

// Entities
let bird = {
    x: 100,
    y: canvas.height / 2,
    velocity: 0,
    rotation: 0,
    color: SKINS.find(s => s.id === currentSkinId).color,
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Calculate rotation based on velocity
        if (state === 'PLAYING' || state === 'GAMEOVER') {
            this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.1)));
        }
        ctx.rotate(this.rotation);

        // Bird Body (Circle)
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Subtle outline/shadow
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.stroke();

        // Eye
        ctx.beginPath();
        ctx.arc(BIRD_RADIUS * 0.4, -BIRD_RADIUS * 0.3, BIRD_RADIUS * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        // Pupil
        ctx.beginPath();
        ctx.arc(BIRD_RADIUS * 0.5, -BIRD_RADIUS * 0.3, BIRD_RADIUS * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#2d3748';
        ctx.fill();

        ctx.restore();
    },
    update() {
        if (state === 'PLAYING') {
            this.velocity += GRAVITY;
            this.y += this.velocity;
            
            // Floor collision
            if (this.y + BIRD_RADIUS >= canvas.height) {
                this.y = canvas.height - BIRD_RADIUS;
                gameOver();
            }
            
            // Ceiling collision (optional, but good for feel)
            if (this.y - BIRD_RADIUS <= 0) {
                this.y = BIRD_RADIUS;
                this.velocity = 0;
            }
        } else if (state === 'START') {
            // Hover effect
            this.y = canvas.height / 2 + Math.cos(frames * 0.05) * 10;
        } else if (state === 'GAMEOVER') {
            // Fall to ground
            if (this.y + BIRD_RADIUS < canvas.height) {
                this.velocity += GRAVITY;
                this.y += this.velocity;
            }
        }
    },
    jump() {
        this.velocity = JUMP_STRENGTH;
    },
    reset() {
        this.x = 100;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.rotation = 0;
    }
};

let pipes = [];

class Pipe {
    constructor() {
        this.x = canvas.width;
        // Ensure pipe is within visible bounds, leaving room for gap
        const minHeight = 50;
        const maxHeight = canvas.height - minHeight - PIPE_GAP;
        this.topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        this.bottomY = this.topHeight + PIPE_GAP;
        this.passed = false;
        this.color = '#a0aec0'; // Soft gray-blue
    }

    draw() {
        ctx.fillStyle = this.color;
        
        // Draw top pipe (rounded bottom)
        this.drawRoundedRect(this.x, 0, PIPE_WIDTH, this.topHeight, 10, false, false, true, true);
        
        // Draw bottom pipe (rounded top)
        this.drawRoundedRect(this.x, this.bottomY, PIPE_WIDTH, canvas.height - this.bottomY, 10, true, true, false, false);
    }

    update() {
        this.x -= PIPE_SPEED;

        // Collision detection
        // Using a slightly smaller hitbox for the bird to make it feel fairer
        const hitboxRadius = BIRD_RADIUS * 0.8;
        
        // Check Top Pipe
        if (bird.x + hitboxRadius > this.x && bird.x - hitboxRadius < this.x + PIPE_WIDTH &&
            bird.y - hitboxRadius < this.topHeight) {
            gameOver();
        }
        
        // Check Bottom Pipe
        if (bird.x + hitboxRadius > this.x && bird.x - hitboxRadius < this.x + PIPE_WIDTH &&
            bird.y + hitboxRadius > this.bottomY) {
            gameOver();
        }

        // Scoring
        if (this.x + PIPE_WIDTH < bird.x && !this.passed) {
            this.passed = true;
            score++;
            updateScoreDisplay();
            pulseScore();
        }
    }

    // Helper for sleek rounded pipes
    drawRoundedRect(x, y, width, height, radius, tl, tr, br, bl) {
        ctx.beginPath();
        ctx.moveTo(x + (tl ? radius : 0), y);
        ctx.lineTo(x + width - (tr ? radius : 0), y);
        if (tr) ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - (br ? radius : 0));
        if (br) ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + (bl ? radius : 0), y + height);
        if (bl) ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + (tl ? radius : 0));
        if (tl) ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }
}

// Background Drawing
function drawBackground() {
    // Soft Sky Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e2f1f8');
    gradient.addColorStop(1, '#b3e5fc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Optional: Draw simple minimalist clouds here if desired
}

// Game Control Functions
function init() {
    bindEvents();
    updateGlobalBalance();
    loop();
}

function startGame() {
    state = 'PLAYING';
    score = 0;
    pipes = [];
    bird.reset();
    frames = 0;
    updateScoreDisplay();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
    bird.jump();
}

function gameOver() {
    if (state === 'GAMEOVER') return;
    state = 'GAMEOVER';
    
    // Currency addition
    totalStars += score;
    localStorage.setItem('simplisticFlappyStars', totalStars);
    updateGlobalBalance();

    scoreDisplay.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('simplisticFlappyBest', bestScore);
    }
    
    finalScoreEl.innerText = score;
    bestScoreEl.innerText = bestScore;
}

function updateScoreDisplay() {
    scoreDisplay.innerText = score;
}

function pulseScore() {
    scoreDisplay.classList.add('pulse');
    setTimeout(() => {
        scoreDisplay.classList.remove('pulse');
    }, 100);
}

function bindEvents() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleInput();
        }
    });

    // Mouse/Touch on Canvas
    canvas.addEventListener('mousedown', handleInput);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput();
    }, {passive: false});

    // Buttons
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    
    // Shop
    shopBtn1.addEventListener('click', openShop);
    shopBtn2.addEventListener('click', openShop);
    closeShopBtn.addEventListener('click', closeShop);
}

// Shop Functions
function openShop() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    shopScreen.classList.remove('hidden');
    renderShop();
}

function closeShop() {
    shopScreen.classList.add('hidden');
    if (state === 'START') {
        startScreen.classList.remove('hidden');
    } else {
        gameOverScreen.classList.remove('hidden');
    }
}

function renderShop() {
    shopStarsEl.innerText = totalStars;
    shopGridEl.innerHTML = '';

    SKINS.forEach(skin => {
        const isUnlocked = unlockedSkins.includes(skin.id);
        const isEquipped = currentSkinId === skin.id;
        const canAfford = totalStars >= skin.price;

        const skinEl = document.createElement('div');
        skinEl.className = `skin-item ${isEquipped ? 'equipped' : ''}`;
        
        let btnText = '';
        let btnDisabled = false;

        if (isEquipped) {
            btnText = 'Equipped';
            btnDisabled = true;
        } else if (isUnlocked) {
            btnText = 'Equip';
        } else {
            btnText = `Buy (⭐${skin.price})`;
            btnDisabled = !canAfford;
        }

        skinEl.innerHTML = `
            <div class="skin-preview" style="background-color: ${skin.color}"></div>
            <div class="skin-name">${skin.name}</div>
            <button class="skin-btn" ${btnDisabled ? 'disabled' : ''}>
                ${btnText}
            </button>
        `;

        const btn = skinEl.querySelector('button');
        if (!btnDisabled) {
            btn.addEventListener('click', () => handleSkinAction(skin));
        }

        shopGridEl.appendChild(skinEl);
    });
}

function handleSkinAction(skin) {
    const isUnlocked = unlockedSkins.includes(skin.id);
    
    if (isUnlocked) {
        equipSkin(skin);
    } else {
        if (totalStars >= skin.price) {
            totalStars -= skin.price;
            unlockedSkins.push(skin.id);
            localStorage.setItem('simplisticFlappyStars', totalStars);
            localStorage.setItem('simplisticFlappySkins', JSON.stringify(unlockedSkins));
            updateGlobalBalance();
            equipSkin(skin);
        }
    }
}

function equipSkin(skin) {
    currentSkinId = skin.id;
    localStorage.setItem('simplisticFlappySkinId', currentSkinId);
    bird.color = skin.color;
    renderShop();
}

function updateGlobalBalance() {
    globalStarsEl.innerText = totalStars;
    
    // Check if there is any unowned skin that we can afford
    const canAffordNew = SKINS.some(skin => !unlockedSkins.includes(skin.id) && totalStars >= skin.price);
    shopBadges.forEach(badge => {
        if (canAffordNew) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    });
}

function handleInput() {
    if (state === 'START') {
        startGame();
    } else if (state === 'PLAYING') {
        bird.jump();
    }
}

// Main Game Loop
function loop() {
    // Clear canvas & draw bg
    drawBackground();

    // Handle Pipes
    if (state === 'PLAYING') {
        // Spawn pipes every 100 frames
        if (frames % 100 === 0) {
            pipes.push(new Pipe());
        }
    }
    
    // Update and Draw Pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i];
        if (state === 'PLAYING') p.update();
        p.draw();
        
        // Remove off-screen pipes
        if (p.x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }

    // Update and Draw Bird
    bird.update();
    bird.draw();

    frames++;
    animationId = requestAnimationFrame(loop);
}

// Start everything
init();

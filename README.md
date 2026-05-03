# Simplistic Flappy Bird

A modern, minimalist reimagining of the classic Flappy Bird game, built using vanilla HTML5 Canvas, CSS, and JavaScript.

## Features

*   **Simplistic Aesthetic:** Clean geometric shapes, smooth pastel colors, and modern glassmorphic UI elements replace the traditional pixel art.
*   **Responsive Canvas:** The game window automatically scales to fit larger screens while perfectly maintaining its original aspect ratio.
*   **Currency & Shop System:** 
    *   Earn 1 Star for every point you score!
    *   Spend your stars in the Shop to unlock new minimalist skins for your bird (Sky Blue, Golden Glow, Obsidian).
    *   Your currency, high score, and skin unlocks are automatically saved to your browser.
*   **Smooth Gameplay:** Utilizes `requestAnimationFrame` for a fluid 60FPS physics and rendering loop.

## How to Run Locally

Since this is a vanilla web application, no installation or build tools are required. 

1. Download or clone this repository to your local machine.
2. Locate the `index.html` file inside the project folder.
3. Double-click the `index.html` file to open it in your default web browser.

*(Alternatively, you can drag and drop the `index.html` file into any open browser window, or serve the directory using a simple local web server like `python -m http.server`)*

## How to Play

1.  Press the **Start Game** button.
2.  Press the **Spacebar**, **Click**, or **Tap** the screen to make the bird flap.
3.  Navigate through the gaps in the pipes to score points.
4.  Earn stars, buy skins, and beat your high score!

## File Structure

*   `index.html`: The main entry point containing the canvas and UI overlays.
*   `styles.css`: Styling for the modern UI, shop grid, and responsive game container.
*   `game.js`: The core game engine containing the game loop, physics, collision detection, and shop logic.

## Built With

*   HTML5 Canvas API
*   Vanilla CSS (Flexbox, Grid, Animations, Variables)
*   Vanilla JavaScript (ES6+)

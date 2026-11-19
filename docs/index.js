//---------- canvas ---------- //
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
//window.addEventListener("resize", resizeCanvas);

// ---------- keyboard handling ---------- //
document.addEventListener("keypress", function (event) {
  if (event.key === " ") {
    if (!spaceDown) {
      spaceDown = true;
      ready = true;
      if (!lost) {
        bird.flap();
      }
      if (over) {
        restart();
      }
    }
  }
  if (event.key === "p") {
    if (!pDown) {
      pDown = true;
      pause = !pause;
    }
  }
  if (event.key === "s") {
    if (!sDown) {
      sDown = true;
      music.pause();
      clearTimeout(musicID);
    }
  }
  if (event.key === "l") {
    lose();
  }
});

document.addEventListener("keyup", function (event) {
  if (event.key === " ") {
    spaceDown = false;
  }
  if (event.key === "p") {
    pDown = false;
  }
  if (event.key === "s") {
    sDown = false;
  }
});

document.addEventListener("mousedown", function (e) {
  handeClick(canvas, e);
});

//---------- global variables ---------- //
let DRAW_HITBOXES = false;
let startTime, previousTime, elapsedTime;
let bird;
let pipes = [];
let background;
let ground;
let spaceDown = false;
let pDown = false;
let sDown = false;
let pause = false;
let lost = false;
let over = false;
let points = 0;
let pointsDisplay;
let gameOverSprite;
let ready = false;
let welcomeScreen;
let best5table;
let best5best;
let best55;
let gameOverBest;
let gameOverBestPoints;
let gameOverLast;
let gameOverLastPoints;
let restartButton;
let pipeSpawningTimeoutID;
let musicID;
let musicPlaying;
let music;

// ---------- classes ---------- //

class Transform2D {
  x;
  y;
  angle;
  scale;

  constructor(x, y, scale = 1, angle = 0) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = angle;
  }
}

// Main class that is used to create objects that are supposed to be displayed on the screen
// It takes an array of images, canvas context and transform2d
// Multiple images are used by the bird to add the wing moving animation
// transform2d x and y are interpreted as the center of the object
class Drawable {
  assets = [];
  assetToDrawIdx;
  ctx;
  size = { w: undefined, h: undefined };
  transform2d;

  constructor(urls, ctx, transform2d) {
    for (let i = 0; i < urls.length; i++) {
      this.assets[i] = new Image();
      this.assets[i].src = urls[i];
    }
    this.ctx = ctx;
    this.transform2d = transform2d;
    this.assetToDrawIdx = 0;
  }
  // this loads the image and sets the object size
  async preLoad() {
    for (let i = 0; i < this.assets.length; i++) await this.assets[i].decode();
    if (this.size.w === undefined) {
      this.size.w = this.assets[0].width;
      this.size.h = this.assets[0].height;
    }
  }

  // draws the object on the screen, centered at it's x and y position, at an angle and a scale
  draw() {
    // getting the center
    let scaleHalf = this.transform2d.scale / 2;
    let x = this.transform2d.x - this.size.w * scaleHalf;
    let y = this.transform2d.y - this.size.h * scaleHalf;
    // moving the canvas context to the center of the object so that we can rotate it to draw the object at an angle
    this.ctx.save();
    this.ctx.translate(
      x + this.size.w * scaleHalf,
      y + this.size.h * scaleHalf,
    );
    this.ctx.rotate(this.transform2d.angle);
    this.ctx.translate(
      -x - this.size.w * scaleHalf,
      -y - this.size.h * scaleHalf,
    );
    // actually drawing the object
    this.ctx.drawImage(
      this.assets[this.assetToDrawIdx],
      this.transform2d.x - (this.size.w / 2) * this.transform2d.scale,
      this.transform2d.y - (this.size.h / 2) * this.transform2d.scale,
      this.size.w * this.transform2d.scale,
      this.size.h * this.transform2d.scale,
    );
    // reseting the movement and rotation off the canvas context
    this.ctx.restore();
  }

  // this is used to draw black borders around objects
  // helped with debugging and looks intresting
  drawHitbox() {
    let scaleHalf = this.transform2d.scale / 2;
    let x = this.transform2d.x - this.size.w * scaleHalf;
    let y = this.transform2d.y - this.size.h * scaleHalf;
    ctx.beginPath();
    ctx.rect(
      x,
      y,
      this.size.w * this.transform2d.scale,
      this.size.h * this.transform2d.scale,
    );
    ctx.stroke();
  }

  // this function checkes if two drawable objects are overlapping
  // used to detect colisions
  overlaps(other) {
    let scaleHalf1 = this.transform2d.scale / 2;
    let x11 = this.transform2d.x - this.size.w * scaleHalf1;
    let y11 = this.transform2d.y - this.size.h * scaleHalf1;
    let x12 = x11 + this.size.w * this.transform2d.scale;
    let y12 = y11 + this.size.h * this.transform2d.scale;

    let scaleHalf2 = other.transform2d.scale / 2;
    let x21 = other.transform2d.x - other.size.w * scaleHalf2;
    let y21 = other.transform2d.y - other.size.h * scaleHalf2;
    let x22 = x21 + other.size.w * other.transform2d.scale;
    let y22 = y21 + other.size.h * other.transform2d.scale;

    if (
      ((x11 <= x21 && x21 <= x12) || (x21 <= x11 && x11 <= x22)) &&
      ((y11 <= y21 && y21 <= y12) || (y21 <= y11 && y11 <= y22))
    ) {
      return true;
    }
    return false;
  }
}

// The flappy bird bird
class Bird extends Drawable {
  maxYup = -40;
  maxYdown = 80;
  yVelocity = 0;

  // move the bird according to laws of "physics"
  move(dt) {
    const g = 9.81;
    this.yVelocity = Math.min(this.yVelocity + g * dt, this.maxYdown);
    this.transform2d.y = Math.min(
      Math.max(this.transform2d.y + this.yVelocity * dt, 25),
      canvas.height - 50,
    );
    this.transform2d.angle = this.calculateAngle();
  }

  // swing of the wings
  // sets the speed up and queues the different images of the bird to be drawn
  flap() {
    const frameTime = 200;
    if (this.yVelocity > 60) {
      let swooshSound = new Audio("./assets/Sound Efects/swoosh.wav");
      swooshSound.play();
    } else {
      let wingSound = new Audio("./assets/Sound Efects/wing.wav");
      wingSound.play();
    }
    this.yVelocity = this.maxYup;
    this.assetToDrawIdx = 2;

    setTimeout(
      function (obj) {
        obj.assetToDrawIdx = 1;
      },
      frameTime,
      this,
    );
    setTimeout(
      function (obj) {
        obj.assetToDrawIdx = 0;
      },
      2 * frameTime,
      this,
    );
  }

  // function to calculate angle according to moving speed
  calculateAngle() {
    return (this.yVelocity * Math.PI) / 4 / 80;
  }

  kill() {
    this.yVelocity = 10;
  }
}

class Pipe extends Drawable {}

// PipePair stores top and bottom pipe and moves them
class PipePair {
  gap = 850;
  xVelocity = 14;
  pipe1;
  pipe2;

  constructor(urls, ctx, transform2d) {
    this.pipe1 = new Pipe(
      urls[1],
      ctx,
      new Transform2D(
        transform2d.x,
        transform2d.y / transform2d.scale + this.gap / 2,
        transform2d.scale,
        transform2d.angle,
      ),
    );
    this.pipe2 = new Pipe(
      urls[0],
      ctx,
      new Transform2D(
        transform2d.x,
        transform2d.y / transform2d.scale - this.gap / 2,
        transform2d.scale,
        transform2d.angle,
      ),
    );
  }

  move(dt) {
    if (
      this.pipe1.transform2d.x >= canvas.width / 2 &&
      this.pipe1.transform2d.x - this.xVelocity * dt <= canvas.width / 2
    ) {
      points += 1;
      let pointSound = new Audio("./assets/Sound Efects/point.wav");
      pointSound.play();
    }
    this.pipe1.transform2d.x -= this.xVelocity * dt;
    this.pipe2.transform2d.x -= this.xVelocity * dt;
  }
}

// Tiles are used to fill the entire canvas with repeating image and move it horizontaly
// Used by the background and the ground
class Tiles {
  tiles = [];
  urls;
  ctx;
  transform2d;
  xVelocity;

  constructor(urls, ctx, spawnTransform2d, velocity) {
    this.urls = urls;
    this.ctx = ctx;
    this.transform2d = spawnTransform2d;
    this.xVelocity = velocity;
  }

  // handles deleting tiles that are off screen and adding new ones in the front and draws them
  fillScreen() {
    while (true) {
      if (
        this.tiles.length > 0 &&
        this.tiles[0].transform2d.x +
          (this.tiles[0].size.w / 2) * this.tiles[0].transform2d.scale <
          0
      ) {
        this.tiles.shift();
        continue;
      }
      if (
        this.tiles.length === 0 ||
        this.tiles[this.tiles.length - 1].transform2d.x <
          this.transform2d.x -
            (this.tiles[this.tiles.length - 1].size.w / 2) *
              this.tiles[0].transform2d.scale
      ) {
        let newTile = new Drawable(
          this.urls,
          this.ctx,
          new Transform2D(
            this.tiles.length === 0
              ? 0
              : this.tiles[this.tiles.length - 1].transform2d.x +
                  (this.tiles[0].size.w / 2) * this.tiles[0].transform2d.scale,
            this.transform2d.y,
            this.transform2d.scale,
            this.transform2d.angle,
          ),
        );
        newTile.preLoad();
        this.tiles.push(newTile);
        continue;
      }
      for (let i = 0; i < this.tiles.length; i++) {
        this.tiles[i].draw();
        if (DRAW_HITBOXES) this.tiles[i].drawHitbox();
      }
      break;
    }
  }

  move(dt) {
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i].transform2d.x -= this.xVelocity * dt;
    }
  }
}

class Number extends Drawable {}

// PointsDisplay handles converting integers to numbers displayed on the canvas using provided digit assets
// Initialy it was made to display score in the top right corner but i reused it to display all numbers on the screen
class PointsDisplay {
  currentPoints = -1;
  currentNumber = [];
  numberFiles = [
    "./assets/UI/Numbers/0.png",
    "./assets/UI/Numbers/1.png",
    "./assets/UI/Numbers/2.png",
    "./assets/UI/Numbers/3.png",
    "./assets/UI/Numbers/4.png",
    "./assets/UI/Numbers/5.png",
    "./assets/UI/Numbers/6.png",
    "./assets/UI/Numbers/7.png",
    "./assets/UI/Numbers/8.png",
    "./assets/UI/Numbers/9.png",
  ];
  numberWidth = 36;
  numberGap = 2;
  ctx;
  y;
  topright;
  scale;

  constructor(ctx, y, topright, scale) {
    this.ctx = ctx;
    this.y = y;
    this.topright = topright;
    this.scale = scale;
    this.numberWidth = 24 * scale;
    this.numberGap = scale * 1.2;
  }

  // draws number if it was not changed from the last draw
  // if the number changed it prepares new combination of digits to form it and draws it
  drawPoints(number) {
    if (number == this.currentnumber) {
      for (let i = 0; i < this.currentNumber.length; i++) {
        this.currentNumber[i].draw();
      }
    } else {
      this.currentnumber = number;
      this.currentNumber = [];

      let nSize = number.toString().length;
      for (let i = 0; i < nSize; i++) {
        let newNumber = new Number(
          [this.numberFiles[parseInt(number.toString()[i])]],
          ctx,
          this.topright
            ? this.topRight(nSize, 50, this.scale, i)
            : this.center(nSize, this.scale, i),
        );
        this.currentNumber.push(newNumber);
      }
      Promise.all(this.currentNumber.map((obj) => obj.preLoad())).then(() => {
        this.drawPoints(number);
      });
    }
  }

  // calculates digit positions if number is anchored to top right corner of the canvas
  topRight(nSize, offset, scale, i) {
    return new Transform2D(
      canvas.width -
        offset -
        ((nSize - 1) * this.numberWidth + (nSize - 1) * this.numberGap) +
        i * this.numberWidth +
        i * this.numberGap,
      this.y,
      scale,
    );
  }

  // calculates digit positions if they are supposed to be in the center of the canvas
  center(nSize, scale, i) {
    return new Transform2D(
      (canvas.width -
        (nSize - 1) * this.numberWidth -
        (nSize - 1) * this.numberGap) /
        2 +
        i * this.numberWidth +
        i * this.numberGap,
      this.y,
      scale,
    );
  }
}
// ---------- functions ---------- //

function handeClick(canvas, e) {
  if (over) {
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    if (
      x >=
        restartButton.transform2d.x -
          (restartButton.transform2d.scale * restartButton.size.w) / 2 &&
      x <=
        restartButton.transform2d.x +
          (restartButton.transform2d.scale * restartButton.size.w) / 2 &&
      y >=
        restartButton.transform2d.y -
          (restartButton.transform2d.scale * restartButton.size.h) / 2 &&
      y <=
        restartButton.transform2d.y +
          (restartButton.transform2d.scale * restartButton.size.h) / 2
    ) {
      restart();
    }
  } else if (!pause && !lost) {
    ready = true;
    bird.flap();
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = Math.min(window.innerHeight, 800); // we limit the screen height because the pipe textures are not long enough
}

function updateTime(timestamp) {
  if (startTime === undefined) {
    startTime = timestamp;
    deltaTime = 0;
  } else {
    deltaTime = timestamp - previousTime;
  }
  elapsedTime = timestamp - startTime;
  previousTime = timestamp;
  return deltaTime * 0.01;
}

function updateStoredScores() {
  let a = points;
  let b;
  for (let i = 0; i < 5; i++) {
    b = best5scores[i];
    if (a > b) {
      best5scores[i] = a;
      a = b;
    }
  }
  localStorage.setItem("best1", best5scores[0]);
  localStorage.setItem("best2", best5scores[1]);
  localStorage.setItem("best3", best5scores[2]);
  localStorage.setItem("best4", best5scores[3]);
  localStorage.setItem("best5", best5scores[4]);
}

function loopMusic() {
  musicPlaying = true;
  music = new Audio("./assets/Sound Efects/Masterczulek - Flappy Bird.mp3");
  music.play();
  music.volume = 0.3;
  musicID = setTimeout(() => {
    loopMusic();
  }, 100000);
}

// ---------- pipes related functions ---------- //

function spawnPipePair() {
  let gapRange = canvas.height / 2;
  let y = canvas.height / 2 + (Math.random() - 0.5) * 2 * gapRange;
  let newPipePair = new PipePair(
    [
      ["./assets/Flappy Bird/pipe-green-top.png"],
      ["./assets/Flappy Bird/pipe-green-bottom.png"],
    ],
    ctx,
    new Transform2D(canvas.width + 100, y, 2),
  );
  Promise.all(
    [newPipePair.pipe1, newPipePair.pipe2].map((obj) => obj.preLoad()),
  ).then(() => pipes.push(newPipePair));
}

function deletePipesOffScreen() {
  let pipesOnScreen = [];
  for (i = 0; i < pipes.length; i++) {
    if (pipes[i].pipe1.transform2d.x >= -pipes[i].pipe1.size.w * 2)
      pipesOnScreen.push(pipes[i]);
  }
  pipes = pipesOnScreen;
}

function movePipes(dt) {
  for (i = 0; i < pipes.length; i++) {
    pipes[i].move(dt);
  }
}

function drawPipes() {
  for (i = 0; i < pipes.length; i++) {
    pipes[i].pipe1.draw();
    pipes[i].pipe2.draw();
    if (DRAW_HITBOXES) {
      pipes[i].pipe1.drawHitbox();
      pipes[i].pipe2.drawHitbox();
    }
  }
}

function startPipeSpawning() {
  spawnPipePair();
  let timeBetween = Math.floor(Math.random() * 400) + 2100;
  if (lost) return;
  //console.log(timeBetween);
  pipeSpawningTimeoutID = setTimeout(() => {
    startPipeSpawning();
  }, timeBetween);
}

// ---------- losing related functions ---------- //

// this function is the main loop that is called when the player loses
// at first the bird is falling, when the bird touches the ground
// we draw the game over ui elements
function shouldLose(timestamp) {
  let deltaTime = updateTime(timestamp);
  ctx.fillStyle = "#eeeeee";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  background.fillScreen();
  drawPipes();
  ground.fillScreen();
  bird.draw();
  pointsDisplay.drawPoints(points);

  if (!over) {
    bird.move(deltaTime);
    if (DRAW_HITBOXES) bird.drawHitbox();
    if (bird.transform2d.y === canvas.height - 50) {
      // animateGameOverScale(2);
      over = true;
      let dieSound = new Audio("./assets/Sound Efects/die.ogg");
      dieSound.play();
    }
  } else {
    gameOverSprite.draw();
    gameOverBest.draw();
    gameOverBestPoints.drawPoints(best5scores[0]);
    gameOverLast.draw();
    gameOverLastPoints.drawPoints(points);
    restartButton.draw();
  }
  if (lost) {
    requestAnimationFrame(shouldLose);
  }
}

// this function is the initial loop that is called when the player loses
// it prepares sprites to draw
function lose() {
  lost = true;
  bird.kill();

  gameOverSprite = new Drawable(
    ["./assets/UI/gameover.png"],
    ctx,
    new Transform2D(canvas.width / 2, canvas.height / 2 - 200, 2),
  );
  gameOverBest = new Drawable(
    ["./assets/UI/BEST.png"],
    ctx,
    new Transform2D(canvas.width / 2, canvas.height / 2 - 75, 1),
  );
  gameOverBestPoints = new PointsDisplay(
    ctx,
    canvas.height / 2 - 5,
    false,
    1.5,
  );

  gameOverLast = new Drawable(
    ["./assets/UI/LAST.png"],
    ctx,
    new Transform2D(canvas.width / 2, canvas.height / 2 + 85, 1),
  );
  gameOverLastPoints = new PointsDisplay(
    ctx,
    canvas.height / 2 + 150,
    false,
    1.5,
  );

  restartButton = new Drawable(
    ["./assets/UI/restart.png"],
    ctx,
    new Transform2D(50, 50, 1.5),
  );

  Promise.all(
    [gameOverSprite, gameOverBest, gameOverLast, restartButton].map((obj) =>
      obj.preLoad(),
    ),
  ).then(() => requestAnimationFrame(shouldLose));
}

// ---------- colisions related functions ---------- //

function collisionDetected() {
  updateStoredScores();
  let hitSound = new Audio("./assets/Sound Efects/hit.wav");
  hitSound.play();
  lose();
}

function detectCollisions() {
  for (i = 0; i < ground.tiles.length; i++) {
    if (bird.overlaps(ground.tiles[i])) {
      collisionDetected();
    }
  }

  for (i = 0; i < pipes.length; i++) {
    if (bird.overlaps(pipes[i].pipe1)) {
      collisionDetected();
    }

    if (bird.overlaps(pipes[i].pipe2)) {
      collisionDetected();
    }
  }
}

// ---------- main functions ---------- //

// This functions prepares game assets
function start() {
  if (!localStorage.getItem("best1")) localStorage.setItem("best1", 0);
  if (!localStorage.getItem("best2")) localStorage.setItem("best2", 0);
  if (!localStorage.getItem("best3")) localStorage.setItem("best3", 0);
  if (!localStorage.getItem("best4")) localStorage.setItem("best4", 0);
  if (!localStorage.getItem("best5")) localStorage.setItem("best5", 0);

  best5scores = [
    localStorage.getItem("best1"),
    localStorage.getItem("best2"),
    localStorage.getItem("best3"),
    localStorage.getItem("best4"),
    localStorage.getItem("best5"),
  ];

  best5best = new Drawable(
    ["./assets/UI/BEST.png"],
    ctx,
    new Transform2D(canvas.width / 2 - 10, canvas.height - 190, 0.5),
  );
  best55 = new Drawable(
    ["./assets/UI/Numbers/5.png"],
    ctx,
    new Transform2D(canvas.width / 2 + 30, canvas.height - 190, 0.75),
  );
  best5table = [];
  for (let i = 0; i < 5; i++) {
    best5table[i] = new PointsDisplay(
      ctx,
      canvas.height - 150 + 30 * i,
      false,
      0.75,
    );
  }

  // create initial objects
  bird = new Bird(
    [
      "./assets/Flappy Bird/yellowbird-midflap.png",
      "./assets/Flappy Bird/yellowbird-upflap.png",
      "./assets/Flappy Bird/yellowbird-downflap.png",
    ],
    ctx,
    new Transform2D(canvas.width / 2, canvas.height / 2, 2),
  );

  ground = new Tiles(
    ["./assets/Flappy Bird/base.png"],
    ctx,
    new Transform2D(canvas.width * 1.5, canvas.height + 50, 2),
    15,
  );

  background = new Tiles(
    ["./assets/Flappy Bird/background-day.png"],
    ctx,
    new Transform2D(canvas.width * 2, canvas.height / 2, 2),
    5,
  );

  welcomeScreen = new Drawable(
    ["./assets/UI/message.png"],
    ctx,
    new Transform2D(canvas.width / 2, canvas.height / 2 - 95, 2),
  );

  pointsDisplay = new PointsDisplay(ctx, 50, true, 1.5);

  initObjs = [bird, welcomeScreen, best5best, best55];
  // load all sprites, then start the update
  Promise.all(initObjs.map((obj) => obj.preLoad())).then(() =>
    requestAnimationFrame(waitForStart),
  );
}

// this function is the loop that waits for player input to start the game
function waitForStart(timestamp) {
  let deltaTime = updateTime(timestamp);
  if (!ready) {
    ctx.fillStyle = "#eeeeee";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    background.move(deltaTime);
    ground.move(deltaTime);
    background.fillScreen();
    ground.fillScreen();
    bird.draw();
    pointsDisplay.drawPoints(points);
    welcomeScreen.draw();
    best5best.draw();
    best55.draw();
    for (let i = 0; i < 5; i++) {
      best5table[i].drawPoints(best5scores[i]);
    }
    requestAnimationFrame(waitForStart);
  } else {
    startPipeSpawning();
    if (!musicPlaying) {
      loopMusic();
    }
    requestAnimationFrame(update);
  }
}

// this is the main loop of the game
function update(timestamp) {
  let deltaTime = updateTime(timestamp);
  if (!pause && !lost) {
    ctx.fillStyle = "#eeeeee";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    detectCollisions();

    bird.move(deltaTime);
    movePipes(deltaTime);
    background.move(deltaTime);
    ground.move(deltaTime);
    deletePipesOffScreen();

    background.fillScreen();
    drawPipes();
    ground.fillScreen();
    bird.draw();

    if (DRAW_HITBOXES) bird.drawHitbox();
    pointsDisplay.drawPoints(points);
  }
  if (!lost) {
    requestAnimationFrame(update);
  }
}

// this function resets all the global variables
function restart() {
  (startTime, previousTime, (elapsedTime = undefined));
  bird = undefined;
  pipes = [];
  background = undefined;
  ground = undefined;
  pause = false;
  lost = false;
  over = false;
  points = 0;
  pointsDisplay = undefined;
  gameOverSprite = undefined;
  ready = false;
  welcomeScreen = undefined;
  best5table = undefined;
  best5best = undefined;
  best55 = undefined;
  gameOverBest = undefined;
  gameOverLast = undefined;
  gameOverLastPoints = undefined;
  restartButton = undefined;
  clearTimeout(pipeSpawningTimeoutID);
  pipeSpawningTimeoutID = undefined;
  start();
}

resizeCanvas();
start();

setTimeout(() => {
  console.log("Test JS");
}, 4000);

let time = 0;
let timer;

const stopwatch = document.getElementById("stopwatch");
const startB = document.getElementById("start");
const stopB = document.getElementById("stop");
const resetB = document.getElementById("reset");

startB.addEventListener("click", start);
stopB.addEventListener("click", stop);
resetB.addEventListener("click", reset);

function start() {
  if (!timer) {
    timer = setTimer();
  }
}

function reset() {
  stopTimer(timer);
  timer = undefined;
  time = 0;
  updateTime();
}

function stop() {
  stopTimer(timer);
}

function setTimer() {
  return setInterval(() => {
    time++;
    updateTime();
  }, 1000);
}

function stopTimer(timer) {
  if (timer) {
    clearInterval(timer);
  }
}

function updateTime() {
  stopwatch.textContent = timeToString();
}

function timeToString() {
  mins = Math.floor(time / 60);
  secs = time % 60;
  if (mins === 0) {
    return secs + "s";
  } else {
    return mins + "min " + secs + "s";
  }
}

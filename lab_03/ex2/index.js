setTimeout(() => {
  console.log("Test JS");
}, 4000);

let minLenEl = document.getElementById("min-pass-len");
let maxLenEl = document.getElementById("max-pass-len");
let withUpper = document.getElementById("with-upper");
let withSpecial = document.getElementById("with-special");
let generateBtn = document.getElementById("generate");
let info = document.getElementById("info");

let minLen, maxLen;

let lower = "qwertyuiopasdfghjklzxcvbnm";
let upper = "QWERTYUIOPASDFGHJKLZXCVBNM";
let special = "-._()[]{}!@";

generateBtn.addEventListener("click", generate);

function checkInputs() {
  info.textContent = "";

  if (isNaN(parseInt(minLenEl.value))) {
    info.textContent = "Minimalna długość hasła nie jest liczbą";
    return false;
  }

  if (isNaN(parseInt(maxLenEl.value))) {
    info.textContent = "Maksymalna długość hasła nie jest liczbą";
    return false;
  }

  minLen = parseInt(minLenEl.value);
  maxLen = parseInt(maxLenEl.value);

  if (maxLen < minLen) {
    info.textContent = "Maksymalna długość jest mniejsza niż minimalna";
    return false;
  }

  return true;
}

function getLetter() {
  let n = lower.length - 1;
  if (withUpper.checked) n += upper.length;
  if (withSpecial.checked) n += special.length;
  let i = Math.floor(Math.random() * n);
  if (i < lower.length) {
    return lower[i];
  }
  i -= lower.length;
  if (withUpper.checked) {
    if (i < upper.length) {
      return upper[i];
    }
    i -= upper.length;
  }
  return special[i];
}

function generate() {
  if (!checkInputs()) return;

  let passLen = minLen + Math.floor(Math.random() * (maxLen - minLen));
  console.log(passLen);
  let password = "";
  for (let i = 0; i < passLen; i++) {
    password += getLetter();
  }
  alert(password);
}


let table = document.getElementById("products");
let filterEl = document.getElementById("filterInput");
let sortingEl = document.getElementById("sorting");
let data, dataToDisplay;
let productsAmount;

filterEl.addEventListener("input", filterData);
sortingEl.addEventListener("change", sortData);

async function getData() {
  if (data) return;
  const url = "https://dummyjson.com/products";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    data = result;
    dataToDisplay = JSON.parse(JSON.stringify(data));
    productsAmount = Math.min(Object.keys(data.products).length, 30);
  } catch (error) {
    console.error(error.message);
  }
}

function addRow(photo, title, desc) {
  let row = document.createElement("tr");
  let photoCell = document.createElement("td");
  photoCell.className = "photoCell";
  let titleCell = document.createElement("td");
  titleCell.className = "titleCell";
  let descCell = document.createElement("td");
  descCell.className = "descCell";

  let photoEl = document.createElement("img");
  photoEl.src = photo;
  let titleEl = document.createElement("h2");
  titleEl.textContent = title;
  let descEl = document.createElement("p");
  descEl.textContent = desc;

  photoCell.appendChild(photoEl);
  titleCell.appendChild(titleEl);
  descCell.appendChild(descEl);
  row.appendChild(photoCell);
  row.appendChild(titleCell);
  row.appendChild(descCell);
  table.appendChild(row);
}

async function fillTable() {
  await getData();
  table.innerHTML = "";
  for (i = 0; i < productsAmount; i++) {
    addRow(
      dataToDisplay.products[i].images[0],
      dataToDisplay.products[i].title,
      dataToDisplay.products[i].description,
    );
  }
}

function filterData() {
  let phrase = filterEl.value.toLowerCase();
  for (i = 0; i < table.childElementCount; i++) {
    if (
      phrase.length === 0 ||
      table.children[i]
        .getElementsByTagName("h2")[0]
        .innerText.toLowerCase()
        .includes(phrase) ||
      table.children[i]
        .getElementsByTagName("p")[0]
        .innerText.toLowerCase()
        .includes(phrase)
    ) {
      table.children[i].className = "";
    } else {
      table.children[i].className = "hidden";
    }
  }
}

function compareTitle(a, b) {
  for (i = 0; i < a.length && b.length; i++) {
    if (a.charCodeAt(i) - b.charCodeAt(i) != 0)
      return a.charCodeAt(i) - b.charCodeAt(i);
  }
  return a.length - b.length;
}

async function sortData() {
  await getData();
  let sortidx = sortingEl.selectedIndex;
  if (sortidx === 0) {
    dataToDisplay = JSON.parse(JSON.stringify(data));
  } else {
    dataToDisplay.products.sort(function (a, b) {
      return compareTitle(a.title, b.title);
    });
    if (sortidx === 2) {
      dataToDisplay.products.reverse();
    }
  }
  fillTable().then((_) => {
    filterData();
  });
}

fillTable();

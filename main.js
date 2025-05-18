// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
// This script was created by Flopp999
// Support me with a coffee https://www.buymeacoffee.com/flopp999 
let version = 0.61;

// Update the code.
try {
  const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-Nordpool/main/main.js");
  const codeString = await req.loadString();
  const serverVersion = codeString.match(/version\s*=\s*([0-9.]+)/);
  if (version < serverVersion[1]){
    let files = FileManager.iCloud();
    files.writeString(module.filename, codeString);
  }
} catch (error){
  console.error(error);
}

let fileName = Script.name() + "_Settings.json";
let fm = FileManager.iCloud(); // Or .local() if preferred
let dir = fm.documentsDirectory();
let filePath = fm.joinPath(dir, fileName);

let settings = {};

try {
  if (fm.fileExists(filePath)) {
    let raw = fm.readString(filePath);
    settings = JSON.parse(raw);
    let keys = Object.keys(settings);
    if (keys.length < 5) {
      throw new Error("Settings file is incomplete or corrupted");
    }
  } else {
    throw new Error("Settings file not found");
  }
} catch (err) {
  console.warn("Settings not found or error reading file: " + err.message);
  [settings.area, settings.vat] = await askForArea();
  settings.resolution = await askForResolution();
  settings.currency = await askForCurrency();
  settings.includevat = await askIncludeVAT();
  fm.writeString(filePath, JSON.stringify(settings, null, 2)); // Pretty print
}

const area = settings.area;
const resolution = settings.resolution;
const currency = settings.currency;
const vat = settings.vat;
const includevat = settings.includevat;

// Select area
async function askForArea() {
  let alert = new Alert();
  alert.title = "Select Area";
  alert.message = "Choose your electricity area:";
  alert.addAction("AT");
  alert.addAction("BE");
  alert.addAction("BG");
  alert.addAction("DK1");
  alert.addAction("DK2");
  alert.addAction("EE");
  alert.addAction("FI");
  alert.addAction("FR");
  alert.addAction("GER");
  alert.addAction("LT");
  alert.addAction("LV");
  alert.addAction("NL");
  alert.addAction("NO1");
  alert.addAction("NO2");
  alert.addAction("NO3");
  alert.addAction("NO4");
  alert.addAction("NO5");
  alert.addAction("PL");
  alert.addAction("SE1");
  alert.addAction("SE2");
  alert.addAction("SE3");
  alert.addAction("SE4");
  alert.addAction("TEL");
  alert.addAction("SYS");
  let index = await alert.presentAlert();
  let area = ["AT","BE","BG","DK1","DK2","EE","FI","FR","GER","LT","LV","NL","NO1","NO2","NO3","NO4","NO5","PL","SE1","SE2","SE3","SE4","TEL","SYS"][index];
  let vat = [
    20,  // AT - Austria
    6,   // BE - Belgium
    20,  // BG - Bulgaria
    25,  // DK1 - Denmark (East)
    25,  // DK2 - Denmark (West)
    20,  // EE - Estonia
    24,  // FI - Finland
    20,  // FR - France
    19,  // GER - Germany
    21,  // LT - Lithuania
    21,  // LV - Latvia
    21,  // NL - Netherlands
    25,  // NO1 - Norway
    25,  // NO2 - Norway
    25,  // NO3 - Norway
    25,  // NO4 - Norway
    25,  // NO5 - Norway
    23,  // PL - Poland
    25,  // SE1 - Sweden
    25,  // SE2 - Sweden
    25,  // SE3 - Sweden
    25,  // SE4 - Sweden
    19,   // TEL - Unknown (set to 0)
    0    // SYS - System price or not applicable (set to 0)
    ][index];
    return [area, vat];
}

// Select resolution
async function askForResolution() {
  let alert = new Alert();
  alert.title = "Select Resolution";
  alert.message = "Choose data resolution:";
  alert.addAction("15 min");
  alert.addAction("60 min");
  let index = await alert.presentAlert();
  return [15, 60][index];
}

// Select currency
async function askForCurrency() {
  let alert = new Alert();
  alert.title = "Select Currency";
  alert.message = "Choose your currency:";
  alert.addAction("BGN");
  alert.addAction("DKK");
  alert.addAction("EUR");
  alert.addAction("NOK");
  alert.addAction("PLN");
  alert.addAction("RON");
  alert.addAction("SEK");
  let index = await alert.presentAlert();
  return ["BGN","DKK","EUR","NOK","PLN","RON","SEK"][index];
}

// Include VAT?
async function askIncludeVAT() {
  let alert = new Alert();
  alert.title = "Include VAT?";
  alert.message = "Do you want the electricity price with or without VAT?";
  alert.addAction("With VAT");
  alert.addAction("Without VAT");
  let index = await alert.presentAlert();
  return [1,0][index];
}

const smallFont = 10;
const mediumFont = 12;
const bigFont = 13.5;
const date = new Date();
const yyyy = date.getFullYear();
const mm = String(date.getMonth() + 1).padStart(2, '0'); // month are indexed from 0
const dd = String(date.getDate()).padStart(2, '0');
const formattedDate = `${yyyy}-${mm}-${dd}`;
const hour = date.getHours();
const minute = date.getMinutes();
const hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
const url = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPriceIndices?date=${formattedDate}&market=DayAhead&indexNames=${area}&currency=SEK&resolutionInMinutes=${resolution}`;
const request = new Request(url);
request.timeoutInterval = 1;
let response = (await request.loadJSON());
let updated = response.updatedAt;
updated = updated.replace(/\.\d+Z$/, '').replace('T', ' ');
const day = response.deliveryDateCET;
let prices = response.multiIndexEntries;
let allValues = [];

for (let i = 0; i < prices.length; i++) {
  const value = prices[i]["entryPerArea"][`${area}`];
  allValues.push(String(value/10* (1+"."+(includevat*vat))));
}

let pricesJSON = JSON.parse(JSON.stringify(allValues));
// Test data for 15 min values
//pricesJSON = ["53.7", "89.1", "60.2", "97.9", "70.8", "40.3", "48.6", "81.7", "26.4", "73.5","75.1", "39.7", "62.8", "18.5", "92.6", "33.1", "20.7", "11.4", "55.5", "46.9","85.0", "35.6", "79.2", "90.4", "66.7", "67.3", "28.8", "15.3", "99.6", "64.5","38.9", "57.2", "19.8", "71.6", "84.4", "49.5", "14.7", "63.1", "21.6", "44.2","78.5", "37.4", "17.2", "13.8", "12.6", "45.3", "58.6", "43.8", "16.9", "69.2","24.1", "41.6", "50.8", "36.3", "59.9", "95.4", "42.5", "93.7", "61.4", "27.5","47.7", "31.9", "32.8", "25.2", "83.6", "30.5", "74.2", "22.4", "77.1", "29.6","34.7", "52.1", "56.8", "23.3", "86.3", "65.4", "91.2", "68.4", "94.9", "98.5","76.3", "87.5", "88.7", "51.3", "80.1", "82.2", "72.7", "96.8", "87.0", "10.9","10.1", "10.4", "10.7", "11.9", "12.2", "13.5", "14.1", "15.8", "16.4", "17.7"]
  
const priceLowest = (Math.min(...pricesJSON.map(Number)));
const priceHighest = (Math.max(...pricesJSON.map(Number)));
const priceDiff = (priceHighest - priceLowest)/3;
const priceAvg = pricesJSON.map(Number).reduce((a, b) => a + b, 0) / pricesJSON.length;

async function createWidget(){
  let listwidget = new ListWidget();
  listwidget.backgroundColor = new Color("#000000");
  let row = listwidget.addStack();
  row.layoutVertically();
  let left = row.addStack();
  left.layoutHorizontally();
  let whatday = left.addText(day);
  whatday.textColor = new Color("#ffffff");
  whatday.font = Font.lightSystemFont(20);
  let right = left.addStack();
  right.layoutVertically();
  let update = right.addStack();
  update.addSpacer();
  let updatetext = update.addText("updated "+updated);
  updatetext.font = Font.lightSystemFont(10);
  updatetext.textColor = new Color("#ffffff");
  let moms = right.addStack();
  moms.addSpacer();
  if (includevat == 1) {
    momstext = moms.addText("incl. VAT");
  }
  else {
    momstext = moms.addText("excl. VAT");
  }
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  
  let head = listwidget.addStack()
  let stackNames = ["first", "second", "third", "fourth", "fifth"];
  let timeStacks = {};
  let priceStacks = {};

  for (let name of stackNames) {
    let timeStack = head.addStack();
    timeStack.layoutVertically();
    head.addSpacer(4);
    let priceStack = head.addStack();
    priceStack.layoutVertically();
    if (name !== stackNames[stackNames.length - 1]) {
      head.addSpacer();
    }
    timeStacks[name] = timeStack;
    priceStacks[name] = priceStack;
  }

// Loop to add time and prices
for (let s = 0; s < stackNames.length; s++) {
  let name = stackNames[s];
  let timeStack = timeStacks[name];
  let priceStack = priceStacks[name];
  let hourOffset = 0 + s * 5; // t.ex. 6, 8, 10
  // Add time
  for (let i = hourOffset; i < hourOffset + 5; i++) {
    if (i == 24) {
      if (allValues.length == 96){
      for (let a = 0; a < 3; a++){ // after hours are printed
        let timeText = timeStack.addText(" ");
        timeText.leftAlignText();
        timeText.font = Font.lightSystemFont(smallFont);
        //timeText.textColor = new Color("#ffffff");
      }}
      timeText = timeStack.addText("version");
      timeText.font = Font.lightSystemFont(smallFont);
      timeText.leftAlignText();
      timeText.textColor = new Color("#ffffff");
      continue
    }
    for (let a = 0; a < 4; a++) {
      let timeText = timeStack.addText(`${i}:${a === 0 ? "00" : a * 15}`);
      timeText.leftAlignText();
      if (i === hour && minute >= a * 15 && minute < (a + 1) * 15) { // actual hour and identifies which 15-minute interval (quarter-hour segment) the current time falls into. e.g., 00–14, 15–29, 30–44, or 45–59
        timeText.textColor = new Color("#00ffff");
        timeText.font = Font.lightSystemFont(bigFont);
      } else {
        timeText.textColor = new Color("#ffffff");
        timeText.font = Font.lightSystemFont(mediumFont);
      }
      if (allValues.length == 24) {
        if (i === hour) {
          timeText.textColor = new Color("#00ffff");
          timeText.font = Font.lightSystemFont(bigFont);
        }
      break
      }
    }
  }

  // Add prices
  let priceStart = 0 + s * Math.ceil(allValues.length*0.2083); // 0.2083 is the difference between 24 and 96 values
  for (let i = priceStart; i < priceStart + Math.ceil(allValues.length*0.2083); i++) {

    if (i == allValues.length){
      if (allValues.length == 96){
      for (let a = 0; a < 3; a++){ // after prices are printed
        let priceText = priceStack.addText(" ");
        priceText.leftAlignText();
        priceText.font = Font.lightSystemFont(smallFont);
        //priceText.textColor = new Color("#ffffff");
      }}
      let priceText = priceStack.addText(`${version}`);
      priceText.leftAlignText();
      priceText.font = Font.lightSystemFont(smallFont);
      priceText.textColor = new Color("#ffffff");
      break
    }
    let priceVal = Math.round(pricesJSON[i]);
    let priceText = priceStack.addText(String(priceVal));
    priceText.leftAlignText();
    if (i === (hour * 4) + Math.floor(minute / 15)) {
        priceText.font = Font.lightSystemFont(bigFont);
      } else {
        priceText.font = Font.lightSystemFont(mediumFont);
      }
    if (allValues.length == 24) {
      if (i === hour) {
        priceText.font = Font.lightSystemFont(bigFont);
      }
    }
    if (pricesJSON[i] == priceLowest){
      priceText.textColor = new Color("#00cf00"); // green
    } else if (pricesJSON[i] < priceDiff + priceLowest) {
      priceText.textColor = new Color("#ffff00"); // yellow
    } else if (pricesJSON[i] == priceHighest){
      priceText.textColor = new Color("#fa60ff"); // purple
    } else if (pricesJSON[i] > priceHighest - priceDiff) {
      priceText.textColor =  new Color("#ff3000"); // red
    } else {
      priceText.textColor = new Color("#f38"); // orange
    }
  }
}
  let bottom = listwidget.addStack();
  // lowest
  let low = bottom.addText("lowest");
  low.font = Font.lightSystemFont(11);
  low.textColor = new Color("#00cf00");
  bottom.addSpacer(4);
  let priceLowestRound = Math.round(priceLowest);
  let lowtext = bottom.addText(`${priceLowestRound}`);
  lowtext.font = Font.lightSystemFont(11);
  lowtext.textColor = new Color("#00cf00");
  bottom.addSpacer();
  // average
  let avg = bottom.addText("average");
  avg.font = Font.lightSystemFont(11);
  avg.textColor = new Color("#f38");
  bottom.addSpacer(4);
  let priceAvgRound = Math.round(priceAvg);
  let avgtext = bottom.addText(`${priceAvgRound}`);
  avgtext.font = Font.lightSystemFont(11);
  avgtext.textColor = new Color("#f38");
  bottom.addSpacer();
  // highest
  let high = bottom.addText("highest");
  high.font = Font.lightSystemFont(11);
  high.textColor = new Color("#fa60ff");
  bottom.addSpacer(4);
  let priceHighestRound = Math.round(priceHighest);
  let hightext = bottom.addText(`${priceHighestRound}`);
  hightext.font = Font.lightSystemFont(11);
  hightext.textColor = new Color("#fa60ff");
  
return listwidget
}
let widget = await createWidget();
widget.presentLarge()
Script.complete();

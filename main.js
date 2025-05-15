// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
// This script was created by Flopp999
// Support me with a coffee https://www.buymeacoffee.com/flopp999 
let version = 0.35
var message

// Update the code.
try {
  const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-Nordpool/main/version.txt")
  const serverVersion = await req.loadString()
  if (version < serverVersion){
    let files = FileManager.local()
    const iCloudInUse = files.isFileStoredIniCloud(module.filename)
    files = iCloudInUse ? FileManager.iCloud() : files
    // Try to download the file.
    try {
      const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-Nordpool/main/main.js")
      const codeString = await req.loadString()
      files.writeString(module.filename, codeString)
    } catch {
      message = "The update failed. Please try again later."
    }
  }
} catch {
  message = "The update failed. Please try again later."
}

const date = new Date();
const yyyy = date.getFullYear();
const mm = String(date.getMonth() + 1).padStart(2, '0'); // month are indexed from 0
const dd = String(date.getDate()).padStart(2, '0');
const formattedDate = `${yyyy}-${mm}-${dd}`;
const hour = date.getHours();
const minute = date.getMinutes();
const hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
const url = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPriceIndices?date=${formattedDate}&market=DayAhead&indexNames=SE4&currency=SEK&resolutionInMinutes=15`;
const request = new Request(url);
request.timeoutInterval = 1
let response = (await request.loadJSON());
let updated = response.updatedAt
updated = updated.replace(/\.\d+Z$/, '').replace('T', ' ');
const day = response.deliveryDateCET
let prices = response.multiIndexEntries
let allValues = [];

for (let i = 0; i < prices.length; i++) {
  const value = prices[i]["entryPerArea"]["SE4"];
  allValues.push(String(value/10));
}

let pricesJSON = JSON.parse(JSON.stringify(allValues));
//pricesJSON = ["53.7", "89.1", "60.2", "97.9", "70.8", "40.3", "48.6", "81.7", "26.4", "73.5","75.1", "39.7", "62.8", "18.5", "92.6", "33.1", "20.7", "11.4", "55.5", "46.9","85.0", "35.6", "79.2", "90.4", "66.7", "67.3", "28.8", "15.3", "99.6", "64.5","38.9", "57.2", "19.8", "71.6", "84.4", "49.5", "14.7", "63.1", "21.6", "44.2","78.5", "37.4", "17.2", "13.8", "12.6", "45.3", "58.6", "43.8", "16.9", "69.2","24.1", "41.6", "50.8", "36.3", "59.9", "95.4", "42.5", "93.7", "61.4", "27.5","47.7", "31.9", "32.8", "25.2", "83.6", "30.5", "74.2", "22.4", "77.1", "29.6","34.7", "52.1", "56.8", "23.3", "86.3", "65.4", "91.2", "68.4", "94.9", "98.5","76.3", "87.5", "88.7", "51.3", "80.1", "82.2", "72.7", "96.8", "87.0", "10.9","10.1", "10.4", "10.7", "11.9", "12.2", "13.5", "14.1", "15.8", "16.4", "17.7"]
  
const priceLowest = (Math.min(...pricesJSON.map(Number)));
const priceHighest = (Math.max(...pricesJSON.map(Number)));
const priceDiff = (priceHighest - priceLowest)/3
async function createUpdate(){
  let listwidget = new ListWidget();
  listwidget.backgroundColor = new Color("#000000");
  let row = listwidget.addStack()
  row.layoutVertically()
  let left = row.addStack()
  left.layoutHorizontally()
  let whatday = left.addText("New update available")
  whatday.textColor = new Color("#ffffff");
  whatday.font = Font.lightSystemFont(20)
  return listwidget
  }

async function createWidget(){
  let listwidget = new ListWidget();
  listwidget.backgroundColor = new Color("#000000");
  let row = listwidget.addStack()
  row.layoutVertically()
  let left = row.addStack()
  left.layoutHorizontally()
  let whatday = left.addText(day)
  whatday.textColor = new Color("#ffffff");
  whatday.font = Font.lightSystemFont(20)
  let right = left.addStack()
  right.layoutVertically()
  let update = right.addStack()
  update.addSpacer()
  let updatetext = update.addText("uppdaterad "+updated);
  updatetext.font = Font.lightSystemFont(10)
  updatetext.textColor = new Color("#ffffff");
  let moms = right.addStack()
  moms.addSpacer()
  let momstext = moms.addText("ink.moms")
  momstext.font = Font.lightSystemFont(10)
  momstext.textColor = new Color("#ffffff");
  
  let head = listwidget.addStack()
  let stackNames = ["first", "second", "third", "fourth","fifth"];
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
      for (let a=0; a<3;a++){
        let timeText = timeStack.addText(" ");
        timeText.leftAlignText();
        timeText.font = Font.lightSystemFont(11);
        timeText.textColor = new Color("#ffffff");
      }
      timeText = timeStack.addText("version");
      timeText.font = Font.lightSystemFont(11);
      timeText.leftAlignText();
      timeText.textColor = new Color("#ffffff");
      continue
    }
    for (let a = 0; a < 4; a++) {
      let timeText = timeStack.addText(`${i}:${a === 0 ? "00" : a * 15}`);
      timeText.leftAlignText();
      if (i === hour && minute >= a * 15 && minute < (a + 1) * 15) {
        timeText.textColor = new Color("#00ffff");
        timeText.font = Font.lightSystemFont(13.5);
      } else {
        timeText.textColor = new Color("#ffffff");
        timeText.font = Font.lightSystemFont(12);
      }
      if (allValues.length  == 24) {
        if (i === hour) {
          timeText.textColor = new Color("#00ffff");
          timeText.font = Font.lightSystemFont(13.5;
        }
      break
      }
    }
  }

  // Add prices
  let priceStart = 0 + s * Math.ceil(allValues.length*0.2083);
  for (let i = priceStart; i < priceStart + Math.ceil(allValues.length*0.2083); i++) {

    if (i==allValues.length){
      for (let a=0; a<3;a++){
        let timeText = priceStack.addText(" ");
        timeText.leftAlignText();
        timeText.font = Font.lightSystemFont(11);
        timeText.textColor = new Color("#ffffff");
      }
      timeText = priceStack.addText(`${version}`);
      timeText.leftAlignText();
      timeText.font = Font.lightSystemFont(11);
      timeText.textColor = new Color("#ffffff");
      break
    }
    let priceVal = Math.round(pricesJSON[i] * 1.25);
    let priceText = priceStack.addText(String(priceVal));
    priceText.leftAlignText();
    if (i === (hour * 4) + Math.floor(minute / 15)) {
        priceText.font = Font.lightSystemFont(13.5);
      } else {
        priceText.font = Font.lightSystemFont(12);
      }
    if (pricesJSON[i] == priceLowest){
      priceText.textColor = new Color("#00af00");
    } else if (pricesJSON[i] < priceDiff + priceLowest) {
      priceText.textColor = new Color("#ffff00")
    } else if (pricesJSON[i] == priceHighest){
      priceText.textColor = new Color("#9f00ff");
    } else if (pricesJSON[i] > priceHighest - priceDiff) {
      priceText.textColor =  new Color("#ff0030")
    } else {
      priceText.textColor = new Color("#f38")
    }
  }
}
return listwidget
}
let widget = await createWidget();
widget.presentLarge()
Script.complete();

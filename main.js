// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
const date = new Date();
const yyyy = date.getFullYear();
const mm = String(date.getMonth() + 1).padStart(2, '0'); // month are indexed from 0
const dd = String(date.getDate()).padStart(2, '0');
const formattedDate = `${yyyy}-${mm}-${dd}`;
const hour = today.getHours();
const minute = today.getMinutes();
const url = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPriceIndices?date=${formattedDate}&market=DayAhead&indexNames=SE4&currency=SEK&resolutionInMinutes=15`;
const request = new Request(url);
const hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]
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

const priceLowest = Math.round(Math.min(...pricesJSON.map(Number)));
const priceHighest = Math.round(Math.max(...pricesJSON.map(Number)));
const priceAvg = Math.round(pricesJSON.reduce((sum, val) => sum + Number(val), 0) / pricesJSON.length / 3);

log(priceHighest)
async function createWidget(){

  let listwidget = new ListWidget();
  listwidget.backgroundColor = new Color("#000000");
  let first = listwidget.addStack()
  first.addSpacer()
  let moms = first.addStack()
  moms.layoutVertically()
  let update = moms.addStack()
  let rrrr = moms.addStack()
  let ab = update.addText(day)
  ab.textColor = new Color("#ffffff");
  ab.font = Font.lightSystemFont(10)
  update.addSpacer(75)
  rrrr.addSpacer(250)
  
  let ute = update.addText("uppdaterad "+updated);
  
  ute.font = Font.lightSystemFont(10)
  ute.textColor = new Color("#ffffff");
  let fff = rrrr.addText("ink.moms")
  fff.font = Font.lightSystemFont(10)
  fff.textColor = new Color("#ffffff");
  let head = listwidget.addStack()
  
  let firsttime = head.addStack()
  firsttime.layoutVertically()
  head.addSpacer(4)
  let firstprice = head.addStack()
  firstprice.layoutVertically()
  head.addSpacer()
  
  let secondtime = head.addStack()
  secondtime.layoutVertically()
  head.addSpacer(4)
  let secondprice = head.addStack();
  secondprice.layoutVertically()
  head.addSpacer()
  
  let thirdtime = head.addStack()
  thirdtime.layoutVertically()
  head.addSpacer(4)
  let thirdprice = head.addStack()
  thirdprice.layoutVertically()
  head.addSpacer()
  
  let fourthtime = head.addStack()
  fourthtime.layoutVertically()
  head.addSpacer(4)
  let fourthprice = head.addStack()
  fourthprice.layoutVertically()
  
  for (let i = 0; i < 6; i++) {
    let uterum1
    for (let a = 0; a < 4; a++) {
      if (a===0){
        uterum1 = firsttime.addText(i+":00 ");
      }
      else if (a===1){
        uterum1 = firsttime.addText(i+":15 ");
      }
      else if (a===2){
        uterum1 = firsttime.addText(i+":30 ");
      }
      else if (a===3){
        uterum1 = firsttime.addText(i+":45 ");
      }
      uterum1.leftAlignText();
      if (i === hour && minute >= a*15 && minute <= (a+1)*15) {
      //if (i===hour){
        uterum1.textColor = new Color("#ff00ff");
      }
      else{
        uterum1.textColor = new Color("#ffffff");
      }
      uterum1.font = Font.lightSystemFont(11);
      }
    }
  
  for (let i = 0; i < 24; i++) {
  let price = firstprice.addText(String(Math.round(pricesJSON[i]*1.25)));
  price.leftAlignText();
  
  price.font = Font.lightSystemFont(11);
  if (pricesJSON[i] < priceAvg+priceLowest){
    price.textColor = Color.green()
  }
  else if (pricesJSON[i] > priceHighest-priceAvg){
    price.textColor = Color.red()
  }
  else {
    price.textColor = Color.orange()
    }
  }
  
  for (let i = 6; i < 12; i++) {
    let time
    for (let a = 0; a < 4; a++) {
      if (a===0){
        time = secondtime.addText(i+":00 ");
      }
      if (a===1){
        time = secondtime.addText(i+":15 ");
      }
      if (a===2){
        time = secondtime.addText(i+":30 ");
      }
      if (a===3){
        time = secondtime.addText(i+":45 ");
      }
      time.leftAlignText();
      if (i === hour && minute >= a*15 && minute <= (a+1)*15) {
        time.textColor = new Color("#ff00ff");
      }
      else{
        time.textColor = new Color("#ffffff");
      }
      time.font = Font.lightSystemFont(11);
      }
    }
  
  for (let i = 24; i < 48; i++) {
  let price = secondprice.addText(String(Math.round(pricesJSON[i]*1.25)));
  price.leftAlignText();
  price.font = Font.lightSystemFont(11);
  if (pricesJSON[i] < priceAvg+priceLowest){
    price.textColor = Color.green()
  }
  else if (pricesJSON[i] > priceHighest-priceAvg){
    price.textColor = Color.red()
  }
  else {
    price.textColor = Color.orange()
  }
  }
  
  for (let i = 12; i < 18; i++) {
    let time
    for (let a = 0; a < 4; a++) {
      if (a===0){
        time = thirdtime.addText(i+":00 ");
      }
      if (a===1){
        time = thirdtime.addText(i+":15 ");
      }
      if (a===2){
        time = thirdtime.addText(i+":30 ");
      }
      if (a===3){
        time = thirdtime.addText(i+":45 ");
      }
      time.leftAlignText();
      if (i === hour && minute >= a*15 && minute <= (a+1)*15) {
        time.textColor = new Color("#ff00ff");
      }
      else{
        time.textColor = new Color("#ffffff");
      }
      time.font = Font.lightSystemFont(11);
      }
    }
  
  for (let i = 48; i < 72; i++) {
    let price = thirdprice.addText(String(Math.round(pricesJSON[i]*1.25)));
    price.leftAlignText();
    price.font = Font.lightSystemFont(11);
    if (pricesJSON[i] < priceAvg+priceLowest){
      
      
      price.textColor = Color.green()
    }
    else if (pricesJSON[i] > priceHighest-priceAvg){
      price.textColor = Color.red()
    }
    else {
      price.textColor = Color.orange()
    }
  }
  
  for (let i = 18; i < 24; i++) {
    let time
    for (let a = 0; a < 4; a++) {
      if (a===0){
        time = fourthtime.addText(i+":00 ");
      }
      if (a===1){
        time = fourthtime.addText(i+":15 ");
      }
      if (a===2){
        time = fourthtime.addText(i+":30 ");
      }
      if (a===3){
        time = fourthtime.addText(i+":45 ");
      }
      time.leftAlignText();
      if (i === hour && minute >= a*15 && minute <= (a+1)*15) {
        time.textColor = new Color("#ff00ff");
      }
      else{
        time.textColor = new Color("#ffffff");
      }
      time.font = Font.lightSystemFont(11);
      }
    }
  
  for (let i = 72; i < 96; i++) {
    let price = fourthprice.addText(String(Math.round(pricesJSON[i]*1.25)));
    price.leftAlignText();
    price.font = Font.lightSystemFont(11);
    log(pricesJSON[i])
    if (pricesJSON[i] < priceAvg+priceLowest){
      price.textColor = Color.green()
    }
    else if (pricesJSON[i] > priceHighest-priceAvg){
      price.textColor = Color.red()
    }
    else {
      price.textColor = Color.orange()
    }
}

return listwidget
}

let widget = await createWidget();
widget.presentLarge()

Script.complete();

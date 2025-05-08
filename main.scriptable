// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0'); // månader är 0-indexerade
const dd = String(today.getDate()+1).padStart(2, '0');
const formattedDate = `${yyyy}-${mm}-${dd}`;
const hour = today.getHours();
const minute = today.getMinutes();
const url = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPriceIndices?date=${formattedDate}&market=DayAhead&indexNames=SE4&currency=SEK&resolutionInMinutes=15`;
const request = new Request(url);
hours=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]
let data = (await request.loadJSON());
updated = data.updatedAt
updated = updated.replace(/\.\d+Z$/, '').replace('T', ' ');
let day = data.deliveryDateCET
data = data.multiIndexEntries
log(day)
let allValues = [];

for (let i = 0; i < data.length; i++) {
  const value = data[i]["entryPerArea"]["SE4"];
  allValues.push(String(value/10));
}
let result = JSON.stringify(allValues);
datatoday = JSON.parse(result)

const todaylow = Number(Math.min(...datatoday.map(Number)).toFixed(1));
const todayhigh = Number(Math.max(...datatoday.map(Number)).toFixed(1));
const values = datatoday.map(Number).reduce((sum, val) => sum + val, 0) / datatoday.length;
const avgtoday = Number(values.toFixed(1)/3);
log(todayhigh)
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
let uterum1 = firstprice.addText(String((datatoday[i]*1.25).toFixed(0)));
uterum1.leftAlignText();

uterum1.font = Font.lightSystemFont(11);
if (datatoday[i] < avgtoday+todaylow){
  uterum1.textColor = Color.green()
}
else if (datatoday[i] > todayhigh-avgtoday){
  uterum1.textColor = Color.red()
}

else {
  uterum1.textColor = Color.orange()
  }
}

for (let i = 6; i < 12; i++) {
  let uterum1
  for (let a = 0; a < 4; a++) {
    if (a===0){
      uterum1 = secondtime.addText(i+":00 ");
    }
    if (a===1){
      uterum1 = secondtime.addText(i+":15 ");
    }
    if (a===2){
      uterum1 = secondtime.addText(i+":30 ");
    }
    if (a===3){
      uterum1 = secondtime.addText(i+":45 ");
    }
    uterum1.leftAlignText();
    if (i === hour && minute >= a*15 && minute <= (a+1)*15) {
      uterum1.textColor = new Color("#ff00ff");
    }
    else{
      uterum1.textColor = new Color("#ffffff");
    }
    uterum1.font = Font.lightSystemFont(11);
    }
  }

for (let i = 24; i < 48; i++) {
let uterum1 = secondprice.addText(String((datatoday[i]*1.25).toFixed(0)));
uterum1.leftAlignText();
uterum1.font = Font.lightSystemFont(11);
if (datatoday[i] < avgtoday+todaylow){
  uterum1.textColor = Color.green()
}
else if (datatoday[i] > todayhigh-avgtoday){
  uterum1.textColor = Color.red()
}
else {
  uterum1.textColor = Color.orange()
}
}

for (let i = 12; i < 18; i++) {
  let uterum1
  for (let a = 0; a < 4; a++) {
    if (a===0){
      uterum1 = thirdtime.addText(i+":00 ");
    }
    if (a===1){
      uterum1 = thirdtime.addText(i+":15 ");
    }
    if (a===2){
      uterum1 = thirdtime.addText(i+":30 ");
    }
    if (a===3){
      uterum1 = thirdtime.addText(i+":45 ");
    }
    uterum1.leftAlignText();
    if (i === hour && minute >= a*15 && minute <= (a+1)*15) {
      uterum1.textColor = new Color("#ff00ff");
    }
    else{
      uterum1.textColor = new Color("#ffffff");
    }
    uterum1.font = Font.lightSystemFont(11);
    }
  }

for (let i = 48; i < 72; i++) {
  let uterum1 = thirdprice.addText(String((datatoday[i]*1.25).toFixed(0)));
  uterum1.leftAlignText();
  uterum1.font = Font.lightSystemFont(11);
  if (datatoday[i] < avgtoday+todaylow){
    //log(datatoday[i])
    //log(avgtoday+todaylow)
    uterum1.textColor = Color.green()
  }
  else if (datatoday[i] > todayhigh-avgtoday){
    uterum1.textColor = Color.red()
  }
  else {
    uterum1.textColor = Color.orange()
  }
}

for (let i = 18; i < 24; i++) {
  let uterum1
  for (let a = 0; a < 4; a++) {
    if (a===0){
      uterum1 = fourthtime.addText(i+":00 ");
    }
    if (a===1){
      uterum1 = fourthtime.addText(i+":15 ");
    }
    if (a===2){
      uterum1 = fourthtime.addText(i+":30 ");
    }
    if (a===3){
      uterum1 = fourthtime.addText(i+":45 ");
    }
    uterum1.leftAlignText();
    if (i === hour && minute >= a*15 && minute <= (a+1)*15) {
      uterum1.textColor = new Color("#ff00ff");
    }
    else{
      uterum1.textColor = new Color("#ffffff");
    }
    uterum1.font = Font.lightSystemFont(11);
    }
  }

for (let i = 72; i < 96; i++) {
  let uterum1 = fourthprice.addText(String((datatoday[i]*1.25).toFixed(0)));
  uterum1.leftAlignText();
  uterum1.font = Font.lightSystemFont(11);
  log(datatoday[i])
  if (datatoday[i] < avgtoday+todaylow){
    uterum1.textColor = Color.green()
  }
  else if (datatoday[i] > todayhigh-avgtoday){
    uterum1.textColor = Color.red()
  }
  else {
    uterum1.textColor = Color.orange()
  }
}

return listwidget
}

let widget = await createWidget();
widget.presentLarge()

Script.complete();

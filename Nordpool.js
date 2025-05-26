// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
// License: Personal use only. See LICENSE for details.
// This script was created by Flopp999
// Support me with a coffee https://www.buymeacoffee.com/flopp999 
let version = 0.727
let allValues = [];
let widget;
let day;
let date;
let pricesJSON;
let pricesJSONToday;
let pricesJSONTomorrow;
let priceAvgToday;
let priceLowestToday;
let priceHighestToday;
let priceDiffToday;
let priceAvgTomorrow;
let priceLowestTomorrow;
let priceHighestTomorrow;
let priceDiff;
let area;
let resolution;
let currency;
let vat;
let includevat;
let extras;
let language;
let settings = {}
let langId;
let translationData;
let currentLang;
const fileName = Script.name() + "_Settings.json";
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
let filePath = fm.joinPath(dir, fileName);
let height = 1150;

if (!config.runsInWidget){
  await updatecode();
  await readTranslations();
  await readsettings();
  await createVariables();
  await start();
  await createVariables();
}

if (config.runsInWidget){
  await updatecode();
  await readsettings();
  await createVariables();
}

async function start() {
  let alert = new Alert();
  let vatText = includevat == 1 ? t("yes") : t("no")
  let showdayText = showday == "Today" ? t("today") : t("tomorrow")
  alert.message = 
    t("changesetup") + "?\n" +
    "Priser för: " + showdayText + "\n" +
    t("area") + ": " + area + ", " + currency + "\n" +
    "Extras: " + extras + "\n" +
    t("withvat") + ": " + vatText + "\n";
  if (includevat == 1) {
    alert.message += t("vat") + ": " + vat;
  }
  alert.addAction(t("yes"));
  alert.addAction(t("no"));
  let index = await alert.presentAlert();
  if (index === 0) {
    settings = await ask();
    fm.writeString(filePath, JSON.stringify(settings, null, 2)); // Pretty print
  }
}

async function updatecode() {
try {
    const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-Nordpool/main/Version.txt")
    const serverVersion = await req.loadString()
    if (version < serverVersion) {
      try {

        const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-NordPool/main/Nordpool.js");
        const response = await req.load(); // laddar utan att direkt kasta fel
        const status = req.response.statusCode;

        if (status !== 200) {
          throw new Error(`Fel: HTTP ${status}`);
        }

        const codeString = response.toRawString(); // eller response.toString()
        fm.writeString(module.filename, codeString);

        
        //const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-NordPool/main/Nordpool.js");
        //const codeString = await req.loadString();
        //fm.writeString(module.filename, codeString);
        let updateNotify = new Notification();
        updateNotify.title = Script.name();
        updateNotify.body = "New version installed";
        updateNotify.sound = "default";
        await updateNotify.schedule();
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    console.error("The update failed. Please try again later." + error);
  }
}

async function readsettings() {
  let filePath = fm.joinPath(dir, fileName);
  try {
    if (fm.fileExists(filePath)) {
      let raw = fm.readString(filePath);
      settings = JSON.parse(raw);
      langId = settings.language; // 1 = ENG, 2 = DE, 3 = SV
      await readTranslations();
      let keys = Object.keys(settings);
      if (keys.length < 6) {
        throw new Error("Settings file is incomplete or corrupted");
      }
    } else {
      await askForLanguage();
      await readTranslations();
      let alert = new Alert();
      alert.title = "Support";
      alert.message = t("buymeacoffee") + "?";
      alert.addAction(t("noway"));
      alert.addCancelAction(t("ofcourse"));
      let response = await alert.present();
      if (response === -1) {
        Safari.open("https://buymeacoffee.com/flopp999");
      }
      throw new Error("Settings file not found");
    }
  } catch (error) {
    console.warn("Settings file not found or error reading file: " + error.message);
    settings = await ask();
    fm.writeString(filePath, JSON.stringify(settings, null, 2)); // Pretty print
  }
}

async function createVariables() {
  area = settings.area;
  resolution = settings.resolution;
  currency = settings.currency;
  vat = settings.vat;
  includevat = settings.includevat;
  extras = settings.extras;
  language = settings.language;
  showday = settings.showday;
}

async function readTranslations() {
  let url = "https://raw.githubusercontent.com/flopp999/Scriptable-NordPool/main/Translations.json";
  let filename = Script.name() + "_Translations.json";
  let req = new Request(url);
  let content = await req.loadString();
  let path = fm.joinPath(dir, filename);
  fm.writeString(path, content);
  try {
    const fm = FileManager.iCloud()
    const path = fm.joinPath(fm.documentsDirectory(), filename);
    translationData = JSON.parse(fm.readString(path));
    const langMap = {
      1: "en",
      2: "de",
      3: "sv"
    };
    currentLang = langMap[langId] || "en"; // fallback to english
  } catch (error) {
    console.error(error);
  }
}

function t(key) {
  const entry = translationData[key];
  if (!entry) return `[${key}]`; // nyckel saknas
  return entry[currentLang] || entry["en"] || `[${key}]`;
}

async function ask() {
  [settings.area, settings.vat, settings.currency] = await askForArea();
  settings.includevat = await askForIncludeVAT();
  settings.extras = await askForExtras();
  //settings.showgraph = await askForShowGraph();
  //settings.showtable = await askForShowTable();
  settings.showattop = await askForShowAtTop();
  settings.showattopday = await askForShowAtTopDay();
  settings.showatmiddle = await askForShowAtMiddle();
  settings.showatmiddleday = await askForShowAtMiddleDay();
  settings.showatbottom = await askForShowAtBottom();
  settings.showatbottomday = await askForShowAtBottomDay();
  //settings.showday = await askForShowDay();
  settings.resolution = 60;
  return settings
}


// Show graph
async function askForShowAtTopDay() {
  let alert = new Alert();
  alert.message = ("What day on top?");
  alert.addAction(t("today"));
  alert.addAction(t("tomorrow"));
  let index = await alert.presentAlert();
  settings.showattopday = ["Today","Tomorrow"][index];
  fm.writeString(filePath, JSON.stringify(settings, null, 2)); // Pretty print
  return ["Today","Tomorrow"][index];
}
// Show graph
async function askForShowAtMiddleDay() {
  let alert = new Alert();
  alert.message = ("What day on middle?");
  alert.addAction(t("today"));
  alert.addAction(t("tomorrow"));
  let index = await alert.presentAlert();
  settings.showatmiddleday = ["Today","Tomorrow"][index];
  fm.writeString(filePath, JSON.stringify(settings, null, 2)); // Pretty print
  return ["Today","Tomorrow"][index];
}

// Show graph
async function askForShowAtBottomDay() {
  let alert = new Alert();
  alert.message = ("What day on bottom?");
  alert.addAction(t("today"));
  alert.addAction(t("tomorrow"));
  let index = await alert.presentAlert();
  settings.showatbottomday = ["Today","Tomorrow"][index];
  fm.writeString(filePath, JSON.stringify(settings, null, 2)); // Pretty print
  return ["Today","Tomorrow"][index];
}

// Ask Top
async function askForShowAtTop() {
  let alert = new Alert();
  alert.message = t("showwhat") + "at top?";
  alert.addAction(t("graph"));
  alert.addAction(t("table"));
  alert.addAction(t("pricestats"));
  alert.addAction(t("empty"));
  let index = await alert.presentAlert();
  settings.showattop = ["Graph","Table","PriceStats","Empty"][index];
  fm.writeString(filePath, JSON.stringify(settings, null, 2)); // Pretty print
  return ["Graph","Table","PriceStats","Empty"][index];
}

// Ask Top
async function askForShowAtMiddle() {
  let alert = new Alert();
  alert.message = t("showwhat") + "in the middle?";
  alert.addAction(t("graph"));
  alert.addAction(t("table"));
  alert.addAction(t("pricestats"));
  alert.addAction(t("empty"));
  let index = await alert.presentAlert();
  settings.showatmiddle = ["Graph","Table","PriceStats","Empty"][index];
  fm.writeString(filePath, JSON.stringify(settings, null, 2)); // Pretty print
  return ["Graph","Table","PriceStats","Empty"][index];
}
// Ask Top
async function askForShowAtBottom() {
  let alert = new Alert();
  alert.message = t("showwhat") + "at the bottom?";
  alert.addAction(t("graph"));
  alert.addAction(t("table"));
  alert.addAction(t("pricestats"));
  alert.addAction(t("empty"));
  let index = await alert.presentAlert();
  settings.showatbottom = ["Graph","Table","PriceStats","Empty"][index];
  fm.writeString(filePath, JSON.stringify(settings, null, 2)); // Pretty print
  return ["Graph","Table","PriceStats","Empty"][index];
}

// Select resolution
async function askForLanguage() {
  let alert = new Alert();
  alert.message = "Language/Sprache/Språk:";
  alert.addAction("English");
  alert.addAction("Deutsch");
  alert.addAction("Svenska");
  let index = await alert.presentAlert();
  settings.language = [1,2,3][index];
  fm.writeString(filePath, JSON.stringify(settings, null, 2)); // Pretty print
  langId = settings.language; // 1 = ENG, 2 = DE, 3 = SV
  return [1,2,3][index];
}

// Select area
async function askForArea() {
  let alert = new Alert();
  alert.message = t("chooseyourelectricityarea") + ":";
  let areas = [
    "AT","BE","BG","DK1","DK2","EE","FI","FR","GER",
    "LT","LV","NL","NO1","NO2","NO3","NO4","NO5",
    "PL","SE1","SE2","SE3","SE4","TEL","SYS"
  ];
  for (let area of areas) {
    alert.addAction(area);
  }
  let index = await alert.presentAlert();
  let area = [
    "AT","BE","BG","DK1","DK2","EE","FI","FR","GER",
    "LT","LV","NL","NO1","NO2","NO3","NO4","NO5",
    "PL","SE1","SE2","SE3","SE4","TEL","SYS"][index];
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
    19,   // TEL - Romania
    0    // SYS - System price or not applicable
    ][index];
   let currencies2 = [
    "EUR",  // AT - Austria
    "EUR",
    "BGN",
    "DKK",
    "DKK",
    "EUR",
    "EUR",
    "EUR",
    "EUR",
    "EUR",
    "EUR",
    "EUR",
    "NOK",
    "NOK",
    "NOK",
    "NOK",
    "NOK",
    "PLN",
    "SEK", // SE1 - Sweden
    "SEK", // SE2 - Sweden
    "SEK", // SE3 - Sweden
    "SEK", // SE4 - Sweden
    "RON",
    "EUR"
    ][index];
    return [area, vat, currencies2];
}

// Select resolution
async function askForResolution() {
  let alert = new Alert();
  alert.message = t("choosedataresolution") + ":";
  alert.addAction("15 min");
  alert.addAction("60 min");
  let index = await alert.presentAlert();
  return [15, 60][index];
}

// Select currency
async function askForCurrency() {
  let allowedCurrencies = {
    AT: ["EUR"],
    BE: ["EUR"],
    BG: ["BGN", "EUR"],
    DK1: ["DKK", "EUR", "NOK", "SEK"],
    DK2: ["DKK", "EUR", "NOK", "SEK"],
    EE: ["EUR", "DKK", "NOK", "SEK"],
    FI: ["EUR", "DKK", "NOK", "SEK"],
    FR: ["EUR"],
    GER: ["EUR"],
    LT: ["EUR", "DKK", "NOK", "SEK"],
    LV: ["EUR", "DKK", "NOK", "SEK"],
    NL: ["EUR"],
    NO1: ["NOK", "DKK", "EUR", "SEK"],
    NO2: ["NOK", "DKK", "EUR", "SEK"],
    NO3: ["NOK", "DKK", "EUR", "SEK"],
    NO4: ["NOK", "DKK", "EUR", "SEK"],
    NO5: ["NOK", "DKK", "EUR", "SEK"],
    PL: ["PLN", "EUR"],
    SE1: ["SEK", "DKK", "EUR", "NOK"],
    SE2: ["SEK", "DKK", "EUR", "NOK"],
    SE3: ["SEK", "DKK", "EUR", "NOK"],
    SE4: ["SEK", "DKK", "EUR", "NOK"],
    TEL: ["RON", "EUR"],
    SYS: ["EUR", "DKK", "NOK", "SEK"],
  };
  let alert = new Alert();
  alert.message = t("chooseyourcurrency") + ":";
  let currencies = allowedCurrencies[settings.area] || [];
  for (let currency of currencies) {
    alert.addAction(currency);
  }
  if (currencies.length === 0) {
    alert.addAction("No options");
    await alert.presentAlert();
    return null;
  }
  let index = await alert.presentAlert();
  return currencies[index];
}

// Include VAT?
async function askForIncludeVAT() {
  let alert = new Alert();
  alert.message = t("doyouwantvat") + "?";
  alert.addAction(t("withvat"));
  alert.addAction(t("withoutvat"));
  let index = await alert.presentAlert();
  return [1,0][index];
}

// Include extra cost?
async function askForExtras() {
  let alert = new Alert();
  alert.title = t("extraelectricitycost");
  alert.message = (t("enterextra") + `${settings.currency}`);
  alert.addTextField("e.g. 0.30","0").setDecimalPadKeyboard();
  alert.addAction("OK");
  await alert.present();
  let input = alert.textFieldValue(0);
  input = input.replace(",", ".")
  let newCost = parseFloat(input);
  return newCost;
}

async function Table(day) {
  pricesJSON = pricesJSON+day
  priceAvgToday = priceAvg+day;
  priceLowestToday = priceLowest+day;
  priceHighestToday = priceHighest+day;
  priceDiffToday = priceDiff+day;

  
  width = 770;
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
  let hourOffset = 0 + s * 5; // how many hours per column
  // Add time
  for (let i = hourOffset; i < hourOffset + 5; i++) {
    if (i == 24) {
      continue
    }
    for (let a = 0; a < 4; a++) {
      let timeText = timeStack.addText(`${i}:${a === 0 ? "00" : a * 15}`);
      timeText.leftAlignText();
      if (i === hour && minute >= a * 15 && minute < (a + 1) * 15) { // actual hour and identifies which 15-minute interval
        timeText.textColor = new Color("#00ffff");
        timeText.font = Font.lightSystemFont(bigFont);
      } else {
        timeText.textColor = new Color("#ffffff");
        timeText.font = Font.lightSystemFont(mediumFont);
      }
      if (allValues.length == 24) {
        if (i === hour && showday == "Today") {
          timeText.textColor = new Color("#00ffff");
          timeText.font = Font.lightSystemFont(bigFont);
        }
      break
      }
    }
  }

  // Add prices
  let priceStart = 0 + s * Math.ceil(allValues.length*0.2083); // 0.2083 is the factor between 24 and 96
  for (let i = priceStart; i < priceStart + Math.ceil(allValues.length*0.2083); i++) {

    if (i == allValues.length){
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
      if (i === hour && showday == "Today") {
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
  }




async function Graph() {
//chart
  if (resolution == 60) {
    if ( settings.showattop == "Table" || settings.showatmiddle == "Table" || settings.showatbottom == "Table" ) {
      height = 770
    }
    let avgtoday = []
    let dotNow = ""
    let countertoday = 0
    let counterdot = 0
    do{
      avgtoday += priceAvg + ","
      countertoday += 1
    }
    while (countertoday < 24)
    
    do{
      if (hour == counterdot && showday == "Today") {
        dotNow += pricesJSON[counterdot] + ","
      }
      else {
        dotNow += ","
      }
      counterdot += 1
    }
      
    while (counterdot < 24)
    
      let graphtoday = "https://quickchart.io/chart?bkg=black&w=1300&h="+height+"&c="
    graphtoday += encodeURI("{\
      data: { \
        labels: ["+hours+"],\
        datasets: [\
        {\
            data:["+dotNow+"],\
            type:'line',\
            fill:false,\
            borderColor:'rgb(0,255,255)',\
            borderWidth:65,\
            pointRadius:6\
          },\
          {\
            data:["+avgtoday+"],\
            type:'line',\
            fill:false,\
            borderColor: 'orange',\
            borderWidth:6,\
            pointRadius:0\
          },\
          {\
            data:["+pricesJSON+"],\
            type:'bar',\
            fill:false,\
            borderColor: getGradientFillHelper('vertical',['rgb(255,25,255)','rgb(255,48,8)','orange','rgb(255,255,0)','rgb(0,150,0)']),\
            borderWidth: 20, \
          },\
        ]\
      },\
        options:\
          {\
            legend:\
            {\
              display:false\
            },\
            scales:\
            {\
              xAxes:[{offset:true,ticks:{fontSize:35,fontColor:'white'}}],\
              yAxes:[{ticks:{stepSize:10,beginAtZero:true,fontSize:35,fontColor:'white'}}]\
            }\
          }\
    }")
    const GRAPH = await new Request(graphtoday).loadImage()
    let emptyrow = listwidget.addStack()
    listwidget.addSpacer(10)
    let chart = listwidget.addStack()
    chart.addImage(GRAPH) 
  }
}

 async function PriceStats() {
  let bottom = listwidget.addStack();
  // lowest
  let lowest = bottom.addText(t("lowest"));
  lowest.font = Font.lightSystemFont(11);
  lowest.textColor = new Color("#00cf00");
  bottom.addSpacer(4);
  let priceLowestRound = Math.round(priceLowest);
  let lowesttext = bottom.addText(`${priceLowestRound}`);
  lowesttext.font = Font.lightSystemFont(11);
  lowesttext.textColor = new Color("#00cf00");
  bottom.addSpacer();
  // average
  let avg = bottom.addText(t("average"));
  avg.font = Font.lightSystemFont(11);
  avg.textColor = new Color("#f38");
  bottom.addSpacer(4);
  let priceAvgRound = Math.round(priceAvg);
  let avgtext = bottom.addText(`${priceAvgRound}`);
  avgtext.font = Font.lightSystemFont(11);
  avgtext.textColor = new Color("#f38");
  bottom.addSpacer();
  // highest
  let highest = bottom.addText(t("highest"));
  highest.font = Font.lightSystemFont(11);
  highest.textColor = new Color("#fa60ff");
  bottom.addSpacer(4);
  let priceHighestRound = Math.round(priceHighest);
  let highesttext = bottom.addText(`${priceHighestRound}`);
  highesttext.font = Font.lightSystemFont(11);
  highesttext.textColor = new Color("#fa60ff");
  }


const smallFont = 10;
const mediumFont = 12;
const bigFont = 13.5;
const hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];

// Today date
const todayDateObj = new Date();
const yyyyToday = todayDateObj.getFullYear();
const mmToday = String(todayDateObj.getMonth() + 1).padStart(2, '0');
const ddToday = String(todayDateObj.getDate()).padStart(2, '0');
const todayStr = `${yyyyToday}-${mmToday}-${ddToday}`;

const hour = todayDateObj.getHours();
const minute = todayDateObj.getMinutes();

// Tomorrow date
const tomorrowDateObj = new Date(todayDateObj);
tomorrowDateObj.setDate(tomorrowDateObj.getDate() + 1);
const yyyyTomorrow = tomorrowDateObj.getFullYear();
const mmTomorrow = String(tomorrowDateObj.getMonth() + 1).padStart(2, '0');
const ddTomorrow = String(tomorrowDateObj.getDate()).padStart(2, '0');
const tomorrowStr = `${yyyyTomorrow}-${mmTomorrow}-${ddTomorrow}`;

const todayUrl = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPriceIndices?date=${todayStr}&market=DayAhead&indexNames=${area}&currency=${currency}&resolutionInMinutes=${resolution}`;
const tomorrowUrl = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPriceIndices?date=${tomorrowStr}&market=DayAhead&indexNames=${area}&currency=${currency}&resolutionInMinutes=${resolution}`;

const requestToday = new Request(todayUrl);
requestToday.timeoutInterval = 1;
let responseToday = (await requestToday.loadJSON());
const todayJSON = JSON.stringify(responseToday, null ,2);
const todayPath = fm.joinPath(dir, "todayprices.json");
fm.writeString(todayPath, todayJSON);

const requestTomorrow = new Request(tomorrowUrl);
requestTomorrow.timeoutInterval = 1;
let responseTomorrow = (await requestTomorrow.loadJSON());
const tomorrowJSON = JSON.stringify(responseTomorrow, null ,2);
const tomorrowPath = fm.joinPath(dir, "tomorrowprices.json");
fm.writeString(tomorrowPath, tomorrowJSON);


let listwidget = new ListWidget();

async function createWidgetNodata(){
  listwidget.backgroundColor = new Color("#000000");
  let row = listwidget.addStack();
  row.layoutVertically();
  let Nodata = row.addText("Could not get data.");
  Nodata.textColor = new Color("#ffffff");
  Nodata.font = Font.lightSystemFont(20);
  let Nodata2 = row.addText("Tomorrow prices is available from 13:00");
  Nodata2.font = Font.lightSystemFont(10);
  Nodata2.textColor = new Color("#ffffff");
  return listwidget
}
async function createWidget(){
  listwidget.backgroundColor = new Color("#000000");
  let row = listwidget.addStack();
  row.layoutVertically();
  let left = row.addStack();
  left.layoutHorizontally();
  let whatday = left.addText(date);
  whatday.textColor = new Color("#ffffff");
  whatday.font = Font.lightSystemFont(20);
  let right = left.addStack();
  right.layoutVertically();
  let update = right.addStack();
  update.addSpacer();
  let updatetext = update.addText(t("updated") + updated);
  updatetext.font = Font.lightSystemFont(10);
  updatetext.textColor = new Color("#ffffff");
  let moms = right.addStack();
  moms.addSpacer();
  momstext = moms.addText("v. " + version);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer();
  momstext = moms.addText(area);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer();
  momstext = moms.addText("Extras: " + extras);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer();
  if (includevat == 1) {
    momstext = moms.addText(t("inclvat"));
  }
  else {
    momstext = moms.addText(t("exclvat"));
  }
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");


  //const functionMap = {
  //Table: Table,
  //PriceStats: PriceStats,
  //Graph: Graph
//};

// Lista på inställningar och deras nuvarande värden
//const positions = [
  //settings.showattop,
  //settings.showatmiddle,
  //settings.showatbottom
//];

// Loopa igenom och kör rätt funktion om den finns i functionMap
//for (let value of positions) {
  //const func = functionMap[value];
  //if (func) {
    //log("a");
    //await func(); // Anropa funktionen asynkront
  //}
//}
  //return listwidget

  if (settings.showattop == "Table") {
    await Table(settings.showattopday);
  }
   else if (settings.showattop == "PriceStats") {
    await PriceStats(settings.showattopday);
  }
   else if (settings.showattop == "Graph") {
    await Graph(settings.showattopday);
  }
  if (settings.showatmiddle == "Table") {
    await Table(settings.showatmiddleday);
  }
   else if (settings.showatmiddle == "PriceStats") {
    await PriceStats(settings.showatmiddleday);
  }
   else if (settings.showatmiddle == "Graph") {
    await Graph(settings.showatmiddleday);
  }
  if (settings.showatbottom == "Table") {
    await Table(settings.showatbottomday);
  }
   else if (settings.showatbottom == "PriceStats") {
    await PriceStats(settings.showatbottomday);
  }
   else if (settings.showatbottom == "Graph") {
    await Graph(settings.showatbottomday);
  }
  
  
  
return listwidget
}



widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  if (Math.random() < 0.5) {
    let alert = new Alert();
    alert.title = "Support";
    alert.message = t("buymeacoffee") + "?";
    alert.addCancelAction(t("ofcourse"));
    alert.addAction(t("noway"));
    let response = await alert.present();
    if (response === -1) {
      Safari.open("https://buymeacoffee.com/flopp999");
    }
  }
}

widget.presentLarge()
Script.complete();

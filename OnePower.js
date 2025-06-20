// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
// License: Personal use only. See LICENSE for details.
// This script was created by Flopp999
// Support me with a coffee https://www.buymeacoffee.com/flopp999 
let version = 0.1
let token;
let deviceSn;
let epv1 = 23
let epv2 = 18

let homekwh = 23;
let batterysoc = 100
let exportkwh = 33
let importkwh = 1
let batterychargekwh = 5
let batterydischargekwh = 7
// === API-anrop ===
let batteryCapacityKwh;
let widget;
let day;
let date;
let language;
let settings = {}
let langId;
let hour;
let minute;
let translationData;
let monthName;
let currentLang;

const fileNameSettings = Script.name() + "_Settings.json";
const fileNameTranslations = Script.name() + "_Translations.json";
const fileNameData = Script.name() + "_Data.json";
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const filePathSettings = fm.joinPath(dir, fileNameSettings);
const filePathTranslations = fm.joinPath(dir, fileNameTranslations);
const filePathData = fm.joinPath(dir, fileNameData);

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
// License: Personal use only. See LICENSE for details.
// This script was created by Flopp999
// Support me with a coffee https://www.buymeacoffee.com/flopp999 
let version = 0.791
let allValues = [];
let widget;
let daybefore;
let day;
let date;
let prices;
let pricesJSON;
let priceAvg;
let priceLowest;
let priceHighest;
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
let hour;
let minute;
let translationData;
let currentLang;
const fileNameSettings = Script.name() + "_Settings.json";
const fileNameTranslations = Script.name() + "_Translations.json";
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const filePathSettings = fm.joinPath(dir, fileNameSettings);
const filePathTranslations = fm.joinPath(dir, fileNameTranslations);
let height = 1150;
let width = 1300;
let keys = [];

if (!config.runsInWidget){
  await updatecode();
  await readTranslations();
  await readsettings();
  await createVariables();
  await start();
  await createVariables();
}

if (config.runsInWidget){
 await readsettings();
  if (keys.length < 11 || keys == undefined) {
    let widget = new ListWidget();
    widget.addText("You need to run \"" + Script.name() + "\" in the app");
    Script.setWidget(widget);
    Script.complete();
    return;
  }
}
if (config.runsInWidget){
  await updatecode();
  await createVariables();
}

async function start() {
  const [topType, topDay] = settings.showattop.split(",").map(s => s.trim());
  const [middleType, middleDay] = settings.showatmiddle.split(",").map(s => s.trim());
  const [bottomType, bottomDay] = settings.showatbottom.split(",").map(s => s.trim());
  let alert = new Alert();
  let vatText = includevat == 1 ? t("yes") : t("no")
  alert.message = 
    t("changesetup") + "?\n" +
    t("top").charAt(0).toUpperCase() + t("top").slice(1) + ":\n" + t(topType) + (topDay ? ", " + t(topDay) : "") + "\n" +
    t("middle").charAt(0).toUpperCase() + t("middle").slice(1) + ":\n" + t(middleType) + (middleDay ? ", " + t(middleDay) : "") + "\n" +
    t("bottom").charAt(0).toUpperCase() + t("bottom").slice(1) + ":\n" + t(bottomType) + (bottomDay ? ", " + t(bottomDay) : "") + "\n" +
    t("area") + ": " + area + "\n" +
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
    fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
  }
}

async function updatecode() {
  try {
    const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-NordPool/main/Version.txt");
    req.timeoutInterval = 1;
    const serverVersion = await req.loadString()
    if (version < serverVersion) {
      try {
        const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-NordPool/main/Nordpool.js");
        req.timeoutInterval = 1;
        const response = await req.load();
        const status = req.response.statusCode;
        if (status !== 200) {
          throw new Error(`Error: HTTP ${status}`);
        }
        const codeString = response.toRawString();
        fm.writeString(module.filename, codeString);

        const reqTranslations = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-NordPool/main/Translations.json");
        reqTranslations.timeoutInterval = 1;
        const responseTranslations = await reqTranslations.load();
        const statusTranslations = reqTranslations.response.statusCode;
        if (statusTranslations !== 200) {
          throw new Error(`Error: HTTP ${statusTranslations}`);
        }
        const codeStringTranslations = responseTranslations.toRawString();
        fm.writeString(filePathTranslations, codeStringTranslations);
        fm.remove(filePathSettings);
        let updateNotify = new Notification();
        updateNotify.title = Script.name();
        updateNotify.body = "New version installed, " + serverVersion;
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
  try {
    if (fm.fileExists(filePathSettings)) {
      let raw = fm.readString(filePathSettings);
      settings = JSON.parse(raw);
      langId = settings.language; // 1 = ENG, 2 = DE, 3 = SV
      await readTranslations();
      keys = Object.keys(settings);
      if (keys.length < 11) {
        throw new Error("Settings file is incomplete or corrupted");
        return;
      }
    } else {
      if (config.runsInWidget) {
        return;
      }
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
    if (config.runsInWidget) {
      return;
    }
    console.warn("Settings file not found or error reading file: " + error.message);
    settings = await ask();
    fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
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
}

async function readTranslations() {
  if (!fm.fileExists(filePathTranslations)) {
    let url = "https://raw.githubusercontent.com/flopp999/Scriptable-NordPool/main/Translations.json";
    let req = new Request(url);
    req.timeoutInterval = 1;
    let content = await req.loadString();
    fm.writeString(filePathTranslations, content);
  }
  try {
    translationData = JSON.parse(fm.readString(filePathTranslations));
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
  if (!entry) return `[${key}]`; // key is missing
  return entry[currentLang] || entry["en"] || `[${key}]`;
}

async function ask() {
  [settings.area, settings.vat, settings.currency] = await askForArea();
  settings.includevat = await askForIncludeVAT();
  settings.extras = await askForExtras();
  await askForAllShowPositions("top");
  settings.resolution = 60;
  return settings
}

async function askForAllShowPositions() {
  const options = ["graph", "table", "pricestats", "nothing"];
  const days = ["today", "tomorrow"];
  const graphTypes = ["line", "bar"];
  const chosenCombinations = [];
  const positions = ["top", "middle", "bottom"];
  const graphOption = {};
  for (let position of positions) {
    const usedCount = (type) =>
      chosenCombinations.filter(c => c && c.type === type).length;

    const usedGraph = usedCount("graph");
    const usedTable = usedCount("table");

    let filteredOptions = options.filter(type => {
      if (type === "graph" && usedGraph >= 2) return false;
      if (type === "table" && usedTable >= 2) return false;
      if ((usedGraph + usedTable) >= 3 && (type === "graph" || type === "table")) return false;
      return true;
    });

    const alert = new Alert();
    alert.message = `${t("showwhat")} ${t(position)}?`;
    filteredOptions.forEach(o => alert.addAction(t(o)));
    const index = await alert.presentAlert();
    const choice = filteredOptions[index];

    let day = "";
    if (choice === "graph") {
      const graphTypeAlert = new Alert();
      graphTypeAlert.title = t(position).charAt(0).toUpperCase() + t(position).slice(1);
      graphTypeAlert.message = t("choosegraphtype");
      graphTypes.forEach(g => graphTypeAlert.addAction(t(g)));
      const gIndex = await graphTypeAlert.presentAlert();
      const selectedGraphType = graphTypes[gIndex];
      graphOption[position] = selectedGraphType;
    }
    if (choice !== "nothing") {
      const usedDaysForType = chosenCombinations
        .filter(c => c.type === choice)
        .map(c => c.day);
      const availableDays = days.filter(d => !usedDaysForType.includes(d));
      const dayAlert = new Alert();
      dayAlert.title = t(position).charAt(0).toUpperCase() + t(position).slice(1);
      dayAlert.message = t("showday") + "?";
      availableDays.forEach(d => dayAlert.addAction(t(d)));
      const dayIndex = await dayAlert.presentAlert();
      day = availableDays[dayIndex];
    }

    chosenCombinations.push({ position, type: choice, day });
    settings[`showat${position}`] = `${choice}, ${day}`;
  }
  settings.graphOption = graphOption;
  
  fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
  const totalGraph = chosenCombinations.filter(c => c.type === "graph").length;
  const totalTable = chosenCombinations.filter(c => c.type === "table").length;
  const totalPriceStats = chosenCombinations.filter(c => c.type === "pricestats").length;
  const heightMap = {
    "1-0-0": 1200,
    "0-1-0": 800,
    "0-0-1": 800,
  
    "1-1-0": 750,
    "1-0-1": 1130,
    "0-1-1": 900,
    "2-0-0": 550,
    "0-2-0": 600,
  
    "1-1-1": 730,
    "2-1-0": 380,
    "1-2-0": 540,
    "2-0-1": 470,
    "0-2-1": 580,
    "1-0-2": 1050,
    "0-1-2": 900,
  };
  
  const key = `${totalGraph}-${totalTable}-${totalPriceStats}`;
  settings.height = heightMap[key] ?? 1150;
  return settings;
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
  fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
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
  alert.addTextField("e.g. 0.30",String(settings.extras ?? "0")).setDecimalPadKeyboard();
  alert.addAction("OK");
  await alert.present();
  let input = alert.textFieldValue(0);
  input = input.replace(",", ".")
  let newCost = parseFloat(input);
  return newCost;
}

async function Table(day) {
  await Data(day);
  if (daybefore != day){
  let left = listwidget.addStack();
  let whatday = left.addText(date);
  whatday.textColor = new Color("#ffffff");
  whatday.font = Font.lightSystemFont(13);
  left.addSpacer();
  if (prices == 0) {
    whatday = left.addText(t("after13"));
    whatday.textColor = new Color("#ffffff");
    whatday.font = Font.lightSystemFont(13);
    listwidget.addSpacer(5);
    return;
  }else{
  
  let updatetext = left.addText(t("updated") + updated);
  updatetext.font = Font.lightSystemFont(13);
  updatetext.textColor = new Color("#ffffff");
  }
  }
  daybefore = day;
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
        if (allValues.length == 24) {
          if (i === hour && day == "today") {
            timeText.textColor = new Color("#00ffff");
            timeText.font = Font.lightSystemFont(bigFont);
          } else {
            timeText.textColor = new Color("#ffffff");
            timeText.font = Font.lightSystemFont(mediumFont);
          }
          break
        }
        if (i === hour && minute >= a * 15 && minute < (a + 1) * 15) { // actual hour and identifies which 15-minute interval
          timeText.textColor = new Color("#00ffff");
          timeText.font = Font.lightSystemFont(bigFont);
        } else {
          timeText.textColor = new Color("#ffffff");
          timeText.font = Font.lightSystemFont(mediumFont);
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
        if (i === hour && day == "today") {
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
  listwidget.addSpacer(5);
}

async function Graph(day, graphOption) {
//chart
  await Data(day);
  if (daybefore != day){ 
    let left = listwidget.addStack();
    let whatday = left.addText(date);
    whatday.textColor = new Color("#ffffff");
    whatday.font = Font.lightSystemFont(13);
    left.addSpacer();
    if (prices == 0) {
      whatday = left.addText("Available after 13:00");
      whatday.textColor = new Color("#ffffff");
      whatday.font = Font.lightSystemFont(13);
      listwidget.addSpacer(5);
      daybefore = day;
      return;
    } else {
      let updatetext = left.addText(t("updated") + updated);
      updatetext.font = Font.lightSystemFont(13);
      updatetext.textColor = new Color("#ffffff");
    }
  }
  daybefore = day;
  if (resolution == 60) {
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
      if (hour == counterdot && day == "today") {
        dotNow += pricesJSON[counterdot] + ","
      }
      else {
        dotNow += ","
      }
      counterdot += 1
    }
    while (counterdot < 24)
    
    let graphtoday = "https://quickchart.io/chart?bkg=black&w=1300&h="+settings.height+"&c="
    graphtoday += encodeURI("{\
      data: { \
        labels: ["+hours+"],\
        datasets: [\
        {\
            data: ["+dotNow+"],\
            type: 'line',\
            fill: false,\
            borderColor: 'rgb(0,255,255)',\
            borderWidth: 65,\
            pointRadius: 6\
          },\
          {\
            data: ["+avgtoday+"],\
            type: 'line',\
            fill: false,\
            borderColor: 'orange',\
            borderWidth: 6,\
            pointRadius: 0\
          },\
          {\
            data: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],\
            type: 'line',\
            fill: false,\
            borderColor: 'rgb(255,255,255)',\
            borderWidth: 6,\
            pointRadius: 0\
          },\
          {\
            data: ["+pricesJSON+"],\
            type: '"+graphOption+"',\
            fill: false,\
            borderColor: getGradientFillHelper('vertical',['rgb(255,25,255)','rgb(255,48,8)','orange','rgb(255,255,0)','rgb(0,150,0)']),\
            borderWidth: 20, \
            pointRadius: 0\
          },\
        ]\
      },\
        options:\
          {\
            legend:\
            {\
              display: false\
            },\
            scales:\
            {\
              xAxes: [{\
                offset:true,\
                ticks:{fontSize:35,fontColor:'white'}\
              }],\
              yAxes: [{\
                ticks:{stepSize:10,beginAtZero:true,fontSize:35,fontColor:'white'}\
              }]\
            }\
          }\
    }")
    graphtoday.timeoutInterval = 1;
    const GRAPH = await new Request(graphtoday).loadImage()
    let emptyrow = listwidget.addStack()
    listwidget.addSpacer(5)
    let chart = listwidget.addStack()
    chart.addImage(GRAPH) 
  }
  listwidget.addSpacer(5);
}

async function PriceStats(day) {
  await Data(day);
  if (daybefore != day){
    let left = listwidget.addStack();
    let whatday = left.
      addText(date);
    whatday.textColor = new Color("#ffffff");
    whatday.font = Font.lightSystemFont(13);
    left.addSpacer();
    let updatetext = left.addText(t("updated") + updated);
    updatetext.font = Font.lightSystemFont(13);
    updatetext.textColor = new Color("#ffffff");
  }
  daybefore = day;
  if (prices == 0) {
    return;
    }
  let bottom = listwidget.addStack();
  if (day != "tomorrow"){
  
  // now
  let now = bottom.addText(t("now") + " " + Math.round(pricesJSON[hour]));
  now.font = Font.lightSystemFont(11);
  now.textColor = new Color("#00ffff");
  bottom.addSpacer();
    }
  // lowest
  let lowest = bottom.addText(t("lowest") + " " + Math.round(priceLowest));
  lowest.font = Font.lightSystemFont(11);
  lowest.textColor = new Color("#00cf00");
  bottom.addSpacer();
  // average
  let avg = bottom.addText(t("average") + " " + Math.round(priceAvg));
  avg.font = Font.lightSystemFont(11);
  avg.textColor = new Color("#f38");
  bottom.addSpacer();
  // highest
  let highest = bottom.addText(t("highest") + " " + Math.round(priceHighest));
  highest.font = Font.lightSystemFont(11);
  highest.textColor = new Color("#fa60ff");
  listwidget.addSpacer(5);
}

const smallFont = 10;
const mediumFont = 12;
const bigFont = 13.5;
const hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];

// Today date
async function Data(day) {
  allValues = [];
  Path = fm.joinPath(dir, "NordPool_" + day + "Prices.json");
  DateObj = new Date();
  async function getData() {
    if (day == "tomorrow") {
      DateObj.setDate(DateObj.getDate() + 1);
    }
    const yyyy = DateObj.getFullYear();
    const mm = String(DateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(DateObj.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    const Url = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPriceIndices?date=${date}&market=DayAhead&indexNames=${area}&currency=${currency}&resolutionInMinutes=${resolution}`;
    const request = new Request(Url);
    request.timeoutInterval = 1;
    let response = (await request.loadJSON());
    const dataJSON = JSON.stringify(response, null ,2);
    fm.writeString(Path, dataJSON);
  }
  if (fm.fileExists(Path)) {
    let modified = fm.modificationDate(Path);
    let now = new Date();
    let hoursDiff = (now - modified) / (1000 * 60 * 60);
    let modifiedDay = modified.getDate();
    let modifiedMonth = modified.getMonth();
    let modifiedYear = modified.getFullYear();
    let yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    let isFromYesterday =
    modifiedDay === yesterday.getDate() &&
    modifiedMonth === yesterday.getMonth() &&
    modifiedYear === yesterday.getFullYear();
    if (hoursDiff > 6 || isFromYesterday) {
      await getData();
    }
  } else {
    await getData();
  }
  hour = DateObj.getHours();
  minute = DateObj.getMinutes();
  let content = fm.readString(Path);
  response = JSON.parse(content);
  date = response.deliveryDateCET;  
  prices = response.multiIndexEntries;
  let Updated = response.updatedAt;
  updated = Updated.replace(/\.\d+Z$/, '').replace('T', ' ');
  for (let i = 0; i < prices.length; i++) {
    const value = prices[i]["entryPerArea"][`${area}`];
    allValues.push(String(value/10* (1 + "." + (includevat*vat)) + extras));
  }
  pricesJSON = JSON.parse(JSON.stringify(allValues));
  priceLowest = (Math.min(...pricesJSON.map(Number)));
  priceHighest = (Math.max(...pricesJSON.map(Number)));
  priceDiff = (priceHighest - priceLowest)/3;
  priceAvg = pricesJSON.map(Number).reduce((a, b) => a + b, 0) / pricesJSON.length;
}

// Tomorrow date
async function DateTomorrow() { 
  allValues = [];
  tomorrowPath = fm.joinPath(dir, "NordPool_TomorrowPrices.json");
  async function getTomorrowData() {
    const tomorrowDateObj = new Date();
    tomorrowDateObj.setDate(tomorrowDateObj.getDate() + 1);
    const yyyyTomorrow = tomorrowDateObj.getFullYear();
    const mmTomorrow = String(tomorrowDateObj.getMonth() + 1).padStart(2, '0');
    const ddTomorrow = String(tomorrowDateObj.getDate()).padStart(2, '0');
    const tomorrowStr = `${yyyyTomorrow}-${mmTomorrow}-${ddTomorrow}`;
    const tomorrowUrl = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPriceIndices?date=${tomorrowStr}&market=DayAhead&indexNames=${area}&currency=${currency}&resolutionInMinutes=${resolution}`;
    const requestTomorrow = new Request(tomorrowUrl);
    requestTomorrow.timeoutInterval = 1;
    let responseTomorrow = (await requestTomorrow.loadJSON());
    const tomorrowJSON = JSON.stringify(responseTomorrow, null ,2);
    fm.writeString(tomorrowPath, tomorrowJSON);
  }
  if (fm.fileExists(tomorrowPath)) {
    let modified = fm.modificationDate(tomorrowPath);
    let now = new Date();
    let hoursDiff = (now - modified) / (1000 * 60 * 60);
    let modifiedDay = modified.getDate();
    let modifiedMonth = modified.getMonth();
    let modifiedYear = modified.getFullYear();
    let yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    let isFromYesterday =
    modifiedDay === yesterday.getDate() &&
    modifiedMonth === yesterday.getMonth() &&
    modifiedYear === yesterday.getFullYear();
  
    if (hoursDiff > 6 || isFromYesterday) {
      await getTomorrowData();
    }
  } else {
    await getTomorrowData();
  }
  let content = fm.readString(tomorrowPath);
  responseTomorrow = JSON.parse(content);
  date = responseTomorrow.deliveryDateCET;  
  prices = responseTomorrow.multiIndexEntries;
  let tomorrowUpdated = responseTomorrow.updatedAt;
  updated = tomorrowUpdated.replace(/\.\d+Z$/, '').replace('T', ' ');
  for (let i = 0; i < prices.length; i++) {
    const value = prices[i]["entryPerArea"][`${area}`];
    allValues.push(String(value/10* (1 + "." + (includevat*vat)) + extras));
  }
  pricesJSON = JSON.parse(JSON.stringify(allValues));
  priceLowest = (Math.min(...pricesJSON.map(Number)));
  priceHighest = (Math.max(...pricesJSON.map(Number)));
  priceDiff = (priceHighest - priceLowest)/3;
  priceAvg = pricesJSON.map(Number).reduce((a, b) => a + b, 0) / pricesJSON.length;
}

async function renderSection(position) {
  const value = settings[`showat${position}`];

  if (!value || value === "nothing") return;

  const [type, day] = value.split(",").map(s => s.trim());
  const graphOption = settings.graphOption[position]
  switch (type) {
    case "table":
      await Table(day);
      break;
    case "graph":
      await Graph(day, graphOption);
      break;
    case "pricestats":
      await PriceStats(day);
      break;
    default:
  }
}

let listwidget = new ListWidget();

async function createWidget(){
  listwidget.backgroundColor = new Color("#000000");
  await renderSection("top");
  await renderSection("middle");
  await renderSection("bottom");  
  let moms = listwidget.addStack();
  momstext = moms.addText("v. " + version);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer(120);
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

async function start() {
  const [topType, topDay] = settings.showattop.split(",").map(s => s.trim());
  const [middleType, middleDay] = settings.showatmiddle.split(",").map(s => s.trim());
 // const [bottomType, bottomDay] = settings.showatbottom.split(",").map(s => s.trim());
  let alert = new Alert();
  //let vatText = includevat == 1 ? t("yes") : t("no")
  alert.message = 
    t("changesetup") + "?\n" +
    t("top").charAt(0).toUpperCase() + t("top").slice(1) + ":\n" + t(topType) + (topDay ? ", " + t(topDay) : "") + "\n" +
    t("middle").charAt(0).toUpperCase() + t("middle").slice(1) + ":\n" + t(middleType) + (middleDay ? ", " + t(middleDay) : "")
    //t("bottom").charAt(0).toUpperCase() + t("bottom").slice(1) + ":\n" + t(bottomType) + (bottomDay ? ", " + t(bottomDay) : "")
  alert.addAction(t("yes"));
  alert.addAction(t("no"));
  let index = await alert.presentAlert();
  if (index === 0) {
    settings = await ask();
    fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
  }
}

async function updatecode() {
  try {
    const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/Version.txt");
    req.timeoutInterval = 1;
    const serverVersion = await req.loadString()
    if (version < serverVersion) {
      try {
        const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/OnePower.js");
        req.timeoutInterval = 1;
        const response = await req.load();
        const status = req.response.statusCode;
        if (status !== 200) {
          throw new Error(`Error: HTTP ${status}`);
        }
        const codeString = response.toRawString();
        fm.writeString(module.filename, codeString);

        const reqTranslations = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/Translations.json");
        reqTranslations.timeoutInterval = 1;
        const responseTranslations = await reqTranslations.load();
        const statusTranslations = reqTranslations.response.statusCode;
        if (statusTranslations !== 200) {
          throw new Error(`Error: HTTP ${statusTranslations}`);
        }
        const codeStringTranslations = responseTranslations.toRawString();
        fm.writeString(filePathTranslations, codeStringTranslations);
        //fm.remove(filePathSettings);
        let updateNotify = new Notification();
        updateNotify.title = Script.name();
        updateNotify.body = "New version installed, " + serverVersion;
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
  try {
    if (fm.fileExists(filePathSettings)) {
      let raw = fm.readString(filePathSettings);
      settings = JSON.parse(raw);
			if (!settings.token || settings.token.length === 0) {
  			settings.token = "token"
			}
			if (!settings.deviceSn || settings.deviceSn.length === 0) {
  			settings.deviceSn = "deviceSn"
			}
			if (!settings.updatehour || settings.updatehour.length === 0) {
  			settings.updatehour = "0"
			}
			if (!settings.updateminute || settings.updateminute.length === 0) {
  			settings.updateminute = "01"
			}
			if (!settings.language || settings.language.length === 0) {
  			settings.language = 1
			}
      langId = settings.language; // 1 = ENG, 2 = DE, 3 = SV
      await readTranslations();
    } else {
      if (config.runsInWidget) {
        return;
      }
      await askForLanguage();
      await readTranslations();
      let alert = new Alert();
      alert.title = "Support";
      alert.message = t("buymeacoffee") + "?";
      alert.addAction(t("noway"));
			alert.addAction("Ko-fi");
      alert.addCancelAction("Buymeacoffee");
      let response = await alert.present();
      if (response === -1) {
        Safari.open("https://buymeacoffee.com/flopp999");
      }
			if (response === 1) {
        Safari.open("https://ko-fi.com/flopp999");
      }
      throw new Error("Settings file not found");
    }
  } catch (error) {
    if (config.runsInWidget) {
      return;
    }
    console.warn("Settings file not found or error reading file: " + error.message);
    settings = await ask();
    fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
  }
}

async function getStatus() {
  const endpoint = `/site/Statuses?serial=` + rpiSerial;
  const url = baseURL + endpoint;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json"
  };
  const req = new Request(url);
  req.method = "GET";
  req.headers = headers;
  try {
    const responsestatus = await req.loadJSON();
    if (req.response.statusCode === 200) {
			if (responsestatus[0]["Pending"][0] == "fcrd") {
				mode = "CO"
			} else if (responsestatus[0]["Pending"][0] == "sc") {
				mode = "SC"
			} else {
				mode = "Unknown"
			}
			if (responsestatus[0]["Service"][0] == "off") {
				modeStatus = t("deactivated")
			} else if (responsestatus[0]["Service"][0] == "fcrd" || responsestatus[0]["Service"][0] == "sc") {
				modeStatus = t("activated")
			} else {
				modeStatus = "Unknown"
			}

			
			
			FpUpInKw = responsestatus[0]["FpUpInKw"]
			FpDownInKw = responsestatus[0]["FpDownInKw"]
			ChargingMax = responsestatus[0]["RelatedMeters"][0]["PeakAcKw"]
			DischargingMax = responsestatus[0]["RelatedMeters"][1]["PeakAcKw"]
      return null;
    } else {
      console.error("❌ Fel statuskod:", req.response.statusCode);
    }
  } catch (err) {
    console.error("❌ Fel vid hämtning av status", err);
  }
  return null;
}

// == Hämta revenue med JWT ==
async function fetchData(jwtToken) {
	Path = filePathData
	DateObj = new Date();
	async function getData() {
		const url = "https://openapi.growatt.com/v1/device/tlx/tlx_last_data";
		let req = new Request(url);
		req.method = "POST";
		req.headers = {
		  "Content-Type": "application/x-www-form-urlencoded",
		  "token": token
		};
		req.body = `tlx_sn=${encodeURIComponent(deviceSn)}`;
		try {
			req.timeoutInterval = 1;
	  	const response = await req.loadJSON();
			if (req.response.statusCode === 200) {
				const dataJSON = JSON.stringify(response, null ,2);
				fm.writeString(filePathData, dataJSON);
		  	console.log("Svar från Growatt:", response);
		    settings.updatehour = String(DateObj.getHours()).padStart(2,"0");
				settings.updateminute = String(DateObj.getMinutes()).padStart(2,"0");
				fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
			} else {
				console.error("❌ Fel statuskod:", req.response.statusCode);
			}
		} catch (err) {
	  	console.error("Fel vid API-anrop:", err);
		}
	}
	
	if (fm.fileExists(filePathData)) {
		let modified = fm.modificationDate(filePathData);
		let now = new Date();
		let minutesDiff = (now - modified) / (1000 * 60);
		if ( minutesDiff > 10 ) {
			await getData();
		}
	} else {
		await getData();
	}
	//hour = DateObj.getHours();
	//minute = DateObj.getMinutes();
	let content = fm.readString(filePathData);
	data = JSON.parse(content);


	epv1 = data["data"]["epv1Today"];
		    epv2 = data["data"]["epv2Today"];
		    batterysoc = data["data"]["bmsSoc"];
		    homekwh = data["data"]["elocalLoadToday"];
		    exportkwh = data["data"]["etoGridToday"];
		    //importkwh = data["data"]["elocalLoadToday"];
		    batterychargekwh = data["data"]["echargeToday"];
		    batterydischargekwh = data["data"]["edischargeToday"];

	updated = "" + hour + minute + "";
}

async function createVariables() {
  token = settings.token;
  deviceSn = settings.deviceSn;
	hour = settings.updatehour;
	minute = settings.updateminute;
}

async function readTranslations() {
  if (!fm.fileExists(filePathTranslations)) {
    let url = "https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/Translations.json";
    let req = new Request(url);
    req.timeoutInterval = 1;
    let content = await req.loadString();
    fm.writeString(filePathTranslations, content);
  }
  try {
    translationData = JSON.parse(fm.readString(filePathTranslations));
    const langMap = {
      1: "en",
      3: "sv"
    };
    currentLang = langMap[langId] || "en"; // fallback to english
  } catch (error) {
    console.error(error);
  }
}

function t(key) {
  const entry = translationData[key];
  if (!entry) return `[${key}]`; // key is missing
  return entry[currentLang] || entry["en"] || `[${key}]`;
}

async function ask() {
  settings.token = await askForToken();
  settings.deviceSn = await askForDeviceSn();
  return settings
}

// Select resolution
async function askForLanguage() {
  let alert = new Alert();
  alert.message = "Language/Språk:";
  alert.addAction("English");
  alert.addAction("Svenska");
  let index = await alert.presentAlert();
  settings.language = [1,3][index];
  fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
  langId = settings.language; // 1 = ENG, 2 = DE, 3 = SV
  return [1,3][index];
}

// Include extra cost?
async function askForToken() {
  let alert = new Alert();
  alert.title = "Token";
  alert.message = (t("askfortoken") + "?");
  alert.addTextField("abc123abc123abc123",settings.token).setDefaultKeyboard();
  alert.addAction("OK");
  await alert.present();
  let input = alert.textFieldValue(0);
  token = input
  return input;
}

// Include extra cost?
async function askForDeviceSn() {
  let alert = new Alert();
  alert.title = ("Serial number");
  alert.message = (t("askfordevicesn") + "?");
  alert.addTextField().setDefaultKeyboard();
  alert.addAction("OK");
  await alert.present();
  let input = alert.textFieldValue(0);
  deviceSn = input;
  return input;
}

async function Status(day) {
	let row = listwidget.addStack();
	row.layoutHorizontally()
  let left = row.addStack()
  left.layoutVertically()
	row.addSpacer(40)
	let mid = row.addStack()
	mid.layoutVertically()
	let right = row.addStack()
	right.layoutVertically()
	let whatday = left.addText(t("mode") + ": " + mode + ", " + modeStatus);
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
	whatday = mid.addText(t("capacity") + ": " + String(batteryCapacityKwh) +  "kWh");
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
  whatday = left.addText(t("charge") + ": " + String(ChargingMax) + "kW");
  whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
  whatday = mid.addText(t("up") + ": " + String(FpUpInKw) + "kW");
  whatday.textColor = new Color("#ffffff");
  whatday.font = Font.lightSystemFont(13);
	whatday = left.addText(t("discharge") + ": " + String(DischargingMax) + "kW");
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
	whatday = mid.addText(t("down") + ": " + String(FpDownInKw) + "kW");
	whatday.textColor = new Color("#ffffff");
	whatday.font = Font.lightSystemFont(13);
}



const smallFont = 10;
const mediumFont = 12;
const bigFont = 13.5;
const now = new Date();
// Hämta antalet dagar i innevarande månad
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
// Skapa array från 1 till antal dagar
const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

async function renderSection(position) {
  const value = settings[`showat${position}`];
  if (!value || value === "nothing") return;

  const [type, day] = value.split(",").map(s => s.trim());
	
  const graphOption = settings.graphOption[position]
  switch (type) {
    case "status":
      await Status(day);
      break;
    case "graph":
      await Graph(day, graphOption);
      break;
    case "revenue":
      await Revenue();
      break;
    default:
  }
}

let listwidget = new ListWidget();

async function Revenue() {
	let ja = listwidget.addStack()
  listwidget.addSpacer(10)
	let save = listwidget.addStack();
  save.layoutHorizontally()
  let saveleft = save.addStack()
  saveleft.layoutVertically()
  save.addSpacer(20)
  let savemid = save.addStack()
  savemid.layoutVertically()
  save.addSpacer(30)
  let saveright = save.addStack()
  saveright.layoutVertically()
  save.addSpacer(20)
  let savemost = save.addStack()
  savemost.layoutVertically()
  let te = saveleft.addText(String(monthName))
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff")
  te = savemid.addText(" ")
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = saveleft.addText("FCR-D");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = savemid.addText(String(Math.round(totalFcrd)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = saveleft.addText(t("savings"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = saveleft.addText(t("peakbought"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemid.addText(String(Math.round(totalSavings)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	 te = savemid.addText(String(peakBought.toFixed(1)) + "kW");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = saveright.addText(t("thisyear"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
	te = saveright.addText("FCR-D");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = saveright.addText(t("savings"));
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemost.addText(" ")
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemost.addText(String(Math.round(totalFcrdYear)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
  te = savemost.addText(String(Math.round(totalSavingsYear)) + "kr");
  te.font = Font.lightSystemFont(13);
  te.textColor = new Color("#ffffff");
}

async function createWidget(){
	//token = set loginAndGetToken();
	await fetchData(token);
	const date = new Date();
	let solarkwh = epv1+epv2
//let widget = new ListWidget();
let first = listwidget.addStack()
first.layoutHorizontally()
first.addSpacer()
//let solarrow = widget.addStack();
//let importrow = widget.addStack()
let exportrowr = first.addStack()
let exportrow=exportrowr.addStack()
exportrow.layoutVertically()
//let homerow = widget.addStack()
//let batterychargerow = widget.addStack()
//let batterydischargerow = widget.addStack()
first.addSpacer()
let fm = FileManager.iCloud()
let exportpath = fm.joinPath(fm.documentsDirectory(), "export.png")
exportimage = await fm.readImage(exportpath)
let importpath = fm.joinPath(fm.documentsDirectory(), "import.png")
importimage = await fm.readImage(importpath)
let solarpath = fm.joinPath(fm.documentsDirectory(), "solar.png")
solarimage = await fm.readImage(solarpath)
let homepath = fm.joinPath(fm.documentsDirectory(), "home.png")
homeimage = await fm.readImage(homepath)
let batterychargepath = fm.joinPath(fm.documentsDirectory(), "batterycharge.png")
batterychargeimage = await fm.readImage(batterychargepath)
let batterydischargepath = fm.joinPath(fm.documentsDirectory(), "batterydischarge.png")
batterydischargeimage = await fm.readImage(batterydischargepath)
let batterysocpath = fm.joinPath(fm.documentsDirectory(), "batterysoc.png")
batterysocimage = await fm.readImage(batterysocpath)

exportrow.addSpacer()
kk=exportrow.addImage(solarimage);
kk.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
ss=exportrow.addImage(homeimage);
ss.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
ii=exportrow.addImage(exportimage);
ii.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
pp=exportrow.addImage(importimage);
pp.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
de=exportrow.addImage(batterychargeimage);
de.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
ll=exportrow.addImage(batterydischargeimage);
ll.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
exportrow.addSpacer()
l=exportrow.addImage(batterysocimage);
l.imageSize = new Size(40, 40); // Extra kontroll på bildstorlek
//exportrow.addSpacer()
exportrowr.addSpacer(10)

let exportvalue = exportrowr.addStack()
exportvalue.layoutVertically()

exportvalue.addSpacer(15)
let solarkwhtext = exportvalue.addText(Math.round(solarkwh) + " kWh");
exportvalue.addSpacer(23)
let homewhtext = exportvalue.addText(Math.round(homekwh) + " kWh");
exportvalue.addSpacer(23)
let exportkwhtext = exportvalue.addText(Math.round(exportkwh) + " kWh");
exportvalue.addSpacer(23)
let importkwhtext = exportvalue.addText(Math.round(importkwh) + " kWh");
exportvalue.addSpacer(23)
let batterychargekwhtext = exportvalue.addText(Math.round(batterychargekwh) + " kWh");
exportvalue.addSpacer(23)
let batterydischargekwhtext = exportvalue.addText(Math.round(batterydischargekwh) + " kWh");
exportvalue.addSpacer(23)
let batterysoctext = exportvalue.addText(Math.round(batterysoc) + " %");

solarkwhtext.textColor = new Color("#ffffff");
homewhtext.textColor = new Color("#ffffff");
exportkwhtext.textColor = new Color("#ffffff");
importkwhtext.textColor = new Color("#ffffff");
batterychargekwhtext.textColor = new Color("#ffffff");
batterydischargekwhtext.textColor = new Color("#ffffff");
batterysoctext.textColor = new Color("#ffffff");
	
  listwidget.backgroundColor = new Color("#000000");
  await renderSection("top");
  //await renderSection("middle");
  //await renderSection("bottom");  
  listwidget.addSpacer(0);
  let moms = listwidget.addStack();
  momstext = moms.addText("v. " + version);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
	moms.addSpacer();
  momstext = moms.addText("updated " + settings.updatehour + ":" + settings.updateminute);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  return listwidget;
}

widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  if (Math.random() < 0.5) {
    let alert = new Alert();
    alert.title = "Support";
    alert.message = t("buymeacoffee") + "?";
    alert.addCancelAction("Buymeacoffee 👍");
	  alert.addAction("Ko-fi 👍");
    alert.addAction(t("noway"));
    let response = await alert.present();
    if (response === -1) {
      Safari.open("https://buymeacoffee.com/flopp999");
    }
		if (response === 0) {
        Safari.open("https://ko-fi.com/flopp999");
    }
  }
}

widget.presentLarge()
Script.complete();

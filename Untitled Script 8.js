// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: magic;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: magic;
// License: Personal use only. See LICENSE for details.
// This script was created by Flopp999
// Support me with a coffee https://www.buymeacoffee.com/flopp999 
let version = 0.1
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
let keys = [];
let token;
let deviceSn;

const fileNameData = Script.name() + "_Data.json";
const fileNameDataYear = Script.name() + "_DataYear.json";
const filePathData = fm.joinPath(dir, fileNameData);

if (!config.runsInWidget){
  await updatecode();
  await readTranslations();
  await readsettings();
  await createVariables();
}

if (config.runsInWidget){
  await readsettings();
  await updatecode();
  await createVariables();
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

	const baseUrl = "https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/assets/"

	// Filer att hämta – json + bilder
	const filesToDownload = [
	  "Translations.json",
	  "batterysocgreen.png",
	  "batterysocorange.png",
	  "batterysocred.png",
	  "batterysocyellow.png",
	  "charge.png",
	  "discharge.png",
	  "export.png",
	  "home.png",
	  "homepercentgreen.png",
	  "homepercentorange.png",
	  "homepercentred.png",
	  "homepercentyellow.png",
	  "import.png",
	  "logo.png",
	  "sun.png"
	]

	// Ladda ner varje fil
	for (let filename of filesToDownload) {
	  const url = baseUrl + filename
	  const filePath = fm.joinPath(dir, filename)

	  try {
	    const req = new Request(url)
	    req.timeoutInterval = 5
	
	    if (filename.endsWith(".json")) {
	      const response = await req.load()
	      const status = req.response.statusCode
	      if (status !== 200) throw new Error(`HTTP ${status}`)
	      const text = response.toRawString()
	      fm.writeString(filePath, text)
	      console.log(`✅ ${filename} (JSON) nedladdad`)
	    } else if (filename.endsWith(".png")) {
	      const image = await req.loadImage()
	      fm.writeImage(filePath, image)
	      console.log(`✅ ${filename} (bild) nedladdad`)
	    } else {
	      console.warn(`⚠️ Okänt filformat: ${filename} – hoppas det funkar!`)
	    }
	  } catch (error) {
	    console.error(`❌ Fel vid nedladdning av ${filename}:`, error)
	  }
	}
lä
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
			if (!settings.updatehour || String(settings.updatehour).length === 0) {
  			settings.updatehour = "0"
			}
			if (!settings.updateminute || String(settings.updateminute).length === 0) {
  			settings.updateminute = "0"
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
		    settings.updatehour = String(DateObj.getHours()).padStart(2, "0");
        settings.updateminute = String(DateObj.getMinutes()).padStart(2, "0");
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
		let modifiedDay = modified.getDate();
		let modifiedMonth = modified.getMonth();
		let modifiedYear = modified.getFullYear();
		let yesterday = new Date(now);
		yesterday.setDate(now.getDate() - 1);
		let isFromYesterday =
		modifiedDay === yesterday.getDate() &&
		modifiedMonth === yesterday.getMonth() &&
		modifiedYear === yesterday.getFullYear();
		if (minutesDiff > 6 || isFromYesterday) {
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
  		  importkwh = data["data"]["etoUserToday"];
		    batterychargekwh = data["data"]["echargeToday"];
		    batterydischargekwh = data["data"]["edischargeToday"];

	//updated = "" + hour + minute + "";
}


async function createVariables() {
  area = settings.area;
  resolution = settings.resolution;
  currency = settings.currency;
  vat = settings.vat;
  includevat = settings.includevat;
  extras = settings.extras;
  language = settings.language;
  token = settings.token;
  deviceSn = settings.deviceSn;
	updatehour = settings.updatehour;
	updateminute = settings.updateminute;
}


async function readTranslations() {
  if (!fm.fileExists(filePathTranslations)) {
    let url = "https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/assets/Translations.json";
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
  //await askForAllShowPositions("top");
  settings.showattop = "graph, today"
  settings.showatmiddle = "pricestats, today"
  settings.graphOption = {"top": "line"},
  settings.resolution = 60;
  settings.token = await askForToken();
  settings.deviceSn = await askForDeviceSn();
  settings.height = 550
   return settings
}

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
  alert.addAction("Svenska");
  let index = await alert.presentAlert();
  settings.language = [1,3][index];
  fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
  langId = settings.language; // 1 = ENG, 2 = DE, 3 = SV
  return [1,3][index];
}

// Select area
async function askForArea() {
  let alert = new Alert();
  alert.message = t("chooseyourelectricityarea") + ":";
  let areas = ["SE1","SE2","SE3","SE4"];
  for (let area of areas) {
    alert.addAction(area);
  }
  let index = await alert.presentAlert();
  let area = ["SE1","SE2","SE3","SE4"][index];
  let vat = 20;
  let currencies2 = "SEK";
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
      let updatetext = left.addText("Nord Pool " + updated);
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
    log(settings.height)
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
            borderColor: 'rgb(255,127,39)',\
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
            borderColor: getGradientFillHelper('vertical',['rgb(255,25,255)','rgb(255,48,8)','rgb(255,127,39)','rgb(255,255,0)','rgb(57,118,59)']),\
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
  lowest.textColor = new Color("#75cf00");
  bottom.addSpacer();
  // average
  let avg = bottom.addText(t("average") + " " + Math.round(priceAvg));
  avg.font = Font.lightSystemFont(11);
  avg.textColor = new Color("#f38");
  bottom.addSpacer();
  // highest
  let highest = bottom.addText(t("highest") + " " + Math.round(priceHighest));
  highest.font = Font.lightSystemFont(11);
  highest.textColor = new Color("#ff1c00");
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
  //await renderSection("bottom");  
  let moms = listwidget.addStack();
  momstext = moms.addText("v. " + version);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer(55);
  momstext = moms.addText(t("updated") + String(updatehour) + ":" + String(updateminute));
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
    momstext = moms.addText(t("withvat"));
  }
  else {
    momstext = moms.addText(t("withoutvat"));
  }
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  
listwidget.addSpacer(5)

  await fetchData(token);
	const date = new Date();
	let solarkwh = epv1+epv2

let first = listwidget.addStack()

let spacesize = 3;
let textsize = 17;
let imagesize = 35;
let growattrow = first.addStack()
let exportrow=growattrow.addStack()
growattrow.addSpacer(spacesize)
let exportrowvalue=growattrow.addStack()
growattrow.addSpacer()
let sunhomerow=growattrow.addStack()
growattrow.addSpacer(spacesize)
let sunhomerowvalue=growattrow.addStack()
growattrow.addSpacer()
let batteryrow=growattrow.addStack()
growattrow.addSpacer(spacesize)
let batteryrowvalue=growattrow.addStack()
growattrow.addSpacer()
let percentrow=growattrow.addStack()
growattrow.addSpacer(spacesize)
let percentrowvalue=growattrow.addStack()
//growattrow.addSpacer(spacesize)

listwidget.addSpacer(5)

let jjj=listwidget.addStack()
exportrow.layoutVertically()
exportrowvalue.layoutVertically()
sunhomerow.layoutVertically()
sunhomerowvalue.layoutVertically()
batteryrow.layoutVertically()
batteryrowvalue.layoutVertically()
percentrow.layoutVertically()
percentrowvalue.layoutVertically()

let fm = FileManager.iCloud()
let exportpath = fm.joinPath(fm.documentsDirectory(), "export.png")
exportimage = await fm.readImage(exportpath)
let importpath = fm.joinPath(fm.documentsDirectory(), "import.png")
importimage = await fm.readImage(importpath)
let solarpath = fm.joinPath(fm.documentsDirectory(), "sun.png")
solarimage = await fm.readImage(solarpath)
let homepath = fm.joinPath(fm.documentsDirectory(), "home.png")
homeimage = await fm.readImage(homepath)
loadpercent=(homekwh-importkwh)/homekwh*100


if (loadpercent < 20) {
  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentred.png")
} else if (loadpercent < 40) {
  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentorange.png")
} else if (loadpercent < 70) {
  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentyelloe.png")
} else {
  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentgreen.png")
}

//let homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentgreen.png")
homepercentimage = await fm.readImage(homepercentpath)
let batterychargepath = fm.joinPath(fm.documentsDirectory(), "batterydischarge.png")
batterychargeimage = await fm.readImage(batterychargepath)
let batterydischargepath = fm.joinPath(fm.documentsDirectory(), "batterycharge.png")
batterydischargeimage = await fm.readImage(batterydischargepath)
let batterysocpath
if (batterysoc < 20) {
  batterysocpath = fm.joinPath(fm.documentsDirectory(), "batterysocred.png")
} else if (batterysoc < 40) {
  batterysocpath = fm.joinPath(fm.documentsDirectory(), "batterysocorange.png")
} else if (batterysoc < 70) {
  batterysocpath = fm.joinPath(fm.documentsDirectory(), "batterysocyellow.png")
} else {
  batterysocpath = fm.joinPath(fm.documentsDirectory(), "batterysocgreen.png")
}
batterysocimage = await fm.readImage(batterysocpath)
let logopath = fm.joinPath(fm.documentsDirectory(), "logo.png")
logoimage = await fm.readImage(logopath)

exportrow.addSpacer(2);
ii=exportrow.addImage(exportimage);
ii.imageSize = new Size(imagesize, imagesize);
exportrow.addSpacer(10)
pp=exportrow.addImage(importimage);
pp.imageSize = new Size(imagesize, imagesize);

sunhomerow.addSpacer(2);
kk=sunhomerow.addImage(solarimage);
kk.imageSize = new Size(imagesize, imagesize);
sunhomerow.addSpacer(9)
ss=sunhomerow.addImage(homeimage);
ss.imageSize = new Size(imagesize, imagesize);

batteryrow.addSpacer(2);
de=batteryrow.addImage(batterydischargeimage);
de.imageSize = new Size(imagesize, imagesize);
batteryrow.addSpacer(10)
ll=batteryrow.addImage(batterychargeimage);
ll.imageSize = new Size(imagesize, imagesize);

percentrow.addSpacer(2);
l=percentrow.addImage(batterysocimage);
l.imageSize = new Size(imagesize, imagesize);
percentrow.addSpacer(10)
lp=percentrow.addImage(homepercentimage);
lp.imageSize = new Size(imagesize, imagesize);

oooo=jjj.addImage(logoimage)

// Value
let exportkwhtext = exportrowvalue.addText(Math.round(exportkwh) + "\nkWh");
exportkwhtext.font = Font.lightSystemFont(textsize);
exportrowvalue.addSpacer(3);
let importkwhtext = exportrowvalue.addText(Math.round(importkwh)+"\nkWh");
importkwhtext.font = Font.lightSystemFont(textsize);

let solarkwhtext = sunhomerowvalue.addText(Math.round(solarkwh) + "\nkWh");
solarkwhtext.font = Font.lightSystemFont(textsize);
sunhomerowvalue.addSpacer(4);
let homekwhtext = sunhomerowvalue.addText(Math.round(homekwh) + "\nkWh");
homekwhtext.font = Font.lightSystemFont(textsize);

let batterychargekwhtext = batteryrowvalue.addText(Math.round(batterychargekwh) + "\nkWh");
batterychargekwhtext.font = Font.lightSystemFont(textsize);
batteryrowvalue.addSpacer(3);
let batterydischargekwhtext = batteryrowvalue.addText(Math.round(batterydischargekwh) + "\nkWh");
batterydischargekwhtext.font = Font.lightSystemFont(textsize);

let batterysoctext = percentrowvalue.addText(Math.round(batterysoc) + "\n%");
batterysoctext.font = Font.lightSystemFont(textsize);
percentrowvalue.addSpacer(3);
let loadpercenttext = percentrowvalue.addText(Math.round(loadpercent) + "\n%");
loadpercenttext.font = Font.lightSystemFont(textsize);

solarkwhtext.textColor = new Color("#ffffff");
homekwhtext.textColor = new Color("#ffffff");
exportkwhtext.textColor = new Color("#ffffff");
importkwhtext.textColor = new Color("#ffffff");
batterychargekwhtext.textColor = new Color("#ffffff");
batterydischargekwhtext.textColor = new Color("#ffffff");
batterysoctext.textColor = new Color("#ffffff");
loadpercenttext.textColor = new Color("#ffffff");

  return listwidget;
}

widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  if (Math.random() < 0) {
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

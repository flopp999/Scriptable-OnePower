// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
// License: Personal use only. See LICENSE for details.
// This script was created by Flopp999
// Support me with a coffee https://www.buymeacoffee.com/flopp999 
let version = 0.49
let widget;
let day;
let todaydate;
let yyyy;
let mm;
let dd;
let date;
let settings = {}
let hour;
let minute;
let translationData;
let currentLang;
let solarkwh;
let allValues = [];
let prices;
let pricesJSON;
let priceAvg;
let priceLowest;
let priceHighest;
let resolution;
let currency;
let vat;
let includevat;
let extras;
let ppv;

const fileNameData = Script.name() + "_Data.json";
const fileNameData2 = Script.name() + "_Data2.json";
const fileNameData3 = Script.name() + "_Data3.json";
const fileNameSettings = Script.name() + "_Settings.json";
const fileNameTranslations = Script.name() + "_Translations.json";
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const filePathData = fm.joinPath(dir, fileNameData);
const filePathData2 = fm.joinPath(dir, fileNameData2);
const filePathData3 = fm.joinPath(dir, fileNameData3);
const filePathSettings = fm.joinPath(dir, fileNameSettings);
const filePathTranslations = fm.joinPath(dir, fileNameTranslations);

if (!config.runsInWidget){
	await downloadFiles();
	await updatecode();
	await readTranslations();
	await readsettings();
}

if (config.runsInWidget){
	await readsettings();
	await updatecode();
}

async function downloadFiles() {
	const baseUrl = "https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/assets/"
	const filesToDownload = [
		"charge.png",
		"discharge.png",
		"export.png",
		"home.png",
		"import.png",
		"batterysocgreen.png",
		"batterysocorange.png",
		"batterysocred.png",
		"batterysocyellow.png",
		"homepercentgreen.png",
		"homepercentorange.png",
		"homepercentred.png",
		"homepercentyellow.png",
		"sun.png"
	]
	for (let filename of filesToDownload) {
		const filePath = fm.joinPath(dir, filename)
		if (!fm.fileExists(filePath)) {
			const url = baseUrl + filename
			try {
				const req = new Request(url)
				req.timeoutInterval = 10
				const image = await req.loadImage()
				fm.writeImage(filePath, image)
			} catch (error) {
				console.error(`Fel vid nedladdning av ${filename}:`, error)
			}
		}
	}
}

async function updatecode() {
	try {
		const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/Version.txt");
		req.timeoutInterval = 10;
		const serverVersion = await req.loadString()
		if (version < serverVersion) {
			try {
				const req = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/OnePowerGrowatt.js");
				req.timeoutInterval = 10;
				const response = await req.load();
				const status = req.response.statusCode;
				if (status !== 200) {
					throw new Error(`Error: HTTP ${status}`);
				}
				const codeString = response.toRawString();
				fm.writeString(module.filename, codeString);
				
				const reqTranslations = new Request("https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/Translations.json");
				reqTranslations.timeoutInterval = 10;
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
			if (!settings.area) {
				await askForArea();
			}
			if (!settings.deviceType || settings.deviceType.length === 0) {
				await getDeviceType()
			}
			if (!settings.token || settings.token.length === 0) {
				settings.token = "token"
			}
			if (!settings.devicesn || settings.devicesn.length === 0) {
				settings.devicesn = "devicesn"
			}
			if (!settings.username || settings.username.length === 0) {
				settings.username = "username"
			}
			if (!settings.password || settings.password.length === 0) {
				settings.password = "password"
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
			fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
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
		settings.brand = await askForBrand();
		settings = await ask();
		fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
	}
}

async function getDeviceType() {
	Path = filePathData
	DateObj = new Date();
	const url = "https://openapi.growatt.com/v4/new-api/queryDeviceList";
	let req = new Request(url);
	req.method = "POST";
	req.headers = {
		"Content-Type": "application/x-www-form-urlencoded",
		"token": settings.token
	};
	try {
		req.timeoutInterval = 10;
		response = await req.loadJSON();

		if (req.response.statusCode === 200) {
			//const dataJSON = JSON.stringify(response, null ,2);
			settings.deviceType = response["data"]["data"][0]["deviceType"]
			//fm.writeString(filePathData, dataJSON);
		fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
		} else {
			console.error("Fel statuskod:", req.response.statusCode);
		}
	} catch (err) {
		console.error(response)
		console.error("Fel vid get device type", err);
	}
}

async function fetchData() {
	Path = filePathData
	DateObj = new Date();
	async function getData() {
		const url = "https://openapi.growatt.com/v4/new-api/queryLastData";
		let req = new Request(url);
		req.method = "POST";
		req.headers = {
			"Content-Type": "application/x-www-form-urlencoded",
			"token": settings.token
		};
		req.body = `deviceSn=${encodeURIComponent(settings.devicesn)}&deviceType=${encodeURIComponent(settings.deviceType)}`;
		try {
			req.timeoutInterval = 10;
			const response = await req.loadJSON();
			if (req.response.statusCode === 200) {
				if ((response["message"] === "FREQUENTLY_ACCESS" && response["code"] == "102") ||
					 (response["message"] === "FREQUENTLY_ACCESS" && response["code"] == "true")){
						alert.title = "Vänta";
						alert.message = ("Du har haft för tätt kontakt med Growatt server, vänta 5 minuter och prova igen");
						alert.addAction("OK");
						await alert.present();
						return
				}
				const dataJSON = JSON.stringify(response, null ,2);
				fm.writeString(filePathData, dataJSON);
				settings.updatehour = String(DateObj.getHours()).padStart(2,"0");
				settings.updateminute = String(DateObj.getMinutes()).padStart(2,"0");
				fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
			} else {
				console.error("Fel statuskod:", req.response.statusCode);
			}
		} catch (err) {
			console.error(response)
			console.error("Fel vid fetchdata", err);
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
	let content = fm.readString(filePathData);
	data = JSON.parse(content);
	if (settings.deviceType == "min") {
		ppv = data["data"][settings.deviceType][0]["ppv"];
		if (ppv > 10000) {
			ppv = ( ppv / 1000).toFixed(1) + "\nkW"
		} else {
			ppv = Math.round(ppv) + "\nW"
		}
		epv1 = data["data"][settings.deviceType][0]["epv1Today"];
		epv2 = data["data"][settings.deviceType][0]["epv2Today"];
		solarkwh = epv1+epv2
		batterysoc = data["data"][settings.deviceType][0]["bmsSoc"];
		homekwh = data["data"][settings.deviceType][0]["elocalLoadToday"];
		exportkwh = data["data"][settings.deviceType][0]["etoGridToday"];
		importkwh = data["data"][settings.deviceType][0]["etoUserToday"];
		batterychargekwh = data["data"][settings.deviceType][0]["echargeToday"];
		batterydischargekwh = data["data"][settings.deviceType][0]["edischargeToday"];
	} else if (settings.deviceType == "storage") {
		solarkwh = data["data"][settings.deviceType][0]["epvToday"];
		batterysoc = data["data"][settings.deviceType][0]["capacity"];
		homekwh = data["data"][settings.deviceType][0]["eopDischrToday"];
		exportkwh = data["data"][settings.deviceType][0]["eToGridToday"];
		importkwh = data["data"][settings.deviceType][0]["eToUserToday"];
		batterychargekwh = data["data"][settings.deviceType][0]["etoday"];
		batterydischargekwh = data["data"][settings.deviceType][0]["eBatDisChargeToday"];
	} else if (settings.deviceType == "inv") {
		epv1 = data["data"][settings.deviceType][0]["epv1Today"];
		epv2 = data["data"][settings.deviceType][0]["epv2Today"];
		solarkwh = epv1+epv2
	} else if (settings.deviceType == "max") {
		solarkwh = data["data"][settings.deviceType][0]["eacToday"];
	} else if (settings.deviceType == "sph") {
		epv1 = data["data"][settings.deviceType][0]["epv1Today"];
		epv2 = data["data"][settings.deviceType][0]["epv2Today"];
		solarkwh = epv1+epv2
		batterysoc = data["data"][settings.deviceType][0]["soc"];
		homekwh = data["data"][settings.deviceType][0]["elocalLoadToday"];
		exportkwh = data["data"][settings.deviceType][0]["etoGridToday"];
		importkwh = data["data"][settings.deviceType][0]["etoUserToday"];
		batterychargekwh = data["data"][settings.deviceType][0]["echarge1Today"];
		batterydischargekwh = data["data"][settings.deviceType][0]["edischarge1Today"];
	} else if (settings.deviceType == "sph-s") {
		epv1 = data["data"][settings.deviceType][0]["epv1Today"];
		epv2 = data["data"][settings.deviceType][0]["epv2Today"];
		solarkwh = epv1+epv2
		batterysoc = data["data"][settings.deviceType][0]["soc"];
		homekwh = data["data"][settings.deviceType][0]["elocalLoadToday"];
		exportkwh = data["data"][settings.deviceType][0]["etoGridToday"];
		importkwh = data["data"][settings.deviceType][0]["etoUserToday"];
		batterychargekwh = data["data"][settings.deviceType][0]["echarge1Today"];
		batterydischargekwh = data["data"][settings.deviceType][0]["edischarge1Today"];
	}
}

async function readTranslations() {
	if (!fm.fileExists(filePathTranslations)) {
		let url = "https://raw.githubusercontent.com/flopp999/Scriptable-OnePower/main/Translations.json";
		let req = new Request(url);
		req.timeoutInterval = 10;
		let content = await req.loadString();
		fm.writeString(filePathTranslations, content);
	}
	try {
		translationData = JSON.parse(fm.readString(filePathTranslations));
		const langMap = {
			1: "en",
			3: "sv"
		};
		currentLang = langMap[settings.language] || "en"; // fallback to english
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
  settings.showattop = "graph, today"
  settings.showatmiddle = "pricestats, today"
  settings.graphOption = {"top": "line"},
  settings.resolution = 60;
  settings.height = 550
	log(settings.whatbrand)
	if (settings.whatbrand == "growatt") {
		settings.token = await askForToken();
		settings.devicesn = await askForDeviceSn();
		settings.deviceType = await getDeviceType()
	} else if (settings.whatbrand == "wattsonic") {
		settings.token = await askForUsername();
		settings.devicesn = await askForPassword();
	}
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
	return settings
}

async function PriceStats(day) {
  await nordpoolData(day);
  if (prices == 0) {
    return;
    }
  let bottom = listwidget.addStack();
  // now
	let now = bottom.addText(t("now") + " " + Math.round(pricesJSON[hour]));
	now.font = Font.lightSystemFont(11);
	now.textColor = new Color("#00ffff");
	bottom.addSpacer();
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
  // t
  let highest = bottom.addText(t("highest") + " " + Math.round(priceHighest));
  highest.font = Font.lightSystemFont(11);
  highest.textColor = new Color("#ff19ff");
  listwidget.addSpacer(5);
}

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
  settings.extras  = newCost
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
	return newCost;
}

async function askForBrand() {
  let alert = new Alert();
  alert.message = t("whatbrand") + "?";
  alert.addAction("Growatt");
	alert.addAction("WattSonic");
  let index = await alert.presentAlert();
	settings.whatbrand = ["growatt","wattsonic"][index];
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
  return ["growatt","wattsonic"][index];
}

async function askForIncludeVAT() {
  let alert = new Alert();
  alert.message = t("doyouwantvat") + "?";
  alert.addAction(t("withvat"));
  alert.addAction(t("withoutvat"));
  let index = await alert.presentAlert();
	settings.includevat = [1,0][index];
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
  return [1,0][index];
}

async function askForArea() {
  let alert = new Alert();
  alert.message = t("chooseyourelectricityarea") + ":";
  let areas = ["SE1","SE2","SE3","SE4"];
  for (let area of areas) {
    alert.addAction(area);
  }
  let index = await alert.presentAlert();
  settings.area = ["SE1","SE2","SE3","SE4"][index];
  settings.vat = 25;
  currencies = "SEK";
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
  return [settings.area, settings.vat, currencies];
}

async function askForLanguage() {
	let alert = new Alert();
	alert.message = "Language/Språk:";
	alert.addAction("English");
	alert.addAction("Svenska");
	let index = await alert.presentAlert();
	settings.language = [1,3][index];
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
	return [1,3][index];
}

async function askForTUsername() {
	let alert = new Alert();
	alert.title = "Username";
	alert.message = (t("askforusername") + "?");
	alert.addTextField("example@mail.com",settings.username).setDefaultKeyboard();
	alert.addAction("OK");
	await alert.present();
	let input = alert.textFieldValue(0);
	settings.username = input
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
	return input;
}

async function askForToken() {
	let alert = new Alert();
	alert.title = "Token";
	alert.message = (t("askfortoken") + "?");
	alert.addTextField("abc123abc123",settings.token).setDefaultKeyboard();
	alert.addAction("OK");
	await alert.present();
	let input = alert.textFieldValue(0);
	settings.token = input
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2));
	return input;
}

async function Graph(day, graphOption) {
//chart
  await nordpoolData(day);
  let left = listwidget.addStack();
  let whatday = left.addText(date);
  whatday.textColor = new Color("#ffffff");
  whatday.font = Font.lightSystemFont(13);
  left.addSpacer();
  let updatetext = left.addText("Nord Pool " + updated);
  updatetext.font = Font.lightSystemFont(13);
  updatetext.textColor = new Color("#ffffff");
  if (settings.resolution == 60) {
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
    let graphtoday = "https://quickchart.io/chart?bkg=black&w=1300&h=" + settings.height + "&c="
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
            type: '"+settings.graphOption.top+"',\
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
    graphtoday.timeoutInterval = 5;
    const GRAPH = await new Request(graphtoday).loadImage()
    let emptyrow = listwidget.addStack()
    listwidget.addSpacer(5)
    let chart = listwidget.addStack()
    chart.addImage(GRAPH) 
  }
  listwidget.addSpacer(5);
}

async function askForDeviceSn() {
	let alert = new Alert();
	alert.title = ("Device Serial number");
	alert.message = (t("askfordevicesn") + "?");
	alert.addTextField().setDefaultKeyboard();
	alert.addAction("OK");
	await alert.present();
	let input = alert.textFieldValue(0);
	settings.devicesn = input;
	return input;
}

async function askForPassword() {
	let alert = new Alert();
	alert.title = ("Password");
	alert.message = (t("askforpassword") + "?");
	alert.addTextField().setDefaultKeyboard();
	alert.addAction("OK");
	await alert.present();
	let input = alert.textFieldValue(0);
	settings.password = input;
	return input;
}

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
		case "pricestats":
    await PriceStats(day);
    break;
		default:
	}
}

async function nordpoolData(day) {
  allValues = [];
  Path = fm.joinPath(dir, "NordPool_" + day + "Prices.json");
  DateObj = new Date();
  yyyy = DateObj.getFullYear();
  mm = String(DateObj.getMonth() + 1).padStart(2, '0');
  dd = String(DateObj.getDate()).padStart(2, '0');
  todaydate = `${yyyy}-${mm}-${dd}`;
    
	async function getData() {
    const Url = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPriceIndices?date=${todaydate}&market=DayAhead&indexNames=${settings.area}&currency=${settings.currency}&resolutionInMinutes=${settings.resolution}`;
    const request = new Request(Url);
    request.timeoutInterval = 1;
    let response = (await request.loadJSON());
    const dataJSON = JSON.stringify(response, null ,2);
    fm.writeString(Path, dataJSON);
  }
  if (fm.fileExists(Path)) {
    let modified = fm.modificationDate(Path);
    let now = new Date();
    let minutesDiff = (now - modified) / (1000 * 60 * 60);
    if (minutesDiff > 10) {
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
    const value = prices[i]["entryPerArea"][`${settings.area}`];
    allValues.push(String(value/10* (1 + "." + (settings.includevat*settings.vat)) + settings.extras));
  }
  pricesJSON = JSON.parse(JSON.stringify(allValues));
  priceLowest = (Math.min(...pricesJSON.map(Number)));
  priceHighest = (Math.max(...pricesJSON.map(Number)));
  priceDiff = (priceHighest - priceLowest)/3;
  priceAvg = pricesJSON.map(Number).reduce((a, b) => a + b, 0) / pricesJSON.length;
}

async function createWidget(){
	//token = set loginAndGetToken();
	listwidget.backgroundColor = new Color("#000000");
	if (settings.whatbrand == "growatt") {
		await fetchData(settings.deviceType);
		
	} else if (settings.whatbrand == "wattsonic") {
		await main();
	}
		
	await renderSection("top");
  await renderSection("middle");

	let moms = listwidget.addStack();
  momstext = moms.addText("v. " + version);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer(40);
  momstext = moms.addText(t("updated") + String(settings.updatehour) + ":" + String(settings.updateminute));
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer();
  momstext = moms.addText(settings.area);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer();
  momstext = moms.addText("Extras: " + settings.extras);
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  moms.addSpacer();
  if (settings.includevat == 1) {
    momstext = moms.addText(t("withvat"));
  }
  else {
    momstext = moms.addText(t("withoutvat"));
  }
  momstext.font = Font.lightSystemFont(10);
  momstext.textColor = new Color("#ffffff");
  
	listwidget.addSpacer(5)
	
	const date = new Date();
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
	listwidget.addSpacer(5)
	let realtimevalue=listwidget.addStack()
	let realtimevalueimage=realtimevalue.addStack()
	realtimevalue.addSpacer(spacesize)
	let realtimevaluetext=realtimevalue.addStack()
	realtimevalue.addSpacer()
	let realtimevaluelogo = realtimevalue.addStack()
	
	exportrow.layoutVertically()
	exportrowvalue.layoutVertically()
	sunhomerow.layoutVertically()
	sunhomerowvalue.layoutVertically()
	batteryrow.layoutVertically()
	batteryrowvalue.layoutVertically()
	percentrow.layoutVertically()
	percentrowvalue.layoutVertically()
	realtimevalue.layoutHorizontally()
	realtimevalueimage.layoutVertically()
	realtimevaluetext.layoutVertically()
	realtimevaluelogo.layoutVertically()
	
	let fm = FileManager.iCloud()
	let exportpath = fm.joinPath(fm.documentsDirectory(), "export.png")
	exportimage = await fm.readImage(exportpath)
	let importpath = fm.joinPath(fm.documentsDirectory(), "import.png")
	importimage = await fm.readImage(importpath)
	let sunpath = fm.joinPath(fm.documentsDirectory(), "sun.png")
	sunimage = await fm.readImage(sunpath)
	let homepath = fm.joinPath(fm.documentsDirectory(), "home.png")
	homeimage = await fm.readImage(homepath)
	loadpercent=(homekwh-importkwh)/homekwh*100
	
	if (loadpercent < 20) {
	  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentred.png")
	} else if (loadpercent < 40) {
	  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentorange.png")
	} else if (loadpercent < 70) {
	  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentyellow.png")
	} else {
	  homepercentpath = fm.joinPath(fm.documentsDirectory(), "homepercentgreen.png")
	}
	
	homepercentimage = await fm.readImage(homepercentpath)
	let batterychargepath = fm.joinPath(fm.documentsDirectory(), "discharge.png")
	batterychargeimage = await fm.readImage(batterychargepath)
	let batterydischargepath = fm.joinPath(fm.documentsDirectory(), "charge.png")
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
	kk=sunhomerow.addImage(sunimage);
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

	realtimevalueimage.addSpacer(2);
	ked=realtimevalueimage.addImage(sunimage);
	ked.imageSize = new Size(imagesize, imagesize);

  realtimevaluelogo.addSpacer(7)
  ooa=realtimevaluelogo.addImage(logoimage)
  //ooa.imageSize = new Size(imagesize, imagesize);

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

	let realtimevaluetext2 = realtimevaluetext.addText((ppv));
	realtimevaluetext2.font = Font.lightSystemFont(textsize);
	
	solarkwhtext.textColor = new Color("#ffffff");
	homekwhtext.textColor = new Color("#ffffff");
	exportkwhtext.textColor = new Color("#ffffff");
	importkwhtext.textColor = new Color("#ffffff");
	batterychargekwhtext.textColor = new Color("#ffffff");
	batterydischargekwhtext.textColor = new Color("#ffffff");
	batterysoctext.textColor = new Color("#ffffff");
	loadpercenttext.textColor = new Color("#ffffff");
	realtimevaluetext2.textColor = new Color("#ffffff");

  return listwidget;
}

const smallFont = 10;
const mediumFont = 12;
const bigFont = 13.5;
const hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];

const now = new Date();
// Hämta antalet dagar i innevarande månad
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
// Skapa array från 1 till antal dagar
const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

let listwidget = new ListWidget();
widget = await createWidget();

if (config.runsInWidget) {
	Script.setWidget(widget);
} else {
	
	if (Math.random() < 0.5) {
		let alert = new Alert();
		alert.title = "Support";
		alert.message = t("buymeacoffee") + "?";
		alert.addCancelAction("Buymeacoffee ");
		alert.addAction("Ko-fi ");
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












// =============== Verktygsfunktioner ===============

function hexToBytes(hex) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

function skapaPwd(password) {
  
	md5Hex = md5(password);
  
	const utf8Bytes = Data.fromString(md5Hex)
  
	//const base64 = Data.fromBytes(md5Bytes).toBase64String();
  return utf8Bytes.toBase64String()
}

// =============== MD5-algoritm ===============
// Kod från https://github.com/blueimp/JavaScript-MD5 – 100 % kompatibel med Python
function md5cycle(x, k) {
  let a = x[0],
      b = x[1],
      c = x[2],
      d = x[3];

  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22, 1236535329);

  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);

  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520);
  b = hh(b, c, d, a, k[2], 23, -995338651);

  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523);
  b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359);
  d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380);
  b = ii(b, c, d, a, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15, 718787259);
  b = ii(b, c, d, a, k[9], 21, -343485551);

  x[0] = (a + x[0]) | 0;
  x[1] = (b + x[1]) | 0;
  x[2] = (c + x[2]) | 0;
  x[3] = (d + x[3]) | 0;
}

function ff(a, b, c, d, x, s, t) {
  return cmn((b & c) | (~b & d), a, b, x, s, t);
}
function gg(a, b, c, d, x, s, t) {
  return cmn((b & d) | (c & ~d), a, b, x, s, t);
}
function hh(a, b, c, d, x, s, t) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}
function ii(a, b, c, d, x, s, t) {
  return cmn(c ^ (b | ~d), a, b, x, s, t);
}
function cmn(q, a, b, x, s, t) {
  a = (a + q + x + t) | 0;
  return (((a << s) | (a >>> (32 - s))) + b) | 0;
}
function md5blk(s) {
  const md5blks = [];
  for (let i = 0; i < 64; i += 4) {
    md5blks[i >> 2] =
      s.charCodeAt(i) +
      (s.charCodeAt(i + 1) << 8) +
      (s.charCodeAt(i + 2) << 16) +
      (s.charCodeAt(i + 3) << 24);
  }
  return md5blks;
}
function md51(s) {
  const n = s.length;
  const state = [1732584193, -271733879, -1732584194, 271733878];
  let i;
  for (i = 64; i <= n; i += 64) {
    md5cycle(state, md5blk(s.substring(i - 64, i)));
  }
  s = s.substring(i - 64);
  const tail = Array(16).fill(0);
  for (i = 0; i < s.length; i++)
    tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
  tail[i >> 2] |= 0x80 << ((i % 4) << 3);
  if (i > 55) {
    md5cycle(state, tail);
    tail.fill(0);
  }
  tail[14] = n * 8;
  md5cycle(state, tail);
  return state;
}
function rhex(n) {
  const s = '0123456789abcdef';
  let str = '';
  for (let j = 0; j < 4; j++)
    str += s.charAt((n >> (j * 8 + 4)) & 0x0F) + s.charAt((n >> (j * 8)) & 0x0F);
  return str;
}
function hex(x) {
  for (let i = 0; i < x.length; i++) {
    x[i] = rhex(x[i]);
  }
  return x.join('');
}
function md5(str) {
  return hex(md51(str));
}

async function loggaIn(account, password) {
  const req = new Request("https://lb-eu.solinteg-cloud.com/gen2api/pc/user/login");
  req.method = "POST";
  req.headers = {
    "content-type": "application/json;charset=UTF-8",
    "lang": "en_US",
    "odm": "WAT",
    "offset": "-120",
    "origin": "https://www.wattsonic.cloud",
    "referer": "https://www.wattsonic.cloud/",
    "var": "pc",
  };
  req.body = JSON.stringify({
    account: account,
    pwd: skapaPwd(password),
  });
  const response = await req.loadJSON();
  if (!response.successful || response.errorCode !== 0) {
    throw new Error("❌ Inloggning misslyckades: " + JSON.stringify(response));
  }
  return response.body[0];
}

async function hamtaStationer(token) {
  
	const req = new Request("https://lb-eu.solinteg-cloud.com/gen2api/pc/distributor/station/search");
  req.method = "POST";
  req.headers = {
    "content-type": "application/json;charset=UTF-8",
    "accept": "application/json, text/plain, */*",
    "lang": "en_US",
    "odm": "WAT",
    "offset": "-120",
    "origin": "https://www.wattsonic.cloud",
    "referer": "https://www.wattsonic.cloud/",
    "var": "pc",
    "token": token,
  };
  req.body = JSON.stringify({
    nameSearch: "",
    orgSearch: "",
    status: "ALL",
    stationTypeIds: [],
    installedCapacityStart: "",
    installedCapacityEnd: "",
    sortField: "",
    sortRule: "DESC",
    pageNo: 1,
    pageSize: 20,
  });

  const response = await req.loadJSON();
  
	if (!response.successful || response.errorCode !== 0) {
    throw new Error("❌ Kunde inte hämta stationer: " + JSON.stringify(response));
  }
	
  return response.body.pageVO.content;
}

async function hamtaSystemData(token, stationId) {
  DateObj = new Date()
	const req = new Request(`https://lb-eu.solinteg-cloud.com/gen2api/pc/distributor/station/view/history/elec/system/percentage?date=${todaydate}&stationId=${stationId}`);
	req.headers = {
    "accept": "application/json, text/plain, */*",
    "lang": "en_US",
    "odm": "WAT",
    "offset": "-120",
    "origin": "https://www.wattsonic.cloud",
    "referer": "https://www.wattsonic.cloud/",
    "token": token,
    "var": "pc",
  };
  const response = await req.loadJSON();
  if (!response.successful || response.errorCode !== 0) {
    throw new Error("❌ Kunde inte hämta systeminfo: " + JSON.stringify(response));
  }
	const dataJSON = JSON.stringify(response, null ,2);
				fm.writeString(filePathData2, dataJSON);
				settings.updatehour = String(DateObj.getHours()).padStart(2,"0");
				settings.updateminute = String(DateObj.getMinutes()).padStart(2,"0");
				fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print

			homekwh=response["body"]["elecPercentage"]["elecUse"]
			importkwh=response["body"]["elecPercentage"]["importEnergy"]
			exportkwh=response["body"]["elecPercentage"]["exportEnergy"]


}
async function hamtaSystemBatteryInfo(token, stationId) {
  DateObj = new Date()
	const req = new Request(`https://lb-eu.solinteg-cloud.com/gen2api/pc/owner/inverter/power_generate/selective?sn=${settings.devicesn}&date=${yyyy}-${mm}&dateType=MONTH`);
  req.headers = {
    "accept": "application/json, text/plain, */*",
    "lang": "en_US",
    "odm": "WAT",
    "offset": "-120",
    "origin": "https://www.wattsonic.cloud",
    "referer": "https://www.wattsonic.cloud/",
    "token": token,
    "var": "pc",
  };
  const response = await req.loadJSON();
  if (!response.successful || response.errorCode !== 0) {
    throw new Error("❌ Kunde inte hämta systeminfo: " + JSON.stringify(response));
  }
	const dataJSON = JSON.stringify(response, null ,2);
	batterychargekwh=response["body"]["data"][3][dd-1]["value"]
	batterydischargekwh=response["body"]["data"][1][dd-1]["value"]
	fm.writeString(filePathData3, dataJSON);
	settings.updatehour = String(DateObj.getHours()).padStart(2,"0");
	settings.updateminute = String(DateObj.getMinutes()).padStart(2,"0");
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
	//ppv = response["body"]["currentPower"] * 1000
	//solarkwh = response["body"]["powerGenerationToday"]
	//batterysoc=response["body"]["soc"]
	return response.body;
}



async function hamtaSystemInfo(token, stationId) {
  DateObj = new Date()
	
	const req = new Request(`https://lb-eu.solinteg-cloud.com/gen2api/pc/distributor/station/stationCurrentInfo/${stationId}/system`);
  req.headers = {
    "accept": "application/json, text/plain, */*",
    "lang": "en_US",
    "odm": "WAT",
    "offset": "-120",
    "origin": "https://www.wattsonic.cloud",
    "referer": "https://www.wattsonic.cloud/",
    "token": token,
    "var": "pc",
  };
  const response = await req.loadJSON();
  if (!response.successful || response.errorCode !== 0) {
    throw new Error("❌ Kunde inte hämta systeminfo: " + JSON.stringify(response));
  }
	const dataJSON = JSON.stringify(response, null ,2);
	//fm.writeString(filePathData, dataJSON);
	settings.devicesn = response["body"]["singleEnergyInverterProps"]["sn"];
	settings.updatehour = String(DateObj.getHours()).padStart(2,"0");
	settings.updateminute = String(DateObj.getMinutes()).padStart(2,"0");
	fm.writeString(filePathSettings, JSON.stringify(settings, null, 2)); // Pretty print
	ppv = response["body"]["currentPower"] * 1000
	if (ppv > 10000) {
		ppv = ( ppv / 1000).toFixed(1) + "\nkW"
	} else {
		ppv = Math.round(ppv) + "\nW"
	}
	solarkwh = response["body"]["powerGenerationToday"]
	batterysoc=response["body"]["soc"]
	return response.body;
}

// =============== Huvudflöde ===============

async function main() {
  const email = settings.username;
  const password = settings.password;
  const token = await loggaIn(email, password);
  const stationer = await hamtaStationer(token);
	for (const s of stationer) {
  await hamtaSystemInfo(token, s.stationId);
  await hamtaSystemData(token, s.stationId);
	await hamtaSystemBatteryInfo(token, s.stationId);
  }
}



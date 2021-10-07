const puppeteer = require('puppeteer');
const SimpleNodeLogger = require('simple-node-logger'),
    opts = {
        logFilePath:'wifi-toggler.log',
        timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
    },
    log = SimpleNodeLogger.createSimpleLogger( opts );
require('dotenv').config();

let enable = true;
let headless = true;

// Param parsing
for (let i = 2; i < process.argv.length; ++i)
{
    if (process.argv[i] === "--debug")
        headless = false;

    if (process.argv[i] === "--disable")
        enable = false;
}

// Checking if .env is configured
if (!process.env.LOGIN_PASS || !process.env.LOGIN_PASS || !process.env.ROUTER_URL)
{
    log.error("Configure .env data before running the program.");
}


log.info("Running...");

(async () => {
    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: headless
    });
    const page = await browser.newPage();
    await page.goto('https://192.168.1.1');

    const user_input = await page.$('#Frm_Username');
    const pass_input = await page.$('#Frm_Password');
    const login_submit = await page.$('#LoginId')

    if (!user_input || !pass_input || !login_submit)
    {
        log.error("An element from the login form isn't reachable.")
        await browser.close();
        return;
    }

    await user_input.type(process.env.LOGIN_USER);
    await pass_input.type(process.env.LOGIN_PASS);
    await login_submit.click();

    await page.waitForNetworkIdle();

    await page.click("#localnet");

    await page.waitForNetworkIdle();
    await page.click("#wlanConfig");

    let radius_1 = "#RadioStatus" + (enable ? "0" : "1") + "_0";
    let radius_2 = "#RadioStatus" + (enable ? "0" : "1") + "_1";

    await page.waitForNetworkIdle();
    await page.click(radius_1);
    await page.click(radius_2);
    await page.click("#Btn_apply_WlanBasicAdConf");

    await page.waitForSelector('.succHint', { visible: true}).then(() => {
        // Finished
        log.info("Wifi " + (enable ? "enabled" : "disabled") + " correctly.");
    }).catch((err) => {
        log.error("Error: ", err);
    });

    await browser.close();
})();

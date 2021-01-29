// --- required dependencies
require('dotenv').config();
const request = require("request");
const fs = require("fs");
const figlet = require("figlet");
// const colors = require("colors");
const fetch = require("node-fetch");
const lineReader = require('line-reader');
//---added database
const { Ecobase } = require('mongo.eco');
const eco = new Ecobase(process.env.Mongodb)
//---added webhook
const hookConfig = { "name": "Nitro Generator", "access": process.env.hookaccess, "log":process.env.logaccess }
const webhook = require("webhook-discord");
const Hook = new webhook.Webhook(hookConfig.access);
const LogHook = new webhook.Webhook(hookConfig.log);
const hookcolor = { "success": "#35f27b", "warn": "#f2d038", "error": "#f54936", "info": "#aabbcc" }
const hookname = { "success": "Nitro Generator", "warn": "Nitro Validator" }
//---added optional
const proxies = __dirname + "/proxies.txt";
var term = require("terminal-kit").terminal;
const { async } = require('rxjs');
var proxyLine = 0;
var proxyUrl = "";
var working = [];
var version = "v1.1"
var toMatch;
// highest rate possible before the stress errors will start to occur
const triesPerSecond = 1;

console.clear();
console.log(figlet.textSync("Nitro Generator").green);
console.log(figlet.textSync(version).blue);
console.log(figlet.textSync("By Biswa").red);
//  async function addedTodatabase(){
//    let addNitro = eco.addItem(`nitro_o`, item)
//  }

generatecode = function () {
    let code = "";
    let dict = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < 16; i++) {
        code = code + dict.charAt(Math.floor(Math.random() * dict.length));
    }
    return code;
};
// async for fetch
async function updateLine() {
    proxyLine++;
    var readLine = 0;
    lineReader.eachLine(proxies, function (line, last) {
        readLine++;
        if (readLine === proxyLine) {
            proxyUrl = "http://" + line;
        }
        if (last) {
            // scrape proxies if none are detected
            readLine = 0;
            term.cyan("No proxies detected now scrapping...\n");
            if (proxyUrl === `http://${line}`) {
                (async () => {
                    await fetch("https://api.proxyscrape.com/?request=displayproxies&proxytype=http&timeout=7000&country=all&anonymity=all&ssl=yes").then(async res => {
                        const body = (await res.text());
                        fs.writeFileSync(__dirname + "/proxies.txt", body);
                    });
                })();
                proxyLine = 0
            }
        }
    });
}

updateLine();
// requests api 
checkCode = function (code) {
    var proxiedRequest = request.defaults({
        'proxy': proxyUrl
    });
    proxiedRequest.timeout = 1500;
    proxiedRequest.get(`https://discordapp.com/api/v6/entitlements/gift-codes/${code}?with_application=false&with_subscription_plan=true`, (error, resp, body) => {
        if (error) {
            // LogHook.warn(hookConfig.name,'Found invalid proxy!');
            term.brightYellow("Found invalid proxy...\n");
            updateLine();
            return;
        }
        try {
            if (body.code == 200) {

                const HookMsg = new webhook.MessageBuilder()
                    .setName(hookname.success)
                    .setColor(hookcolor.success)
                    .setTitle("Found Nitro!")
                    .setText(`\n https://discord.gift/${code} `);
                Hook.send(HookMsg);
                Hook.success(hookConfig.name, `https://discord.gift/${code}`)

                term.brightGreen(`Found Nitro! https://discord.gift/${code}\n`);
                eco.set(`nitro`, `https://discord.gift/${code}`);
                console.log(JSON.stringify(body, null, 4));
                working.push(`https://discord.gift/${code}`);
                fs.writeFileSync(__dirname + '/codes.json', JSON.stringify(working, null, 4));
                if (toMatch === 0) {
                    setTimeout(() => { process.exit() }, 1100);
                } else {
                    //console.log("test")
                }
            } else if (body.code == 429) {
                updateLine();
                term.brightYellow("Your being rate limited! switching...\n");
                LogHook.warn(hookConfig.name,'Discord Api being rate limited!');
                

            } else {
                term.brightRed(`discord.com/gifts/${code} is an invalid code!\n`);
                // Hook.err(hookname.warn, `discord.com/gifts/${code} is invalid`);

            }
        } catch (error) {
            LogHook.err(hookConfig.name,`An error occurred ${error}`);
            term.gray("An error occurred:\n");
            term.gray(error + "\n");
            return;
        }
    });
}
checkCodeOffline = function (code) {
    request(`https://discordapp.com/api/v6/entitlements/gift-codes/${code}?with_application=false&with_subscription_plan=true`, (error, res, body) => {
        if (error) {
            LogHook.err(hookConfig.name,`An error occurred ${error}`);
            term.gray("An error occurred:\n");
            term.gray(error + "\n");
            return;
        }
        try {
            if (body.code == 200) {
                const HookMsg = new webhook.MessageBuilder()
                    .setName(hookname.success)
                    .setColor(hookcolor.success)
                    .setTitle("Found Nitro!")
                    .setText(`\n https://discord.gift/${code} `);
                Hook.send(HookMsg);
                Hook.success(hookConfig.name,`https://discord.gift/${code}`);
                term.brightGreen(`Found Nitro! https://discord.gift/${code}\n`);
                console.log(JSON.stringify(body, null, 4));
                working.push(`https://discord.gift/${code}`);
                fs.writeFileSync(__dirname + '/codes.json', JSON.stringify(working, null, 4));
                if (toMatch === 0) {
                    process.exit();
                } else {
                    //console.log("test")
                }
            } else if (body.code == 429) {
                LogHook.success(hookConfig.name,`You are being rate limited!`);
                term.brightYellow("You are being rate limited!");
            } else {
                term.brightRed(`discord.com/gifts/${code} is an invalid code!\n`);

            }
        } catch (error) {
            LogHook.err(hookConfig.name,`An error occurred ${error}`);
            term.gray("An error occurred:\n");
            term.gray(error + "\n");
            return;
        }
    });
}


function main() {
    term.brightYellow(
        "Are you sure to use the generator? [Y|N]\n"
    );

    term.yesOrNo({
        yes: ["y", "ENTER"],
        no: ["n"]
    }, function (error, result) {


        if (result) {


            term.brightYellow(
                "Want to autostop the generator? [Y|N]\n"
            );

            term.yesOrNo({
                yes: ["y", "ENTER"],
                no: ["n"]
            }, function (error, result) {
                if (result) {
                    toMatch = 0;

                    term.brightYellow(
                        "Want to run the generator on proxies? [Y|N]\n"
                    );

                    term.yesOrNo({
                        yes: ["y", "ENTER"],
                        no: ["n"]
                    }, function (error, result) {
                        if (result) {



                            term.cyan("Now using proxies...\n");

                            var progressBar, progress = 0;


                            function doProgress() {

                                // Add random progress
                                progress += Math.random() / 10;
                                progressBar.update(progress);

                                if (progress >= 1) {

                                    console.clear();
                                    setTimeout(function () {
                                        term.cyan("Now using proxies...\n");
                                        term.green("-------------------------------------\n");
                                    }, 2000);

                                    setTimeout(function () {
                                        term.brightCyan("Press 'n' to stop the generator at any time\n");
                                    }, 8000);


                                    term.green("-------------------------------------\n");
                                    term.green(`Discord nitro generator ${version} \n`);
                                    term.green(`Checking a code every ${1 / triesPerSecond} second(s)\n`);

                                    setTimeout(function () {

                                        setInterval(() => {
                                            checkCode(generatecode());
                                        }, (1 / triesPerSecond) * 250);
                                    }, 12000);

                                } else {
                                    setTimeout(doProgress, 100 + Math.random() * 400);
                                }
                            }


                            progressBar = term.progressBar({
                                width: 80,
                                title: "Starting generator....",
                                eta: true,
                                percent: true
                            });

                            doProgress();



                        } else {
                            term.red("'No' detected, not using proxies...\n");


                            var progressBar, progress = 0;


                            function doProgress() {

                                // Add random progress
                                progress += Math.random() / 10;
                                progressBar.update(progress);

                                if (progress >= 1) {

                                    console.clear();
                                    setTimeout(function () {

                                        term.green("-------------------------------------\n");
                                        term.brightCyan("Made by Biswa#1234\n");
                                    }, 2000);


                                    term.green("-------------------------------------\n");
                                    term.green(`Discord nitro generator ${version} \n`);
                                    term.green(`Checking a code every ${12 / triesPerSecond} second(s)\n`);

                                    setTimeout(function () {

                                        setInterval(() => {
                                            checkCodeOffline(generatecode());
                                        }, (12 / triesPerSecond) * 1000);
                                    }, 12000);

                                } else {
                                    setTimeout(doProgress, 100 + Math.random() * 400);
                                }
                            }


                            progressBar = term.progressBar({
                                width: 80,
                                title: "Starting generator....",
                                eta: true,
                                percent: true
                            });

                            doProgress();


                        }
                    });


                } else {
                    term.brightYellow("'No' generator will continually log codes until manually stopped...\n");
                    LogHook.warn(hookConfig.name,`Generator will run 24*7 !`);

                    term.brightYellow(
                        "Would you like you to enable the use of proxy's? [Y|N]\n"
                    );

                    term.yesOrNo({
                        yes: ["y", "ENTER"],
                        no: ["n"]
                    }, function (error, result) {
                        if (result) {



                            term.cyan("Now using proxies...\n");

                            var progressBar, progress = 0;


                            function doProgress() {

                                // Add random progress
                                progress += Math.random() / 10;
                                progressBar.update(progress);

                                if (progress >= 1) {

                                    console.clear();
                                    setTimeout(function () {
                                        term.cyan("Now using proxies...\n");
                                        term.green("-------------------------------------\n");
                                        term.brightCyan("Maintained by Biswa#1234\n");
                                    }, 2000);

                                    setTimeout(function () {
                                        term.brightCyan("Press 'n' to stop the generator at any time\n");
                                    }, 4000);;

                                    term.green("-------------------------------------\n");
                                    term.green(`Discord nitro generator ${version} \n`);
                                    term.green(`Checking a code every ${1 / triesPerSecond} second(s)\n`);

                                    setTimeout(function () {

                                        setInterval(() => {
                                            checkCode(generatecode());
                                        }, (1 / triesPerSecond) * 250);
                                    }, 12000);

                                } else {
                                    setTimeout(doProgress, 100 + Math.random() * 400);
                                }
                            }


                            progressBar = term.progressBar({
                                width: 80,
                                title: "Starting generator....",
                                eta: true,
                                percent: true
                            });

                            doProgress();



                        } else {
                            term.red("No proxy detected...\n");


                            var progressBar, progress = 0;


                            function doProgress() {

                                // Add random progress
                                progress += Math.random() / 10;
                                progressBar.update(progress);

                                if (progress >= 1) {

                                    console.clear();
                                    setTimeout(function () {

                                        term.green("-------------------------------------\n");
                                    }, 2000);
                                    setTimeout(function () {
                                        term.brightCyan(
                                            "Press 'n' to stop the generator \n"
                                        );
                                    }, 4000);


                                    term.green("-------------------------------------\n");
                                    term.green(`Discord nitro generator ${version} \n`);
                                    term.green(`Checking a code every ${12 / triesPerSecond} second(s)\n`);

                                    setTimeout(function () {

                                        setInterval(() => {
                                            checkCodeOffline(generatecode());
                                        }, (12 / triesPerSecond) * 1000);
                                    }, 12000);

                                } else {
                                    setTimeout(doProgress, 100 + Math.random() * 400);
                                }
                            }


                            progressBar = term.progressBar({
                                width: 80,
                                title: "Starting generator....",
                                eta: true,
                                percent: true
                            });

                            doProgress();


                        }
                    });


                }
            });

        } else {
            LogHook.err(hookConfig.name,`generator stopped working !`);
            term.red("'No' detected, now quitting generator...\n");
            setTimeout(()=> {process.exit()}, 1200);
        }
    });
}

main()
process.on('uncaughtException', function (err) {
    LogHook.err(hookConfig.name,`An error occurred ${err}`);
    term.gray("An error occurred:\n");
    term.gray(err + "\n");
});

require('dotenv').config();
const { Ecobase } = require('mongo.eco');
const eco = new Ecobase(process.env.Mongodb)
var term = require("terminal-kit").terminal;
const { async } = require('rxjs');
const hookConfig = {"name":"Nitro Generator", "access": process.env.hookaccess}
const webhook = require("webhook-discord");
const Hook = new webhook.Webhook(hookConfig.access);
const hookcolor = { "success": "#35f27b", "warn": "#f2d038", "error": "#f54936", "info": "#aabbcc" }
const hookname = { "success": "Nitro Generator", "warn": "Nitro Validator" }

// const HookMsg= new webhook.MessageBuilder()
//     .setName(hookname.success)
//     .setColor(hookcolor.info)
//     .setTitle("Scrapped")
//     .setText('**Found Valid Nitro!** \n https://discord.com/gifts/0D70P7mmCE0k3Aa3 ');
// Hook.send(HookMsg);


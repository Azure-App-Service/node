#!/usr/bin/env node
const fs = require('fs'),
      util = require('util');

console.log("Generating app startup command");

const DEFAULTAPP = "/opt/startup/default-static-site.js";
const CMDFILE = "/opt/startup/startupCommand";

var httpLoggingEnabled = process.env.HTTP_LOGGING_ENABLED;
httpLoggingEnabled = (typeof httpLoggingEnabled !== 'undefined'
    && httpLoggingEnabled !== null
    && (httpLoggingEnabled.toLowerCase() === 'true' || httpLoggingEnabled.toLowerCase() === '1'))

var roleInstanceId = '';
if (typeof process.env.WEBSITE_ROLE_INSTANCE_ID !== 'undefined'
    && process.env.WEBSITE_ROLE_INSTANCE_ID !== null) {
    roleInstanceId = process.env.WEBSITE_ROLE_INSTANCE_ID;
}

var startupCommand = fs.readFileSync(CMDFILE, 'utf8').trim();

const CUSTOM_STARTUP_CMD_FLAG = "/opt/startup/CUSTOM_STARTUP_CMD_FLAG";
fs.writeFileSync(CUSTOM_STARTUP_CMD_FLAG, "FALSE");
if (startupCommand) {
    fs.writeFileSync(CUSTOM_STARTUP_CMD_FLAG, "TRUE"); // set CUSTOM_STARTUP_CMD_FLAG for remote debugging
}

// No user-provided startup command, check for scripts.start
const PACKAGE_JSON_FLAG = "/opt/startup/PACKAGE_JSON_FLAG";
fs.writeFileSync(PACKAGE_JSON_FLAG, "FALSE");
if (!startupCommand) {
    var packageJsonPath = "/home/site/wwwroot/package.json";
    var json = fs.existsSync(packageJsonPath) && JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    if (typeof json == 'object' && typeof json.scripts == 'object' && typeof json.scripts.start == 'string') {
        console.log("Found scripts.start in package.json")
        startupCommand = 'npm start';
        fs.writeFileSync(PACKAGE_JSON_FLAG, "TRUE"); // set PACKAGE_JSON_FLAG for remote debugging
    }
}

var nodeFile = startupCommand;

// No scripts.start; can we autodetect an app?
if (!startupCommand) {
    var autos = ['bin/www', 'server.js', 'app.js', 'index.js', 'hostingstart.js'];
    for (var i = 0; i < autos.length; i++) {
        var filename = "/home/site/wwwroot/" + autos[i];
        if (fs.existsSync(filename)) {
            console.log("No startup command entered, but found " + filename);
            nodeFile = filename;
            break;
        }
    }
}

// Still nothing, run the default static site
if (!startupCommand && !nodeFile) {
    console.log("No startup command or autodetected startup script " +
        "found. Running default static site.");
    nodeFile = DEFAULTAPP;
}

if (!startupCommand && nodeFile && fs.existsSync(nodeFile)) {
    if (process.env.APPSVC_REMOTE_DEBUGGING == "TRUE") {
        if (process.env.APPSVC_REMOTE_DEBUGGING_BREAK == "TRUE") {
            startupCommand = "node --inspect-brk=0.0.0.0:" + process.env.APPSVC_TUNNEL_PORT + " " + nodeFile;
        } else {
            startupCommand = "node --inspect=0.0.0.0:" + process.env.APPSVC_TUNNEL_PORT + " " + nodeFile;
        }
    } else {
        // Run with pm2
        startupCommand = "pm2 start " + nodeFile + " --no-daemon";
    }
}

// Write to file
fs.writeFileSync(CMDFILE, startupCommand);

#!/usr/bin/env node
const fs = require('fs');

const CMDFILE = "/opt/startup/startupCommand";

function getJsStartupCommand(jsFile) {
    if (process.env.APPSVC_REMOTE_DEBUGGING == "TRUE") {
        if (process.env.APPSVC_REMOTE_DEBUGGING_BREAK == "TRUE") {
            return "node --inspect-brk=0.0.0.0:" + process.env.APPSVC_TUNNEL_PORT + " " + jsFile;
        } else {
            return "node --inspect=0.0.0.0:" + process.env.APPSVC_TUNNEL_PORT + " " + jsFile;
        }
    } else {
        // Run with pm2
        return "pm2 start " + jsFile + " --no-daemon";
    }
}

function getStartupCommand(CMDFILE) {
    const CUSTOM_STARTUP_CMD_FLAG = "/opt/startup/CUSTOM_STARTUP_CMD_FLAG";
    fs.writeFileSync(CUSTOM_STARTUP_CMD_FLAG, "FALSE");
    const PACKAGE_JSON_FLAG = "/opt/startup/PACKAGE_JSON_FLAG";
    fs.writeFileSync(PACKAGE_JSON_FLAG, "FALSE");
    const PROCESS_JSON_FLAG = "/opt/startup/PROCESS_JSON_FLAG";
    fs.writeFileSync(PROCESS_JSON_FLAG, "FALSE");

    const DEFAULTAPP = "/opt/startup/default-static-site.js";
    var userStartupCommand = fs.readFileSync(CMDFILE, 'utf8').trim();

    if (userStartupCommand) {
        fs.writeFileSync(CUSTOM_STARTUP_CMD_FLAG, "TRUE"); // set CUSTOM_STARTUP_CMD_FLAG for remote debugging
    }
    
    // contains spaces, so multipart command
    // eg: npm start
    if (userStartupCommand.indexOf(" ") != -1) {
        console.log("Found command: "+ userStartupCommand);
        return userStartupCommand;
    }

    // look for package.json
    if (userStartupCommand.endsWith("package.json") || !userStartupCommand) {
        var packageJsonPath = "";
        if (!userStartupCommand) {
            packageJsonPath = "/home/site/wwwroot/package.json";
        } else {
            packageJsonPath = userStartupCommand;
        }
        if (fs.existsSync(packageJsonPath)) {
            var json =  JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
            if (typeof json == 'object' && typeof json.scripts == 'object' && typeof json.scripts.start == 'string') {
                console.log("Found scripts.start in " + packageJsonPath);
                fs.writeFileSync(PACKAGE_JSON_FLAG, "TRUE"); // set PACKAGE_JSON_FLAG for remote debugging
                if (packageJsonPath != "package.json") {
                    var packageJsonDir = packageJsonPath.substring(0, packageJsonPath.indexOf("package.json")-1);
                    return "npm --prefix=" + packageJsonDir + " start";
                } else {
                    return 'npm start';
                }
            }
        }
    }
    
    // look for process.json or *.json
    if (userStartupCommand.endsWith(".json") || !userStartupCommand) {
        var processJsonPath = "";
        if (!userStartupCommand) {
            processJsonPath = "/home/site/wwwroot/process.json";
        } else {
            processJsonPath = userStartupCommand;
        }
        if (fs.existsSync(processJsonPath)) {
            var json = JSON.parse(fs.readFileSync(processJsonPath, 'utf8'))
            console.log("Found script in " + processJsonPath)
            fs.writeFileSync(PROCESS_JSON_FLAG, "TRUE"); // set PROCESS_JSON_FLAG for remote debugging
            if (process.env.APPSVC_REMOTE_DEBUGGING == "TRUE") {
                if (typeof json == 'object' && typeof json.script == 'string') {
                    var nodeFile = json.script; // run the script directly with node
                    if (process.env.APPSVC_REMOTE_DEBUGGING_BREAK == "TRUE") {	
                        return "node --inspect-brk=0.0.0.0:" + process.env.APPSVC_TUNNEL_PORT + " " + nodeFile;
                    } else {
                        return "node --inspect=0.0.0.0:" + process.env.APPSVC_TUNNEL_PORT + " " + nodeFile;
                    }
                } else {
                    // did not find script tag
                    return "pm2 start " + processJsonPath + " --no-daemon";
                }
            } else {
                // Run with pm2
                return "pm2 start " + processJsonPath + " --no-daemon";
            }
        }
    }

    // look for *.config.js
    if (userStartupCommand.endsWith(".config.js") || !userStartupCommand) {
        var configJsPath = "";
        if (!userStartupCommand) {
            configJsPath = "/home/site/wwwroot/ecosystem.config.js";
        } else {
            configJsPath = userStartupCommand;
        }
        if (fs.existsSync(configJsPath)) {
            console.log("Found script in " + configJsPath)
            fs.writeFileSync(PROCESS_JSON_FLAG, "TRUE"); // set PROCESS_JSON_FLAG for remote debugging

            if (process.env.APPSVC_REMOTE_DEBUGGING == "TRUE") {
                // debugging not yet supported
                return "pm2 start " + configJsPath + " --no-daemon";
            } else {
                // Run with pm2
                return "pm2 start " + configJsPath + " --no-daemon";
            }
        }
    }

    // look for *.yaml and *.yml
    if (userStartupCommand.endsWith(".yml") || userStartupCommand.endsWith(".yaml")) {
        var processYamlPath = userStartupCommand;
        if (fs.existsSync(processYamlPath)) {
            console.log("Found script in " + processYamlPath)
            fs.writeFileSync(PROCESS_JSON_FLAG, "TRUE"); // set PROCESS_JSON_FLAG for remote debugging

            if (process.env.APPSVC_REMOTE_DEBUGGING == "TRUE") {
                // debugging not yet supported
                return "pm2 start " + processYamlPath + " --no-daemon";
            } else {
                // Run with pm2
                return "pm2 start " + processYamlPath + " --no-daemon";
            }
        }
    }

    // look for *.js
    if (userStartupCommand.endsWith(".js")) {
        console.log("Found js file " + userStartupCommand);
        return getJsStartupCommand(userStartupCommand);
    }

    // otherwise, use the user input
    if (userStartupCommand) {
        console.log(userStartupCommand + " is an executable file");
        // eg: /home/site/wwwroot/run.sh or ./bin/www
        return userStartupCommand; 
    }

    // No scripts.start; can we autodetect an app?
    var autos = ['bin/www', 'server.js', 'app.js', 'index.js', 'hostingstart.js'];
    for (var i = 0; i < autos.length; i++) {
        var filename = "/home/site/wwwroot/" + autos[i];
        if (fs.existsSync(filename)) {
            console.log("No startup command entered, but found " + filename);
            return getJsStartupCommand(filename);
        }
    }
    
    // Still nothing, run the default static site
    console.log("No startup command or autodetected startup script " +
        "found. Running default static site.");
    return getJsStartupCommand(DEFAULTAPP);
}

console.log("Generating app startup command");

var httpLoggingEnabled = process.env.HTTP_LOGGING_ENABLED;
httpLoggingEnabled = (typeof httpLoggingEnabled !== 'undefined'
    && httpLoggingEnabled !== null
    && (httpLoggingEnabled.toLowerCase() === 'true' || httpLoggingEnabled.toLowerCase() === '1'))

var startupCommand = getStartupCommand(CMDFILE);

// Write to file
fs.writeFileSync(CMDFILE, startupCommand);

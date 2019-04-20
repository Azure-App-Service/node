#!/usr/bin/env bash
cat >/etc/motd <<EOL 
  _____                               
  /  _  \ __________ _________   ____  
 /  /_\  \\___   /  |  \_  __ \_/ __ \ 
/    |    \/    /|  |  /|  | \/\  ___/ 
\____|__  /_____ \____/ |__|    \___  >
        \/      \/                  \/ 
A P P   S E R V I C E   O N   L I N U X

Documentation: http://aka.ms/webapp-linux
NodeJS quickstart: https://aka.ms/node-qs
NodeJS Version : `node --version`

EOL
cat /etc/motd

mkdir "$PM2HOME"
chmod 777 "$PM2HOME"
ln -s /home/LogFiles "$PM2HOME"/logs

# Get environment variables to show up in SSH session
eval $(printenv | sed -n "s/^\([^=]\+\)=\(.*\)$/export \1=\2/p" | sed 's/"/\\\"/g' | sed '/=/s//="/' | sed 's/$/"/' >> /etc/profile)

# starting sshd process
sed -i "s/SSH_PORT/$SSH_PORT/g" /etc/ssh/sshd_config
/usr/sbin/sshd

# feature flag for remote debugging for with npm
# set flag and restart site to remove these changes
if [ "$APPSVC_REMOTE_DEBUGGING" = "TRUE" ] && [ ! "$APPSETTING_REMOTE_DEBUGGING_FEATURE_FLAG" = "FALSE" ]
then
        mv /usr/local/bin/node /usr/local/bin/node-original
        mv /opt/startup/node-wrapper.sh /usr/local/bin/node
        chmod a+x /usr/local/bin/node
        sed -i 's/env node/env node-original/' /usr/local/lib/node_modules/npm/bin/npm-cli.js
        sed -i 's/env node/env node-original/' /usr/local/lib/node_modules/npm/bin/npx-cli.js
        sed -i 's/env node/env node-original/' /usr/local/lib/node_modules/pm2/bin/pm2
        sed -i 's/env node/env node-original/' /usr/local/lib/node_modules/pm2/bin/pm2-dev
        sed -i 's/env node/env node-original/' /usr/local/lib/node_modules/pm2/bin/pm2-docker
        sed -i 's/env node/env node-original/' /usr/local/lib/node_modules/pm2/bin/pm2-runtime
        sed -i 's/env node/env node-original/' /opt/startup/generateStartupCommand.js
fi

#
# Extract dependencies if required:
#
if [ -f "oryx-manifest.toml" ] && [ ! "$APPSVC_RUN_ZIP" = "TRUE" ] ; then
    echo "Found 'oryx-manifest.toml', checking if node_modules was compressed..."
    source "oryx-manifest.toml"
    if [ ${compressedNodeModulesFile: -4} == ".zip" ]; then
        echo "Found zip-based node_modules."
        extractionCommand="unzip -q $compressedNodeModulesFile -d /node_modules"
    elif [ ${compressedNodeModulesFile: -7} == ".tar.gz" ]; then
        echo "Found tar.gz based node_modules."
        extractionCommand="tar -xzf $compressedNodeModulesFile -C /node_modules"
    fi
    if [ ! -z "$extractionCommand" ]; then
        echo "Removing existing modules directory..."
        rm -fr /node_modules
        mkdir -p /node_modules
        echo "Extracting modules..."
        $extractionCommand
    fi
    echo "Done."
fi

echo "$@" > /opt/startup/startupCommand
node /opt/startup/generateStartupCommand.js
chmod 755 /opt/startup/startupCommand

STARTUPCOMMAND=$(cat /opt/startup/startupCommand)
echo "Running $STARTUPCOMMAND"
eval "exec $STARTUPCOMMAND" 

#!/usr/bin/env bash
service ssh start

mkdir "$PM2HOME"
chmod 777 "$PM2HOME"
ln -s /home/LogFiles "$PM2HOME"/logs

echo "$@" > /opt/startup/startupCommand
node /opt/startup/generateStartupCommand.js

STARTUPCOMMAND=$(cat /opt/startup/startupCommand)
echo "Running $STARTUPCOMMAND"
eval "exec $STARTUPCOMMAND"
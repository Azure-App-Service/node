#!/bin/sh

# check if inspect option is used
# hope we didnt match too much, should improve on this
args_contain_inspect=false
for arg in "$@"
do
  case "$arg" in
    --inspect*)
      args_contain_inspect=true
      ;;
    --debug*)
      args_contain_inspect=true
      ;;
  esac
done

package_json="FALSE"
if [ -e "/opt/startup/PACKAGE_JSON_FLAG" ]
then
  package_json=`cat /opt/startup/PACKAGE_JSON_FLAG`
fi

process_json="FALSE"
if [ -e "/opt/startup/PROCESS_JSON_FLAG" ]
then
  process_json=`cat /opt/startup/PROCESS_JSON_FLAG`
fi

custom_startup="FALSE"
if [ -e "/opt/startup/CUSTOM_STARTUP_CMD_FLAG" ]
then
  custom_startup=`cat /opt/startup/CUSTOM_STARTUP_CMD_FLAG`
fi

# enable remote debugging when node started with npm
if [ "$APPSVC_REMOTE_DEBUGGING" = "TRUE" ] && [ "$package_json" = "TRUE" ] && [ $args_contain_inspect = false ]
then
  node-original --inspect=0.0.0.0:$APPSVC_TUNNEL_PORT "$@"
elif [ "$APPSVC_REMOTE_DEBUGGING_BREAK" = "TRUE" ] && [ "$package_json" = "TRUE" ] && [ $args_contain_inspect = false ]
then 
  node-original --inspect-brk=0.0.0.0:$APPSVC_TUNNEL_PORT "$@"
# if using pm2
elif ([ "$APPSVC_REMOTE_DEBUGGING" = "TRUE" ] || [ "$APPSVC_REMOTE_DEBUGGING_BREAK" = "TRUE" ] ) && [ "$process_json" = "TRUE" ] && [ $args_contain_inspect = false ]
then
  node-original "$@"
elif [ "$APPSVC_REMOTE_DEBUGGING" = "TRUE" ] && [ "$custom_startup" = "TRUE" ] && [ $args_contain_inspect = false ]
then
  node-original --inspect=0.0.0.0:$APPSVC_TUNNEL_PORT "$@"
elif [ "$APPSVC_REMOTE_DEBUGGING_BREAK" = "TRUE" ] && [ "$custom_startup" = "TRUE" ] && [ $args_contain_inspect = false ]
then
  node-original --inspect-brk=0.0.0.0:$APPSVC_TUNNEL_PORT "$@"
else
  node-original "$@"
fi

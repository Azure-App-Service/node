FROM node:4.4.7
MAINTAINER Nazim Lala <naziml@microsoft.com>

COPY init_container.sh /bin/

RUN  npm install -g pm2 \
  && mkdir /pm2home     \
  && chmod 777 /pm2home \
  && rm -rf /pm2home/logs \
  && ln -s /home/LogFiles /pm2home/logs

  CMD ["/bin/init_container.sh"]

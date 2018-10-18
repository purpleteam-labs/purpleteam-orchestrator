FROM node:10-alpine

# Create an environment variable in our image for the non-root user we want to use.
# ENV user 1000
ENV user orchestrator

ENV workdir /usr/src/app/

# Home is required for npm install. System account with no ability to login to shell
# For standard node image:
#RUN useradd --create-home --system --shell /bin/false $user
# For node alpine:
RUN addgroup -S $user && adduser -S -G $user $user
RUN mkdir -p $workdir

#RUN cat /etc/resolv.conf
#RUN echo "" > /etc/resolv.conf
#RUN cat /etc/resolv.conf
#RUN ping dl-cdn.alpinelinux.org

#RUN apk add --no-cache --virtual .gyp python make g++
#RUN apk add --no-cache --virtual .gyp python 

WORKDIR $workdir
# For npm@5 or later, copy the automatically generated package-lock.json instead.
COPY package.json package-lock.json $workdir

# chown is required by npm install as a non-root user.
RUN chown $user:$user --recursive $workdir

# Required if posix needed, for winston-syslog-posix
#RUN apk add --no-cache --virtual .gyp python make g++

# Then all further actions including running the containers should
# be done under non-root user, unless root is actually required.
USER $user

RUN cd $workdir; npm install

# Required if posix needed, for winston-syslog-posix
#User root
#RUN apk del .gyp python make g++
#USER $user


COPY . $workdir


# Here I used to chown and chmod as shown here: http://f1.holisticinfosecforwebdevelopers.com/chap03.html#vps-countermeasures-docker-the-default-user-is-root
# Problem is, each of these commands creates another layer of all the files modified and thus adds over 100MB to the image: https://www.datawire.io/not-engineer-running-3-5gb-docker-images/

EXPOSE 2000

#CMD ["node", ".${workdir}app.js"]
CMD ["npm", "start"]
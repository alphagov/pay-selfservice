FROM ubuntu
RUN apt-get update && apt-get install -y rinetd
WORKDIR /root
ADD rinetd.conf /root/rinetd.conf
CMD /usr/sbin/rinetd -f -c rinetd.conf
FROM alpine:3.20
RUN apk add --no-cache bash curl
COPY validate-k8s.sh /usr/local/bin/validate-k8s.sh
RUN chmod +x /usr/local/bin/validate-k8s.sh
ENTRYPOINT ["/usr/local/bin/validate-k8s.sh"]
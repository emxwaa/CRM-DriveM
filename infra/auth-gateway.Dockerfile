FROM nginx:1.28.2-alpine
COPY auth.conf /etc/nginx/conf.d/default.conf

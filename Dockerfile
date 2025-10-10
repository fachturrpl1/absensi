FROM node:20-alpine AS runner
WORKDIR /app

# install jq (hanya 300KB)
RUN apk add --no-cache jq

ENV NODE_ENV=production
COPY --from=builder /app ./

# 💡 Ganti script start-only (tanpa build ulang)
RUN echo '{"scripts": {"start-only": "next start"}}' > package.json.tmp && \
    jq -s '.[0] * .[1]' package.json package.json.tmp > package.json.new && \
    mv package.json.new package.json && rm package.json.tmp

EXPOSE 4005
ENV PORT=4005

CMD ["npm", "run", "start-only"]

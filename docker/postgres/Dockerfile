# gosuだけをビルドする。Goの開発環境は最終イメージに含めない。
FROM --platform=$BUILDPLATFORM golang:1.27.3 AS gosu-build

ARG TARGETOS
ARG TARGETARCH

# 修正版の依存を含むgosu 1.20のソースを取得する。
RUN git clone --depth 1 --branch 1.20 \
    https://github.com/tianon/gosu.git /src/gosu

WORKDIR /src/gosu

# 実行対象のCPU向けに、外部のCライブラリに依存しないバイナリを作る。
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -o /out/gosu .

# PostgreSQL 17系のセキュリティ修正版とOS更新を取り込む。
FROM postgres:17.12

RUN apt-get update -qq && apt-get upgrade --no-install-recommends -y && rm -rf /var/lib/apt/lists/*

COPY --from=gosu-build /out/gosu /usr/local/bin/gosu

# バージョン表示とpostgresユーザーへの切り替えをビルド時に確認する。
RUN gosu --version && gosu postgres id

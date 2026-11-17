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

# PostgreSQL本体は17.11を維持し、gosuだけを置き換える。
FROM postgres:17.11

COPY --from=gosu-build /out/gosu /usr/local/bin/gosu

# バージョン表示とpostgresユーザーへの切り替えをビルド時に確認する。
RUN gosu --version && gosu postgres id

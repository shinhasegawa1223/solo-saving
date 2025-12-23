FROM python:3.12-slim-bookworm
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# バイトコードのコンパイルを有効化
ENV UV_COMPILE_BYTECODE=1

# マウントされたボリュームを使用するため、リンクではなくキャッシュからコピーする
ENV UV_LINK_MODE=copy

# lockファイルと設定を使用してプロジェクトの依存関係をインストールする
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-dev

# 実行可能ファイルをPATHの前方に追加する
ENV UV_PROJECT_ENVIRONMENT="/opt/venv"
ENV PATH="/opt/venv/bin:$PATH"

# エントリポイントをリセットし、`uv`を呼び出さないようにする
ENTRYPOINT []

# プロジェクトの残りの部分をコピーする
COPY . .

# プロジェクトをインストールする
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

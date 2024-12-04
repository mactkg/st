# st

Slackのステータスを管理するためのCLIツール

## SYNOPSIS

```toml
# ~/.config/st/config.toml
[states.start]
text = "お仕事中"
emoji = ":running:"
messages = [
  { channel = "CA4242AAA", message = "業務開始" },
  { channel = "CB2424BBB", message = "おはよー" },
]
```

```bash
$ st set start
# SlackのStatusが :running: お仕事中 にセットされ
# 各チャンネルにメッセージが通知される
```

## インストール

- [リリース](https://github.com/mactkg/st/releases)にビルド済みのバイナリがあります。

## コマンドリファレンス
### `set [state名]`

設定ファイルで定義した `state名` の state より、Slackのステータスを設定します。 `messages` が設定されていれば、各チャンネルにメッセージを投稿します。

### `clear`

Slackのステータスをクリアします。

### `ls`

設定ファイルに記載のある各種 state をリストアップします。

### `show`

Slack上のステータスを表示します。

### `generate [state名]`

設定ファイルに `state名` で新しい state を追加します。

## 設定ファイルのリファレンス

TBW

いったん[TOMLファイルの読み込みインタフェース](https://github.com/mactkg/st/blob/d88cf0834919766b81cd887fc0af04503b22b451/toml.ts#L5-L18)を参考にしてください。

## LICENSE

MIT License
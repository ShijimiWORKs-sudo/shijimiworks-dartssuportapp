# DartsSupportApp

Expo + React Native + TypeScript で作る、iPhone 向けソフトダーツ練習支援アプリのMVP土台です。

## Requirements

- Node.js 22 以上
- npm
- iPhone 実機、または iOS Simulator
- iPhone 実機で確認する場合は Expo Go

## Setup

```bash
npm install
```

## Start

```bash
npx expo start
```

起動後、ターミナルに表示されるQRコードまたはメニューから確認します。

## iPhoneで確認する

1. iPhone に Expo Go をインストールします。
2. PC と iPhone を同じネットワークに接続します。
3. `npx expo start` を実行します。
4. Expo Go でQRコードを読み取ります。

iOS Simulator が使える環境では、起動中のターミナルで `i` を押すか、次を実行します。

```bash
npm run ios
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run format:check
```

## App identity

- App name: `DartsSupportApp`
- Expo slug: `darts-support-app`
- iOS bundle identifier: `com.shijimiworks.dartssupportapp`
- Logo path: `assets/images/logo.png`

## Design references

- `docs/design/README.md`
- `docs/design/darts_training_app_screen_prompts.md`
- `docs/design/darts_training_app_mvp_ui_mockup.png`

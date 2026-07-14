# Account Contract Phase Report

DartsSupportApp側に、Darts共通Accountデータ契約 v1.0 へ向けたローカル基盤を追加した実装メモです。

## Scope

実装したもの:

- UUID v4形式の共通 `account_id`
- ローカルAccount登録、プロフィール編集、論理削除
- `activeAccountId`
- 4〜8桁PINロック
- PIN設定、変更、解除、確認
- OWNERプロフィールとの `accountId` 紐付け
- 新規練習記録への `accountId` 保存
- 既存記録の互換表示
- 共通JSON Export
- 共通JSON Importの検証とpreview
- CommonEvent / Outbox
- schemaVersion 10 migration
- 関連テスト

実装していないもの:

- DartsAppへの変更
- DartsAppとの通信
- Supabase
- クラウド同期
- Apple Login / Google Login / メール認証
- API通信
- 複数端末同期
- Rating計算方式の変更

## schemaVersion

`AppState.schemaVersion` は `10` です。

schemaVersion 1〜9 から読み込む場合、以下を補完します。

- `accounts: []`
- `activeAccountId: null`
- `accountLockEnabled: false`
- `commonOutbox: []`

既存の `profile`、`records`、写真スコア、相談履歴、フォーム写真相談、基準画像は保持します。

## account_id

`features/account/application/accountService.ts` の `createUuidV4()` で生成します。

- `globalThis.crypto.randomUUID()` が利用できる場合はそれを使用
- 利用できない環境ではUUID v4形式のfallback生成を使用
- `isUuidV4()` で形式検証

## PIN

PINは `expo-secure-store` に保存します。

- key: `darts_support_account_pin_v1:{accountId}`
- 4〜8桁の数字のみ許可
- AsyncStorage、AppState、Export JSONにはPINやPIN関連秘密情報を保存しない
- PINは端末内ロック用で、クラウド認証ではない

## Export / Import

Export:

- envelope: `contractName: darts_common_data`, `contractVersion: 1`
- `sourceApp: darts_support_app`
- Account、OWNER profile、practice_records、履歴、favorite、filter、outboxを出力
- PIN、hash、token、secret、SecureStore情報、画像URIを除外

Import:

- JSON構文、contract、version、UUID v4、payload形状を検証
- 秘密情報らしいkeyが含まれる場合はreject
- previewでaccount、記録件数、別Accountかどうかを表示
- 同一record IDかつ同一内容はskip
- 同一record IDかつ別内容はconflictとして既存データを優先
- 別record IDは追加
- ImportされたAccountはPINを復元せず `local_no_auth`

## Outbox

`CommonOutboxItem` は将来同期用のlocal-onlyイベントです。

現在のevent type:

- `account_created`
- `account_profile_updated`
- `practice_session_completed`
- `consultation_saved`
- `record_deleted`

`syncStatus` は現時点では `local_only` です。送信処理は未実装です。

## Limitations

- Account登録は任意で、起動時強制はしない
- Account未登録の既存データはそのまま利用できる
- 既存記録へ自動で `accountId` を一括付与しない
- Importは練習記録を中心としたMVP mergeで、相談履歴などの完全mergeは今後対応
- PINは端末内ロックであり、本人確認やクラウド認証ではない

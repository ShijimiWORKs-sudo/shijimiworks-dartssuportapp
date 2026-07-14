# DartsSupportApp 共通Account・ローカル認証先行実装 Codex指示書 v1.0

- 対象: DartsSupportAppのみ
- リポジトリ: `ShijimiWORKs-sudo/shijimiworks-dartssuportapp`
- ローカル: `C:\制作データ\10_App\DartsPractisAI`
- DartsApp: 変更禁止
- 前提設計書: `docs/specs/Darts_Common_Account_Data_Contract_v1.0.md`

## 1. 目的

DartsSupportAppへ、将来DartsAppと共通利用できるAccount ID・JSON契約を先行導入する。

実装対象:

1. UUID v4 account_id
2. ローカルAccount登録
3. 端末内PINロック
4. activeAccountId
5. OWNERプロフィール紐付け
6. Accountプロフィール・ロック解除
7. JSONエクスポート
8. JSONインポート検証
9. 共通JSON mapper
10. 将来同期用Outbox
11. migration
12. テスト・docs

対象外:

- DartsApp変更
- DartsApp通信
- Supabase
- Apple/Google Login
- メール・パスワードクラウド認証
- API通信
- 複数端末同期
- Rating計算変更

## 2. 最優先ルール

- DartsAppリポジトリへ触れない
- 既存練習記録、分析、相談、写真、設定、Legal、EASを壊さない
- PIN平文をAsyncStorageへ保存しない
- PINや秘密情報をエクスポートしない
- クラウド認証済みと表示しない
- 既存データを初期化しない
- migrationは前進・冪等
- `git reset --hard`、force push禁止
- 未追跡ファイルを削除しない
- 大規模リファクタリング禁止
- DartsApp連携へ進まない

## 3. 作業開始

```powershell
cd "C:\制作データ\10_App\DartsPractisAI"
git status --short
git fetch origin
git switch main
git pull --ff-only origin main
```

未commit変更があれば削除・stashせず報告して停止。

```powershell
git switch -c codex/support-account-contract-v1
npm run typecheck
npm run lint
npm run format:check
npm test
npm run validate:data
```

baseline失敗時は実装停止。

## 4. 文書配置

```text
docs/specs/Darts_Common_Account_Data_Contract_v1.0.md
docs/codex/CODEX_SUPPORT_ACCOUNT_CONTRACT_v1.0.md
```

## 5. 型

推奨:

```text
features/account/domain/types.ts
features/account/domain/commonContractTypes.ts
```

必須:

```ts
export type AccountStatus =
  | 'local_active'
  | 'cloud_pending'
  | 'cloud_active'
  | 'suspended'
  | 'deleted';

export type AuthMode =
  | 'local_pin'
  | 'local_no_auth'
  | 'email_password'
  | 'apple'
  | 'google';

export type LocalAccount = {
  schemaVersion: 1;
  accountId: string;
  userName: string;
  displayName: string;
  email: string | null;
  accountStatus: AccountStatus;
  authMode: AuthMode;
  cloudAuthSubject: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SyncStatus =
  | 'local_only'
  | 'pending'
  | 'synced'
  | 'conflict'
  | 'failed'
  | 'deleted';

export type CommonContractEnvelope<T> = {
  contractName: 'darts_common_data';
  contractVersion: 1;
  exportId: string;
  exportedAt: string;
  sourceApp: 'darts_app' | 'darts_support_app';
  sourceAppVersion: string;
  accountId: string;
  payload: T;
};
```

UUIDは`crypto.randomUUID()`または既存Expo互換helperを優先し、不要な依存追加を避ける。

## 6. AppStateとmigration

現在のschemaVersionを確認し1つ上げる。

追加:

```ts
accounts: LocalAccount[];
activeAccountId: string | null;
accountLockEnabled: boolean;
commonOutbox: CommonOutboxItem[];
```

```ts
export type CommonOutboxItem = {
  outboxId: string;
  eventType:
    | 'account_created'
    | 'account_profile_updated'
    | 'practice_session_completed'
    | 'consultation_saved'
    | 'record_deleted';
  eventVersion: 1;
  accountId: string;
  sourceRecordId: string | null;
  occurredAt: string;
  createdAt: string;
  syncStatus: SyncStatus;
  payload: Record<string, unknown>;
};
```

migration:

- 既存データ保持
- accounts: []
- activeAccountId: null
- accountLockEnabled: false
- commonOutbox: []
- 既存OWNERから自動Account作成しない
- 初回登録時に既存プロフィールと紐付け
- 壊れたデータでも初期値へ復元
- migrationテスト追加

## 7. PIN

未導入なら:

```powershell
npx expo install expo-secure-store
```

要件:

- 数字4～8桁
- AsyncStorage保存禁止
- エクスポート禁止
- SecureStoreへ保存
- PIN設定・変更・解除・確認
- 生体認証対象外

SecureStore key:

```text
darts_support_account_pin_v1:{account_id}
```

独自暗号を作らない。実装上の安全性と制限をdocsへ記録。

## 8. Account Service

推奨:

```text
features/account/application/AccountService.ts
features/account/application/AccountServicePort.ts
```

API:

```ts
registerLocalAccount(input)
updateLocalAccount(accountId, input)
getActiveAccount()
setActiveAccount(accountId)
enablePinLock(accountId, pin)
verifyPin(accountId, pin)
changePin(accountId, oldPin, newPin)
disablePinLock(accountId, pin)
lockSession()
unlockSession(accountId, pin)
deleteLocalAccount(accountId)
```

検証:

- userName 3～32文字
- 英数字、`_`、`-`
- 大文字小文字を無視した重複判定
- displayName 1～40文字
- email任意、入力時normalize
- accountId UUID v4
- local_active
- PIN有効ならlocal_pin、無効ならlocal_no_auth

削除は論理削除。記録は削除しない。PINはSecureStoreから削除。

## 9. 画面

```text
/account
/account/register
/account/profile
/account/security
/account/unlock
/account/export
/account/import
```

### Account概要

- 未登録CTA
- 登録済みプロフィール
- ローカルAccount表示
- クラウド同期未対応表示

### Register

- userName
- displayName
- email任意
- PIN有無
- PIN／確認
- 登録後activeAccountId
- OWNER紐付け
- account_created Outbox
- profileへ遷移

### Profile

- accountId
- userName
- displayName
- email
- status
- authMode
- 作成日
- ローカルAccount説明
- 編集／Security／Export／Import

### Security

- PIN有効／無効
- 設定／変更／解除
- PINは端末内ロックであり本人確認ではない旨

### Unlock

- PIN入力
- エラー
- 成功時元画面

### Export

- 秘密情報を含まない説明
- JSON生成
- 共有または保存

### Import

- JSON選択
- contract/schema/accountId検証
- プレビュー
- 上書き確認
- PINと画像URIは復元しない

## 10. 起動時ロック

- activeAccountIdなし: 従来利用可
- PIN無効: 従来利用可
- PIN有効: unlockへ
- 既存導線を壊す場合は、Account・個人データ画面のロックから開始してよい
- 判断と制限を報告

## 11. OWNER紐付け

既存プロフィールへoptional:

```ts
accountId?: string;
```

- 初回登録時に設定
- 既存全記録を一括書換えしない
- 新規記録へaccountId保存
- 既存記録は読み取り時にactiveAccountIdへ帰属させる互換helper
- 非破壊

## 12. 共通JSON mapper

推奨:

```text
features/account/application/commonContractMapper.ts
```

実装:

```ts
toCommonAccountJson(account)
toCommonProfileJson(profile, accountId)
toCommonPracticeRecordJson(record, accountId)
createCommonExportEnvelope(payload, accountId, appVersion)
validateCommonImportEnvelope(value)
```

外部JSONはsnake_case。

含めない:

- PIN
- hash
- SecureStore key
- token
- secret
- 画像URI

## 13. Export

```json
{
  "contract_name": "darts_common_data",
  "contract_version": 1,
  "export_id": "UUID",
  "exported_at": "ISO8601",
  "source_app": "darts_support_app",
  "source_app_version": "current",
  "account_id": "UUID",
  "payload": {
    "account": {},
    "profile": {},
    "practice_records": [],
    "consult_histories": [],
    "form_photo_advice_results": []
  }
}
```

画像本体・画像URI・PINは除外。

## 14. Import安全要件

- parse失敗で変更しない
- contractName不一致拒否
- unsupported version拒否
- UUID不正拒否
- 必須不足拒否
- 件数プレビュー
- 同一IDは初期版でskip
- Account上書きは確認
- PIN、画像URIは復元しない
- 部分失敗で既存データを壊さない

## 15. Outbox

送信は実装しない。

生成:

- Account登録
- Account更新
- 新規練習記録
- 相談保存
- 論理削除

現時点:

```text
syncStatus = local_only
```

## 16. 導線

Settings:

- Account
- Security
- Export
- Import

Home:

- Account未登録案内は任意
- 登録強制禁止
- 「Accountを登録すると記録所有者を明確にできます」

## 17. テスト

Account:

- UUID
- userName検証・重複
- email normalize
- 登録・更新・論理削除
- activeAccount

PIN:

- 長さ
- 一致・不一致
- 変更・解除
- AppStateに秘密情報なし
- ExportにPINなし

Migration:

- accounts等補完
- 既存記録・相談保持
- 壊れたデータ安全

Contract:

- snake_case生成
- envelope生成
- name/version/UUID不正拒否
- PIN除外
- 画像URI除外
- 重複record処理

Outbox:

- account_created
- account_profile_updated
- local_only
- 秘密情報なし

## 18. docs

```text
README.md
docs/ARCHITECTURE.md
docs/MVP_FEATURES.md
docs/ROUTES.md
docs/QA_CHECKLIST.md
docs/specs/Darts_Common_Account_Data_Contract_v1.0.md
docs/implementation/ACCOUNT_CONTRACT_PHASE_REPORT.md
```

READMEへ:

- ローカルAccount
- PINは端末内ロック
- クラウド認証ではない
- DartsApp連携は未実装
- JSON契約v1

## 19. 品質確認

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
npm run validate:data
npm run start:lan
```

## 20. Git

`git add .`と`git add -A`は禁止。対象ファイルを明示的にadd。

```powershell
git status --short
git diff --check
git diff --stat
git add <対象ファイル一覧>
git commit -m "Add local account and common data contract"
git push -u origin codex/support-account-contract-v1
```

可能ならDraft PR:

```powershell
gh pr create --draft --base main --head codex/support-account-contract-v1 --title "Add local account and common data contract" --body-file docs/implementation/ACCOUNT_CONTRACT_PHASE_REPORT.md
```

mainへマージしない。

## 21. 完了報告

- 変更ファイル
- schemaVersion
- Account型・ID形式
- PIN保存方式
- 追加画面
- OWNER紐付け
- Export/Import
- Outbox
- migration
- テスト
- Expo起動
- 既知制限
- DartsApp未変更確認
- branch
- commit hash
- Draft PR URL

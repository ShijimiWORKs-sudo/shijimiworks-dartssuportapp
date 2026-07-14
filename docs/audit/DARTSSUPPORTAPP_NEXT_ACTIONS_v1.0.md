# DartsSupportApp Next Actions v1.0

- 対象ブランチ: `codex/audit-dartssupportapp-product-boundary-v1`
- 作業種別: 棚卸し後の次Action整理
- 注意: この文書は計画であり、本棚卸し工程ではコード変更しない

## Priority Definition

- `P0`: 境界違反、データ破損、秘密情報漏えい
- `P1`: 次機能前に必要な基盤・主要Support機能
- `P2`: iPhone単体完成までに必要な拡張
- `P3`: PC Web版・DartsApp連携前に整理する拡張

## P0 Actions

| ID     | Action                       | 対象                                              | 目的                                                             | 変更範囲                | 禁止範囲                                     | QA                                    |
| ------ | ---------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- | ----------------------- | -------------------------------------------- | ------------------------------------- |
| P0-001 | PIN/Export秘密情報の回帰監視 | Account Export/Import                             | PIN、hash、token、secret、SecureStore情報、画像URIをExportしない | Export mapper/test/docs | PINをAsyncStorage/AppState/JSONへ保存しない  | 不正JSON、秘密key混入、Export内容確認 |
| P0-002 | 正式ゲーム機能の混入監視     | `PracticeGame`, `calculateDartScore`, photo score | 写真スコア補助ロジックが正式ゲームエンジン化しないよう境界を守る | 文言、docs、テスト分類  | 01残点、BUST、2P、MATCH、CLOSE、アワード追加 | route検索、keyword検索、実機導線確認  |

## P1 Actions

| ID     | Action                     | 対象                           | 目的                                                                    | 変更範囲                                  | 禁止範囲                         | QA                                 |
| ------ | -------------------------- | ------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------- | -------------------------------- | ---------------------------------- |
| P1-001 | 今日の練習を実施管理へ拡張 | `/practice`, `/home`, AppState | 推薦だけでなく、今日の予定、開始、完了、中断を扱う                      | Support用PracticeSession型、today plan UI | 正式ゲームルール、BUST、2P交代   | iPhone縦、未設定profile、記録0件   |
| P1-002 | 練習タイマーを追加         | 新規Support timer画面          | 練習時間と休憩時間を保存可能にする                                      | Timer state、start/pause/resume/finish    | PCゲーム用timer、対戦round timer | バックグラウンド制限、再起動、保存 |
| P1-003 | ラウンド/セット進行を追加  | PracticeMenu detail / session  | ブル練習10R×3投などのSupport用進行を扱う                                | currentRound/currentSet/remainingThrows   | 01/CRICKET/MATCHの正式進行       | 中断/再開、完了、記録保存          |
| P1-004 | 目標管理MVP                | `/goals` または settings配下   | 週間/月間回数、時間、Bull目標を設定する                                 | Goal型、達成率算出、home表示              | DartsApp Rating算出              | 目標なし、期限切れ、再起動         |
| P1-005 | Backup/Restore UX強化      | Account Export/Import          | 実装済みExport/Importをユーザー向けBackup/Restoreとして分かりやすくする | JSON preview、restore guard、docs         | クラウド同期、API通信            | 不正JSON、既存データ保持、秘密除外 |

## P2 Actions

| ID     | Action               | 対象                   | 目的                                    | 変更範囲                             | 禁止範囲                   | QA                         |
| ------ | -------------------- | ---------------------- | --------------------------------------- | ------------------------------------ | -------------------------- | -------------------------- |
| P2-001 | 連続練習日数         | Home/Analysis          | 習慣化指標を表示する                    | records日付から算出、必要ならstate化 | DartsApp側習慣UI           | タイムゾーン、同日複数記録 |
| P2-002 | 週別/月別分析UI      | `/analysis`            | Support主機能の週/月推移を見える化      | weekly/monthly summary cards         | PC Web専用詳細UIの過剰実装 | 記録0/1/多数、月跨ぎ       |
| P2-003 | 練習時間分析         | Timer導入後            | 総練習時間、週/月時間、目標達成率を表示 | records/session duration             | ゲームプレイ時間との混同   | durationなし旧record互換   |
| P2-004 | 写真スコア指標拡張   | Photo score / Analysis | BULL周辺集中率、平均中心距離を表示      | grouping metrics                     | リアルタイム自動判定       | 手動点/候補点/調整点       |
| P2-005 | Knowledge source管理 | knowledgeBase          | 将来RAGのため出典メモを整理             | sourceNotes, related IDs             | 外部記事の無断転載         | validate:data              |

## P3 Actions

| ID     | Action                 | 対象            | 目的                                            | 変更範囲                           | 禁止範囲                     | QA                                |
| ------ | ---------------------- | --------------- | ----------------------------------------------- | ---------------------------------- | ---------------------------- | --------------------------------- |
| P3-001 | PC Web分析domain分離   | utils/types     | iPhone版とWeb版で分析ロジックを共有しやすくする | pure TS domain packages or folders | UI共通化のしすぎ             | Node test, Web mock               |
| P3-002 | DartsApp結果Import契約 | Common JSON     | DartsAppのゲーム結果をSupport分析に取り込む     | JSON contract mapper               | DartsApp通信/API同期         | fixture import, conflict handling |
| P3-003 | AI/RAG相談準備         | consult/library | 固定ロジックからRAGへ移行可能にする             | KnowledgeArticle contract          | 医療断定、外部送信の無断追加 | privacy, opt-in                   |
| P3-004 | CSV/Advanced export    | Analysis/Backup | PC Web詳細分析や外部表計算へ展開                | CSV exporter                       | 個人情報/画像URI混入         | export content test               |

## Human Confirmation Items

- Account/PIN/Export/Importはmainへ反映済み。今後は秘密情報除外と既存record互換を回帰確認する
- iPhone Expo Goで現在の`/photo-score`、`/practice`、`/analysis`、`/consult`を確認する
- 「01」「CRICKET」の表示が正式ゲームではなく記録カテゴリとして伝わるか確認する
- App Store説明文が正式01/CRICKETゲーム実装と誤認されないか確認する
- Backup/RestoreをAccount Export/Importと同義にするか、ユーザー向け別導線にするか決める

## Recommended Immediate Sequence

1. Account Export/Importの実機QAで、PIN/secret/画像URIがJSONに含まれないことを確認する。
2. 今日の練習を「推薦」から「実施管理」へ拡張する仕様を書く。
3. Timer + Round/Set + Goalを同じPracticeSession設計としてまとめる。
4. 週別/月別分析とStreakをrecords/sessionから算出する。
5. DartsApp連携前にCommonEvent/Outboxの送信対象と除外対象を再確認する。

## Boundary Guardrails for Future Codex Tasks

以後のDartsSupportApp指示では、冒頭に以下を入れる。

```text
対象アプリ: DartsSupportApp
対象リポジトリ: ShijimiWORKs-sudo/shijimiworks-dartssuportapp
主端末: iPhone
変更可能範囲:
変更禁止範囲: DartsApp、正式ゲームエンジン、MATCH、2P交代、BUST、CLOSE、アワード、PC USBカメラ制御
正式QA環境: iPhone Expo Go / Development Build
```

## Non-actions in This Audit

- コード変更なし
- route変更なし
- AppState変更なし
- migration追加なし
- package追加なし
- assets変更なし
- DartsApp変更なし

# DartsSupportApp Feature Inventory v1.0

- 対象アプリ: DartsSupportApp
- 対象リポジトリ: `ShijimiWORKs-sudo/shijimiworks-dartssuportapp`
- 対象ブランチ: `codex/audit-dartssupportapp-product-boundary-v1`
- 基準日: 2026-07-14
- 作業種別: 調査・棚卸し・文書作成のみ

## Summary

| 指標            | 件数 |
| --------------- | ---: |
| 調査ファイル数  |  110 |
| Route数         |   29 |
| AppState項目数  |   10 |
| KEEP            |   40 |
| MOVE_LATER      |    8 |
| HIDE            |    0 |
| REMOVE          |    0 |
| SHARED_CONTRACT |   15 |
| REVIEW          |    8 |

## Classification Rule

- `KEEP`: DartsSupportAppの練習管理・記録・分析・相談用途として維持する
- `MOVE_LATER`: Support側に必要だが、現状は未実装または次工程以降で実装する
- `HIDE`: 現時点で主要導線から外す候補。ただし今回は該当なし
- `REMOVE`: 明確に不要。ただし今回は該当なし
- `SHARED_CONTRACT`: DartsAppとデータ契約として共通化する対象
- `REVIEW`: 仕様・実装差分、人間確認、境界維持が必要な対象

## Feature Inventory

| ID    | 機能/画面/データ                              | パス                                                       | 現在状態                                   | 分類            | 根拠                                            | 依存                            | 次工程                                 |
| ----- | --------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ | --------------- | ----------------------------------------------- | ------------------------------- | -------------------------------------- |
| F-001 | 初期設定                                      | `app/index.tsx`                                            | レーティング、機種、悩みを保存             | KEEP            | iPhoneで練習管理を始める入口                    | `AppState.profile`              | 入力UXと復元確認                       |
| F-002 | プロフィール再編集                            | `app/settings.tsx`                                         | rating、machine、悩み、テーマを編集        | KEEP            | Support用途の個人設定                           | `saveProfileAndDisplaySettings` | Account導入後はOWNER連携確認           |
| F-003 | 表示テーマ/背景色                             | `constants/theme.ts`, `app/settings.tsx`                   | 白/グレー、背景色選択                      | KEEP            | iPhone実機の視認性調整                          | `UiTheme`, `BackgroundTheme`    | 黒背景QA継続                           |
| F-004 | 下部ナビ                                      | `components/BottomNav.tsx`                                 | Home/Practice/Records/Analysis/Consult     | KEEP            | iPhone縦画面の主要導線                          | `expo-router`                   | Account/Backup導線はSettings配下で検討 |
| F-005 | ホーム                                        | `app/home.tsx`                                             | 推薦、最新記録、分析サマリー、主要メニュー | KEEP            | 練習前後の確認ハブ                              | profile, records                | 今日の予定/実施済み導線を追加          |
| F-006 | 今日のおすすめ練習                            | `app/practice.tsx`, `utils/recommendPracticeMenus.ts`      | 3件+補助3件を固定ロジック推薦              | KEEP            | DartsSupportAppの主責務                         | profile, records, menus         | 実施済み管理とタイマー接続             |
| F-007 | 練習メニューDB                                | `constants/practiceMenus.ts`                               | レベル/悩み/機種/ゲーム種別付きメニュー    | KEEP            | 計画・簡易記録用。正式ゲームではない            | `PracticeMenu`                  | goal/timer/round metadata追加          |
| F-008 | 練習メニューフィルタ保存                      | `app/practice.tsx`, `PracticeFilterState`                  | level/machine/game/problemを保存           | KEEP            | iPhoneで再利用しやすい                          | AsyncStorage                    | 条件リセットQA                         |
| F-009 | お気に入り練習                                | `app/favorites.tsx`                                        | favoritePracticeMenuIdsで保存              | KEEP            | よく使う練習の入口                              | menus, AppState                 | 今日の練習へ統合強化                   |
| F-010 | 練習詳細                                      | `app/practice/[id].tsx`                                    | 手順、評価、関連資料、履歴                 | KEEP            | 練習メニュー説明に必要                          | practiceMenus, knowledgeBase    | Timer/round開始ボタン追加              |
| F-011 | メニュー別記録履歴                            | `app/practice/[id]/records.tsx`                            | menuId別の記録一覧                         | KEEP            | 練習単位で振り返れる                            | records                         | 平均・改善推移を拡張                   |
| F-012 | 手入力記録                                    | `app/record.tsx`, `components/PracticeRecordForm.tsx`      | score/bull/cricket/memo/condition保存      | KEEP            | 簡易記録の中核                                  | `PracticeRecordInput`           | duration/round/set/achievement追加     |
| F-013 | 記録時メニュー選択                            | `PracticeRecordForm.tsx`                                   | 検索とフィルタでメニュー選択               | KEEP            | 記録の分類精度向上                              | practiceMenus                   | UI簡略化QA                             |
| F-014 | 練習記録一覧/詳細/編集/削除                   | `app/records*.tsx`                                         | CRUD実装済み                               | KEEP            | 練習履歴管理の主機能                            | AppState.records                | accountId導入後の互換確認              |
| F-015 | 写真スコア開始                                | `app/photo-score/index.tsx`                                | 写真選択/撮影、ボード種別選択              | KEEP            | Support用の写真ベース簡易記録                   | `expo-image-picker`             | 写真永続化方針確認                     |
| F-016 | 写真スコアキャリブレーション                  | `app/photo-score/calibrate.tsx`                            | 中心/20方向/外周を手動指定                 | KEEP            | リアルタイム判定ではなく手動補助                | `BoardCalibration`              | 誤タップ復帰QA                         |
| F-017 | 基準ボード画像                                | `app/photo-score/reference/*`                              | 空ボード基準画像と品質比較                 | KEEP            | Support用写真補正の範囲                         | `BoardReferenceImage`           | 画像URI保存方針再確認                  |
| F-018 | 写真スコア位置選択                            | `app/photo-score/mark.tsx`                                 | 手動追加、自動候補β、ドラッグ/十字微調整   | KEEP            | ユーザー確定型でSupport用途に収まる             | PhotoBoardCanvas, score utils   | beta表記維持                           |
| F-019 | 写真スコア結果保存                            | `app/photo-score/result.tsx`                               | 3本スコア、Bull/Triple/Double、記録保存    | KEEP            | 簡易記録として保存                              | `PracticeRecord.photoScore`     | game engine化しない                    |
| F-020 | グルーピング分析                              | `utils/analyzePhotoScoreGrouping.ts`                       | 3点のまとまり・偏り・助言                  | KEEP            | Support分析の中核                               | `DartHitResult`                 | 目標/練習推薦と連携                    |
| F-021 | 分析ダッシュボード                            | `app/analysis.tsx`                                         | 7/30/90/all、平均、グラフ、改善コメント    | KEEP            | 練習後の振り返り                                | `analyzePracticeRecords`        | 月別/週別UI拡張                        |
| F-022 | ゲーム種別集計                                | `calculateGameTypeSummary`                                 | COUNT-UP/01/CRICKET/OTHER件数・平均        | KEEP            | 記録カテゴリ集計。ゲーム進行ではない            | `PracticeGame`                  | DartsApp結果Import時も流用             |
| F-023 | 週別集計domain                                | `calculateWeeklySummary`                                   | utilは存在、画面露出は限定的               | KEEP            | PC Web分析へ流用可能                            | records                         | UIはMOVE_LATER                         |
| F-024 | フォーム相談                                  | `app/consult.tsx`, `utils/generateConsultAdvice.ts`        | 固定ロジック助言                           | KEEP            | Support相談機能                                 | consultAdvice, knowledgeBase    | AI/RAG前の安全文維持                   |
| F-025 | 相談履歴                                      | `app/consult/history*`                                     | 一覧/詳細/削除                             | KEEP            | 相談の振り返り                                  | `ConsultHistory`                | Export/Import対象確認                  |
| F-026 | フォーム写真3枚相談                           | `app/consult/form-photo/index.tsx`                         | 写真+自己チェック+写真スコア連携           | KEEP            | Support専用。骨格AIではない                     | `FormPhotoAdviceResult`         | 写真保存範囲の明文化                   |
| F-027 | フォーム写真相談履歴                          | `app/consult/form-photo/history*`                          | 一覧/詳細/削除                             | KEEP            | 継続相談の履歴                                  | `formPhotoAdviceResults`        | Export対象確認                         |
| F-028 | 資料ライブラリ                                | `app/library*.tsx`, `constants/knowledgeBase.ts`           | 検索/カテゴリ/タグ/詳細                    | KEEP            | Support知識機能                                 | knowledgeBase                   | AI/RAGの参照元候補                     |
| F-029 | Legalページ                                   | `app/legal/*`                                              | Privacy/Terms/Credits                      | KEEP            | TestFlight準備に必要                            | settings                        | URL公開時更新                          |
| F-030 | EAS/TestFlight docs                           | `docs/EAS_BUILD_GUIDE.md`, `docs/TESTFLIGHT_PREP.md`       | 配布準備文書                               | KEEP            | iPhoneアプリ配布準備                            | eas.json                        | Apple加入後に更新                      |
| F-031 | 品質チェック                                  | `tests/*`, `utils/validateDataIntegrity.ts`                | 80件規模のロジックテストと整合性           | KEEP            | 追加機能の破損防止                              | Node test                       | Account実装後に増強                    |
| F-032 | 画像/ロゴassets                               | `assets/images/*`                                          | オリジナルロゴ/アイコン/スプラッシュ       | KEEP            | 公式素材不使用                                  | app.json                        | App Store用最終確認                    |
| F-033 | ScreenShell/Card/Button                       | `components/*`                                             | iPhone向け共通UI                           | KEEP            | UI一貫性                                        | theme                           | accessibility継続                      |
| F-034 | Practice recommendation domain                | `utils/recommendPracticeMenus.ts`                          | profile/recordsから推薦                    | KEEP            | Supportの計画機能                               | practiceMenus                   | goal/streakを加点条件へ                |
| F-035 | Consult/Knowledge DB                          | `constants/consultAdvice.ts`, `constants/knowledgeBase.ts` | 固定DB                                     | KEEP            | AIなしMVPの助言品質                             | validateDataIntegrity           | 出典管理強化                           |
| F-036 | Form photo advice domain                      | `utils/generateFormPhotoAdvice.ts`                         | 自己チェック+写真スコアで助言              | KEEP            | Support専用                                     | records, formPhoto              | 医療断定禁止QA                         |
| F-037 | Photo detection quality domain                | `utils/evaluatePhotoDetectionQuality.ts`                   | 基準画像との差分品質評価                   | KEEP            | 撮影ズレ補助                                    | board calibration               | リアルタイム化しない                   |
| F-038 | SimpleBarChart                                | `components/SimpleBarChart.tsx`                            | Viewベース簡易グラフ                       | KEEP            | Expo Go軽量構成                                 | analysis                        | PC Webでは別UI検討                     |
| F-039 | App identity/config                           | `app.json`, `eas.json`                                     | iOS bundle等設定済み                       | KEEP            | iPhone版として必要                              | Expo SDK 54                     | projectId/Apple情報は人間管理          |
| F-040 | Camera/photo picker permission                | `app.json`, `expo-image-picker`                            | 写真スコア/フォーム写真用途                | KEEP            | Support用途の写真入力                           | iOS permission                  | PC USBカメラとは分離                   |
| F-041 | 練習タイマー                                  | 該当routeなし                                              | 未実装                                     | MOVE_LATER      | Support責務だが現状なし                         | PracticeMenu, records           | P1で追加                               |
| F-042 | 休憩タイマー                                  | 該当routeなし                                              | 未実装                                     | MOVE_LATER      | Support責務だが現状なし                         | Timer session                   | P2で追加                               |
| F-043 | ラウンド/セット進行                           | 部分的にメニューstepsのみ                                  | 進行UIなし                                 | MOVE_LATER      | 正式ゲームではなく練習進行として必要            | PracticeMenu                    | P1で追加                               |
| F-044 | 目標管理                                      | 該当routeなし                                              | 未実装                                     | MOVE_LATER      | 週間/月間/Bull/時間目標が未実装                 | records                         | P1で追加                               |
| F-045 | 連続練習日数                                  | 該当stateなし                                              | 未実装                                     | MOVE_LATER      | 習慣化指標が未実装                              | records dates                   | P2で追加                               |
| F-046 | 月別分析UI                                    | `analysis`は期間フィルタ中心                               | 明示的な月別集計画面なし                   | MOVE_LATER      | Support責務として不足                           | `calculateWeeklySummary`        | P2で追加                               |
| F-047 | Backup/Restore UI                             | Account契約docsのみ                                        | 実装なし                                   | MOVE_LATER      | Export/Importとは別のユーザー向け復元導線が必要 | AsyncStorage                    | P1で設計                               |
| F-048 | PC Web詳細分析domain                          | 一部utilあり                                               | UI未実装                                   | MOVE_LATER      | 将来Web版に流用                                 | analysis utils                  | P3で分離                               |
| F-049 | UserProfile                                   | `types/index.ts`                                           | rating/level/machine/problems              | SHARED_CONTRACT | Account/OWNER profileへ接続対象                 | profile                         | account_id追加後に共通化               |
| F-050 | PracticeRecord                                | `types/index.ts`                                           | 簡易記録とphotoScore                       | SHARED_CONTRACT | DartsApp結果分析にも利用                        | records                         | accountId/game_session_id検討          |
| F-051 | PracticeMenu id                               | `constants/practiceMenus.ts`                               | app内固定ID                                | SHARED_CONTRACT | DartsApp結果との関連候補                        | menus                           | ID命名規約固定                         |
| F-052 | PracticeGame                                  | `types/index.ts`                                           | COUNT-UP/01/CRICKET/OTHER                  | SHARED_CONTRACT | game_type契約候補                               | records                         | 正式エンジンと区別                     |
| F-053 | BoardCalibration/NormalizedPoint              | `types/index.ts`                                           | 正規化座標契約                             | SHARED_CONTRACT | 写真スコア/将来分析で共通化                     | photo score                     | 座標系仕様化                           |
| F-054 | DartHitResult                                 | `types/index.ts`                                           | 3本ヒット結果                              | SHARED_CONTRACT | 投擲座標/判定元の共通化候補                     | score utils                     | DartsApp realtime結果と整合            |
| F-055 | PhotoScoreEntry                               | `types/index.ts`                                           | 写真スコア保存単位                         | SHARED_CONTRACT | Support写真分析のExport対象                     | records                         | 画像URI除外方針確認                    |
| F-056 | PhotoScoreGroupingAnalysis                    | `types/index.ts`                                           | まとまり・偏り・助言                       | SHARED_CONTRACT | PC Web分析へ流用可能                            | photo score                     | 指標定義固定                           |
| F-057 | AnalysisSummary/GameTypeSummary/WeeklySummary | `types/index.ts`                                           | 集計型                                     | SHARED_CONTRACT | Web分析へ流用可能                               | records                         | month summary追加                      |
| F-058 | ConsultHistory                                | `types/index.ts`                                           | 相談履歴型                                 | SHARED_CONTRACT | Backup/Export対象                               | consult                         | common JSON対象確認                    |
| F-059 | FormPhotoAdviceResult                         | `types/index.ts`                                           | フォーム写真相談結果                       | SHARED_CONTRACT | Backup/Export対象                               | form photo                      | 写真URI除外方針確認                    |
| F-060 | KnowledgeArticle                              | `types/index.ts`                                           | ナレッジ記事型                             | SHARED_CONTRACT | AI/RAG参照契約候補                              | library                         | related IDs固定                        |
| F-061 | BoardReferenceImage                           | `types/index.ts`                                           | 基準画像+calibration                       | SHARED_CONTRACT | 写真スコア補正契約候補                          | photo score                     | 画像実体の扱い確認                     |
| F-062 | schemaVersion/migration                       | `utils/appStateMigration.ts`                               | schemaVersion 9                            | SHARED_CONTRACT | 互換保存の境界                                  | AsyncStorage                    | Account後にversion更新                 |
| F-063 | Account contract docs                         | `docs/specs/Darts_Common_Account_Data_Contract_v1.0.md`    | 仕様書あり                                 | SHARED_CONTRACT | DartsApp共通ID契約                              | 未実装                          | 実装ブランチ反映待ち                   |
| F-064 | Export/Import contract docs                   | `docs/codex/CODEX_SUPPORT_ACCOUNT_CONTRACT_v1.0.md`        | 指示書あり                                 | SHARED_CONTRACT | Backup/Restore/共通JSON対象                     | 未実装                          | 実装ブランチ反映待ち                   |
| F-065 | CommonEvent/Outbox docs                       | `docs/codex/CODEX_SUPPORT_ACCOUNT_CONTRACT_v1.0.md`        | 指示書あり                                 | SHARED_CONTRACT | 将来同期契約                                    | 未実装                          | 実装ブランチ反映待ち                   |
| F-066 | Account画面群                                 | `app/account`                                              | このブランチには存在しない                 | REVIEW          | 仕様書はあるが実装未反映                        | Account contract                | Account PR merge状況確認               |
| F-067 | PIN/SecureStore                               | package/app                                                | このブランチには`expo-secure-store`なし    | REVIEW          | PIN仕様あり、実装未反映                         | Account contract                | Account PR反映後に再棚卸し             |
| F-068 | activeAccountId/accountId                     | `types/index.ts`                                           | AppState/record/profileに未存在            | REVIEW          | 共通契約に必須だが未反映                        | migration                       | Account PR反映後確認                   |
| F-069 | JSON Export/Import UI                         | routeなし                                                  | 未実装                                     | REVIEW          | Backup/Restore責務として必要                    | Account contract                | Account PR反映後確認                   |
| F-070 | 01/CRICKET記録種別                            | `PracticeGame`, menus                                      | 練習/記録カテゴリとして存在                | REVIEW          | 正式ゲーム化しない境界監視が必要                | records                         | 文言とUIを継続監視                     |
| F-071 | App Store文言                                 | `docs/APP_STORE_METADATA_DRAFT.md`                         | COUNT-UP/01/CRICKET記録と記載              | REVIEW          | 公式ゲーム実装と誤認されない表現確認            | docs                            | 公開前に文言調整                       |
| F-072 | Expo起動/実機QA                               | npm scripts                                                | 今回環境では未確認                         | REVIEW          | Codex環境制限のため                             | human QA                        | 人間側でExpo Go確認                    |
| F-073 | Account docs vs current docs                  | `docs/ARCHITECTURE.md`, `QA_CHECKLIST.md`                  | schemaVersion 9記述                        | REVIEW          | Account実装前の記述と仕様書の差分               | docs                            | Account PR後に更新                     |

## Direct Boundary Findings

- 正式な01ゲームエンジン: 見当たらない。`01`は練習メニュー/記録種別/資料カテゴリとして使用。
- STANDARD CRICKET対戦: 見当たらない。`CRICKET`は練習メニュー/記録種別として使用。
- MATCH・2P対戦: route、state、進行ロジックとも見当たらない。
- BUST・プレイヤー交代処理: 見当たらない。
- アワード動画: 見当たらない。
- PC用USBカメラ制御: 見当たらない。写真選択/撮影は`expo-image-picker`のiPhone用途。
- 写真スコア: 写真上の候補・手動補正・3本結果保存であり、Support用途の範囲に収まる。

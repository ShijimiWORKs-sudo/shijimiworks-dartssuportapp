# Today Practice MVP Report

## Summary

DartsSupportApp に、Support用途の「今日の練習・実施管理」MVPを追加しました。

この機能は練習メニューを今日の実施リストへ追加し、順番、タイマー、一時停止/再開、完了入力、通常の練習記録化までを扱います。正式なゲームエンジンや対戦処理は含みません。

## Added Routes

- `/practice/today`
- `/practice/today/select`
- `/practice/session/[id]`
- `/practice/session/[id]/complete`

## Added Domain

- `TodayPracticeItem`
- `ActivePracticeSession`
- `TodayPracticeStatus`
- `features/practice/today/application/todayPracticeService.ts`

## AppState

schemaVersion: 11

追加フィールド:

- `todayPracticeItems: TodayPracticeItem[]`
- `activePracticeSessions: ActivePracticeSession[]`
- `todayPracticeDefaultDurationMinutes: number`

既存 `PracticeRecord` の追加optionalフィールド:

- `durationSeconds`
- `completedRounds`
- `completedSets`
- `achievementRate`
- `nextMemo`
- `todayPracticeItemId`

## Migration

schemaVersion 1〜10 の既存データには以下を補完します。

- `todayPracticeItems: []`
- `activePracticeSessions: []`
- `todayPracticeDefaultDurationMinutes: 20`

既存のプロフィール、練習記録、写真スコア、相談履歴、Account、Outboxは維持します。

## Outbox

Account登録済みの場合のみ、将来同期用のlocal-onlyイベントを追加します。

- `today_practice_planned`
- `practice_session_started`
- `practice_session_paused`
- `practice_session_resumed`
- `practice_session_cancelled`
- 完了時は既存の `practice_session_completed`

Account未登録の場合は既存OWNER互換としてOutboxを作らず、アプリ機能は利用可能です。

## Boundary

今回含めないもの:

- 正式01ゲームエンジン
- STANDARD CRICKET対戦
- MATCH / 2P対戦
- BUST
- プレイヤー交代処理
- アワード動画
- PCカメラ制御
- DartsApp通信

## QA Focus

- 今日の練習を空状態で開ける
- メニューを検索して追加できる
- 実施順を変更できる
- タイマーを開始/一時停止/再開できる
- 1件だけ実施中になる
- 完了入力から練習記録が作成される
- 分析と記録一覧へ反映される
- schemaVersion 10以前からmigrationしても既存データが残る

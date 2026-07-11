# Changelog

本パッケージの変更履歴。[Semantic Versioning](https://semver.org/lang/ja/) に従う。

## [0.4.0] - 2026-07-11

非依存性監査（Issue #3）で特定した「出力文言の日本語固定」を解消。

### Added

- `FlowDefinition.lang: "ja" | "en"`（既定は `"ja"`） — 出力 HTML の定型文言（凡例・見出し・Gherkin 行ラベル・ホットスポットの title・フッター）を切り替える。書き手が書いたコンテンツには影響しない
- 定型文言を `src/i18n.ts` のロケール表に集約。ja / en のキー構造一致をテストで保証

### Notes

- 検証エラーと CLI のメッセージは書き手向けのため日本語のまま（必要になれば別途対応）

## [0.3.0] - 2026-07-11

3つ目のドメイン（CLI ツール dev-framework）への適用評価を反映。GUI を持たないツールの業務フローを表現できるようにした。

### Added

- `Screen.layout: "terminal"` — 端末枠（560px・ダークテーマ）。CLI の対話フローを GUI フォームに見せず表現する
- `console` 部品 — 等幅のコンソールブロック。行頭 `$ ` はコマンド、`? ` は対話プロンプトとして強調。全レイアウトで使用可（コード片の表示にも使える）
- 凡例に端末枠・`$`/`?` 記法の説明を追加

### 適用で記録した未対応ギャップ（Issue 管理）

- ループするフロー（スプリントサイクル等）の戻り遷移表現
- 条件分岐の表現（現状は「1フロー = 1シナリオ経路」の原則で回避）

## [0.2.0] - 2026-07-10

他プロジェクト（デスクトップWeb + 自動化パイプライン）への適用評価を反映した汎用化リリース。

### Added

- `Screen.layout: "desktop"` — 560px のブラウザ枠（アドレスバー付き）。従来のスマホ枠(320px)と併用可
- `FlowStep.process` / `FlowStep.actor` — 画面を持たない処理ステップ（バッチ・自動化）と手順単位の主体
- `nav` 項目の `{label, goto}` 形式 — ナビゲーション経由の画面遷移をホットスポット化
- `button` / `link` の `external` — 外部サービスへの遷移（↗）
- JSON Schema 同梱（`schema/flow-wireframe.schema.json`）— `$schema` によるエディタ補完・機械検証
- README にフレームワーク運用プロセス（ストーリー選定 → 画面定義 → フロー定義 → 検証・生成）を明文化

### Changed

- リポジトリを budget-management-tool のモノレポから独立（https://github.com/yyamamoto95/flow-wireframe）

## [0.1.0] - 2026-07-10

初版。

- JSON のフロー定義から自己完結型の静的 HTML（1ファイル・JSなし）を生成
- 画面カタログ・フローストリップ（ミニチュア＋操作矢印）・Gherkin 表・注釈
- `goto` によるアンカーリンク遷移と CSS `:target` ハイライト
- CLI（`init` / `check` / `build`）と日本語の検証エラーメッセージ
- 決定的レンダリング（同じ定義 → 同じ HTML）

# flow-wireframe

**業務フロー定義（JSON 1ファイル）から、非エンジニアにも読める静的 HTML ワイヤーフレーム（1ファイル）を生成する**ライブラリ / CLI。

**ふるまい（BDD）・画面（UI）・ことば（ユビキタス言語）・データ（テーブル）を1本の ID で貫いた Living Documentation** を目指している。企画・営業・PO・エンジニアが同じ1枚で「この操作をすると、画面とデータがどう変わるか」まで話せる。

> **English**: flow-wireframe turns a single JSON definition of your user flows into a single
> self-contained static HTML wireframe — no JavaScript, no external resources, deterministic
> output. Designed for BDD teams: each flow carries a traceability ID and a Gherkin
> (Given/When/Then) table so stakeholders, designers, and engineers review the same artifact.
> Documentation is currently in Japanese; the JSON schema (`schema/flow-wireframe.schema.json`)
> is self-describing.

ふるまい駆動開発（BDD）の「ユーザーストーリー → 画面 → 操作 → 結果」のつながりを、企画・デザイン・開発・ビジネスの全員が同じ資料で確認できるようにする。

## 特徴

- **静的 HTML 1ファイル**: JavaScript・外部フォント・外部画像に一切依存しない。`file://` で直接開ける・メール添付できる・S3 や社内 Wiki に置くだけで共有できる
- **非エンジニアでもわかる**: 画面の縮小図と矢印で「誰が・どの画面で・何をすると・どうなるか」を表現。冒頭に「この資料の読み方」を自動挿入
- **直感的**: ボタン・リンクの `goto` はクリック可能なホットスポットになり、アンカーリンクだけで画面遷移を体験できる（遷移先は CSS `:target` でハイライト）
- **再現性**: タイムスタンプ等を埋め込まない決定的レンダリング。同じ定義からは常にバイト単位で同じ HTML が生成され、git 管理・差分レビューに向く
- **BDD トレーサビリティ**: フロー ID（例 `US-301`）とGherkin（前提・操作・結果）をワイヤーフレームに併記し、ユーザーストーリー・E2E テストと対応づけられる

## 使い方

```bash
# ひな形を作る
npx flow-wireframe init flow.json

# 定義を検証する（参照切れなどを日本語で報告）
npx flow-wireframe check flow.json

# HTML を生成する
npx flow-wireframe build flow.json -o wireframe.html
```

ライブラリとしても使える:

```ts
import { renderHtml, validate } from "flow-wireframe";

const html = renderHtml(definition); // 不正な定義は日本語のエラーで throw
```

## どんな開発にも使える（非依存性の設計）

「見える化ツール自体が特定の技術圏に閉じない」ことを設計目標にしている。

| 軸 | 依存するか | 理由 |
|----|-----------|------|
| プロダクトの実装言語 | **しない** | 定義は JSON・出力は HTML。対象が Python / Ruby / Go / Java でも書く内容は変わらない |
| ドキュメントの言語 | 日本語（既定）/ 英語 | `"lang": "en"` で凡例・見出し・Gherkin 行ラベル等の定型文言が英語になる（書き手のコンテンツはそのまま） |
| 対象プロジェクトへの導入 | **しない** | `npx flow-wireframe build flow.json` を実行するだけ。対象プロジェクトに package.json・依存・設定ファイルは一切追加されない（Node は「生成時に使う道具」で、鉛筆と同じ扱い） |
| 閲覧環境 | **しない** | 出力は JSなし・外部参照なしの単一 HTML。`file://` 直開き・社内 Wiki・メール添付・印刷で機能する |
| UI ライブラリ / アーキテクチャ | **しない** | 描くのは「ふるまい」（どの画面で・何をすると・どうなるか）であり実装ではない。React でも Rails でも DDD でもレガシーでも同じ |
| プラットフォーム | Web / モバイル / CLI | `layout: mobile / desktop / terminal`。UI を持たない処理は `process` ステップで表現 |
| デザインツール | 競合しない | 忠実なビジュアルデザインは Figma 等に譲る（下記「設計方針」参照） |
| AI エージェント | **しない**（どのエージェントでも） | 定義は JSON Schema で機械検証でき、出力は決定的。エージェントが定義を書き `check` で自己検証するループが、Claude / Cursor / Copilot / Codex のいずれでも成立する |

### 非 Node プロジェクトでの使い方

対象プロジェクトが何の言語でも、Node 18+ さえ入っていれば導入作業ゼロで使える。

```bash
cd your-python-project/
npx flow-wireframe init docs/flow.json     # 雛形を作る
npx flow-wireframe build docs/flow.json    # docs/flow.html が生成される
```

### AI エージェントに定義を書かせるレシピ

1. ユーザーストーリー（Gherkin 等）と `$schema` の URL をエージェントに渡す
2. 「screens と flows を書き、`npx flow-wireframe check` が通るまで修正せよ」と指示する
3. 検証エラーは全件・日本語で返るため、エージェントは自律的に修正できる

## フレームワークとしての使い方（再現可能な運用プロセス）

どのプロジェクトでも同じ手順で業務フローを見える化できるよう、運用を4ステップに固定する。

```
1. ストーリー選定   BDD のユーザーストーリー（US-nnn 等）から見える化する単位を選ぶ
2. 画面の定義       screens に画面と UI 部品を書く（mobile / desktop を選択）
3. フローの定義     flows に「画面ステップ」と「画面を持たない処理ステップ(process)」を並べる
4. 検証と生成       check で整合性を検証 → build で HTML 生成 → 関係者レビュー
```

- **定義（JSON）を git 管理し、生成物（HTML）はいつでも再生成できる**。出力は決定的なので、定義の diff がそのまま仕様変更のレビューになる
- 定義ファイル先頭に `$schema` を書くと、VS Code 等のエディタで**入力補完と機械検証**が効く（スキーマは本パッケージの `schema/flow-wireframe.schema.json` に同梱）

```jsonc
{ "$schema": "https://unpkg.com/flow-wireframe/schema/flow-wireframe.schema.json", ... }
```

- フロー ID は「トレーサビリティの鍵」: ユーザーストーリー → ワイヤーフレーム → Issue / PR → E2E スペックを同じ ID で貫く

### 適用実績

| プロジェクト | 特徴 | 使った機能 |
|--------------|------|-----------|
| 家計簿アプリ | モバイル UI・BDD ストーリー駆動 | スマホ枠、Gherkin 表、注釈、nav 遷移 |
| Tech Blog Aggregator | デスクトップ UI・自動化パイプライン | ブラウザ枠(`layout: desktop`)、処理ステップ(`process`)、外部リンク(`external`) |
| create-dev-framework | CLI ツール・スプリント運用 | 端末枠(`layout: terminal`)、コンソール部品(`console`) |

## デザインフレームワーク（テーマとトークン）

出力の見た目は3層のデザインシステムとして管理され、すべて**定義ファイルに書く**ため再現性がある（同じ定義→同じ見た目）。

```jsonc
{
  "theme": "plain",                  // ① プリセット: plain=無地(既定) / blueprint=製図(方眼) / mono=白黒印刷向け
  "accent": "#0d9488",               // ② 簡易上書き（tokens.accent の別名。when 色も連動）
  "tokens": { "paper": "#fffdf5" }   // ② トークン単位の上書き（全18トークン）
}
```

| 層 | 役割 |
|----|------|
| ① テーマプリセット | 資料全体の世界観。`plain`（無地のニュートラル・既定。claude.ai/design で設計）/ `blueprint`（方眼紙＋製図インク）/ `mono`（白黒複合機・グレースケール印刷に最適） |
| ② トークン上書き | プロジェクトのブランド色への調整。基調 11 トークン（paper / ink / line …） |
| ③ **意味トークン** | `given / when / then`（ふるまい）と `create / read / update / delete`（データ）。**どのテーマでも「同じ意味は同じトークン」を通る**ため、ふるまい表とデータチップの読み方が資料間・テーマ間で変わらない |

- 意味は色だけに頼らない: ラベル文字（前提/操作/結果、作成/参照/更新/削除）が常に併記されるため、`mono` テーマや白黒印刷でも意味が失われない
- 全テーマが同じトークンキーを持つことはテストで保証される（テーマ追加時の定義漏れを CI が検知）
- 存在しないテーマ名・トークンキーは生成前に日本語エラーで報告される

## ことば・データの層（ユビキタス言語と CRUD）

`glossary`（用語集）・`entities`（ビジネス用語⇔テーブルの写像）・ステップの `data`（データ変化）を書くと、
フロー中に色分けチップ（作成・参照・更新・削除）が付き、巻末に **CRUD マトリクス**・**データカタログ**・**用語集**が自動生成される。

```jsonc
{
  "entities": [
    { "id": "record", "name": "記録", "table": "budget_list",
      "columns": [{ "name": "amount", "label": "金額" }] }
  ],
  "glossary": [
    { "term": "生活余力", "definition": "総資産が実効支出の何ヶ月分あるか", "entity": "settings" }
  ],
  "flows": [{ "steps": [{
    "screen": "quick-record", "action": "登録する",
    "data": [{ "entity": "record", "change": "create", "note": "明細が1行増える" }]
  }] }]
}
```

**スキーマの SSOT は実装側（Prisma 等）に置く。** ここに書くのはビジネス用語との写像であり、
実スキーマとの自動突合（乖離の CI 検知）は今後 `check --schema` として提供予定。

## 定義ファイルの構造

```jsonc
{
  "title": "ドキュメント名",
  "lang": "ja",           // 定型文言の言語: "ja"(既定) / "en"

  "screens": [            // 画面カタログ
    {
      "id": "home",       // フローや goto から参照する ID
      "name": "ホーム画面",
      "note": "画面の目的",
      "layout": "mobile", // mobile(スマホ枠) / desktop(ブラウザ枠) / terminal(端末枠・CLI用)
      "elements": [       // 上から順に描画される UI 部品
        { "type": "header", "label": "ホーム" },
        { "type": "card", "label": "今日使える残り予算", "value": "¥1,280" },
        { "type": "button", "label": "＋ 記録する", "goto": "record" }
      ]
    }
  ],
  "flows": [              // 業務フロー（ユーザーストーリー単位）
    {
      "id": "US-301",     // BDD ストーリーとのトレーサビリティ ID
      "name": "支出を素早く記録する",
      "actor": "利用者",
      "scenario": {       // Gherkin（前提・操作・結果）
        "given": ["ユーザーがアプリを開いている"],
        "when": ["クイック入力でカテゴリを選んで金額を入力する"],
        "then": ["記録が完了しフィードバックが得られる"]
      },
      "steps": [          // 画面の並びと操作（矢印になる）
        { "screen": "home", "action": "「＋ 記録する」をタップ" },
        { "screen": "record", "result": "登録完了" }
      ]
    },
    {
      "id": "BATCH-001",  // 画面を持たない自動処理も同じ語彙で書ける
      "name": "毎朝のダイジェスト生成",
      "actor": "システム",
      "steps": [
        { "process": "RSS収集", "action": "スコアリングして選抜" },
        { "process": "要約と配信", "action": "翌朝ユーザーが確認" },
        { "screen": "home", "result": "画面に反映される" }
      ]
    }
  ]
}
```

### UI 部品（elements）の種類

| type | 用途 | 主な属性 |
|------|------|---------|
| `header` | 画面見出し | `label` |
| `text` | 説明文 | `label`, `muted` |
| `input` | 入力欄 | `label`, `placeholder`, `secret` |
| `button` | ボタン | `label`, `goto`, `variant`(`primary`/`secondary`/`danger`), `external`(↗) |
| `link` | テキストリンク | `label`, `goto`, `external`(↗) |
| `list` | 明細・箇条書き | `label`, `items` |
| `card` | 数値カード | `label`, `value`, `caption` |
| `chart` | グラフのプレースホルダ | `label`, `kind`(`bar`/`line`/`donut`) |
| `image` | 画像のプレースホルダ | `label` |
| `badge` | 状態ラベル | `label`, `tone`(`good`/`caution`/`neutral`) |
| `choice` | タブ・セグメント選択 | `label`, `items`, `selected` |
| `nav` | ナビゲーション | `items`(文字列 or `{label, goto}`), `selected` |
| `console` | コマンド・コンソール出力（等幅） | `label`, `lines`（`$ `=コマンド、`? `=プロンプト） |
| `divider` | 区切り線 | — |

すべての部品は `note`（①②…の注釈）を持てる。注釈は画面下の一覧に対応番号つきで表示される。

## サンプル

家計簿アプリの BDD ユーザーストーリーを題材にしたサンプルが `examples/` にある。

```bash
pnpm example   # examples/kakeibo.flow.json → examples/kakeibo.wireframe.html
```

## リリース（npm への公開）

タグ駆動で自動公開される。手順は [CONTRIBUTING.md](./CONTRIBUTING.md) の「リリース手順」を参照
（`v{version}` タグの push で GitHub Actions がテスト・ビルド・`npm publish` を実行する）。

## コントリビュート / ライセンス

- 開発環境・設計原則・変更時チェックリスト: [CONTRIBUTING.md](./CONTRIBUTING.md)
- 変更履歴: [CHANGELOG.md](./CHANGELOG.md)
- ライセンス: [MIT](./LICENSE)

## 設計方針

1. **定義と出力は 1 対 1** — レビューは JSON の diff で、確認は HTML で行う
2. **語彙を増やしすぎない** — UI 部品は「打ち合わせで手描きするレベル」の粒度に留め、忠実なビジュアルデザインは Figma 等に譲る
3. **壊れ方を親切に** — 参照切れ・ID 重複などは生成前に全件、日本語で報告する

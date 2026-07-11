/**
 * フロー定義のスキーマ。
 * 「1つの JSON 定義 → 1つの静的 HTML」を原則とし、
 * 非エンジニアが読み書きできる語彙のみで構成する。
 */

/** すべての UI 部品が共通で持てる属性 */
interface ElementBase {
  /** 画面下部の注釈リストに①②…として表示される補足 */
  note?: string;
}

/** 画面上部の見出し */
export interface HeaderElement extends ElementBase {
  type: "header";
  label: string;
}

/** 説明文・本文 */
export interface TextElement extends ElementBase {
  type: "text";
  label: string;
  /** true のとき補足文として薄く表示する */
  muted?: boolean;
}

/** 入力欄 */
export interface InputElement extends ElementBase {
  type: "input";
  label: string;
  placeholder?: string;
  /** パスワード等の伏せ字入力 */
  secret?: boolean;
}

/** ボタン。goto に画面 ID を指定するとクリックで遷移できるホットスポットになる */
export interface ButtonElement extends ElementBase {
  type: "button";
  label: string;
  goto?: string;
  variant?: "primary" | "secondary" | "danger";
  /** true のとき外部サービスへの遷移（↗）として描画する。goto とは併用しない */
  external?: boolean;
}

/** テキストリンク。goto・external はボタンと同様 */
export interface LinkElement extends ElementBase {
  type: "link";
  label: string;
  goto?: string;
  external?: boolean;
}

/** 箇条書き・明細リスト */
export interface ListElement extends ElementBase {
  type: "list";
  label?: string;
  items: string[];
}

/** 数値やステータスを見せるカード */
export interface CardElement extends ElementBase {
  type: "card";
  label: string;
  /** カードの主役となる値（例: "¥1,280"、"3.2ヶ月分"） */
  value?: string;
  caption?: string;
}

/** グラフのプレースホルダ */
export interface ChartElement extends ElementBase {
  type: "chart";
  label?: string;
  kind?: "bar" | "line" | "donut";
}

/** 画像・イラストのプレースホルダ */
export interface ImageElement extends ElementBase {
  type: "image";
  label?: string;
}

/** 状態を表す小さなラベル */
export interface BadgeElement extends ElementBase {
  type: "badge";
  label: string;
  tone?: "good" | "caution" | "neutral";
}

/** 選択肢（タブ・ラジオ・セグメント） */
export interface ChoiceElement extends ElementBase {
  type: "choice";
  label?: string;
  items: string[];
  /** 選択中にする項目（items 内の文字列） */
  selected?: string;
}

/** ナビゲーション項目。文字列、または遷移先つきのオブジェクト */
export type NavItem = string | { label: string; goto?: string };

/** ナビゲーションバー（モバイルは下部・デスクトップは上部を想定） */
export interface NavElement extends ElementBase {
  type: "nav";
  items: NavItem[];
  selected?: string;
}

/** 区切り線 */
export interface DividerElement extends ElementBase {
  type: "divider";
}

/**
 * コンソール出力・コマンド・コードのブロック（等幅表示）。
 * CLI ツールの対話や、画面内のコード片の表現に使う。
 * 行頭が "$ " の行はコマンド、"? " の行は対話プロンプトとして強調される。
 */
export interface ConsoleElement extends ElementBase {
  type: "console";
  label?: string;
  lines: string[];
}

export type ScreenElement =
  | HeaderElement
  | ConsoleElement
  | TextElement
  | InputElement
  | ButtonElement
  | LinkElement
  | ListElement
  | CardElement
  | ChartElement
  | ImageElement
  | BadgeElement
  | ChoiceElement
  | NavElement
  | DividerElement;

/** 1つの画面（ワイヤーフレーム） */
export interface Screen {
  /** フロー・goto から参照される一意な ID（半角英数字とハイフン推奨） */
  id: string;
  name: string;
  /** 画面の目的や状態の説明 */
  note?: string;
  /** 画面の枠。mobile=スマホ枠(320px) / desktop=ブラウザ枠(560px) / terminal=端末枠(560px・CLI用)。省略時は mobile */
  layout?: "mobile" | "desktop" | "terminal";
  elements: ScreenElement[];
}

/** Gherkin 形式のシナリオ（BDD との対応付け） */
export interface Scenario {
  given: string[];
  when: string[];
  then: string[];
}

/**
 * フローの 1 ステップ。
 * screen（画面）か process（画面を持たない処理）のどちらか一方を指定する。
 * process はバッチ処理・自動化など、UI を介さない業務ステップの表現に使う。
 */
export interface FlowStep {
  /** 表示する画面の ID */
  screen?: string;
  /** 画面を持たない処理の名前（例: "RSSを収集"、"ダイジェストを生成"） */
  process?: string;
  /** このステップの主体（例: "利用者"、"システム"）。省略時はフローの actor */
  actor?: string;
  /** このステップで行う操作（次のステップへの矢印ラベル） */
  action?: string;
  /** 操作に対するシステムの応答・特記事項 */
  result?: string;
  /** このステップでデータ（テーブル）がどう変わるか */
  data?: StepData[];
}

/** 業務フロー（ユーザーストーリー単位） */
export interface Flow {
  /** トレーサビリティ ID（例: "US-301"） */
  id: string;
  name: string;
  /** フローの主体（例: "利用者"、"管理者"） */
  actor?: string;
  description?: string;
  scenario?: Scenario;
  steps: FlowStep[];
}

/** ユビキタス言語の用語（ことばの層） */
export interface GlossaryTerm {
  term: string;
  definition: string;
  /** この用語が対応するエンティティ ID（entities を参照） */
  entity?: string;
}

/** エンティティのカラム（ビジネス用語との対応付き） */
export interface EntityColumn {
  /** 物理カラム名 */
  name: string;
  /** ビジネス上の呼び名（例: "金額"） */
  label?: string;
  note?: string;
}

/**
 * エンティティ（データの層）。
 * ビジネス用語（name）と物理テーブル（table）の写像を宣言する。
 * スキーマの SSOT はあくまで実装側（Prisma 等）にあり、ここはその写しである。
 */
export interface Entity {
  /** step.data から参照される一意な ID */
  id: string;
  /** ビジネス用語（ユビキタス言語）での名前（例: "記録"） */
  name: string;
  /** 物理テーブル名（例: "budget_list"） */
  table?: string;
  note?: string;
  columns?: EntityColumn[];
}

/** データの変化の種類（CRUD） */
export type DataChange = "create" | "read" | "update" | "delete";

/** ステップがデータに与える影響 */
export interface StepData {
  /** entities の ID */
  entity: string;
  change: DataChange;
  /** 影響するカラム（entities.columns の name） */
  columns?: string[];
  /** 非エンジニア向けの補足（例: "明細が1行増える"） */
  note?: string;
}

/** フロー定義全体 */
export interface FlowDefinition {
  /** エディタ補完用の JSON Schema 参照。レンダリングには影響しない */
  $schema?: string;
  /** 出力ドキュメントの定型文言の言語。省略時は日本語 */
  lang?: "ja" | "en";
  title: string;
  description?: string;
  /** 定義自体のバージョン。出力 HTML に表示される */
  version?: string;
  /** テーマプリセット名（"blueprint"=製図(既定) / "mono"=白黒印刷向け） */
  theme?: string;
  /** テーマのトークンを個別に上書きする（キーは theme.ts の ThemeTokens 参照） */
  tokens?: Partial<import("./theme").ThemeTokens>;
  /** アクセントカラー（CSS カラー値）。tokens.accent の簡易記法 */
  accent?: string;
  screens: Screen[];
  flows: Flow[];
  /** ユビキタス言語の用語集（ことばの層）。省略可 */
  glossary?: GlossaryTerm[];
  /** ビジネス用語とテーブルの写像（データの層）。省略可 */
  entities?: Entity[];
}

/** レンダリングオプション */
export interface RenderOptions {
  /**
   * 出力フッターに埋め込む生成情報。
   * 既定では何も埋め込まない（同じ定義から常に同じ HTML を出力する＝再現性を優先）。
   */
  generatedAt?: string;
}

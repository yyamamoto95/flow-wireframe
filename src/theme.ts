/**
 * デザインフレームワーク。
 *
 * 3層構造:
 *   1. テーマプリセット（THEMES）      — 資料全体の世界観
 *   2. トークン上書き（定義の tokens） — プロジェクト固有の調整
 *   3. 意味トークン                    — ふるまい（given/when/then）とデータ（create/read/update/delete）の色。
 *      どのテーマでも「同じ意味は同じトークン」を通るため、読者の学習が資料間で転移する。
 *
 * 出力 CSS は外部フォント・外部リソースへの参照を持たず、file:// 直開きでも完全に動作する。
 * 印刷（A4）にも配慮する。
 */

/** デザイントークン。すべて CSS カラー値 */
export interface ThemeTokens {
  /** 基調 */
  accent: string;
  ink: string;
  muted: string;
  line: string;
  hairline: string;
  paper: string;
  surface: string;
  grid: string;
  sketch: string;
  good: string;
  caution: string;
  /** 意味トークン: ふるまい（Gherkin） */
  given: string;
  when: string;
  then: string;
  /** 意味トークン: データ（CRUD） */
  create: string;
  read: string;
  update: string;
  delete: string;
}

export type TokenName = keyof ThemeTokens;

/** テーマプリセット */
export const THEMES: Record<string, ThemeTokens> = {
  /** 製図（既定）: 方眼紙とインクの設計図 */
  blueprint: {
    accent: "#2563eb",
    ink: "#232a31",
    muted: "#5d6773",
    line: "#d5dbe1",
    hairline: "#e4e9ee",
    paper: "#f3f5f7",
    surface: "#ffffff",
    grid: "rgba(35, 42, 49, .045)",
    sketch: "#9aa4ad",
    good: "#0b7a58",
    caution: "#b45309",
    given: "#64748b",
    when: "#2563eb",
    then: "#0b7a58",
    create: "#0b7a58",
    read: "#5d6773",
    update: "#1d4ed8",
    delete: "#b91c1c",
  },
  /** 白黒印刷・複合機向け: 色に依存せず文字（C/R/U/D・前提/操作/結果）で意味が立つ */
  mono: {
    accent: "#1a1a1a",
    ink: "#1a1a1a",
    muted: "#525252",
    line: "#c9c9c9",
    hairline: "#e3e3e3",
    paper: "#f6f6f6",
    surface: "#ffffff",
    grid: "rgba(0, 0, 0, .04)",
    sketch: "#9a9a9a",
    good: "#1a1a1a",
    caution: "#1a1a1a",
    given: "#6f6f6f",
    when: "#1a1a1a",
    then: "#3d3d3d",
    create: "#1a1a1a",
    read: "#6f6f6f",
    update: "#3d3d3d",
    delete: "#1a1a1a",
  },
};

export const DEFAULT_THEME = "blueprint";

export function buildCss(t: ThemeTokens): string {
  return `
:root {
  --accent: ${t.accent};
  --ink: ${t.ink};
  --muted: ${t.muted};
  --line: ${t.line};
  --hairline: ${t.hairline};
  --paper: ${t.paper};
  --surface: ${t.surface};
  --grid: ${t.grid};
  --sketch: ${t.sketch};
  --good: ${t.good};
  --caution: ${t.caution};
  --given: ${t.given};
  --when: ${t.when};
  --then: ${t.then};
  --create: ${t.create};
  --read: ${t.read};
  --update: ${t.update};
  --delete: ${t.delete};
}
* { box-sizing: border-box; }
body {
  margin: 0;
  color: var(--ink);
  background:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px),
    var(--paper);
  background-size: 24px 24px, 24px 24px, auto;
  font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", Meiryo, system-ui, sans-serif;
  line-height: 1.65;
  font-feature-settings: "palt";
}
main { max-width: 1080px; margin: 0 auto; padding: 0 20px 64px; }
table { font-variant-numeric: tabular-nums; }
h2 { font-size: 21px; letter-spacing: .02em; border-bottom: 1px solid var(--ink); padding-bottom: 8px; margin: 56px 0 20px; position: relative; }
h2::before { content: ""; position: absolute; left: 0; bottom: -1px; width: 56px; border-bottom: 3px solid var(--accent); }
h3 { font-size: 16px; letter-spacing: .01em; }

/* 図面のタイトルブロック風ヘッダー */
.wf-doc-header { max-width: 1080px; margin: 28px auto 8px; padding: 0 20px; }
.wf-doc-header h1 { margin: 0; font-size: 27px; letter-spacing: .01em; line-height: 1.35; text-wrap: balance; border-top: 3px solid var(--ink); border-bottom: 1px solid var(--ink); padding: 18px 2px 14px; }
.wf-doc-desc { margin: 10px 2px 0; color: var(--muted); font-size: 13.5px; max-width: 72ch; }
.wf-doc-meta { display: inline-block; margin: 12px 2px 0; font-size: 11.5px; letter-spacing: .06em; color: var(--muted); border: 1px solid var(--line); background: var(--surface); border-radius: 3px; padding: 3px 12px; }
.wf-doc-footer { text-align: center; color: var(--muted); font-size: 11.5px; letter-spacing: .04em; padding: 28px 20px 36px; }

/* 読み方・目次 */
.wf-legend { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 10px 18px; margin-top: 24px; }
.wf-legend summary { cursor: pointer; font-weight: 700; }
.wf-legend li { margin: 6px 0; font-size: 14px; }
.wf-toc { display: flex; gap: 48px; flex-wrap: wrap; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 14px 22px; margin-top: 14px; }
.wf-toc h4 { margin: 8px 0 4px; }
.wf-toc ol { margin: 0; padding-left: 20px; font-size: 14px; }
.wf-toc a { color: var(--ink); text-decoration: none; }
.wf-toc a:hover { color: var(--accent); }

/* フロー */
.wf-flow-section, .wf-screen-section { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 18px 22px; margin: 20px 0; scroll-margin-top: 16px; }
.wf-flow-id, .wf-screen-id { display: inline-block; background: var(--accent); color: #fff; border-radius: 3px; font-size: 11.5px; letter-spacing: .05em; padding: 2px 9px; margin-right: 10px; vertical-align: 2px; font-variant-numeric: tabular-nums; }
.wf-actor { float: right; font-size: 13px; font-weight: 400; color: var(--muted); }
.wf-flow-desc { color: var(--muted); font-size: 14px; margin-top: 0; }
.wf-strip { display: flex; align-items: flex-start; gap: 4px; overflow-x: auto; padding: 12px 4px 16px; }
.wf-flow-goal { align-self: center; white-space: nowrap; font-size: 13px; font-weight: 700; color: var(--good); padding: 0 8px; }

/* ミニチュア画面 */
.wf-thumb { position: relative; flex: 0 0 auto; width: 148px; text-align: center; text-decoration: none; color: var(--ink); }
.wf-thumb-no { position: absolute; top: -8px; left: -6px; z-index: 1; background: var(--ink); color: #fff; width: 22px; height: 22px; border-radius: 50%; font-size: 13px; line-height: 22px; display: inline-block; }
.wf-thumb-scale { display: block; height: 200px; overflow: hidden; border-radius: 8px; }
.wf-thumb-scale .wf-frame-wrap { transform: scale(.44); transform-origin: top left; width: 320px; pointer-events: none; }
.wf-thumb-scale::after { content: ""; position: absolute; left: 0; right: 0; top: 160px; height: 40px; background: linear-gradient(transparent, #fff); }
.wf-thumb-name { display: block; font-size: 12px; font-weight: 700; margin-top: 4px; }
.wf-thumb:hover .wf-thumb-name { color: var(--accent); }

/* 端末（CLI）枠 */
.wf-terminal .wf-frame { width: 560px; border-radius: 10px; background: #1e293b; color: #e2e8f0; }
.wf-terminal-bar { display: flex; align-items: center; gap: 5px; background: #0f172a; margin: -14px -12px 6px; padding: 7px 12px; border-radius: 8px 8px 0 0; }
.wf-terminal-bar span { width: 9px; height: 9px; border-radius: 50%; background: #475569; }
.wf-terminal-bar i { flex: 1; font-style: normal; font-size: 10px; color: #94a3b8; text-align: center; }
.wf-terminal .wf-header { color: #e2e8f0; border-bottom-color: #475569; }
.wf-terminal .wf-text { color: #cbd5e1; }
.wf-terminal .wf-muted { color: #94a3b8; }
.wf-terminal .wf-console { border-color: #475569; }

/* コンソールブロック（全レイアウトで使用可） */
.wf-console { border: 1.5px solid var(--line); border-radius: 8px; background: #1e293b; padding: 8px 10px; overflow-x: auto; }
.wf-console-label { font-size: 12px; color: var(--muted); margin-bottom: 4px; }
.wf-terminal .wf-console-label { color: #94a3b8; }
.wf-console pre { margin: 0; font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace; font-size: 11px; line-height: 1.7; color: #e2e8f0; display: flex; flex-direction: column; }
.wf-console-cmd { color: #7dd3fc; font-weight: 700; }
.wf-console-prompt { color: #fbbf24; }
.wf-console-out { color: #cbd5e1; }

/* デスクトップ枠のミニチュア */
.wf-thumb-desktop { width: 216px; }
.wf-thumb-desktop .wf-thumb-scale .wf-frame-wrap { transform: scale(.36); width: 560px; }

/* 画面を持たない処理ステップ */
.wf-process { position: relative; flex: 0 0 auto; align-self: center; display: flex; flex-direction: column; align-items: center; gap: 2px; border: 2px solid var(--muted); border-radius: 14px; background: #f3f4f6; padding: 14px 16px; min-width: 120px; max-width: 150px; text-align: center; }
.wf-process-icon { font-size: 22px; color: var(--muted); }
.wf-process-name { font-size: 12px; font-weight: 700; }
.wf-process-actor { font-size: 11px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 0 8px; background: #fff; }

/* 外部サービスへの遷移マーク */
.wf-external { margin-left: 4px; font-weight: 700; }

/* ステップ(ノード+データ変化チップ) */
.wf-step { display: flex; flex: 0 0 auto; flex-direction: column; align-items: center; gap: 6px; }
.wf-data-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; max-width: 216px; }
.wf-data-chip { display: inline-block; border-radius: 999px; font-size: 10px; font-weight: 700; padding: 1px 8px; text-decoration: none; border: 1px solid; }
.wf-data-create { background: color-mix(in srgb, var(--create) 9%, var(--surface)); color: var(--create); border-color: var(--create); }
.wf-data-read { background: color-mix(in srgb, var(--read) 8%, var(--surface)); color: var(--read); border-color: var(--read); }
.wf-data-update { background: color-mix(in srgb, var(--update) 9%, var(--surface)); color: var(--update); border-color: var(--update); }
.wf-data-delete { background: color-mix(in srgb, var(--delete) 9%, var(--surface)); color: var(--delete); border-color: var(--delete); }

/* データカタログ・CRUDマトリクス・用語集 */
.wf-crud-note { color: var(--muted); font-size: 13px; }
.wf-crud-wrap { overflow-x: auto; }
.wf-crud { border-collapse: collapse; background: var(--surface); font-size: 13px; }
.wf-crud th, .wf-crud td { border: 1px solid var(--line); padding: 6px 12px; text-align: left; }
.wf-crud td { text-align: center; min-width: 72px; }
.wf-crud td .wf-data-chip { margin: 0 2px; padding: 1px 6px; }
.wf-crud a { color: var(--ink); text-decoration: none; }
.wf-crud a:hover { color: var(--accent); }
.wf-entity { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 14px 22px; margin: 16px 0; scroll-margin-top: 16px; }
.wf-entity:target { outline: 3px solid var(--accent); animation: wf-flash 1.2s ease-out 1; }
.wf-entity h4 { margin: 4px 0 8px; font-size: 15px; }
.wf-entity-table { margin-left: 10px; font-size: 12px; font-weight: 400; background: #f3f4f6; border: 1px solid var(--line); border-radius: 4px; padding: 1px 8px; }
.wf-entity-cols { border-collapse: collapse; font-size: 13px; margin: 6px 0; }
.wf-entity-cols th { text-align: left; color: var(--muted); font-size: 12px; font-weight: 400; padding: 2px 14px 2px 0; border-bottom: 1px solid var(--line); }
.wf-entity-cols td { padding: 3px 14px 3px 0; border-bottom: 1px dashed var(--line); }
.wf-col-name { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; }
.wf-glossary-section { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 8px 22px; }
.wf-glossary { border-collapse: collapse; font-size: 14px; width: 100%; }
.wf-glossary th { text-align: left; white-space: nowrap; padding: 8px 18px 8px 0; vertical-align: top; }
.wf-glossary td { padding: 8px 12px 8px 0; border-bottom: 1px dashed var(--line); color: var(--ink); }
.wf-glossary tr:last-child td { border-bottom: none; }

/* ステップ間の矢印 */
.wf-arrow { flex: 0 0 auto; align-self: center; display: flex; flex-direction: column; justify-content: center; min-width: 110px; max-width: 160px; text-align: center; padding: 0 6px; }
.wf-arrow-action { font-size: 12px; font-weight: 700; color: var(--ink); }
.wf-arrow-line { display: block; position: relative; height: 2px; background: var(--ink); margin: 6px 2px; }
.wf-arrow-line::after { content: ""; position: absolute; right: -1px; top: -4px; border: 5px solid transparent; border-left-color: var(--ink); }
.wf-arrow-result { order: 3; font-size: 11px; color: var(--muted); }

/* Gherkin 表 */
.wf-gherkin { margin-top: 8px; font-size: 13px; }
.wf-gherkin summary { cursor: pointer; color: var(--muted); }
.wf-gherkin table { border-collapse: collapse; margin-top: 8px; width: 100%; }
.wf-gherkin th { width: 56px; text-align: center; font-size: 12px; color: #fff; border-radius: 4px; padding: 2px 6px; }
.wf-gherkin td { padding: 3px 10px; border-bottom: 1px dashed var(--line); }
.wf-gherkin-given th { background: var(--given); }
.wf-gherkin-when th { background: var(--when); }
.wf-gherkin-then th { background: var(--then); }

/* 画面カタログ */
.wf-screen-note { color: var(--muted); font-size: 14px; margin-top: 0; }
.wf-screen-flows { font-size: 12px; }
.wf-tag { display: inline-block; background: color-mix(in srgb, var(--accent) 8%, var(--surface)); color: var(--accent); border-radius: 999px; padding: 1px 10px; text-decoration: none; margin: 2px; }
.wf-screen-section:target { outline: 3px solid var(--accent); animation: wf-flash 1.2s ease-out 1; }
@keyframes wf-flash { from { background: #dbeafe; } to { background: #fff; } }

/* ワイヤーフレーム本体（スマホ枠 320px / デスクトップ枠 560px） */
.wf-frame-wrap { display: inline-block; vertical-align: top; }
.wf-frame { width: 320px; min-height: 120px; border: 2px solid var(--ink); border-radius: 18px; background: #fff; padding: 14px 12px 8px; display: flex; flex-direction: column; gap: 8px; }
.wf-desktop .wf-frame { width: 560px; border-radius: 10px; }
.wf-browser-bar { display: flex; align-items: center; gap: 5px; background: #e5e7eb; margin: -14px -12px 6px; padding: 7px 12px; border-radius: 8px 8px 0 0; border-bottom: 2px solid var(--ink); }
.wf-browser-bar span { width: 9px; height: 9px; border-radius: 50%; background: #fff; border: 1px solid var(--sketch); }
.wf-browser-bar i { flex: 1; font-style: normal; font-size: 10px; color: var(--muted); background: #fff; border-radius: 999px; padding: 1px 12px; margin-left: 6px; }
.wf-el { margin: 0; }
.wf-header { font-weight: 700; font-size: 16px; border-bottom: 2px solid var(--ink); padding-bottom: 6px; }
.wf-text { font-size: 13px; }
.wf-muted { color: var(--muted); font-size: 12px; }
.wf-input { display: block; font-size: 12px; }
.wf-input-label { display: block; color: var(--muted); margin-bottom: 2px; }
.wf-input-box { display: block; border: 1.5px solid var(--sketch); border-radius: 6px; padding: 7px 10px; color: var(--sketch); background: #fff; min-height: 34px; }
.wf-button { display: block; text-align: center; border-radius: 8px; padding: 9px 10px; font-size: 14px; font-weight: 700; text-decoration: none; }
.wf-button-primary { background: var(--ink); color: #fff; }
.wf-button-secondary { background: #fff; color: var(--ink); border: 1.5px solid var(--ink); }
.wf-button-danger { background: #fff; color: #b91c1c; border: 1.5px solid #b91c1c; }
.wf-link { display: block; text-align: center; color: var(--accent); text-decoration: underline; font-size: 13px; }
.wf-hotspot { outline: 2px dashed var(--accent); outline-offset: 2px; cursor: pointer; }
.wf-hotspot:hover { outline-style: solid; }
.wf-list-label, .wf-choice-label, .wf-chart-label { font-size: 12px; color: var(--muted); margin-bottom: 4px; }
.wf-list ul { margin: 0; padding: 0; list-style: none; border: 1.5px solid var(--line); border-radius: 8px; }
.wf-list li { padding: 7px 10px; font-size: 13px; border-bottom: 1px solid var(--line); }
.wf-list li:last-child { border-bottom: none; }
.wf-card { border: 1.5px solid var(--line); border-radius: 10px; padding: 10px 12px; background: #fff; }
.wf-card-label { font-size: 12px; color: var(--muted); }
.wf-card-value { font-size: 22px; font-weight: 700; }
.wf-card-caption { font-size: 11px; color: var(--muted); }
.wf-chart { border: 1.5px solid var(--line); border-radius: 10px; padding: 10px 12px; color: var(--sketch); }
.wf-chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 64px; }
.wf-chart-bars span { flex: 1; background: repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 4px, #f3f4f6 4px, #f3f4f6 8px); border: 1px solid var(--sketch); border-radius: 3px 3px 0 0; }
.wf-chart-donut { width: 64px; height: 64px; margin: 0 auto; border-radius: 50%; background: conic-gradient(var(--sketch) 0 40%, #e5e7eb 40% 75%, #f3f4f6 75%); -webkit-mask: radial-gradient(circle 18px, transparent 98%, #000); mask: radial-gradient(circle 18px, transparent 98%, #000); }
.wf-chart-line { width: 100%; height: 64px; }
.wf-image { border: 1.5px dashed var(--sketch); border-radius: 8px; min-height: 64px; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--sketch); font-size: 12px; }
.wf-image svg { width: 28px; height: 28px; }
.wf-badge { display: inline-block; align-self: flex-start; border-radius: 999px; font-size: 11px; font-weight: 700; padding: 2px 10px; }
.wf-badge-good { background: color-mix(in srgb, var(--good) 9%, var(--surface)); color: var(--good); border: 1px solid var(--good); }
.wf-badge-caution { background: color-mix(in srgb, var(--caution) 10%, var(--surface)); color: var(--caution); border: 1px solid var(--caution); }
.wf-badge-neutral { background: color-mix(in srgb, var(--muted) 7%, var(--surface)); color: var(--muted); border: 1px solid var(--line); }
.wf-choice-items { display: flex; border: 1.5px solid var(--ink); border-radius: 8px; overflow: hidden; }
.wf-choice-item { flex: 1; text-align: center; font-size: 12px; padding: 6px 4px; border-right: 1px solid var(--line); }
.wf-choice-item:last-child { border-right: none; }
.wf-choice-item.wf-selected, .wf-nav-item.wf-selected { background: var(--ink); color: #fff; font-weight: 700; }
.wf-nav { display: flex; border-top: 2px solid var(--ink); margin: auto -12px -8px; padding-top: 0; }
.wf-nav-item { flex: 1; text-align: center; font-size: 11px; padding: 8px 2px; }
.wf-nav-hotspot { color: var(--accent); text-decoration: none; outline: 1.5px dashed var(--accent); outline-offset: -3px; border-radius: 6px; cursor: pointer; }
.wf-nav-hotspot:hover { outline-style: solid; }
.wf-divider { border: none; border-top: 1.5px dashed var(--line); width: 100%; }
.wf-note-mark { color: var(--accent); font-weight: 700; margin-left: 2px; }
.wf-notes { max-width: 320px; font-size: 12px; color: var(--muted); padding-left: 20px; margin: 8px 0 0; }
.wf-notes li { list-style: none; counter-increment: wf-note; position: relative; }
.wf-notes li::before { content: counter(wf-note); position: absolute; left: -18px; top: 2px; width: 14px; height: 14px; border: 1px solid var(--accent); border-radius: 50%; color: var(--accent); font-size: 10px; line-height: 14px; text-align: center; }

@media print {
  body { background: #fff; }
  .wf-legend, .wf-toc { display: none; }
  .wf-flow-section, .wf-screen-section { break-inside: avoid; border: none; padding: 0; }
  .wf-strip { overflow: visible; flex-wrap: wrap; }
}
`;
}

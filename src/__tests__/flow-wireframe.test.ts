import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { renderHtml, escapeHtml } from "../render";
import { validate } from "../validate";
import type { FlowDefinition } from "../types";

const minimalDef = (): FlowDefinition => ({
  title: "テストフロー",
  screens: [
    {
      id: "a",
      name: "画面A",
      elements: [
        { type: "header", label: "A" },
        { type: "button", label: "進む", goto: "b" },
      ],
    },
    {
      id: "b",
      name: "画面B",
      elements: [{ type: "text", label: "<b>エスケープ確認</b>", note: "注釈1" }],
    },
  ],
  flows: [
    {
      id: "F-1",
      name: "AからBへ",
      scenario: { given: ["Aにいる"], when: ["進むを押す"], then: ["Bに遷移する"] },
      steps: [
        { screen: "a", action: "進むを押す" },
        { screen: "b", result: "完了" },
      ],
    },
  ],
});

describe("validate", () => {
  it("正しい定義を受理する", () => {
    expect(validate(minimalDef())).toEqual({ ok: true, errors: [] });
  });

  it("存在しない画面への遷移(goto)を検出する", () => {
    const def = minimalDef();
    def.screens[0].elements.push({ type: "link", label: "迷子", goto: "nowhere" });
    const result = validate(def);
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain("nowhere");
  });

  it("フローの手順が参照する画面の不在を検出する", () => {
    const def = minimalDef();
    def.flows[0].steps.push({ screen: "ghost" });
    const result = validate(def);
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain("ghost");
  });

  it("画面IDの重複を検出する", () => {
    const def = minimalDef();
    def.screens.push({ ...def.screens[0] });
    expect(validate(def).errors.join()).toContain("重複");
  });

  it("最後以外の手順で action の欠落を検出する", () => {
    const def = minimalDef();
    delete def.flows[0].steps[0].action;
    expect(validate(def).errors.join()).toContain("action");
  });
});

describe("renderHtml", () => {
  it("自己完結型のHTML(外部参照なし)を生成する", () => {
    const html = renderHtml(minimalDef());
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("テストフロー");
    expect(html).not.toMatch(/src=["']https?:/);
    expect(html).not.toMatch(/href=["']https?:/);
    expect(html).not.toContain("<script");
  });

  it("画面・フロー・Gherkinシナリオを含む", () => {
    const html = renderHtml(minimalDef());
    expect(html).toContain('id="screen-a"');
    expect(html).toContain('id="screen-b"');
    expect(html).toContain('id="flow-F-1"');
    expect(html).toContain("Bに遷移する");
  });

  it("goto をアンカーリンクとして描画する", () => {
    const html = renderHtml(minimalDef());
    expect(html).toContain('href="#screen-b"');
  });

  it("ユーザー入力をエスケープする", () => {
    const html = renderHtml(minimalDef());
    expect(html).not.toContain("<b>エスケープ確認</b>");
    expect(html).toContain("&lt;b&gt;エスケープ確認&lt;/b&gt;");
  });

  it("同じ定義から常に同じHTMLを生成する（再現性）", () => {
    expect(renderHtml(minimalDef())).toBe(renderHtml(minimalDef()));
  });

  it("ミニチュア内にアンカーを入れ子にしない（<a>の入れ子はHTMLとして不正）", () => {
    const html = renderHtml(minimalDef());
    for (const thumb of html.match(/<a class="wf-thumb"[\s\S]*?<\/a>/g) ?? []) {
      expect(thumb.match(/<a /g)?.length).toBe(1);
    }
    // ミニチュアは1手順につき1つだけ生成される
    expect(html.match(/class="wf-thumb"/g)?.length).toBe(2);
  });

  it("不正な定義では全エラーを列挙して例外を投げる", () => {
    const def = minimalDef();
    def.flows[0].steps.push({ screen: "ghost" });
    expect(() => renderHtml(def)).toThrow(/ghost/);
  });
});

describe("v0.2 の汎用化機能", () => {
  it("layout: desktop はブラウザ枠として描画される", () => {
    const def = minimalDef();
    def.screens[0].layout = "desktop";
    const html = renderHtml(def);
    expect(html).toContain("wf-desktop");
    expect(html).toContain("wf-browser-bar");
  });

  it("process ステップは画面なしの処理ノードとして描画される", () => {
    const def = minimalDef();
    def.flows[0].steps = [
      { screen: "a", action: "保存する" },
      { process: "ダイジェストを生成", actor: "システム", action: "配信する" },
      { screen: "b", result: "完了" },
    ];
    const html = renderHtml(def);
    expect(html).toContain("wf-process");
    expect(html).toContain("ダイジェストを生成");
    expect(html).toContain("システム");
  });

  it("screen と process の同時指定・両方欠落を検出する", () => {
    const def = minimalDef();
    def.flows[0].steps = [
      { screen: "a", process: "二重指定", action: "x" },
      { action: "y" },
      { screen: "b" },
    ];
    const errors = validate(def).errors.join();
    expect(errors).toContain("どちらか一方");
    expect(errors).toContain("どちらかを指定");
  });

  it("nav 項目の goto はホットスポットになり、参照切れは検出される", () => {
    const def = minimalDef();
    def.screens[0].elements.push({
      type: "nav",
      items: [{ label: "B画面へ", goto: "b" }, "設定"],
      selected: "設定",
    });
    const html = renderHtml(def);
    expect(html).toContain("wf-nav-hotspot");

    def.screens[0].elements.push({ type: "nav", items: [{ label: "迷子", goto: "nowhere" }] });
    expect(validate(def).errors.join()).toContain("nowhere");
  });

  it("external な部品は ↗ マーク付きで描画される", () => {
    const def = minimalDef();
    def.screens[0].elements.push({ type: "link", label: "記事を読む", external: true });
    const html = renderHtml(def);
    expect(html).toContain("wf-external");
  });
});

describe("v0.3 の汎用化機能（CLIドメイン）", () => {
  it("layout: terminal は端末枠として描画される", () => {
    const def = minimalDef();
    def.screens[0].layout = "terminal";
    const html = renderHtml(def);
    expect(html).toContain("wf-terminal");
    expect(html).toContain("wf-terminal-bar");
  });

  it("console 部品はコマンド・プロンプト・出力を区別して描画する", () => {
    const def = minimalDef();
    def.screens[0].elements.push({
      type: "console",
      lines: ["$ pnpm create dev-framework", "? プロダクト名: 家計簿", "✅ 導入完了"],
    });
    const html = renderHtml(def);
    expect(html).toContain("wf-console-cmd");
    expect(html).toContain("wf-console-prompt");
    expect(html).toContain("wf-console-out");
    expect(html).toContain("$ pnpm create dev-framework");
  });
});

describe("v0.5 ことば・データの層", () => {
  const defWithData = () => {
    const def = minimalDef();
    def.entities = [
      { id: "record", name: "記録", table: "budget_list",
        columns: [{ name: "amount", label: "金額" }, { name: "category_id", label: "カテゴリ" }] },
      { id: "settings", name: "ユーザー設定", table: "user_settings" },
    ];
    def.glossary = [
      { term: "生活余力", definition: "総資産が実効支出の何ヶ月分あるかを示す値", entity: "settings" },
    ];
    def.flows[0].steps[0].data = [
      { entity: "record", change: "create", columns: ["amount"], note: "明細が1行増える" },
      { entity: "settings", change: "read" },
    ];
    return def;
  };

  it("ステップにデータ変化チップが描画される", () => {
    const html = renderHtml(defWithData());
    expect(html).toContain("wf-data-chip");
    expect(html).toContain("wf-data-create");
    expect(html).toContain("作成: 記録");
    expect(html).toContain('href="#entity-record"');
  });

  it("CRUDマトリクスとデータカタログ・用語集が生成される", () => {
    const html = renderHtml(defWithData());
    expect(html).toContain("CRUD マトリクス");
    expect(html).toContain('id="entity-record"');
    expect(html).toContain("budget_list");
    expect(html).toContain("用語集（ユビキタス言語）");
    expect(html).toContain("生活余力");
  });

  it("entities がない定義では従来通り（データ系セクションなし）", () => {
    const html = renderHtml(minimalDef());
    expect(html).not.toContain('id="data"');
    expect(html).not.toContain('id="glossary"');
    expect(html).not.toContain('<table class="wf-crud"');
  });

  it("存在しないエンティティ・カラムへの参照を検出する", () => {
    const def = defWithData();
    def.flows[0].steps[0].data!.push({ entity: "ghost", change: "read" });
    def.flows[0].steps[0].data!.push({ entity: "record", change: "update", columns: ["nope"] });
    const errors = validate(def).errors.join();
    expect(errors).toContain("ghost");
    expect(errors).toContain("nope");
  });

  it("lang: en では CRUD 見出しも英語になる", () => {
    const def = defWithData();
    def.lang = "en";
    const html = renderHtml(def);
    expect(html).toContain("CRUD matrix");
    expect(html).toContain("Create: 記録");
  });
});

describe("i18n（lang: ja / en）", () => {
  it("既定は日本語で描画される", () => {
    const html = renderHtml(minimalDef());
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain("この資料の読み方");
    expect(html).toContain(">前提<");
    expect(html).toContain(">業務フロー</h2>");
  });

  it("lang: en は定型文言のみ英語になり、書き手のコンテンツは変わらない", () => {
    const def = minimalDef();
    def.lang = "en";
    const html = renderHtml(def);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("How to read this document");
    expect(html).toContain(">Given<");
    expect(html).toContain(">User flows</h2>");
    expect(html).toContain(">Screen catalog</h2>");
    // 定型文言に日本語が残らない
    expect(html).not.toContain("この資料の読み方");
    expect(html).not.toContain(">前提<");
    // 書き手が書いた日本語コンテンツはそのまま
    expect(html).toContain("画面A");
    expect(html).toContain("Bに遷移する");
  });

  it("ja と en のロケールは同じキー構造を持つ（文言の追加漏れガード）", async () => {
    const { LOCALES } = await import("../i18n");
    expect(Object.keys(LOCALES.en).sort()).toEqual(Object.keys(LOCALES.ja).sort());
    expect(LOCALES.en.legendItems.length).toBe(LOCALES.ja.legendItems.length);
  });
});

describe("JSON Schema", () => {
  it("schema が有効な JSON で、TypeScript の element type 一覧と一致する", () => {
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "..", "schema", "flow-wireframe.schema.json"),
        "utf-8"
      )
    );
    const schemaTypes: string[] = schema.definitions.element.properties.type.enum;
    // render.ts の switch が扱う全部品タイプ（types.ts の ScreenElement と対応）
    const implemented = [
      "header", "text", "input", "button", "link", "list", "card",
      "chart", "image", "badge", "choice", "nav", "divider", "console",
    ];
    expect([...schemaTypes].sort()).toEqual([...implemented].sort());
  });
});

describe("escapeHtml", () => {
  it("HTML特殊文字をすべて変換する", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;"
    );
  });
});

describe("examples/kakeibo.flow.json", () => {
  it("サンプル定義がスキーマとして妥当でレンダリングできる", () => {
    const raw = fs.readFileSync(
      path.join(__dirname, "..", "..", "examples", "kakeibo.flow.json"),
      "utf-8"
    );
    const def = JSON.parse(raw) as FlowDefinition;
    expect(validate(def).errors).toEqual([]);
    const html = renderHtml(def);
    expect(html).toContain("US-301");
    expect(html).toContain("生活余力");
  });
});

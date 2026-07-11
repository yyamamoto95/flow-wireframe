import type {
  Entity,
  Flow,
  FlowDefinition,
  FlowStep,
  RenderOptions,
  Screen,
  ScreenElement,
  StepData,
} from "./types";
import { validate } from "./validate";
import { buildCss } from "./theme";
import { LOCALES, type Locale } from "./i18n";

const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const esc = escapeHtml;

/** goto 付き部品をアンカーとして描く際の共通属性 */
function gotoAttrs(goto: string | undefined, t: Locale): string {
  return goto ? ` href="#screen-${esc(goto)}" title="${esc(t.gotoTitle(goto))}"` : "";
}

interface NoteCollector {
  notes: string[];
  mark(note: string | undefined): string;
}

function createNoteCollector(): NoteCollector {
  const notes: string[] = [];
  return {
    notes,
    mark(note) {
      if (!note) return "";
      notes.push(note);
      const n = notes.length - 1;
      const mark = n < CIRCLED.length ? CIRCLED[n] : `(${n + 1})`;
      return `<sup class="wf-note-mark">${mark}</sup>`;
    },
  };
}

function renderElement(el: ScreenElement, c: NoteCollector, interactive: boolean, t: Locale): string {
  const mark = c.mark(el.note);
  switch (el.type) {
    case "header":
      return `<div class="wf-el wf-header">${esc(el.label)}${mark}</div>`;
    case "text":
      return `<p class="wf-el wf-text${el.muted ? " wf-muted" : ""}">${esc(el.label)}${mark}</p>`;
    case "input":
      return (
        `<label class="wf-el wf-input"><span class="wf-input-label">${esc(el.label)}${mark}</span>` +
        `<span class="wf-input-box${el.secret ? " wf-secret" : ""}">${
          el.secret ? "●●●●●●" : esc(el.placeholder ?? "")
        }</span></label>`
      );
    case "button": {
      const variant = el.variant ?? "primary";
      const hot = interactive && el.goto;
      const tag = hot ? "a" : "span";
      const ext = el.external ? `<span class="wf-external" title="${esc(t.externalTitle)}">↗</span>` : "";
      return `<${tag} class="wf-el wf-button wf-button-${variant}${hot ? " wf-hotspot" : ""}"${hot ? gotoAttrs(el.goto, t) : ""}>${esc(el.label)}${ext}${mark}</${tag}>`;
    }
    case "link": {
      const hot = interactive && el.goto;
      const tag = hot ? "a" : "span";
      const ext = el.external ? `<span class="wf-external" title="${esc(t.externalTitle)}">↗</span>` : "";
      return `<${tag} class="wf-el wf-link${hot ? " wf-hotspot" : ""}"${hot ? gotoAttrs(el.goto, t) : ""}>${esc(el.label)}${ext}${mark}</${tag}>`;
    }
    case "list": {
      const label = el.label ? `<div class="wf-list-label">${esc(el.label)}${mark}</div>` : mark;
      const items = el.items.map((i) => `<li>${esc(i)}</li>`).join("");
      return `<div class="wf-el wf-list">${label}<ul>${items}</ul></div>`;
    }
    case "card":
      return (
        `<div class="wf-el wf-card"><div class="wf-card-label">${esc(el.label)}${mark}</div>` +
        (el.value ? `<div class="wf-card-value">${esc(el.value)}</div>` : "") +
        (el.caption ? `<div class="wf-card-caption">${esc(el.caption)}</div>` : "") +
        `</div>`
      );
    case "chart": {
      const kind = el.kind ?? "bar";
      const label = el.label ? `<div class="wf-chart-label">${esc(el.label)}${mark}</div>` : mark;
      let body = "";
      if (kind === "bar") {
        body =
          `<div class="wf-chart-bars">` +
          [60, 90, 45, 75, 30]
            .map((h) => `<span style="height:${h}%"></span>`)
            .join("") +
          `</div>`;
      } else if (kind === "donut") {
        body = `<div class="wf-chart-donut"></div>`;
      } else {
        body =
          `<svg class="wf-chart-line" viewBox="0 0 100 40" preserveAspectRatio="none">` +
          `<polyline points="0,32 20,24 40,28 60,14 80,18 100,6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
      }
      return `<div class="wf-el wf-chart">${label}${body}</div>`;
    }
    case "image":
      return (
        `<div class="wf-el wf-image"><svg viewBox="0 0 24 24" aria-hidden="true">` +
        `<path d="M3 5h18v14H3z M3 15l5-5 4 4 3-3 6 6" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>` +
        (el.label ? `<span>${esc(el.label)}${mark}</span>` : mark) +
        `</div>`
      );
    case "badge":
      return `<span class="wf-el wf-badge wf-badge-${el.tone ?? "neutral"}">${esc(el.label)}${mark}</span>`;
    case "choice": {
      const label = el.label ? `<div class="wf-choice-label">${esc(el.label)}${mark}</div>` : mark;
      const items = el.items
        .map(
          (i) =>
            `<span class="wf-choice-item${i === el.selected ? " wf-selected" : ""}">${esc(i)}</span>`
        )
        .join("");
      return `<div class="wf-el wf-choice">${label}<div class="wf-choice-items">${items}</div></div>`;
    }
    case "nav": {
      const items = el.items
        .map((item) => {
          const label = typeof item === "string" ? item : item.label;
          const goto = typeof item === "string" ? undefined : item.goto;
          const hot = interactive && goto;
          const tag = hot ? "a" : "span";
          const cls = `wf-nav-item${label === el.selected ? " wf-selected" : ""}${hot ? " wf-nav-hotspot" : ""}`;
          return `<${tag} class="${cls}"${hot ? gotoAttrs(goto, t) : ""}>${esc(label)}</${tag}>`;
        })
        .join("");
      return `<div class="wf-el wf-nav">${items}${mark}</div>`;
    }
    case "console": {
      const label = el.label ? `<div class="wf-console-label">${esc(el.label)}${mark}</div>` : mark;
      const lines = el.lines
        .map((line) => {
          const cls = line.startsWith("$ ")
            ? "wf-console-cmd"
            : line.startsWith("? ")
              ? "wf-console-prompt"
              : "wf-console-out";
          return `<span class="${cls}">${esc(line)}</span>`;
        })
        .join("\n");
      return `<div class="wf-el wf-console">${label}<pre>${lines}</pre></div>`;
    }
    case "divider":
      return `<hr class="wf-el wf-divider" />`;
  }
}

/**
 * 1画面のワイヤーフレーム（スマホ枠）を描く。
 * interactive=false はミニチュア用: <a> の入れ子（HTML では不正）を避けるため
 * ホットスポットを描かず、注釈リストも省略する。
 */
function renderScreenFrame(screen: Screen, t: Locale, interactive = true): string {
  const c = interactive ? createNoteCollector() : { notes: [], mark: () => "" };
  const body = screen.elements.map((el) => renderElement(el, c, interactive, t)).join("\n");
  const notes =
    interactive && c.notes.length > 0
      ? `<ol class="wf-notes">${c.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ol>`
      : "";
  const desktop = screen.layout === "desktop";
  const terminal = screen.layout === "terminal";
  const chrome = desktop
    ? `<div class="wf-browser-bar"><span></span><span></span><span></span><i>${esc(screen.name)}</i></div>`
    : terminal
      ? `<div class="wf-terminal-bar"><span></span><span></span><span></span><i>${esc(screen.name)}</i></div>`
      : "";
  return (
    `<div class="wf-frame-wrap${desktop ? " wf-desktop" : ""}${terminal ? " wf-terminal" : ""}">` +
    `<div class="wf-frame">${chrome}${body}</div>` +
    notes +
    `</div>`
  );
}

/** 画面カタログの 1 セクション */
function renderScreenSection(screen: Screen, usedBy: Flow[], t: Locale): string {
  const flows = usedBy
    .map((f) => `<a class="wf-tag" href="#flow-${esc(f.id)}">${esc(f.id)} ${esc(f.name)}</a>`)
    .join(" ");
  return (
    `<section class="wf-screen-section" id="screen-${esc(screen.id)}">` +
    `<h3><span class="wf-screen-id">${esc(screen.id)}</span>${esc(screen.name)}</h3>` +
    (screen.note ? `<p class="wf-screen-note">${esc(screen.note)}</p>` : "") +
    (flows ? `<p class="wf-screen-flows">${esc(t.appearsIn)}: ${flows}</p>` : "") +
    renderScreenFrame(screen, t) +
    `</section>`
  );
}

/** フロー内で使うミニチュア画面（実物のワイヤーフレームを縮小表示） */
function renderThumb(screen: Screen, stepNo: number, t: Locale): string {
  const wide = screen.layout === "desktop" || screen.layout === "terminal";
  return (
    `<a class="wf-thumb${wide ? " wf-thumb-desktop" : ""}" href="#screen-${esc(screen.id)}" title="${esc(t.thumbTitle)}">` +
    `<span class="wf-thumb-no">${stepNo}</span>` +
    `<span class="wf-thumb-scale">${renderScreenFrame(screen, t, false)}</span>` +
    `<span class="wf-thumb-name">${esc(screen.name)}</span>` +
    `</a>`
  );
}

/** 画面を持たない処理ステップのノード */
function renderProcessNode(step: FlowStep, stepNo: number, defaultActor?: string): string {
  const actor = step.actor ?? defaultActor;
  return (
    `<span class="wf-process">` +
    `<span class="wf-thumb-no">${stepNo}</span>` +
    `<span class="wf-process-icon" aria-hidden="true">⚙</span>` +
    `<span class="wf-process-name">${esc(step.process ?? "")}</span>` +
    (actor ? `<span class="wf-process-actor">${esc(actor)}</span>` : "") +
    `</span>`
  );
}

/** ステップ下に表示するデータ変化チップ */
function renderDataChips(
  data: StepData[] | undefined,
  entitiesById: Map<string, Entity>,
  t: Locale
): string {
  if (!data || data.length === 0) return "";
  const chips = data
    .map((d) => {
      const entity = entitiesById.get(d.entity);
      const name = entity?.name ?? d.entity;
      const colLabel = (colName: string) =>
        entity?.columns?.find((c) => c.name === colName)?.label ?? colName;
      const titleLines = [
        d.note,
        entity?.table ? `${t.tableWord}: ${entity.table}` : "",
        d.columns?.length ? `${t.columnWord}: ${d.columns.map(colLabel).join(", ")}` : "",
      ].filter(Boolean);
      const title = titleLines.join("\n");
      return `<a class="wf-data-chip wf-data-${d.change}" href="#entity-${esc(d.entity)}"${title ? ` title="${esc(title)}"` : ""}>${esc(t.changes[d.change])}: ${esc(name)}</a>`;
    })
    .join("");
  return `<span class="wf-data-chips">${chips}</span>`;
}

function renderScenario(flow: Flow, t: Locale): string {
  if (!flow.scenario) return "";
  const row = (kind: string, label: string, lines: string[]) =>
    lines
      .map(
        (line, i) =>
          `<tr class="wf-gherkin-${kind}"><th>${i === 0 ? esc(label) : esc(t.and)}</th><td>${esc(line)}</td></tr>`
      )
      .join("");
  return (
    `<details class="wf-gherkin" open><summary>${esc(t.behavior)}</summary><table>` +
    row("given", t.given, flow.scenario.given) +
    row("when", t.when, flow.scenario.when) +
    row("then", t.then, flow.scenario.then) +
    `</table></details>`
  );
}

function renderFlowSection(flow: Flow, screensById: Map<string, Screen>, entitiesById: Map<string, Entity>, t: Locale): string {
  const strip = flow.steps
    .map((step, i) => {
      let node = "";
      if (step.screen) {
        const screen = screensById.get(step.screen);
        node = screen ? renderThumb(screen, i + 1, t) : "";
      } else if (step.process) {
        node = renderProcessNode(step, i + 1, flow.actor);
      }
      const chips = renderDataChips(step.data, entitiesById, t);
      if (node) node = `<span class="wf-step">${node}${chips}</span>`;
      const isLast = i === flow.steps.length - 1;
      const arrow = !isLast
        ? `<span class="wf-arrow"><span class="wf-arrow-action">${esc(step.action ?? "")}</span>` +
          (step.result ? `<span class="wf-arrow-result">${esc(step.result)}</span>` : "") +
          `<span class="wf-arrow-line" aria-hidden="true"></span></span>`
        : step.result
          ? `<span class="wf-flow-goal">🏁 ${esc(step.result)}</span>`
          : "";
      return node + arrow;
    })
    .join("");
  return (
    `<section class="wf-flow-section" id="flow-${esc(flow.id)}">` +
    `<h3><span class="wf-flow-id">${esc(flow.id)}</span>${esc(flow.name)}` +
    (flow.actor ? `<span class="wf-actor">👤 ${esc(flow.actor)}</span>` : "") +
    `</h3>` +
    (flow.description ? `<p class="wf-flow-desc">${esc(flow.description)}</p>` : "") +
    `<div class="wf-strip">${strip}</div>` +
    renderScenario(flow, t) +
    `</section>`
  );
}

function renderLegend(t: Locale): string {
  const items = t.legendItems.map((item) => `<li>${item}</li>`).join("");
  return `<details class="wf-legend"><summary>${esc(t.legendTitle)}</summary><ul>${items}</ul></details>`;
}

function renderToc(def: FlowDefinition, t: Locale): string {
  const flowItems = def.flows
    .map(
      (f) =>
        `<li><a href="#flow-${esc(f.id)}"><span class="wf-flow-id">${esc(f.id)}</span>${esc(f.name)}</a></li>`
    )
    .join("");
  const screenItems = def.screens
    .map((s) => `<li><a href="#screen-${esc(s.id)}">${esc(s.name)}</a></li>`)
    .join("");
  return (
    `<nav class="wf-toc"><div><h4>${esc(t.flowsHeading)}</h4><ol>${flowItems}</ol></div>` +
    `<div><h4>${esc(t.screensHeading)}</h4><ol>${screenItems}</ol></div></nav>`
  );
}

/** 用語集セクション */
function renderGlossary(def: FlowDefinition, entitiesById: Map<string, Entity>, t: Locale): string {
  if (!def.glossary || def.glossary.length === 0) return "";
  const rows = def.glossary
    .map((g) => {
      const entity = g.entity ? entitiesById.get(g.entity) : undefined;
      const link = entity
        ? `<a class="wf-tag" href="#entity-${esc(entity.id)}">${esc(entity.name)}${entity.table ? ` (${esc(entity.table)})` : ""}</a>`
        : "";
      return `<tr><th>${esc(g.term)}</th><td>${esc(g.definition)}</td><td>${link}</td></tr>`;
    })
    .join("");
  return (
    `<h2 id="glossary">${esc(t.glossaryHeading)}</h2>` +
    `<section class="wf-glossary-section"><table class="wf-glossary">${rows}</table></section>`
  );
}

const CRUD_ORDER = ["create", "read", "update", "delete"] as const;
const CRUD_LETTER = { create: "C", read: "R", update: "U", delete: "D" } as const;

/** CRUD マトリクス（フロー × エンティティ） */
function renderCrudMatrix(def: FlowDefinition, t: Locale): string {
  const entities = def.entities ?? [];
  const header = entities
    .map((e) => `<th><a href="#entity-${esc(e.id)}">${esc(e.name)}</a></th>`)
    .join("");
  const rows = def.flows
    .map((f) => {
      const cells = entities
        .map((e) => {
          const changes = new Set(
            f.steps.flatMap((st) => (st.data ?? []).filter((d) => d.entity === e.id).map((d) => d.change))
          );
          const letters = CRUD_ORDER.filter((c) => changes.has(c))
            .map((c) => `<span class="wf-data-chip wf-data-${c}" title="${esc(t.changes[c])}">${CRUD_LETTER[c]}</span>`)
            .join("");
          return `<td>${letters}</td>`;
        })
        .join("");
      return `<tr><th><a href="#flow-${esc(f.id)}">${esc(f.id)} ${esc(f.name)}</a></th>${cells}</tr>`;
    })
    .join("");
  return (
    `<h3>${esc(t.crudHeading)}</h3><p class="wf-crud-note">${esc(t.crudNote)}</p>` +
    `<div class="wf-crud-wrap"><table class="wf-crud"><thead><tr><th></th>${header}</tr></thead><tbody>${rows}</tbody></table></div>`
  );
}

/** データカタログ（エンティティごとのカード） */
function renderDataCatalog(def: FlowDefinition, t: Locale): string {
  const entities = def.entities ?? [];
  if (entities.length === 0) return "";
  const usedBy = (entityId: string) =>
    def.flows.filter((f) => f.steps.some((st) => (st.data ?? []).some((d) => d.entity === entityId)));
  /** カラム→ユースケースの逆引き: そのカラムを data.columns で明示しているフロー */
  const columnUsedBy = (entityId: string, colName: string) =>
    def.flows.filter((f) =>
      f.steps.some((st) =>
        (st.data ?? []).some((d) => d.entity === entityId && (d.columns ?? []).includes(colName))
      )
    );
  const cards = entities
    .map((e) => {
      const cols = (e.columns ?? [])
        .map((c) => {
          const flowTags = columnUsedBy(e.id, c.name)
            .map((f) => `<a class="wf-tag" href="#flow-${esc(f.id)}" title="${esc(f.name)}">${esc(f.id)}</a>`)
            .join(" ");
          return `<tr><td class="wf-col-name">${esc(c.name)}</td><td>${esc(c.label ?? "")}</td><td>${esc(c.note ?? "")}</td><td class="wf-col-flows">${flowTags}</td></tr>`;
        })
        .join("");
      const colTable = cols
        ? `<table class="wf-entity-cols"><thead><tr><th>${esc(t.columnWord)}</th><th>${esc(t.columnBizName)}</th><th></th><th>${esc(t.appearsIn)}</th></tr></thead><tbody>${cols}</tbody></table>`
        : "";
      const flows = usedBy(e.id)
        .map((f) => `<a class="wf-tag" href="#flow-${esc(f.id)}">${esc(f.id)}</a>`)
        .join(" ");
      return (
        `<section class="wf-entity" id="entity-${esc(e.id)}">` +
        `<h4>${esc(e.name)}${e.table ? `<code class="wf-entity-table">${esc(e.table)}</code>` : ""}</h4>` +
        (e.note ? `<p class="wf-screen-note">${esc(e.note)}</p>` : "") +
        colTable +
        (flows ? `<p class="wf-screen-flows">${esc(t.appearsIn)}: ${flows}</p>` : "") +
        `</section>`
      );
    })
    .join("");
  return `<h2 id="data">${esc(t.dataHeading)}</h2>${renderCrudMatrix(def, t)}${cards}`;
}

/**
 * フロー定義から自己完結型の静的 HTML（1ファイル・JS なし）を生成する。
 * 定義が不正な場合は、全エラーをまとめた Error を投げる。
 */
export function renderHtml(def: FlowDefinition, options: RenderOptions = {}): string {
  const result = validate(def);
  if (!result.ok) {
    throw new Error(`フロー定義にエラーがあります:\n- ${result.errors.join("\n- ")}`);
  }

  const t = LOCALES[def.lang ?? "ja"];
  const screensById = new Map(def.screens.map((s) => [s.id, s]));
  const entitiesById = new Map((def.entities ?? []).map((e) => [e.id, e]));
  const flowsByScreen = (screenId: string) =>
    def.flows.filter((f) => f.steps.some((st) => st.screen === screenId));

  const flowSections = def.flows.map((f) => renderFlowSection(f, screensById, entitiesById, t)).join("\n");
  const screenSections = def.screens
    .map((s) => renderScreenSection(s, flowsByScreen(s.id), t))
    .join("\n");

  const meta = [
    def.version ? `${esc(t.version)}: ${esc(def.version)}` : "",
    options.generatedAt ? `${esc(t.generated)}: ${esc(options.generatedAt)}` : "",
  ]
    .filter(Boolean)
    .join(t.metaSeparator);

  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(def.title)}</title>
<style>${buildCss(def.accent)}</style>
</head>
<body>
<header class="wf-doc-header">
<h1>${esc(def.title)}</h1>
${def.description ? `<p class="wf-doc-desc">${esc(def.description)}</p>` : ""}
${meta ? `<p class="wf-doc-meta">${meta}</p>` : ""}
</header>
<main>
${renderLegend(t)}
${renderToc(def, t)}
<h2 id="flows">${esc(t.flowsHeading)}</h2>
${flowSections}
<h2 id="screens">${esc(t.screensHeading)}</h2>
${screenSections}
${renderDataCatalog(def, t)}
${renderGlossary(def, entitiesById, t)}
</main>
<footer class="wf-doc-footer">${esc(t.footer)}</footer>
</body>
</html>
`;
}

#!/usr/bin/env node
/**
 * Context interview after the AdsPower key. Vietnamese, multiple choice, skippable.
 * Writes the local multi-store profile and roadmap.md + roadmap.yaml.
 * Does not print the API key, address, or profile id. Does not open a seller site.
 *
 *   node onboard-context.mjs --questions
 *   node onboard-context.mjs --save < answers.json
 *   node onboard-context.mjs --status
 *   node onboard-context.mjs --resuggest --as-of YYYY-MM-DD --results file
 *   node onboard-context.mjs --accept
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const MARKETS = ["PH", "MY", "ID", "VN", "TH", "SG"];
const PLATFORMS = new Set(["shopee", "lazada", "tiktokshop"]);
const STAGES = new Set(["A", "B", "C"]);
const GOALS = new Set(["doanh_thu", "loi_nhuan", "don", "thuong_hieu"]);
const TEAMS = new Set(["1", "2-5", "6+"]);
const CADENCE = new Set(["week", "month", "quarter"]);
const CADENCE_DAYS = { week: 7, month: 30, quarter: 90 };

export const QUESTIONS = `Phỏng vấn ngắn. Mỗi câu là trắc nghiệm. Trả lời "bỏ qua" để bỏ câu đó. Không câu nào bắt buộc.

1. Số cửa hàng?
   1) Một
   2) Nhiều

2. Sàn nào? Chọn một hoặc nhiều.
   1) Shopee
   2) TikTok Shop
   3) Lazada

3. Thị trường nào? Chọn một hoặc nhiều.
   1) PH
   2) MY
   3) ID
   4) VN
   5) TH
   6) SG

4. Với từng cửa hàng, giai đoạn nào?
   A) Cửa hàng mới
   B) Cửa hàng đang chạy nhưng chưa đạt
   C) Cửa hàng ổn định hoặc đang tăng
   Trả lời theo số, ví dụ: 1 A, 2 C. "bỏ qua" để trống giai đoạn cửa hàng đó.

5. Mục tiêu, nếu muốn nói. Chọn một hoặc nhiều, hoặc bỏ qua.
   1) Doanh thu
   2) Lợi nhuận
   3) Số đơn
   4) Thương hiệu

6. Quy mô đội, nếu muốn nói, hoặc bỏ qua.
   1) Một mình
   2) 2 đến 5 người
   3) Hơn 5 người

7. Lộ trình tự động hoá?
   1) Theo tuần
   2) Theo tháng
   3) Theo quý
   Bỏ qua thì chưa lập lịch.`;

const STAGE_NAME = {
  A: "Cửa hàng mới",
  B: "Cửa hàng đang chạy nhưng chưa đạt",
  C: "Cửa hàng ổn định hoặc đang tăng",
};
const GOAL_NAME = {
  doanh_thu: "Doanh thu",
  loi_nhuan: "Lợi nhuận",
  don: "Số đơn",
  thuong_hieu: "Thương hiệu",
};
const TEAM_NAME = { 1: "Một mình", "2-5": "2 đến 5 người", "6+": "Hơn 5 người" };
const CADENCE_NAME = { week: "tuần", month: "tháng", quarter: "quý" };

function planFor(platform) {
  const vouchers = platform === "lazada"
    ? "modules/lazada/promotions.md"
    : platform === "tiktokshop"
      ? "modules/tiktokshop/promotions.md"
      : "modules/shopee/vouchers-promotions.md";
  const invite = platform === "lazada"
    ? "modules/lazada/affiliate-invite.md"
    : platform === "tiktokshop"
      ? "modules/tiktokshop/creator-outreach.md"
      : "modules/shopee/affiliate-invite.md";
  const listingFix = platform === "lazada"
    ? "modules/lazada/listing-update.md"
    : platform === "tiktokshop"
      ? "modules/tiktokshop/listing-update.md"
      : "modules/shopee/listing-update.md";
  return {
    A: [
      ["policies/LAYER.md", "Cổng chính sách chạy cho sàn và thị trường này", "Kết quả cổng không phải BLOCK"],
      ["modules/listing/method.md", "Một listing qua hai lần QC", "Listing đã lưu khớp QC"],
      [invite, "Shortlist affiliate được duyệt trước khi mời", "Chỉ mời handle đã duyệt"],
      [vouchers, "Một voucher ở dạng đề xuất", "Chưa bấm lưu nếu chưa có yes"],
      ["modules/growth/ads-kickstart.md", "Đề xuất ads nhỏ có điểm dừng", "Chi phí nằm trong trần, không nạp tiền"],
    ],
    B: [
      ["modules/scale/health.md", "Đọc sức khoẻ shop từ trang chính thức", "Hai nguồn được nêu khi lệch"],
      ["modules/fees/fee-cap.md", "Phí trên GMV được tách từng khoản", "Không bấm tham gia chương trình"],
      ["modules/ads/spend-topup.md", "ROAS và số ngày số dư ads được đọc", "ROAS dưới sàn thì báo, không nạp tiền"],
      [listingFix, "Sửa listing theo QC", "Trường đã lưu khớp màn hình"],
      ["modules/orders/cancel-return.md", "Tỷ lệ huỷ và hoàn từ export", "Không huỷ đơn để đổi tỷ lệ"],
    ],
    C: [
      ["modules/scale/ads-scale.md", "Bước ads là đề xuất trong trần", "Không tăng ngân sách khi chưa có yes"],
      ["modules/scale/margin.md", "Biên lợi nhuận được đối chiếu doanh thu", "Báo khi doanh thu tăng mà biên giảm"],
      ["modules/scale/stock.md", "Ngày phủ tồn kho được tính", "Không đặt mua nếu chưa được duyệt"],
      ["modules/scale/expand.md", "Mở rộng thị trường ở trạng thái HOLD hoặc READY", "Không nhân listing khi HOLD"],
      ["modules/scale/team.md", "Việc và SLA được ghi", "Không tự duyệt ngân sách"],
      ["modules/scale/mall.md", "Điều kiện Mall hoặc brand được đối chiếu", "READY chỉ khi mọi mục bắt buộc là yes"],
    ],
  };
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function homeDir() {
  return join(homedir(), ".automate-ecom-store");
}

function configPath() {
  return arg("--config") || join(homeDir(), "config.yaml");
}

function readConfig(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeConfig(file, config) {
  const dir = join(file, "..");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  chmodSync(file, 0o600);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(path, header, rows) {
  const lines = [header.join(",")];
  for (const row of rows) lines.push(header.map((key) => csvEscape(row[key])).join(","));
  writeFileSync(path, `${lines.join("\n")}\n`);
}

function addDays(iso, days) {
  const parsed = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed)) return "";
  return new Date(parsed + days * 86400000).toISOString().slice(0, 10);
}

function dayNumber(iso) {
  const parsed = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(parsed) ? null : parsed / 86400000;
}

function yamlValue(value) {
  const text = String(value ?? "");
  if (/[:#\n"]/.test(text) || text.startsWith(" ") || text.endsWith(" ")) return JSON.stringify(text);
  return text;
}

export function stepsToYaml(doc) {
  const lines = [
    `cadence: ${yamlValue(doc.cadence)}`,
    `started: ${yamlValue(doc.started)}`,
    `period_end: ${yamlValue(doc.period_end)}`,
    `period_index: ${doc.period_index}`,
    "steps:",
  ];
  for (const step of doc.steps) {
    lines.push(`  - period: ${step.period}`);
    lines.push(`    stage: ${yamlValue(step.stage)}`);
    lines.push(`    store: ${yamlValue(step.store)}`);
    lines.push(`    platform: ${yamlValue(step.platform)}`);
    lines.push(`    market: ${yamlValue(step.market)}`);
    lines.push(`    module: ${yamlValue(step.module)}`);
    lines.push(`    milestone: ${yamlValue(step.milestone)}`);
    lines.push(`    kpi: ${yamlValue(step.kpi)}`);
    lines.push(`    status: ${yamlValue(step.status)}`);
  }
  return `${lines.join("\n")}\n`;
}

export function parseRoadmapYaml(text) {
  const doc = { cadence: "", started: "", period_end: "", period_index: 1, steps: [] };
  let current = null;
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/\r$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (line.startsWith("  - ")) {
      current = {};
      doc.steps.push(current);
      const body = line.slice(4);
      const split = body.indexOf(":");
      current[body.slice(0, split).trim()] = unquote(body.slice(split + 1).trim());
      continue;
    }
    if (line.startsWith("    ") && current) {
      const body = line.trim();
      const split = body.indexOf(":");
      current[body.slice(0, split).trim()] = unquote(body.slice(split + 1).trim());
      continue;
    }
    const split = line.indexOf(":");
    if (split < 0) continue;
    const key = line.slice(0, split).trim();
    const value = unquote(line.slice(split + 1).trim());
    if (key === "period_index") doc.period_index = Number(value) || 1;
    else if (key !== "steps") doc[key] = value;
  }
  return doc;
}

function unquote(value) {
  if (value.startsWith("\"") && value.endsWith("\"")) {
    try { return JSON.parse(value); } catch { return value.slice(1, -1); }
  }
  return value;
}

function periodOf(index, cadence, count) {
  if (cadence === "week") return index + 1;
  if (cadence === "month") return Math.floor(index / 2) + 1;
  const size = Math.max(1, Math.ceil(count / 3));
  return Math.min(3, Math.floor(index / size) + 1);
}

export function buildSteps(stores, cadence, started) {
  const steps = [];
  for (const store of stores) {
    if (!STAGES.has(store.stage)) continue;
    const items = planFor(store.platform)[store.stage];
    items.forEach((item, index) => {
      steps.push({
        period: cadence ? periodOf(index, cadence, items.length) : 0,
        stage: store.stage,
        store: store.label,
        platform: store.platform,
        market: store.market || "",
        module: item[0],
        milestone: item[1],
        kpi: item[2],
        status: cadence ? "planned" : "recommend",
      });
    });
  }
  const periodEnd = cadence && started ? addDays(started, CADENCE_DAYS[cadence] - 1) : "";
  return {
    cadence: cadence || "",
    started: started || "",
    period_end: periodEnd,
    period_index: 1,
    steps,
  };
}

function markdown(doc, context) {
  const lines = ["# Lộ trình", ""];
  lines.push(`Nhịp: ${CADENCE_NAME[doc.cadence] || "chưa chọn"}.`);
  if (doc.started) lines.push(`Bắt đầu: ${doc.started}. Hết kỳ 1: ${doc.period_end}.`);
  if (context.goals?.length) lines.push(`Mục tiêu: ${context.goals.map((goal) => GOAL_NAME[goal] || goal).join(", ")}.`);
  if (context.team_size) lines.push(`Đội: ${TEAM_NAME[context.team_size] || context.team_size}.`);
  lines.push("");
  for (const stage of ["A", "B", "C"]) {
    const rows = doc.steps.filter((step) => step.stage === stage);
    if (!rows.length) continue;
    const stores = [...new Set(rows.map((step) => step.store))].join(", ");
    lines.push(`## ${stage}. ${STAGE_NAME[stage]}`);
    lines.push("");
    lines.push(`Cửa hàng: ${stores}.`);
    lines.push("");
    for (const step of rows) {
      lines.push(`- Kỳ ${step.period}: \`${step.module}\`. Mốc: ${step.milestone}. KPI: ${step.kpi}.`);
    }
    lines.push("");
  }
  lines.push("Chủ shop có thể làm lại phỏng vấn bất kỳ lúc nào. Cuối mỗi kỳ, script chỉ đề xuất. File này không đổi cho đến khi chủ shop nhận đề xuất.");
  lines.push("");
  return lines.join("\n");
}

function normalizePlatform(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "tiktok" || text === "tiktok shop") return "tiktokshop";
  return text;
}

export function normalizeAnswers(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { error: "JSON object required" };
  if (payload.skip === true) return { skip: true };
  const storeCount = payload.store_count == null || payload.store_count === "" ? "" : String(payload.store_count);
  if (storeCount && storeCount !== "1" && storeCount !== "many") return { error: "store_count must be 1, many, or empty" };
  const platforms = [];
  for (const item of payload.platforms || []) {
    const platform = normalizePlatform(item);
    if (!PLATFORMS.has(platform)) return { error: "platform must be shopee, tiktokshop, or lazada" };
    if (!platforms.includes(platform)) platforms.push(platform);
  }
  const markets = [];
  for (const item of payload.markets || []) {
    const market = String(item || "").trim().toUpperCase();
    if (!market) continue;
    if (!MARKETS.includes(market)) return { error: "market must be PH, MY, ID, VN, TH, or SG" };
    if (!markets.includes(market)) markets.push(market);
  }
  const goals = [];
  for (const item of payload.goals || []) {
    const goal = String(item || "").trim();
    if (!GOALS.has(goal)) return { error: "goal must be doanh_thu, loi_nhuan, don, or thuong_hieu" };
    if (!goals.includes(goal)) goals.push(goal);
  }
  const team = payload.team_size == null || payload.team_size === "" ? "" : String(payload.team_size);
  if (team && !TEAMS.has(team)) return { error: "team_size must be 1, 2-5, 6+, or empty" };
  const cadence = payload.cadence == null || payload.cadence === "" ? "" : String(payload.cadence);
  if (cadence && !CADENCE.has(cadence)) return { error: "cadence must be week, month, quarter, or empty" };
  const stores = [];
  for (const store of payload.stores || []) {
    if (!store || typeof store.label !== "string" || !store.label.trim()) return { error: "each store needs a label" };
    const stage = store.stage == null || store.stage === "" ? "" : String(store.stage);
    if (stage && !STAGES.has(stage)) return { error: "stage must be A, B, C, or empty" };
    const market = store.market == null || store.market === "" ? "" : String(store.market).trim().toUpperCase();
    if (market && !MARKETS.includes(market)) return { error: "market must be PH, MY, ID, VN, TH, or SG" };
    stores.push({ label: store.label.trim(), stage, market });
  }
  return { storeCount, platforms, markets, goals, team, cadence, stores };
}

function applyAnswers(config, answers, today) {
  const byLabel = new Map(answers.stores.map((store) => [store.label, store]));
  const stores = (config.stores || []).map((store) => {
    const update = byLabel.get(store.label);
    if (!update) return store;
    return {
      ...store,
      stage: update.stage || store.stage || "",
      market: update.market || store.market || "",
    };
  });
  const known = new Set(stores.map((store) => store.label));
  const missing = answers.stores.filter((store) => !known.has(store.label)).map((store) => store.label);
  const context = {
    asked: true,
    skipped: false,
    store_count: answers.storeCount,
    platforms: answers.platforms,
    markets: answers.markets,
    goals: answers.goals,
    team_size: answers.team,
    cadence: answers.cadence,
  };
  const staged = stores.filter((store) => STAGES.has(store.stage)).map((store) => ({
    label: store.label,
    platform: store.platform,
    market: store.market || "",
    stage: store.stage,
  }));
  const doc = buildSteps(staged, answers.cadence, answers.cadence ? today : "");
  return { stores, context, doc, missing };
}

function writeRoadmap(dir, doc, context) {
  writeFileSync(join(dir, "roadmap.md"), markdown(doc, context));
  writeFileSync(join(dir, "roadmap.yaml"), stepsToYaml(doc));
  writeCsv(join(dir, "roadmap.csv"), [
    "period", "cadence", "stage", "store", "platform", "market", "module", "milestone", "kpi", "status",
  ], doc.steps.map((step) => ({ ...step, cadence: doc.cadence })));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "").replace(/^(?:#[^\n]*\n)+/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const kept = rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
  if (!kept.length) return [];
  const header = kept[0].map((cell) => cell.trim().toLowerCase());
  return kept.slice(1).map((cells) => {
    const record = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] || "").trim();
    });
    return record;
  });
}

export function resuggest(doc, results, asOf) {
  const end = dayNumber(doc.period_end);
  const today = dayNumber(asOf);
  if (!doc.cadence || end === null || today === null) return { error: "roadmap has no period" };
  if (today < end) return { wait: true };
  const current = doc.steps.filter((step) => Number(step.period) === Number(doc.period_index));
  const missed = [];
  const done = [];
  for (const step of current) {
    const row = results.find((item) => item.store === step.store && item.kpi === step.kpi);
    if (!row) return { need: step.kpi };
    if (String(row.met).toLowerCase() === "yes") done.push(step);
    else missed.push(step);
  }
  const later = doc.steps.filter((step) => Number(step.period) > Number(doc.period_index));
  const shift = missed.length ? 1 : 0;
  const nextIndex = Number(doc.period_index) + 1;
  const steps = [
    ...done.map((step) => ({ ...step, status: "done" })),
    ...missed.map((step) => ({ ...step, period: nextIndex, status: "repeat" })),
    ...later.map((step) => ({ ...step, period: Number(step.period) + shift, status: "planned" })),
  ];
  const started = addDays(doc.period_end, 1);
  return {
    doc: {
      cadence: doc.cadence,
      started,
      period_end: addDays(started, CADENCE_DAYS[doc.cadence] - 1),
      period_index: nextIndex,
      steps,
    },
  };
}

function printSummary(context, doc, missing) {
  const counts = { A: 0, B: 0, C: 0 };
  for (const step of doc.steps) {
    if (!counts[`seen:${step.store}`]) {
      counts[step.stage] += 1;
      counts[`seen:${step.store}`] = true;
    }
  }
  console.log("context: set");
  console.log(`store_count_answer: ${context.store_count || "skipped"}`);
  console.log(`platforms: ${context.platforms.join(" ") || "skipped"}`);
  console.log(`markets: ${context.markets.join(" ") || "skipped"}`);
  console.log(`stages: A ${counts.A} B ${counts.B} C ${counts.C}`);
  console.log(`cadence: ${context.cadence || "skipped"}`);
  console.log(`roadmap: ${doc.steps.length ? "written" : "none"}`);
  if (missing.length) console.log(`unknown_store: ${missing.join(" ")}`);
  console.log("result: OK");
}

function main() {
  const file = configPath();
  const dir = join(file, "..");
  if (process.argv.includes("--questions")) {
    console.log(QUESTIONS);
    console.log("result: QUESTIONS");
    return;
  }
  if (!existsSync(file)) {
    console.log("config: missing");
    console.log("result: MISSING");
    process.exit(1);
  }
  const config = readConfig(file);
  if (process.argv.includes("--status")) {
    const context = config.context || {};
    const state = context.asked ? (context.skipped ? "skipped" : "set") : "unset";
    console.log(`context: ${state}`);
    console.log(`cadence: ${context.cadence || "unset"}`);
    console.log("result: OK");
    return;
  }
  if (process.argv.includes("--accept")) {
    const suggestion = join(dir, "roadmap-suggestion.yaml");
    if (!existsSync(suggestion)) {
      console.log("suggestion: missing");
      console.log("result: MISSING");
      process.exit(1);
    }
    const doc = parseRoadmapYaml(readFileSync(suggestion, "utf8"));
    writeRoadmap(dir, doc, config.context || {});
    console.log("roadmap: replaced");
    console.log("result: ACCEPTED");
    return;
  }
  if (process.argv.includes("--resuggest")) {
    const roadmapFile = join(dir, "roadmap.yaml");
    const asOf = arg("--as-of");
    const resultsPath = arg("--results");
    if (!existsSync(roadmapFile) || !asOf || !resultsPath) {
      console.error("usage: node onboard-context.mjs --resuggest --as-of YYYY-MM-DD --results file");
      process.exit(2);
    }
    const doc = parseRoadmapYaml(readFileSync(roadmapFile, "utf8"));
    const outcome = resuggest(doc, parseCsv(readFileSync(resultsPath, "utf8")), asOf);
    if (outcome.wait) {
      console.log("result: WAIT");
      return;
    }
    if (outcome.need) {
      console.log(`missing_kpi: ${outcome.need}`);
      console.log("result: NEED_RESULTS");
      return;
    }
    if (outcome.error) {
      console.error(outcome.error);
      process.exit(2);
    }
    writeFileSync(join(dir, "roadmap-suggestion.md"), markdown(outcome.doc, config.context || {}));
    writeFileSync(join(dir, "roadmap-suggestion.yaml"), stepsToYaml(outcome.doc));
    writeCsv(join(dir, "roadmap-suggestion.csv"), [
      "period", "cadence", "stage", "store", "platform", "market", "module", "milestone", "kpi", "status",
    ], outcome.doc.steps.map((step) => ({ ...step, cadence: outcome.doc.cadence })));
    console.log(`next_period_end: ${outcome.doc.period_end}`);
    console.log(`repeat: ${outcome.doc.steps.filter((step) => step.status === "repeat").length}`);
    console.log("result: SUGGEST");
    return;
  }
  if (!process.argv.includes("--save")) {
    console.error("usage: node onboard-context.mjs (--questions | --status | --save | --resuggest --as-of DATE --results file | --accept)");
    process.exit(2);
  }
  if (process.stdin.isTTY) {
    console.error("stdin JSON required");
    process.exit(2);
  }
  let payload;
  try {
    payload = JSON.parse(readFileSync(0, "utf8"));
  } catch (error) {
    console.error(`payload_error: ${error.message}`);
    process.exit(2);
  }
  const answers = normalizeAnswers(payload);
  if (answers.error) {
    console.error(`payload_error: ${answers.error}`);
    process.exit(2);
  }
  if (answers.skip) {
    config.context = { ...(config.context || {}), asked: true, skipped: true };
    writeConfig(file, config);
    console.log("context: skipped");
    console.log(existsSync(join(dir, "roadmap.yaml")) ? "roadmap: kept" : "roadmap: none");
    console.log("result: SKIPPED");
    return;
  }
  const today = arg("--today") || new Date().toISOString().slice(0, 10);
  const applied = applyAnswers(config, answers, today);
  config.stores = applied.stores;
  config.context = applied.context;
  writeConfig(file, config);
  if (applied.doc.steps.length) writeRoadmap(dir, applied.doc, applied.context);
  printSummary(applied.context, applied.doc, applied.missing);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

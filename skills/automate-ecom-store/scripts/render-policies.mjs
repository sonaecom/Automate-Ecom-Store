#!/usr/bin/env node
/**
 * Write policies/<platform>/<market>.md from the shared summaries.
 * Does not fetch pages and does not change a seller setting.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "policies");
const retrieved = "2026-10-29";
const markets = ["PH", "VN", "MY", "ID", "TH", "SG"];

const hubs = {
  shopee: {
    PH: "https://seller.shopee.ph/edu/home",
    VN: "https://banhang.shopee.vn/edu/home",
    MY: "https://seller.shopee.com.my/edu/home",
    ID: "https://seller.shopee.co.id/edu/home",
    TH: "https://seller.shopee.co.th/edu/home",
    SG: "https://seller.shopee.sg/edu/home",
  },
  tiktokshop: {
    PH: "https://seller-ph.tiktok.com/university",
    VN: "https://seller-vn.tiktok.com/university",
    MY: "https://seller-my.tiktok.com/university",
    ID: "https://seller-id.tiktok.com/university",
    TH: "https://seller-th.tiktok.com/university",
    SG: "https://seller-sg.tiktok.com/university",
  },
  lazada: {
    PH: "https://www.lazada.com.ph/terms-conditions/",
    VN: "https://www.lazada.vn/terms-conditions/",
    MY: "https://www.lazada.com.my/terms-conditions/",
    ID: "https://www.lazada.co.id/terms-conditions/",
    TH: "https://www.lazada.co.th/terms-conditions/",
    SG: "https://www.lazada.sg/terms-conditions/",
  },
};

const names = { shopee: "Shopee", tiktokshop: "TikTok Shop", lazada: "Lazada" };

const verified = {
  "shopee:SG:review_rating": ["https://seller.shopee.sg/edu/article/6820", "no"],
  "shopee:SG:review_prize": ["https://seller.shopee.sg/edu/article/13356/review-prize", "no"],
  "shopee:SG:prohibited_restricted": ["https://seller.shopee.sg/edu/article/11697/anti-brushing-policy", "yes"],
  "shopee:PH:review_rating": ["https://seller.shopee.ph/edu/article/9703", "yes"],
  "shopee:MY:shop_page": ["https://seller.shopee.com.my/edu/article/1928", "yes"],
  "tiktokshop:SG:chat_off_platform": ["https://seller-sg.tiktok.com/university/essay?knowledge_id=7654182014502658&lang=en", "no"],
  "tiktokshop:SG:review_rating": ["https://seller-us.tiktok.com/university/essay?knowledge_id=4451321470682882&lang=en", "yes"],
  "lazada:SG:penalty_points": ["https://sellercenter.lazada.sg/helpcenter/s/faq/knowledge?questionId=1000145984", "yes"],
  "lazada:PH:data_privacy": ["https://www.lazada.com.ph/terms-conditions/", "no"],
};

function sourceFor(platform, market, id) {
  const hit = verified[`${platform}:${market}:${id}`];
  if (hit) return { source: hit[0], verify: hit[1] };
  return { source: hubs[platform][market], verify: "yes" };
}

function rules(platform, market) {
  const local = hubs[platform][market];
  const review = sourceFor(platform, market, "review_rating");
  const chat = sourceFor(platform, market, "chat_off_platform");
  const penalty = sourceFor(platform, market, "penalty_points");
  const privacy = sourceFor(platform, market, "data_privacy");
  const prohibited = sourceFor(platform, market, "prohibited_restricted");
  return [
    {
      id: "prohibited_restricted",
      status: "flag",
      ...prohibited,
      modules: "product-listing, prelaunch",
      match: "firearm; narcotic; counterfeit; replica",
      summary: `${names[platform]} prohibits prohibited, restricted, and counterfeit goods. The full list is on the local seller education or Seller Center page. Do not list an item the page names. This match list is only a few obvious words, not the whole catalogue.`,
    },
    {
      id: "listing_titles",
      status: "flag",
      ...sourceFor(platform, market, "listing_titles"),
      modules: "product-listing, ab-test",
      match: "",
      summary: "Titles must describe the product the buyer receives. Do not stuff keywords, competitor names, or claims the spec does not allow. The in-app counter wins over any draft length.",
    },
    {
      id: "listing_images",
      status: "flag",
      ...sourceFor(platform, market, "listing_images"),
      modules: "product-listing, ab-test",
      match: "before and after; 100% cure; whatsapp; zalo",
      summary: "Images must show the real product. Do not put a phone number, a chat app, a price that contradicts the listing, or a medical before-and-after on the picture. Exact crop and text limits differ by market. Re-read the local page before publish.",
    },
    {
      id: "keyword_spam",
      status: "flag",
      ...sourceFor(platform, market, "keyword_spam"),
      modules: "product-listing",
      match: "",
      summary: "Do not repeat keywords, hide text, or add unrelated brands to win search. If the form warns about spam, stop and shorten the title.",
    },
    {
      id: "misleading_claims",
      status: "block",
      ...sourceFor(platform, market, "misleading_claims"),
      modules: "product-listing, reviews-trust",
      match: "cures cancer; guaranteed cure; 100% effective",
      summary: "Do not claim a cure, a guaranteed result, or an official approval that is not in the spec and on the official page. verify is yes because the banned-claim list is market specific. The three phrases above are blocked anyway.",
    },
    {
      id: "pricing_promotion",
      status: "flag",
      ...sourceFor(platform, market, "pricing_promotion"),
      modules: "vouchers-promotions, ab-test, ads-kickstart",
      match: "",
      summary: "A price, a voucher, or a discount needs the owner's yes and the policy gate action price or publish. Do not show a crossed-out price the product never used. Do not invent a percent.",
    },
    {
      id: "review_rating",
      status: "block",
      source: review.source,
      verify: review.verify,
      modules: "post-delivery, reviews-trust, customer-chat",
      match: "5 stars; five stars; 5 sao; năm sao; bintang 5; 5 bintang; ห้าดาว; 5 ดาว",
      summary: "Do not ask for a star count, do not pay for a rating, and do not ask only happy buyers. One honest thank-you after delivery is allowed in the post-delivery module. A platform review reward, if the screen has one, must apply to any qualifying review.",
    },
    {
      id: "chat_off_platform",
      status: "block",
      source: chat.source,
      verify: chat.verify,
      modules: "post-delivery, customer-chat, affiliate-invite",
      match: "whatsapp; wa.me; telegram; t.me/; zalo; wechat; line.me",
      summary: "Keep buyer and creator messages inside the platform chat. Do not send a phone number, a personal chat app, or a link that takes the conversation off the platform.",
    },
    {
      id: "affiliate_creator",
      status: "flag",
      ...sourceFor(platform, market, "affiliate_creator"),
      modules: "affiliate-invite, creator-outreach",
      match: "",
      summary: "Invite creators only with the platform's own affiliate or creator tool. Do not promise income. Do not ask a creator to post a false review. Commission changes are proposals.",
    },
    {
      id: "ads",
      status: "flag",
      ...sourceFor(platform, market, "ads"),
      modules: "ads-kickstart, ads",
      match: "",
      summary: "Ad claims must match the listing. A budget increase needs the owner's yes for that amount. Do not top up from this skill. A prohibited product must not be advertised.",
    },
    {
      id: "shipping_sla",
      status: "flag",
      ...sourceFor(platform, market, "shipping_sla"),
      modules: "prelaunch, daily-report",
      match: "",
      summary: "Ship by the SLA shown in Seller Center for this market. The number of days is not copied here because it changes by channel and programme. Read the on-screen SLA before promising a date. verify: yes.",
    },
    {
      id: "penalty_points",
      status: "flag",
      source: penalty.source,
      verify: penalty.verify,
      modules: "account-security, alerts",
      match: "",
      summary: "Penalty or non-compliance points are read from Account Health. Do not guess the threshold. A rise in points is an owner alert, not a licence to change settings. Lazada SG's help page describes point milestones. Other markets must be re-read.",
    },
    {
      id: "returns_refunds",
      status: "flag",
      ...sourceFor(platform, market, "returns_refunds"),
      modules: "disputes, settlement, cancel-return",
      match: "",
      summary: "Follow the on-screen return and refund window. Do not refuse a case the page says is the seller's to accept. Filing a dispute is a proposal. Do not invent a deadline.",
    },
    {
      id: "account_automation",
      status: "block",
      ...sourceFor(platform, market, "account_automation"),
      modules: "account-safety, session-runner",
      match: "new-fingerprint; delete-cache",
      summary: "One profile per store. Do not run a second account to avoid a limit, do not share a login, and do not use an unofficial bot. This skill's visible paced browser is the allowed path. Headless mode and fingerprint changes stay forbidden.",
    },
    {
      id: "data_privacy",
      status: "block",
      source: privacy.source,
      verify: privacy.verify,
      modules: "post-delivery, retention, backup",
      match: "",
      summary: "Do not copy a buyer's address, phone, or full name into git, chat logs, or a sheet. Order ids and store labels are enough. Do not pretend to be the buyer or misstate who wrote a review.",
    },
    {
      id: "local_hub",
      status: "flag",
      source: local,
      verify: "yes",
      modules: "prelaunch",
      match: "",
      summary: `Local seller education or terms entry for ${names[platform]} ${market}. Re-read it before the first mutating action in this market.`,
    },
  ];
}

function render(platform, market) {
  const lines = [
    "---",
    `platform: ${platform}`,
    `market: ${market}`,
    `retrieved: ${retrieved}`,
    `source_url: ${hubs[platform][market]}`,
    "---",
    "",
    `# ${names[platform]} ${market} policy summary`,
    "",
    `Retrieved ${retrieved}. These are summaries of public seller pages, not a replacement for them. A rule with verify: yes must be opened on the official page before a mutating action. The gate still blocks a star-rating ask and an off-platform contact.`,
    "",
  ];
  for (const rule of rules(platform, market)) {
    lines.push(`### ${rule.id}`);
    lines.push(`- status: ${rule.status}`);
    lines.push(`- verify: ${rule.verify}`);
    lines.push(`- source: ${rule.source}`);
    lines.push(`- retrieved: ${retrieved}`);
    lines.push(`- modules: ${rule.modules}`);
    lines.push(`- match: ${rule.match}`);
    lines.push(`- summary: ${rule.summary}`);
    lines.push("");
  }
  lines.push("## Update log");
  lines.push("");
  lines.push("The weekly checker appends a row here when the official page hash changes. That row is a flag. It does not change a price, a budget, a listing, or a programme.");
  lines.push("");
  return lines.join("\n");
}

const sourceLines = [
  "# Official policy and seller-education URLs. The weekly checker reads these.",
  "# A hash change alerts the owner. It does not change a seller setting.",
  `retrieved: "${retrieved}"`,
  "",
  "sources:",
];
for (const platform of Object.keys(hubs)) {
  for (const market of markets) {
    sourceLines.push(`  - id: ${platform}-${market.toLowerCase()}-hub`);
    sourceLines.push(`    platform: ${platform}`);
    sourceLines.push(`    market: ${market}`);
    sourceLines.push("    topic: hub");
    sourceLines.push(`    url: ${hubs[platform][market]}`);
    sourceLines.push(`    retrieved: "${retrieved}"`);
  }
}
const extras = [
  ["shopee-sg-reviews", "shopee", "SG", "review_rating", "https://seller.shopee.sg/edu/article/6820"],
  ["shopee-sg-brushing", "shopee", "SG", "prohibited_restricted", "https://seller.shopee.sg/edu/article/11697/anti-brushing-policy"],
  ["shopee-sg-review-prize", "shopee", "SG", "review_prize", "https://seller.shopee.sg/edu/article/13356/review-prize"],
  ["shopee-ph-brushing", "shopee", "PH", "review_rating", "https://seller.shopee.ph/edu/article/9703"],
  ["tiktokshop-sg-chat", "tiktokshop", "SG", "chat_off_platform", "https://seller-sg.tiktok.com/university/essay?knowledge_id=7654182014502658&lang=en"],
  ["tiktokshop-us-reviews", "tiktokshop", "SG", "review_rating", "https://seller-us.tiktok.com/university/essay?knowledge_id=4451321470682882&lang=en"],
  ["lazada-sg-points", "lazada", "SG", "penalty_points", "https://sellercenter.lazada.sg/helpcenter/s/faq/knowledge?questionId=1000145984"],
];
for (const [id, platform, market, topic, url] of extras) {
  sourceLines.push(`  - id: ${id}`);
  sourceLines.push(`    platform: ${platform}`);
  sourceLines.push(`    market: ${market}`);
  sourceLines.push(`    topic: ${topic}`);
  sourceLines.push(`    url: ${url}`);
  sourceLines.push(`    retrieved: "${retrieved}"`);
}

for (const platform of Object.keys(hubs)) {
  for (const market of markets) {
    const path = join(root, platform, `${market}.md`);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, render(platform, market));
  }
}
writeFileSync(join(root, "sources.yaml"), `${sourceLines.join("\n")}\n`);
console.log("markets: 18");
console.log("result: OK");

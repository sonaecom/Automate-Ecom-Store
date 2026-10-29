/** Phrases that must not appear in a review follow-up. */

export const forbiddenPhrases = [
  [/5\s*[- ]?\s*stars?/i, "star_rating"],
  [/five\s*stars?/i, "star_rating"],
  [/5\s*sao/i, "star_rating"],
  [/năm\s*sao/i, "star_rating"],
  [/bintang\s*5/i, "star_rating"],
  [/5\s*bintang/i, "star_rating"],
  [/ห้า\s*ดาว/, "star_rating"],
  [/5\s*ดาว/, "star_rating"],
  [/only if you(?: are|'re)? (?:happy|satisfied)/i, "selective_ask"],
  [/nếu (?:bạn )?hài lòng/i, "selective_ask"],
  [/kalau (?:anda |kamu )?puas/i, "selective_ask"],
  [/jika berpuas hati/i, "selective_ask"],
  [/ถ้าพอใจ/, "selective_ask"],
  [/reward.{0,40}(?:review|rating|star)/i, "conditional_reward"],
  [/voucher.{0,40}(?:5|star|rating|review)/i, "conditional_reward"],
  [/đổi (?:quà|sao|voucher).{0,40}(?:sao|đánh giá)/i, "conditional_reward"],
  [/change your (?:review|rating)/i, "pressure"],
  [/sửa (?:đánh giá|sao)/i, "pressure"],
];

export function findForbidden(text) {
  const hits = [];
  for (const [pattern, label] of forbiddenPhrases) {
    if (pattern.test(text)) hits.push(label);
  }
  return hits;
}

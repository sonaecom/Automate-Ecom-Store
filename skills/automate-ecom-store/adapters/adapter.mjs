/**
 * Official seller API adapter. No keys live in this file.
 * A call the API cannot do throws BROWSER_ONLY.
 * A call the API can do throws NOT_CONFIGURED until the seller connects access
 * outside this repository.
 */

export const ADAPTERS = {
  shopee: {
    name: "Shopee Open Platform",
    docs: "https://open.shopee.com/documents",
    api: ["orders", "products", "ads_report", "wallet_read"],
    browser: ["listing_images", "affiliate_invite", "shop_decoration", "chat_reply", "captcha"],
  },
  tiktokshop: {
    name: "TikTok Shop Partner API",
    docs: "https://partner.tiktokshop.com/",
    api: ["orders", "products", "ads_report", "wallet_read"],
    browser: ["listing_images", "creator_outreach", "shop_decoration", "chat_reply", "captcha"],
  },
  lazada: {
    name: "Lazada Open Platform",
    docs: "https://open.lazada.com/",
    api: ["orders", "products", "ads_report", "wallet_read"],
    browser: ["listing_images", "affiliate_invite", "shop_decoration", "chat_reply", "captcha"],
  },
};

export function createAdapter(platform) {
  const spec = ADAPTERS[platform];
  if (!spec) {
    const error = new Error("UNKNOWN_PLATFORM");
    error.platform = platform;
    throw error;
  }
  return {
    platform,
    name: spec.name,
    docs: spec.docs,
    configured: false,
    async read(resource) {
      if (spec.browser.includes(resource) && !spec.api.includes(resource)) {
        const error = new Error("BROWSER_ONLY");
        error.resource = resource;
        throw error;
      }
      if (!spec.api.includes(resource)) {
        const error = new Error("BROWSER_ONLY");
        error.resource = resource;
        throw error;
      }
      const error = new Error("NOT_CONFIGURED");
      error.resource = resource;
      throw error;
    },
  };
}

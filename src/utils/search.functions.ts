import { createServerFn } from "@tanstack/react-start";
import { getDistinctDistricts, type Trade } from "./contractors";

export interface SearchFilters {
  trade: Trade | null;
  district: string | null;
  keywords: string[];
}

interface ParseResult {
  filters: SearchFilters;
  fallback: boolean;
}

const VALID_TRADES: Record<string, Trade> = {
  interior_renovation: "interior_renovation",
  air_conditioning: "air_conditioning",
  external_wall_pipe: "external_wall_pipe",
  truss_out_scaffolding: "truss_out_scaffolding",
};

const TRADE_SYNONYMS: Record<string, Trade> = {
  renovation: "interior_renovation",
  裝修: "interior_renovation",
  室內裝修: "interior_renovation",
  interior: "interior_renovation",
  ac: "air_conditioning",
  冷氣: "air_conditioning",
  "air-conditioning": "air_conditioning",
  "air conditioning": "air_conditioning",
  aircon: "air_conditioning",
  "external wall": "external_wall_pipe",
  外牆: "external_wall_pipe",
  pipe: "external_wall_pipe",
  喉管: "external_wall_pipe",
  scaffolding: "truss_out_scaffolding",
  棚架: "truss_out_scaffolding",
  scaffold: "truss_out_scaffolding",
  truss: "truss_out_scaffolding",
};

const ipRequestLog = new Map<string, number[]>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestLog.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  ipRequestLog.set(ip, recent);
  return true;
}

const DISTRICTS = getDistinctDistricts();

const SYSTEM_PROMPT = `You are a search query parser for a Hong Kong contractor directory.
Given a user's natural language query (in English or Chinese), extract:
1. "trade" — one of: interior_renovation, air_conditioning, external_wall_pipe, truss_out_scaffolding, or null
2. "district" — one of the 18 HK districts: ${DISTRICTS.join(", ")}, or null
3. "keywords" — any remaining search terms as an array of strings

Respond with ONLY valid JSON: {"trade": "...|null", "district": "...|null", "keywords": ["..."]}

Examples:
- "AC dripping in Yuen Long" → {"trade":"air_conditioning","district":"Yuen Long","keywords":["dripping"]}
- "scaffolding Kowloon" → {"trade":"truss_out_scaffolding","district":null,"keywords":["kowloon"]}
- "冷氣 觀塘" → {"trade":"air_conditioning","district":"Kwun Tong","keywords":[]}
- "裝修公司" → {"trade":"interior_renovation","district":null,"keywords":[]}`;

async function callGemini(query: string): Promise<SearchFilters | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nQuery: "${query}"` }] },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });

  const text = response.text;
  if (!text) return null;

  const parsed = JSON.parse(text) as Record<string, unknown>;

  const trade =
    typeof parsed.trade === "string" && parsed.trade in VALID_TRADES
      ? VALID_TRADES[parsed.trade]!
      : null;

  const district =
    typeof parsed.district === "string" && DISTRICTS.includes(parsed.district)
      ? parsed.district
      : null;

  const keywords = Array.isArray(parsed.keywords)
    ? (parsed.keywords as unknown[]).filter((k): k is string => typeof k === "string")
    : [];

  return { trade, district, keywords };
}

function localParse(query: string): SearchFilters {
  const lower = query.toLowerCase().trim();
  let trade: Trade | null = null;
  let district: string | null = null;
  const remaining: string[] = [];

  const words = lower.split(/\s+/);

  for (const word of words) {
    if (!trade && word in TRADE_SYNONYMS) {
      trade = TRADE_SYNONYMS[word]!;
      continue;
    }

    const matchedDistrict = DISTRICTS.find(
      (d) => d.toLowerCase() === word || d.toLowerCase().includes(word),
    );
    if (!district && matchedDistrict) {
      district = matchedDistrict;
      continue;
    }

    remaining.push(word);
  }

  if (!trade) {
    for (const [synonym, t] of Object.entries(TRADE_SYNONYMS)) {
      if (lower.includes(synonym)) {
        trade = t;
        break;
      }
    }
  }

  if (!district) {
    for (const d of DISTRICTS) {
      if (lower.includes(d.toLowerCase())) {
        district = d;
        break;
      }
    }
  }

  return { trade, district, keywords: remaining };
}

export const parseSearchQuery = createServerFn({ method: "GET" })
  .validator((data: { query: string }) => data)
  .handler(async ({ data }): Promise<ParseResult> => {
    const query = data.query.trim();
    if (!query) {
      return { filters: { trade: null, district: null, keywords: [] }, fallback: false };
    }

    const ip =
      (typeof globalThis !== "undefined" &&
        "process" in globalThis &&
        process.env.__CLIENT_IP) ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return { filters: localParse(query), fallback: true };
    }

    try {
      const geminiResult = await callGemini(query);
      if (geminiResult) {
        return { filters: geminiResult, fallback: false };
      }
    } catch {
      // Gemini failed — fall through to local parse
    }

    return { filters: localParse(query), fallback: true };
  });

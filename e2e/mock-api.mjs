// Minimal stand-in for the SideKick API used by the Playwright tests and local screenshots.
// PRICING_MODE=down → 503 for /v1/public/pricing. Inquiry email "limit@…" → 429, "bad@…" → 422 on email.
import http from "node:http";
import { pricing } from "./fixtures.ts";

const port = Number(process.env.MOCK_API_PORT ?? 4999);
export const received = [];
http
  .createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const send = (status, json) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(json)); };
      if (req.method === "GET" && req.url === "/v1/public/pricing") {
        return process.env.PRICING_MODE === "down" ? send(503, { code: "UNAVAILABLE" }) : send(200, pricing);
      }
      if (req.method === "POST" && req.url === "/v1/public/inquiries") {
        if (req.headers.authorization !== "Bearer test-site-token") return send(401, { code: "UNAUTHORIZED" });
        const data = JSON.parse(body || "{}");
        if (String(data.email).startsWith("limit@")) return send(429, { code: "RATE_LIMITED" });
        if (String(data.email).startsWith("bad@")) return send(422, { code: "VALIDATION_FAILED", issues: [{ path: ["email"], message: "Invalid email" }] });
        received.push({ headers: req.headers, data });
        return send(201, { id: "inq_1" });
      }
      if (req.url === "/__received") return send(200, received);
      send(404, { code: "NOT_FOUND" });
    });
  })
  .listen(port, "127.0.0.1", () => console.log(`mock SideKick API on :${port}`));

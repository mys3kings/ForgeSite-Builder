import { Router, type IRouter } from "express";
import {
  GenerateForgeSiteBody,
  GenerateForgeSiteResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const systemPrompt =
  "You are a React expert. Generate a single modern React component using Tailwind CSS for the website described. Use beautiful UI, real dummy data, responsive. Return only code.";

router.post("/forge/generate", async (req, res): Promise<void> => {
  const input = GenerateForgeSiteBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }

  const apiKey = process.env["GEMINI_API_KEY"]?.trim();
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY is not configured");
    res.status(500).json({ error: "Gemini is not configured on the server." });
    return;
  }

  try {
    const model = "gemini-3.8-flash";
    const maxAttempts = 2;
    let response: Response | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: input.data.prompt }] }],
          generationConfig: { maxOutputTokens: 8192 },
        }),
        },
      );
      if (response.ok) break;
      if (![429, 503].includes(response.status) || attempt === maxAttempts) {
        break;
      }
      req.log.warn(
        { model, status: response.status, attempt },
        "Gemini model is busy; retrying",
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!response?.ok) {
      const upstreamError = response ? await response.text() : "No response";
      req.log.error(
        {
          status: response?.status,
          upstreamError: upstreamError.slice(0, 1000),
        },
        "Gemini website generation failed",
      );
      res.status(502).json({ error: "Gemini could not generate the website." });
      return;
    }

    const result = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const rawCode = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!rawCode) {
      req.log.warn("Gemini returned no website code");
      res.status(502).json({ error: "Gemini returned an empty website." });
      return;
    }

    const code = rawCode
      .replace(/^```(?:jsx?|tsx?|javascript|js)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    res.json(GenerateForgeSiteResponse.parse({ code }));
  } catch (error) {
    req.log.error({ err: error }, "Gemini website generation request failed");
    res.status(502).json({ error: "Gemini could not generate the website." });
  }
});

export default router;

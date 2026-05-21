import type { NextApiRequest, NextApiResponse } from "next";

export type XerberusPlatform = "ipor" | "morpho" | "spark";

export type XerberusVault = {
	id: string;
	name: string;
	platform: XerberusPlatform;
	address: string;
	score: number | null;
};

type SuccessBody = { status: "success"; data: XerberusVault[] };
type ErrorBody = { status: "error"; message: string };

const ALLOWED_PLATFORMS: XerberusPlatform[] = ["ipor", "morpho", "spark"];

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuccessBody | ErrorBody>) {
	if (req.method !== "GET") {
		res.setHeader("Allow", "GET");
		return res.status(405).json({ status: "error", message: "Method Not Allowed" });
	}

	const platform = typeof req.query.platform === "string" ? req.query.platform : "";
	if (!ALLOWED_PLATFORMS.includes(platform as XerberusPlatform)) {
		return res.status(400).json({
			status: "error",
			message: `platform must be one of: ${ALLOWED_PLATFORMS.join(", ")}`,
		});
	}

	const baseUrl = process.env.XERBERUS_API_URL;
	const apiKey = process.env.XERBERUS_API_KEY;
	const userEmail = process.env.XERBERUS_USER_EMAIL;

	if (!baseUrl || !apiKey || !userEmail) {
		return res.status(500).json({
			status: "error",
			message: "Xerberus API is not configured (XERBERUS_API_URL, XERBERUS_API_KEY, XERBERUS_USER_EMAIL).",
		});
	}

	try {
		const upstream = await fetch(`${baseUrl.replace(/\/$/, "")}/vault/list?platform=${encodeURIComponent(platform)}`, {
			method: "GET",
			headers: {
				"x-api-key": apiKey,
				"x-user-email": userEmail,
				accept: "application/json",
			},
		});

		const body = (await upstream.json().catch(() => null)) as SuccessBody | ErrorBody | null;

		if (!upstream.ok || !body || body.status !== "success") {
			const message = body && "message" in body ? body.message : `Upstream request failed (${upstream.status})`;
			return res.status(upstream.status || 502).json({ status: "error", message });
		}

		return res.status(200).json(body);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error contacting Xerberus API";
		return res.status(502).json({ status: "error", message });
	}
}

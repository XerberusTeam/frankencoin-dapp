import { useEffect, useState } from "react";
import type { XerberusPlatform, XerberusVault } from "../pages/api/vaults/list";

type Result = {
	data: XerberusVault[];
	loading: boolean;
	error: string | null;
};

export function useVaultList(platform: XerberusPlatform): Result {
	const [data, setData] = useState<XerberusVault[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();

		setLoading(true);
		setError(null);

		fetch(`/api/vaults/list?platform=${encodeURIComponent(platform)}`, { signal: controller.signal })
			.then(async (res) => {
				const body = await res.json();
				if (!res.ok || body.status !== "success") {
					throw new Error(body?.message ?? `Request failed (${res.status})`);
				}
				setData(body.data as XerberusVault[]);
			})
			.catch((err) => {
				if (err.name === "AbortError") return;
				setError(err instanceof Error ? err.message : "Unknown error");
				setData([]);
			})
			.finally(() => setLoading(false));

		return () => controller.abort();
	}, [platform]);

	return { data, loading, error };
}

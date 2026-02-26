"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
	show: boolean;
};

export default function UpdateSuccessToast({ show }: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const [visible, setVisible] = useState(show);

	useEffect(() => {
		if (!show) {
			setVisible(false);
			return;
		}

		setVisible(true);
		const timer = window.setTimeout(() => {
			setVisible(false);
			router.replace(pathname, { scroll: false });
		}, 3000);

		return () => window.clearTimeout(timer);
	}, [show, router, pathname]);

	if (!visible) return null;

	return (
		<div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg border border-emerald-700">
			保存が完了しました
		</div>
	);
}

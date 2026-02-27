import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db"; // パスは環境に合わせてください
import { profiles, friendships } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friend } from "./actions/friend";
import Link from "next/link";

// ランダムな8桁のフレンドコードを生成する関数
function generateFriendCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default async function FriendsPage() {
    // 1. Clerkからユーザー情報を取得（Usernameを含む）
    const user = await currentUser();
    if (!user) redirect("/");

    const userId = user.id;

    // 2. 自分のプロフィールがDBにあるか確認、なければ自動作成（ClerkのUsernameを利用）
    let [myProfile] = await db.select().from(profiles).where(eq(profiles.userId, userId));

    if (!myProfile) {
        const newCode = generateFriendCode();
        // Clerkのusernameを取得。設定されていなければ代替名を使用
        const displayName = user.username || "名無しモデラー";

        [myProfile] = await db.insert(profiles).values({
            userId,
            displayName,
            friendCode: newCode,
        }).returning();
    }

    // 3. 自分宛ての「フレンド申請（PENDING）」を取得
    const pendingRequests = await db
        .select({
            friendshipId: friendships.id,
            requesterName: profiles.displayName,
        })
        .from(friendships)
        .innerJoin(profiles, eq(friendships.requesterId, profiles.userId))
        .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "PENDING")));

    // 4. 現在のフレンド一覧（ACCEPTED）を取得
    const myFriends = await db
        .select({
            friendId: profiles.userId,
            friendName: profiles.displayName,
        })
        .from(friendships)
        .innerJoin(
            profiles,
            // 自分が申請した側か、された側かを判定して相手のプロフィールを結合
            or(
                and(eq(friendships.requesterId, userId), eq(profiles.userId, friendships.addresseeId)),
                and(eq(friendships.addresseeId, userId), eq(profiles.userId, friendships.requesterId))
            )
        )
        .where(
            and(
                or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
                eq(friendships.status, "ACCEPTED")
            )
        );

    // --- Server Actions ---

    // フレンド申請を送る
    async function sendRequest(formData: FormData) {
        "use server";
        const targetCode = formData.get("friendCode") as string;
        if (!targetCode || targetCode === myProfile.friendCode) return;

        // コードから相手のユーザーを探す
        const [targetProfile] = await db.select().from(profiles).where(eq(profiles.friendCode, targetCode));
        if (!targetProfile) return; // 該当なし

        // 既に申請済み・フレンド済みかチェック（簡易版）
        const existing = await db.select().from(friendships).where(
            or(
                and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, targetProfile.userId)),
                and(eq(friendships.requesterId, targetProfile.userId), eq(friendships.addresseeId, userId))
            )
        );
        if (existing.length > 0) return;

        // 申請レコードを作成
        await db.insert(friendships).values({
            requesterId: userId,
            addresseeId: targetProfile.userId,
            status: "PENDING",
        });
        revalidatePath("/friends");
    }

    // フレンド申請を承認する
    async function acceptRequest(formData: FormData) {
        "use server";
        const friendshipId = formData.get("friendshipId") as string;

        await db.update(friendships)
            .set({ status: "ACCEPTED", updatedAt: new Date() })
            .where(eq(friendships.id, friendshipId));

        revalidatePath("/friends");
    }

    // --- UI表示 ---
    return (
        <main className="min-h-screen p-8 max-w-2xl mx-auto">
            <div className="mb-6">
                <Link href="/" className="text-blue-600 hover:underline">← ホームに戻る</Link>
            </div>

            <header className="mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold">フレンド管理</h1>
                <p className="mt-2 text-gray-700">
                    あなたの名前: <strong>{myProfile.displayName}</strong>
                </p>
                <p className="text-gray-700">
                    あなたのフレンドコード: <strong className="text-lg bg-gray-100 px-2 py-1 tracking-widest">{myProfile.friendCode}</strong>
                </p>
            </header>

            {/* 申請フォーム */}
            <section className="mb-8 p-4 bg-white border rounded shadow-sm">
                <h2 className="font-bold mb-2">フレンドを追加</h2>
                <form action={sendRequest} className="flex gap-2">
                    <input
                        type="text"
                        name="friendCode"
                        placeholder="相手の8桁のコードを入力"
                        className="border p-2 rounded flex-1 uppercase"
                        maxLength={8}
                        required
                    />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        申請を送る
                    </button>
                </form>
            </section>

            {/* 承認待ちリスト */}
            {pendingRequests.length > 0 && (
                <section className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded shadow-sm">
                    <h2 className="font-bold mb-2 text-yellow-800">届いているフレンド申請</h2>
                    <ul className="space-y-2">
                        {pendingRequests.map(req => (
                            <li key={req.friendshipId} className="flex justify-between items-center bg-white p-2 border rounded">
                                <span><strong>{req.requesterName}</strong> さんから</span>
                                <form action={acceptRequest}>
                                    <input type="hidden" name="friendshipId" value={req.friendshipId} />
                                    <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                        承認する
                                    </button>
                                </form>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* 現在のフレンド一覧 */}
            <section>
                <h2 className="font-bold mb-2 border-b pb-1">フレンド一覧</h2>
                {myFriends.length === 0 ? (
                    <p className="text-gray-500 text-sm">まだフレンドがいません。</p>
                ) : (
                    <ul className="space-y-2">
                        {myFriends.map(friend => (
                            <li key={friend.friendId} className="p-3 border rounded shadow-sm flex justify-between items-center bg-white">
                                <span className="font-medium">{friend.friendName}</span>
                                <Link
                                    href={`/friends/${friend.friendId}`}
                                    className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded hover:bg-blue-100 transition"
                                >
                                    コレクションを見る
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

        </main>
    );
}
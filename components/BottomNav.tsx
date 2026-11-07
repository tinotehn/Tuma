//components/BotomNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav(){
    const path = usePathname();
    const active = (p: string) => path === p ? "text-forest" : "text-forest/40";

    return(
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-forest max-w-md mx-auto">
            <div className="flex justify-around py-3">
                <Link href="/" className={`flex flex-col items-center test-xs ${active ("/")}`}>
                <span className="text-lg"></span>Home
                </Link>
                <Link href="/send/peer" className={`flex flex-col items-center test-xs ${active ("/send/peer")}`}>
                <span className="text-lg"></span>P2P
                </Link>
                <Link href="/settings" className={`flex flex-col items-center test-xs ${active ("/settings")}`}>
                <span className="text-lg"></span>Settings
                </Link>
            </div>
        </div>
    );
}
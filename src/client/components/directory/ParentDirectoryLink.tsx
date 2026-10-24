import { ArrowUp } from "lucide-react";
import { Link } from "react-router";
import { directoryUrl } from "./directoryUrl";

export function ParentDirectoryLink({ path }: { path: string }) {
  const parentPath = path.split("/").slice(0, -1).join("/");
  return (
    <Link
      className="fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] left-[calc(16px+env(safe-area-inset-left,0px))] z-10 inline-flex min-h-14 items-center gap-2.5 rounded-full border border-[#b4df94] bg-[#a5cf86] px-5 py-3 font-semibold text-[#182b19] shadow-[0_4px_20px_#0006] hover:bg-[#b4df94]"
      aria-label="親ディレクトリへ戻る"
      to={directoryUrl(parentPath)}
    >
      <ArrowUp className="size-4 shrink-0" aria-hidden="true" />
      <span>親へ戻る</span>
    </Link>
  );
}

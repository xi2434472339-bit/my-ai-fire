import { Cloud, CloudOff, Loader2, Wifi } from "lucide-react";
import { useLedgerStore } from "@/store/useLedgerStore";
import { cn } from "@/lib/utils";
import { isCloudSyncEnabled } from "@/lib/tcb";

const statusConfig = {
  local: {
    icon: CloudOff,
    label: "本地测试模式",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  connecting: {
    icon: Loader2,
    label: "连接云端...",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  synced: {
    icon: Cloud,
    label: "云端已同步",
    className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  error: {
    icon: Wifi,
    label: "同步失败",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
} as const;

export function SyncStatus() {
  const syncStatus = useLedgerStore((s) => s.syncStatus);
  const cloudEnabled = isCloudSyncEnabled();
  const config = statusConfig[syncStatus];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
      )}
      title={
        !cloudEnabled
          ? "云端同步已禁用，数据仅保存在本地浏览器"
          : syncStatus === "synced"
            ? "多人修改会实时同步"
            : config.label
      }
    >
      <Icon className={cn("h-3.5 w-3.5", syncStatus === "connecting" && "animate-spin")} />
      {config.label}
    </div>
  );
}


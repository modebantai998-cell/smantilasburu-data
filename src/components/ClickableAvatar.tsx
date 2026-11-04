import { UserAvatar } from "@/components/UserAvatar";
import { openProfileViewer } from "@/components/ProfileViewer";
import { cn } from "@/lib/utils";

type ClickableAvatarProps = {
  profileId: string;
  avatarUrl: string | null;
  fullName: string;
  className?: string;
};

/** Avatar yang ketika diklik membuka penayangan profil layar penuh. */
export function ClickableAvatar({ profileId, avatarUrl, fullName, className }: ClickableAvatarProps) {
  return (
    <button
      type="button"
      aria-label={`Lihat profil ${fullName}`}
      title="Lihat profil"
      onClick={(event) => {
        event.stopPropagation();
        openProfileViewer(profileId);
      }}
      className={cn("shrink-0 rounded-full transition-transform hover:scale-105", className)}
    >
      <UserAvatar avatarUrl={avatarUrl} fullName={fullName} className="size-full" />
    </button>
  );
}

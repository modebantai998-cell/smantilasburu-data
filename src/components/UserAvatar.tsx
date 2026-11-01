import { useQuery } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveImageSrc } from "@/lib/storage";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  avatarUrl: string | null;
  fullName: string;
  className?: string;
};

export function UserAvatar({ avatarUrl, fullName, className }: UserAvatarProps) {
  const { data } = useQuery({
    queryKey: ["avatar-src", avatarUrl],
    enabled: Boolean(avatarUrl),
    queryFn: () => resolveImageSrc("chat-images", avatarUrl as string),
    staleTime: 1000 * 60 * 30,
  });

  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Avatar className={cn("size-10 border-2 border-border bg-secondary", className)}>
      {data ? <AvatarImage src={data} alt={fullName} /> : null}
      <AvatarFallback className="bg-primary font-extrabold text-primary-foreground">
        {initials || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

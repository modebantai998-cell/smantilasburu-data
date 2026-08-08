import { useQuery } from "@tanstack/react-query";
import { ImageOff } from "lucide-react";

import { resolveImageSrc } from "@/lib/storage";
import { cn } from "@/lib/utils";

type StoredImageProps = {
  bucket: string;
  value: string;
  alt: string;
  className?: string;
};

export function StoredImage({ bucket, value, alt, className }: StoredImageProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["image-src", bucket, value],
    queryFn: () => resolveImageSrc(bucket, value),
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return <div className={cn("animate-pulse bg-muted", className)} />;
  }

  if (!data) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <ImageOff className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return <img src={data} alt={alt} loading="lazy" className={className} />;
}

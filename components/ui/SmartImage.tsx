import Image, { type ImageProps } from "next/image";

type SmartImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string;
  alt?: string;
};

export default function SmartImage({
  src = "",
  alt = "",
  sizes = "100vw",
  priority,
  loading,
  fetchPriority,
  ...rest
}: SmartImageProps) {
  const resolvedLoading = priority ? "eager" : (loading ?? "lazy");
  const resolvedFetchPriority = priority ? "high" : (fetchPriority ?? "low");

  return (
    <Image
      src={typeof src === "string" ? src : ""}
      alt={alt}
      sizes={sizes}
      priority={priority}
      loading={resolvedLoading}
      fetchPriority={resolvedFetchPriority}
      width={rest.fill ? undefined : (rest.width ?? 1600)}
      height={rest.fill ? undefined : (rest.height ?? 1200)}
      {...rest}
    />
  );
}

type SectionHeaderProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  as?: "h1" | "h2";
};

export default function SectionHeader({
  kicker,
  title,
  subtitle,
  as = "h2",
}: SectionHeaderProps) {
  const HeadingTag = as;

  return (
    <div className="sectionHeader">
      {kicker ? <div className="kicker">{kicker}</div> : null}
      <HeadingTag className="h2">{title}</HeadingTag>
      {subtitle ? <p className="p">{subtitle}</p> : null}
    </div>
  );
}

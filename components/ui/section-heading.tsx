import Link from "next/link";
import Eyebrow from "./eyebrow";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  titleId?: string;
  href?: string;
  linkLabel?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  titleId,
  href,
  linkLabel = "Se alle →",
}: SectionHeadingProps) {
  return (
    <div className="sectionHeading">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 id={titleId}>{title}</h2>
      </div>
      {href && (
        <Link href={href} className="sectionLink">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

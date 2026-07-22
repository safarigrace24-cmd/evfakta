import Link from "next/link";
import Eyebrow from "./eyebrow";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
};

export default function SectionHeading({ eyebrow, title, href, linkLabel = "Se alle →" }: SectionHeadingProps) {
  return (
    <div className="sectionHeading">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2>{title}</h2>
      </div>
      {href && (
        <Link href={href} className="sectionLink">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

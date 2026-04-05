import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugifyHeading } from "@/lib/blog-shared";

type MarkdownContentProps = {
  content: string;
};

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: () => null,
        a: ({ href, children, ...props }) => (
          <a href={href} {...props} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        img: ({ src = "", alt = "" }) => (
          <Image
            src={typeof src === "string" ? src : ""}
            alt={alt}
            width={1600}
            height={900}
            loading="lazy"
            sizes="(max-width: 900px) 100vw, 720px"
            style={{ width: "100%", height: "auto" }}
          />
        ),
        h2: ({ children, ...props }) => {
          const title = String(children).trim();
          return (
            <h2 id={slugifyHeading(title)} {...props}>
              {children}
            </h2>
          );
        },
        h3: ({ children, ...props }) => {
          const title = String(children).trim();
          return (
            <h3 id={slugifyHeading(title)} {...props}>
              {children}
            </h3>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

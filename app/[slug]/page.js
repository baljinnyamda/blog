import { Fragment } from "react";
import { readdir, readFile } from "fs/promises";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import Link from "../Link";
import { sans } from "../fonts";
import remarkSmartpants from "remark-smartypants";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkMdxEvalCodeBlock } from "./mdx.js";
import overnight from "overnight/themes/Overnight-Slumber.json";
import "./markdown.css";
import remarkGfm from "remark-gfm";

overnight.colors["editor.background"] = "var(--code-bg)";

export default async function PostPage({ params }) {
  const { slug } = await params;
  const filename = "./public/" + slug + "/index.md";
  const file = await readFile(filename, "utf8");
  let postComponents = {};
  try {
    postComponents = await import("../../public/" + slug + "/components.js");
  } catch (e) {
    if (!e || e.code !== "MODULE_NOT_FOUND") {
      throw e;
    }
  }
  let Wrapper = postComponents.Wrapper ?? Fragment;
  const { content, data } = matter(file);

  return (
    <>
      <article>
        <h1 className={[sans.className, "text-[40px] font-black leading-[44px] text-[--title]"].join(" ")}>
          {data.title}
        </h1>
        <p className="mt-2 text-[13px] text-gray-700 dark:text-gray-300">
          {new Date(data.date).toLocaleDateString("en", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <div className="markdown">
          <Wrapper>
            <MDXRemote
              source={content}
              components={{
                a: Link,
                img: ({ src, ...rest }) => {
                  if (src && !/^https?:\/\//.test(src)) {
                    // https://github.com/gaearon/blog.balj.in/issues/827
                    src = `/${slug}/${src}`;
                  }
                  return <img src={src} {...rest} />;
                },
                ...postComponents,
              }}
              options={{
                mdxOptions: {
                  useDynamicImport: true,
                  remarkPlugins: [remarkSmartpants, remarkGfm, [remarkMdxEvalCodeBlock, filename]],
                  rehypePlugins: [
                    [
                      rehypePrettyCode,
                      {
                        theme: overnight,
                      },
                    ],
                    [rehypeSlug],
                    [
                      rehypeAutolinkHeadings,
                      {
                        behavior: "wrap",
                        properties: {
                          className: "linked-heading",
                          target: "_self",
                        },
                      },
                    ],
                  ],
                },
              }}
            />
          </Wrapper>
        </div>
      </article>
    </>
  );
}

export async function generateStaticParams() {
  const entries = await readdir("./public/", { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  return dirs.map((dir) => ({ slug: dir }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const file = await readFile("./public/" + slug + "/index.md", "utf8");
  let { data } = matter(file);
  return {
    title: data.title + " — bdayan",
    description: data.spoiler,
  };
}

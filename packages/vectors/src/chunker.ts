import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getEncoding, Tiktoken } from "@dqbd/tiktoken";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { Root, Content, Heading } from "mdast";
import { toString } from "mdast-util-to-string";
import matter from "gray-matter";
import { PolicyScope } from "@ironsight/common";

export type ChunkMetadata = {
  tenantId: string;
  documentId: string;
  versionId: string;
  scope: PolicyScope;
  facilityId?: string | null;
  path: string[];
  headings: string[];
  chunkIndex: number;
};

export type HierarchicalChunk = {
  id: string;
  text: string;
  tokenCount: number;
  metadata: ChunkMetadata;
};

const encoder: Tiktoken = getEncoding("cl100k_base");

if (typeof process !== "undefined") {
  process.once("exit", () => encoder.free());
}

function tokenLength(text: string): number {
  return encoder.encode(text).length;
}

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 64,
  lengthFunction: tokenLength,
  separators: ["\n## ", "\n# ", "\n", " "]
});

function normalizeHeading(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

type Section = {
  path: string[];
  body: string;
};

function flattenMarkdown(markdown: string): Section[] {
  const { content } = matter(markdown);
  const tree = unified().use(remarkParse).parse(content) as Root;
  const sections: Section[] = [];
  const headingStack: string[] = [];
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    sections.push({ path: [...headingStack], body: buffer.join("\n").trim() });
    buffer = [];
  };

  function handleNode(node: Content) {
    if (node.type === "heading") {
      flushBuffer();
      const heading = normalizeHeading(toString(node));
      const depth = (node as Heading).depth;
      headingStack.splice(depth - 1);
      headingStack[depth - 1] = heading;
      return;
    }

    const value = toString(node);
    if (value) {
      buffer.push(value);
    }
  }

  tree.children.forEach((node) => handleNode(node as Content));
  flushBuffer();

  if (sections.length === 0) {
    sections.push({ path: [], body: content });
  }

  return sections.filter((section) => section.body.length > 0);
}

export type ChunkerOptions = {
  tenantId: string;
  documentId: string;
  versionId: string;
  facilityId?: string | null;
  scope: PolicyScope;
};

export async function chunkMarkdown(markdown: string, options: ChunkerOptions): Promise<HierarchicalChunk[]> {
  const sections = flattenMarkdown(markdown);
  const metadata = sections.map((section) => ({
    path: section.path,
    headings: section.path,
  }));
  const documents = await splitter.createDocuments(
    sections.map((section) => section.body),
    metadata,
  );

  let chunkCounter = 0;
  return documents.map((doc) => {
    const text = doc.pageContent.trim();
    const tokenCount = tokenLength(text);
    const metadata: ChunkMetadata = {
      tenantId: options.tenantId,
      documentId: options.documentId,
      versionId: options.versionId,
      scope: options.scope,
      facilityId: options.facilityId ?? null,
      path: (doc.metadata.path as string[]) ?? [],
      headings: (doc.metadata.headings as string[]) ?? [],
      chunkIndex: chunkCounter++,
    };

    return {
      id: `${options.versionId}-${metadata.chunkIndex}`,
      text,
      tokenCount,
      metadata,
    } satisfies HierarchicalChunk;
  });
}

import path from "path";
import glob from "fast-glob";
import prettyFormat from "pretty-format";
import { render } from "@marko/testing-library";

type ContainerNode = DocumentFragment | Element;
interface ComponentFixtures {
  name: string;
  path: string;
  component: unknown;
  fixturesPath: string;
  fixtures: Record<
    string,
    {
      name: string;
      path: string;
      ext: string;
      fixture: unknown;
      render: () => ReturnType<typeof render>;
      toString: (n?: typeof defaultNormalizer) => Promise<string>;
    }
  >;
}

const { DOMElement, DOMCollection } = prettyFormat.plugins;

export function findComponentFixtures(
  componentPath: string,
  { fixtureDir = "fixtures" } = {}
) {
  const componentName = inferName(componentPath);
  const fixturesPath = path.join(path.dirname(componentPath), fixtureDir);
  const fixtures = glob
    .sync("*.{json,marko}", { cwd: fixturesPath })
    .map((fixtureRelativePath: string) => {
      const fixturePath = path.join(fixturesPath, fixtureRelativePath);
      const fixtureExtension = path.extname(fixturePath);
      const fixtureName = path
        .basename(fixturePath)
        .slice(0, -1 * fixtureExtension.length);
      const renderFn =
        fixtureExtension === ".json"
          ? () => render(require(componentPath), require(fixturePath))
          : () => render(require(fixturePath));
      return {
        async toString(normalizer = defaultNormalizer) {
          const result = await renderFn();
          return defaultSerializer(normalizer(result.container));
        },
        get fixture() {
          return require(fixturePath);
        },
        path: fixturePath,
        ext: fixtureExtension,
        name: fixtureName,
        render: renderFn
      };
    })
    .reduce(
      (lookup, current) => {
        lookup[current.name] = current;
        return lookup;
      },
      {} as ComponentFixtures["fixtures"]
    );
  if (Object.keys(fixtures).length) {
    return {
      get component() {
        return require(componentPath);
      },
      path: componentPath,
      name: componentName,
      fixturesPath,
      fixtures
    } as ComponentFixtures;
  }
}

export function findProjectFixtures(
  cwd: string,
  { ignore = ["node_modules"], fixtureDir = "fixtures" } = {}
) {
  return glob
    .sync("**/*.marko", { cwd, ignore })
    .map((componentRelativePath: string) => {
      const componentPath = path.join(cwd, componentRelativePath);
      return findComponentFixtures(componentPath, { fixtureDir });
    })
    .filter(Boolean) as ComponentFixtures[];
}

export function defaultSerializer(container: ContainerNode) {
  return Array.from(container.childNodes)
    .map((n: Node) => prettyFormat(n, { plugins: [DOMElement, DOMCollection] }))
    .join("\n");
}

const SHOW_ELEMENT = 1;
const SHOW_COMMENT = 128;
const COMMENT_NODE = 8;
export function defaultNormalizer(container: ContainerNode) {
  const clone = container.cloneNode(true) as ContainerNode;
  const document = container.ownerDocument!;
  const treeWalker = document.createTreeWalker(
    clone,
    SHOW_ELEMENT & SHOW_COMMENT
  );

  let node: Comment | Element;
  while ((node = treeWalker.nextNode() as Comment | Element)) {
    if (node.nodeType === COMMENT_NODE) {
      (node as Comment).remove();
    } else {
      Array.from((node as Element).attributes)
        .map(attr => attr.name)
        .filter(attrName => /^data-(w-|widget$|marko$)/.test(attrName))
        .forEach(attrName => (node as Element).removeAttribute(attrName));
    }
  }

  clone.normalize();

  return clone;
}

function inferName(p: string) {
  const match = /\/([^/]+)\/([^/]+)\.marko$/.exec(p)!;
  const indexOrTemplate = match[2] === "index" || match[2] === "template";
  return indexOrTemplate ? match[1] : match[2];
}

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
    .sync("!(*.marko.).{json,marko,js}", { cwd: fixturesPath })
    .map((fixtureRelativePath: string) => {
      const fixturePath = path.join(fixturesPath, fixtureRelativePath);
      const fixtureExtension = path.extname(fixturePath);
      const fixtureName = path
        .basename(fixturePath)
        .slice(0, -1 * fixtureExtension.length);
      let component = require(componentPath);
      component = component.default || component;
      const renderFn =
        [".json", ".js"].indexOf(fixtureExtension) !== -1
          ? () => render(component, require(fixturePath))
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
    .reduce((lookup, current) => {
      lookup[current.name] = current;
      return lookup;
    }, {} as ComponentFixtures["fixtures"]);
  if (Object.keys(fixtures).length) {
    return {
      get component() {
        let component = require(componentPath);
        component = component.default || component;
        return component;
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
  const idMap: Map<string, number> = new Map();
  const clone = container.cloneNode(true) as ContainerNode;
  const document = container.ownerDocument!;
  const commentAndElementWalker = document.createTreeWalker(
    clone,
    SHOW_ELEMENT | SHOW_COMMENT
  );

  let node: Comment | Element;
  let nextNode = commentAndElementWalker.nextNode();
  while ((node = nextNode as Comment | Element)) {
    nextNode = commentAndElementWalker.nextNode();
    if (isComment(node)) {
      node.remove();
    } else {
      const { id, attributes } = node;
      if (/\d/.test(id)) {
        let idIndex = idMap.get(id);

        if (idIndex === undefined) {
          idIndex = idMap.size;
          idMap.set(id, idIndex);
        }

        node.id = `GENERATED-${idIndex}`;
      }

      for (let i = attributes.length; i--; ) {
        const attr = attributes[i];

        if (/^data-(w-|widget$|marko(-|$))/.test(attr.name)) {
          node.removeAttributeNode(attr);
        }
      }
    }
  }

  if (idMap.size) {
    const elementWalker = document.createTreeWalker(clone, SHOW_ELEMENT);

    nextNode = elementWalker.nextNode();
    while ((node = nextNode as Element)) {
      nextNode = elementWalker.nextNode();
      const { attributes } = node;

      for (let i = attributes.length; i--; ) {
        const attr = attributes[i];
        const { value } = attr;
        const updated = value
          .split(" ")
          .map(part => {
            const idIndex = idMap.get(part);
            if (idIndex === undefined) {
              return part;
            }

            return `GENERATED-${idIndex}`;
          })
          .join(" ");

        if (value !== updated) {
          attr.value = updated;
        }
      }
    }
  }

  clone.normalize();

  return clone;
}

const sep = `\\${path.sep}`;
const nameRegex = new RegExp(`${sep}(([^${sep}]+)${sep}([^${sep}]+)\\.marko$)`);
function inferName(p: string) {
  const match = nameRegex.exec(p)!;
  const indexOrTemplate = match[2] === "index" || match[2] === "template";
  return indexOrTemplate ? match[1] : match[2];
}

function isComment(node: Node): node is Comment {
  return node.nodeType === COMMENT_NODE;
}

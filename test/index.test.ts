import path from "path";
import { findComponentFixtures, findProjectFixtures } from "../src/index";

expect.addSnapshotSerializer({
  test(val) {
    return typeof val._ === "function" && val.meta && val.meta.id && val.path;
  },
  print(val, printer) {
    // @ts-ignore
    return `[Component ${printer(val.path)}]`;
  }
});

expect.addSnapshotSerializer({
  test(val) {
    return typeof val === "string" && val.includes(process.cwd());
  },
  print(val) {
    // @ts-ignore
    return JSON.stringify(val.replace(process.cwd(), "(cwd)"));
  }
});

describe("findComponentFixtures", () => {
  test("finds fixtures", () => {
    expect(
      findComponentFixtures(
        path.join(__dirname, "components", "hello", "index.marko")
      )
    ).toMatchInlineSnapshot(`
      Object {
        "component": [Component "(cwd)/test/components/hello/index.marko"],
        "fixtures": Object {
          "data": Object {
            "ext": ".json",
            "fixture": Object {
              "name": "Data",
            },
            "name": "data",
            "path": "(cwd)/test/components/hello/fixtures/data.json",
            "render": [Function],
            "toString": [Function],
          },
          "template": Object {
            "ext": ".marko",
            "fixture": [Component "(cwd)/test/components/hello/fixtures/template.marko"],
            "name": "template",
            "path": "(cwd)/test/components/hello/fixtures/template.marko",
            "render": [Function],
            "toString": [Function],
          },
        },
        "fixturesPath": "(cwd)/test/components/hello/fixtures",
        "name": "hello",
        "path": "(cwd)/test/components/hello/index.marko",
      }
    `);
  });
});

describe("findProjectFixtures", () => {
  test("finds fixtures", () => {
    expect(findProjectFixtures(__dirname)).toMatchInlineSnapshot(`
      Array [
        Object {
          "component": [Component "(cwd)/test/components/container/index.marko"],
          "fixtures": Object {
            "data": Object {
              "ext": ".js",
              "fixture": Object {
                "model": Promise {},
                "renderBody": [Function],
              },
              "name": "data",
              "path": "(cwd)/test/components/container/fixtures/data.js",
              "render": [Function],
              "toString": [Function],
            },
            "template": Object {
              "ext": ".marko",
              "fixture": [Component "(cwd)/test/components/container/fixtures/template.marko"],
              "name": "template",
              "path": "(cwd)/test/components/container/fixtures/template.marko",
              "render": [Function],
              "toString": [Function],
            },
          },
          "fixturesPath": "(cwd)/test/components/container/fixtures",
          "name": "container",
          "path": "(cwd)/test/components/container/index.marko",
        },
        Object {
          "component": [Component "(cwd)/test/components/fancy-form/index.marko"],
          "fixtures": Object {
            "data": Object {
              "ext": ".json",
              "fixture": Object {
                "firstName": "Michael",
                "lastName": "Rawlings",
              },
              "name": "data",
              "path": "(cwd)/test/components/fancy-form/fixtures/data.json",
              "render": [Function],
              "toString": [Function],
            },
          },
          "fixturesPath": "(cwd)/test/components/fancy-form/fixtures",
          "name": "fancy-form",
          "path": "(cwd)/test/components/fancy-form/index.marko",
        },
        Object {
          "component": [Component "(cwd)/test/components/hello/index.marko"],
          "fixtures": Object {
            "data": Object {
              "ext": ".json",
              "fixture": Object {
                "name": "Data",
              },
              "name": "data",
              "path": "(cwd)/test/components/hello/fixtures/data.json",
              "render": [Function],
              "toString": [Function],
            },
            "template": Object {
              "ext": ".marko",
              "fixture": [Component "(cwd)/test/components/hello/fixtures/template.marko"],
              "name": "template",
              "path": "(cwd)/test/components/hello/fixtures/template.marko",
              "render": [Function],
              "toString": [Function],
            },
          },
          "fixturesPath": "(cwd)/test/components/hello/fixtures",
          "name": "hello",
          "path": "(cwd)/test/components/hello/index.marko",
        },
      ]
    `);
  });
});

import fs from "fs";
import path from "path";
import assert from "assert";
import { cleanup } from "@marko/testing-library";
import {
  findProjectFixtures,
  findClosestComponentFixtures,
  defaultNormalizer
} from "./";

declare const before: (fn: () => any) => any;

export default runProjectSnapshotTests;
export function runProjectSnapshotTests(
  dir: string,
  { normalize = defaultNormalizer, ...otherOptions } = {}
) {
  findProjectFixtures(dir, otherOptions).forEach(component => {
    describe(component.name, () => {
      before(cleanup);
      afterEach(cleanup);
      Object.keys(component.fixtures).forEach(name => {
        it(name, async () => {
          const fixture = component.fixtures[name];
          snapshot(
            fixture.path.replace(fixture.ext, ".html"),
            await fixture.toString(normalize)
          );
        });
      });
    });
  });
}

export function runComponentSnapshotTests({
  normalize = defaultNormalizer,
  ...otherOptions
} = {}) {
  const component = findClosestComponentFixtures({ ...otherOptions, depth: 1 });

  if (!component) {
    throw new Error("Unable to find a component with fixtures");
  }

  describe(component.name + " fixtures", () => {
    before(cleanup);
    afterEach(cleanup);
    Object.keys(component.fixtures).forEach(name => {
      it(name, async () => {
        const fixture = component.fixtures[name];
        snapshot(
          fixture.path.replace(fixture.ext, ".html"),
          await fixture.toString(normalize)
        );
      });
    });
  });
}

function snapshot(file: string, contents: string) {
  if (process.env.UPDATE_SNAPSHOTS) {
    fs.writeFileSync(file, contents, "utf-8");
  } else {
    const expected = fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : "";

    try {
      assert.equal(contents, expected);
    } catch (err) {
      err.snapshot = true;
      err.name = err.name.replace(" [ERR_ASSERTION]", "");
      err.message = `${path.relative(process.cwd(), file)}\n\n${err.message}`;

      throw err;
    }
  }
}

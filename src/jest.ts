import { cleanup } from "@marko/testing-library";
import {
  findProjectFixtures,
  findClosestComponentFixtures,
  defaultNormalizer
} from "./";
import { toMatchFile } from "jest-file-snapshot";

expect.extend({ toMatchFile });

export default runProjectSnapshotTests;
export function runProjectSnapshotTests(
  path: string,
  { normalize = defaultNormalizer, ...otherOptions } = {}
) {
  findProjectFixtures(path, otherOptions).forEach(component => {
    describe(component.name, () => {
      beforeAll(cleanup);
      afterEach(cleanup);
      Object.keys(component.fixtures).forEach(name => {
        it(name, async () => {
          const fixture = component.fixtures[name];
          expect(await fixture.toString(normalize)).toMatchFile(
            fixture.path.replace(fixture.ext, ".html")
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

  describe("fixtures", () => {
    beforeAll(cleanup);
    afterEach(cleanup);
    Object.keys(component.fixtures).forEach(name => {
      it(name, async () => {
        const fixture = component.fixtures[name];
        expect(await fixture.toString(normalize)).toMatchFile(
          fixture.path.replace(fixture.ext, ".html")
        );
      });
    });
  });
}

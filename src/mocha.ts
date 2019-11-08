import fs from "fs";
import path from "path";
import assert from "assert";
import { findProjectFixtures, defaultNormalizer } from "./";

export default function snapshotComponentFixtures(
  dir: string,
  { normalize = defaultNormalizer, ...otherOptions } = {}
) {
  findProjectFixtures(dir, otherOptions).forEach(component => {
    describe(component.name, () => {
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

import { describe, expect, it } from "vitest";
import { prepareProjectFiles } from "./project-files";

function projectFile(path: string, contents: string, type = "") {
  return {
    name: path.split("/").at(-1)!,
    size: new TextEncoder().encode(contents).byteLength,
    type,
    webkitRelativePath: path,
    text: async () => contents,
  };
}

describe("project folder preparation", () => {
  it("keeps source files and removes generated, binary, lock, and secret files", async () => {
    const project = await prepareProjectFiles([
      projectFile("demo/src/styles.css", "body { color: black; }"),
      projectFile("demo/node_modules/pkg/index.js", "generated"),
      projectFile("demo/public/logo.png", "binary", "image/png"),
      projectFile("demo/.env", "API_KEY=secret"),
      projectFile("demo/package-lock.json", "{}"),
      projectFile("demo/src/index.ts", "export const answer = 42;"),
    ]);

    expect(project).toMatchObject({
      rootName: "demo",
      includedFiles: 2,
      ignoredFiles: 4,
      language: "typescript",
      limited: false,
    });
    expect(project.code).toBe(
      "/* file: src/index.ts */\nexport const answer = 42;\n\n" +
        "/* file: src/styles.css */\nbody { color: black; }",
    );
    expect(project.code).not.toContain("secret");
    expect(project.code).not.toContain("generated");
  });

  it("stops before the client-side size budget is exceeded", async () => {
    const project = await prepareProjectFiles(
      [
        projectFile("demo/a.ts", "1234"),
        projectFile("demo/b.ts", "5678"),
      ],
      5,
    );

    expect(project.includedFiles).toBe(1);
    expect(project.ignoredFiles).toBe(1);
    expect(project.limited).toBe(true);
    expect(project.code).toContain("1234");
    expect(project.code).not.toContain("5678");
  });
});

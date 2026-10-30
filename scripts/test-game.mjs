import ts from "typescript";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = path.join(root, ".next", "game-tests");
const program = ts.createProgram([path.join(root, "tests", "game.test.ts")], {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  rootDir: root,
  outDir: output,
  strict: true,
  esModuleInterop: true,
  skipLibCheck: true,
  noEmitOnError: true,
  types: ["node"],
});
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  process.stderr.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => root,
    getCanonicalFileName: (filename) => filename,
    getNewLine: () => "\n",
  }));
  process.exitCode = 1;
} else {
  program.emit();
  const result = spawnSync(process.execPath, ["--test", path.join(output, "tests", "game.test.js")], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
}

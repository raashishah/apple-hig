declare const process: {
  cwd(): string;
  argv: string[];
  stdout: { write(chunk: string): void };
  stderr: { write(chunk: string): void };
  exit(code: number): never;
};

declare module "node:fs" {
  export type Dirent = {
    name: string;
    isDirectory(): boolean;
  };
  export function existsSync(file: string): boolean;
  export function readFileSync(file: string, encoding: "utf8"): string;
  export function writeFileSync(file: string, data: string): void;
  export function mkdirSync(file: string, options: { recursive: boolean }): void;
  export function readdirSync(file: string, options: { withFileTypes: true }): Dirent[];
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
  export function dirname(file: string): string;
}


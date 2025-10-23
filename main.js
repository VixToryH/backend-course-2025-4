import http from "http";
import fs from "fs/promises";
import { Command } from "commander";

const program = new Command();

program
  .requiredOption("-i, --input <path>", "шлях до файлу для читання")
  .requiredOption("-h, --host <host>", "адреса сервера")
  .requiredOption("-p, --port <port>", "порт сервера");

program.parse(process.argv);
const options = program.opts();

async function readData(path) {
  try {
    const data = await fs.readFile(path, "utf8");
    return data;
  } catch {
    throw new Error("Cannot find input file");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    await readData(options.input);
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Сервер працює, файл знайдено ");
  } catch (err) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(err.message);
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Сервер запущено на http://${options.host}:${options.port}`);
});

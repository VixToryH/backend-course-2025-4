import http from "http";
import fs from "fs/promises"; //працює через асинхронні проміси (не колбеки)
import { Command } from "commander";
import { XMLBuilder } from "fast-xml-parser";
import url from "url";

const program = new Command();

program
  .requiredOption("-i, --input <path>", "шлях до файлу для читання")
  .requiredOption("-h, --host <host>", "адреса сервера")
  .requiredOption("-p, --port <port>", "порт сервера");

program.parse(process.argv);
const options = program.opts(); //повертає всі зчитані опції у вигляді об’єкта

async function readData(path) {
  try {
    const raw = await fs.readFile(path, "utf8");

    const records = raw //-----
      .trim()
      .split(/\r?\n/)
      .filter(line => line)
      .map(line => JSON.parse(line));

    return records;
  } catch {
    throw new Error("Cannot find input file");
  }
}


const server = http.createServer(async (req, res) => {
  try {
    const query = url.parse(req.url, true).query;

    const irisData = await readData(options.input);

    let filtered = irisData;
    if (query.min_petal_length) {
      const minLen = parseFloat(query.min_petal_length);
      filtered = filtered.filter(f => f["petal.length"] > minLen);
    }

    const result = filtered.map(f => {
      const obj = {
        petal_length: f["petal.length"],
        petal_width: f["petal.width"],
      };
      if (query.variety === "true") {
        obj.variety = f.variety;
      }      
      return obj;
    });

    const builder = new XMLBuilder({ format: true });
    const xml = builder.build({ irises: { flower: result } });

    res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
    res.end(xml);
  } catch (err) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(err.message);
  }
});

server.listen(options.port, options.host, () => {
 console.log(`Сервер запущено на http://${options.host}:${options.port}`);

});
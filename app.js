const repl = require('repl');
const CommandGenerator = require('./command-generator');
const sqlite3 = require('sqlite3').verbose();
const sqlScripts = require('./db-scripts');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.simple()
  ),
  transports: [new winston.transports.File({ filename: 'commandHistory.log' })],
});

let commandHistory = {
  first: '',
};

let db = new sqlite3.Database('./warehouse-data.db', err => {
  if (err) {
    return console.error(err.message);
  }
});

db.run(sqlScripts.ClearProducts, [], err => {
  if (err) console.log(err);
});
db.run(sqlScripts.ClearWarehouses, [], err => {
  if (err) console.log(err);
});
db.run(sqlScripts.ClearStocked, [], err => {
  if (err) console.log(err);
});

let replServer = repl.start({
  prompt: 'warehouse-fun > ',
  eval: evaluate,
  useGlobal: true,
  replMode: repl.REPL_MODE_STRICT,
});

async function evaluate(cmd, context, filename, callback) {
  try {
    cmd = cmd.replace(/\n$/, '');
    // check command history if modulas == 0 save last 2 to a file
    if (commandHistory.first === '') commandHistory.first = cmd;
    else {
      // save using winston
      logger.info(commandHistory.first);
      logger.info(cmd);
      commandHistory.first = '';
    }

    const commandGenerator = new CommandGenerator(cmd, db);
    // get command object
    const command = await commandGenerator.getCommand();

    // execute command
    let successMessage = await command.execute();

    callback(console.log(successMessage));
  } catch (e) {
    callback(console.log(e.toString()));
  }
}

const commandGenerator = require('./command-generator');
const sqlite3 = require('sqlite3').verbose();
const sqlScripts = require('./db-scripts');
let db = new sqlite3.Database(':memory:', err => {
  if (err) {
    return err.message;
  }
});
function initializeDb() {
  return new Promise((res, rej) => {
    db.all(sqlScripts.CreateProductTable, [], err => {});
    db.run(sqlScripts.CreateWarehouseTable, [], err => {});
    db.run(sqlScripts.CreateStockTable, [], err => {
      res();
    });
  });
}
function clearDb() {
  return new Promise((res, rej) => {
    db.run(sqlScripts.ClearProducts, [], err => {});
    db.run(sqlScripts.ClearWarehouses, [], err => {});
    db.run(sqlScripts.ClearStocked, [], err => {
      res();
    });
  });
}
beforeAll(async () => {
  await initializeDb();
});
afterEach(async () => {
  await clearDb();
});

test('Returns Bad Command', async () => {
  const commandGen = new commandGenerator('PRODUCT', null);

  let error = 'Invalid Command';

  try {
    await commandGen.getCommand();
  } catch (e) {
    expect(e.toString()).toMatch(error);
  }
});
test('Returns Bad Command', async () => {
  const commandGen = new commandGenerator('ADD PRODUCT', null);

  let error = 'Error: Invalid Product Name';

  try {
    await commandGen.getCommand();
  } catch (e) {
    expect(e.toString()).toMatch(error);
  }
});

test('Returns Bad Command', async () => {
  const commandGen = new commandGenerator('ADD PRODUCT "asd"', null);

  let error = 'Error: No SKU provided';

  try {
    await commandGen.getCommand();
  } catch (e) {
    expect(e.toString()).toMatch(error);
  }
});
test('Returns Bad Command', async () => {
  const commandGen = new commandGenerator('ADD PRODUCT "" 12112-324eeds', null);

  let error = 'Error: No product name supplied';

  try {
    await commandGen.getCommand();
  } catch (e) {
    expect(e.toString()).toMatch(error);
  }
});
test('Returns Bad Command', async () => {
  const commandGen = new commandGenerator('ADD WAREHOUSE', null);

  let error = 'Warehouse number is not an Integer';

  try {
    await commandGen.getCommand();
  } catch (e) {
    expect(e.toString()).toMatch(error);
  }
});
test('Returns Bad Command', async () => {
  const commandGen = new commandGenerator('ADD WAREHOUSE dfg');

  let error = 'Warehouse number is not an Integer';

  try {
    await commandGen.getCommand();
  } catch (e) {
    expect(e.toString()).toMatch(error);
  }
});
test('Returns bad command', async () => {
  const commandGen = new commandGenerator(
    'ADD PRODUCT "WEE" 2142S-ASDFSA-3SDFAF hukh'
  );

  let error = 'Error: Invalid SKU';

  try {
    await commandGen.getCommand();
  } catch (e) {
    expect(e.toString()).toMatch(error);
  }
});

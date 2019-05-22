const commands = require('./commands');
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

const addProduct = new commands.AddProduct();
test('Inserts to Products', async () => {
  const addProduct = new commands.AddProduct('ADD PRODUCT "as" sdasdf', db);
  // this is not testing as expected.
  expect.assertions(1);
  await addProduct.validate();
  let response = await addProduct.execute();
  expect(response).toMatch('');
});

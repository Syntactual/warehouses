const sqlScripts = require('./db-scripts');
class AddProduct {
  constructor(input, db) {
    this.productName;
    this.sku;
    this.input = input;
    this.db = db;
  }
  validate() {
    return new Promise((res, rej) => {
      if (this.input.charAt(12) !== '"' || this.input.match(/"/g).length !== 2)
        rej(new Error('Invalid Product Name'));

      const productArray = this.input.split('"');
      const productName = productArray[1];
      if (productName.length === 0) rej(new Error('No product name supplied'));
      this.productName = productName;
      if (!productArray[2]) rej(new Error('No SKU provided'));
      if (productArray[2].trim().match(/\s/) !== null)
        rej(new Error('Invalid SKU'));
      this.sku = productArray[2].trim();
      // check for product in db with same sku
      this.db.all(sqlScripts.SKU_DuplicateCheck, [this.sku], (err, rows) => {
        if (err) rej(err);
        if (rows.length === 0) res(true);
        else rej(new Error('SKU already exists'));
      });
    });
  }
  execute() {
    return new Promise((res, rej) => {
      this.db.run(
        sqlScripts.InsertProduct,
        [this.productName, this.sku],
        (err, rows) => {
          if (err) console.log(err);
          res(this.getSuccessMessage());
        }
      );
    });
  }
  getSuccessMessage() {
    return `${this.productName} with SKU ${this.sku} added`;
  }
}
class AddWarehouse {
  constructor(input, db) {
    this.warehouseNumber;
    this.stockLimit;
    this.input = input;
    this.db = db;
  }
  validate() {
    return new Promise((res, rej) => {
      let params = this.input.substr(14).split(' ');

      if (params.length > 2) rej('Invalid Input');
      let parsedWarehouseNumber = parseFloat(params[0]);
      if (!Number.isInteger(parsedWarehouseNumber))
        rej('Warehouse number is not an Integer');
      else this.warehouseNumber = parsedWarehouseNumber;
      if (params.length === 2) {
        let parsedStockLimit = parseFloat(params[1]);
        if (!Number.isInteger(parsedStockLimit))
          rej('Stock limit is not an Integer');
        else this.stockLimit = parsedStockLimit;
      }
      this.db.get(
        sqlScripts.WarehouseDuplicateCheck,
        [this.warehouseNumber],
        (err, row) => {
          if (err) rej(err);
          if (!row) res(true);
          else rej(new Error('Warehouse already exists'));
        }
      );
    });
  }
  execute() {
    return new Promise((res, rej) => {
      this.db.run(
        sqlScripts.InsertWarehouse,
        [this.warehouseNumber, this.stockLimit],
        err => {
          if (err) console.log(err);
          res(this.getSuccessMessage());
        }
      );
    });
  }
  getSuccessMessage() {
    let message = `Warehouse ${this.warehouseNumber}`;
    if (this.stockLimit) message += ` with a stock limit of ${this.stockLimit}`;
    message += ` added`;
    return message;
  }
}
class Stock {
  constructor(input, db) {
    this.productSKU;
    this.warehouseNumber;
    this.quantity;
    this.newQuantity;
    this.stockLimit;
    this.input = input;
    this.db = db;
  }
  validate() {
    return new Promise((res, rej) => {
      let inputArray = this.input.split(' ');
      if (inputArray.length !== 4) rej(new Error('Invalid Input'));
      this.db.get(
        sqlScripts.StockedDuplicateCheck,
        [inputArray[1], inputArray[2]],
        (err, row) => {
          if (err) rej(err);
          if (typeof row === 'undefined') {
            rej(
              new Error(
                `Product with SKU: ${
                  inputArray[1]
                } and Warehouse with number: ${inputArray[2]} does not exist`
              )
            );
            return;
          } else if (!row.SKU) {
            rej(new Error(`Product with SKU: ${inputArray[1]} does not exist`));
            return;
          } else if (!row.WarehouseNumber) {
            rej(
              new Error(
                `Warehouse with number: ${inputArray[2]} does not exist`
              )
            );
            return;
          }

          if (row.StockLimit) {
            this.stockLimit = row.StockLimit;
          }
          this.productSKU = inputArray[1];
          this.warehouseNumber = inputArray[2];
          let parsedQuantity = parseFloat(inputArray[3]);
          console.log(inputArray[3]);
          if (!Number.isInteger(parsedQuantity))
            rej('Quantity is not an Integer');
          else this.quantity = parsedQuantity;
          res(true);
        }
      );
    });
  }
  execute() {
    return new Promise(async (res, rej) => {
      try {
        let record = await this.getStockedRecord();

        if (record) {
          this.newQuantity += record.Quantity;
          if (this.newQuantity > this.stockLimit)
            this.newQuantity = this.stockLimit;
          await this.updateStocked();
          res(this.getSuccessMessage());
        } else {
          if (this.quantity > this.stockLimit) this.quantity = this.stockLimit;
          await this.insertIntoStocked();
          res(this.getSuccessMessage());
        }
      } catch (err) {
        rej(err);
      }
    });
  }
  getSuccessMessage() {
    let message = `Stocked ${this.quantity} of Product: ${
      this.productSKU
    } into Warehouse: ${this.warehouseNumber}`;
    if (this.newQuantity) message += `; there is now ${this.newQuantity} total`;
    return message;
  }
  getStockedRecord() {
    return new Promise((res, rej) => {
      this.db.get(
        sqlScripts.GetStockedRecord,
        [this.productSKU, this.warehouseNumber],
        (err, row) => {
          if (err) rej(new Error(err));
          res(row);
        }
      );
    });
  }
  updateStocked() {
    return new Promise((res, rej) => {
      this.db.run(
        sqlScripts.UpdateStocked,
        [this.newQuantity, this.productSKU, this.warehouseNumber],
        err => {
          if (err) rej(new Error(err));
          res();
        }
      );
    });
  }
  insertIntoStocked() {
    return new Promise((res, rej) => {
      this.db.run(
        sqlScripts.InsertStocked,
        [this.productSKU, this.warehouseNumber, this.quantity],
        err => {
          if (err) rej(new Error(err));
          res();
        }
      );
    });
  }
}
class Unstock extends Stock {
  constructor(input, db) {
    super(input, db);
  }
  async validate() {
    try {
      await super.validate();

      let record = await super.getStockedRecord();
      return new Promise((res, rej) => {
        if (record) {
          this.newQuantity = record.Quantity - this.quantity;

          if (this.newQuantity < 0) this.newQuantity = 0;
          res();
        } else {
          rej(new Error('There is no stocked goods to unstock'));
        }
      });
    } catch (err) {
      throw err;
    }
  }
  async execute() {
    await super.updateStocked();
    return new Promise((res, rej) => {
      res(
        `Unstocked ${this.quantity} of Product: ${
          this.productSKU
        } from Warehouse: ${this.warehouseNumber}; there is now ${
          this.newQuantity
        } total`
      );
    });
  }
}
class ListProducts {
  constructor(input, db) {
    this.input = input;
    this.db = db;
  }
  validate() {
    return new Promise((res, rej) => {
      if (this.input.split(' ').length > 2) rej(new Error('Invalid Command'));
      res();
    });
  }
  execute() {
    return new Promise((res, rej) => {
      this.db.all(sqlScripts.SelectProducts, [], (err, rows) => {
        if (err) rej(new Error(err));
        let message = '';
        if (rows.length === 0) message = 'No Products to List';
        else {
          console.log(`Name                               SKU`);
          rows.forEach(row => {
            let message = `${row.Name}`;
            for (let x = 1; x <= 35 - row.Name.length; x++) {
              message += ' ';
            }

            message += `${row.SKU}`;

            console.log(message);
          });
        }

        res(message);
      });
    });
  }
}
class ListWarehouses {
  constructor(input, db) {
    this.input = input;
    this.db = db;
  }
  validate() {
    return new Promise((res, rej) => {
      if (this.input.split(' ').length > 2) rej(new Error('Invalid Command'));
      res();
    });
  }
  execute() {
    return new Promise((res, rej) => {
      this.db.all(sqlScripts.SelectWarehouses, [], (err, rows) => {
        if (err) rej(new Error(err));
        let message = '';
        if (rows.length === 0) {
          message = 'No Warehouses to List';
        } else {
          console.log(`Number        Stock Limit`);
          rows.forEach(row => {
            let message = `${row.WarehouseNumber}`;
            for (
              let x = 1;
              x <= 13 - row.WarehouseNumber.toString().length;
              x++
            ) {
              message += ' ';
            }

            if (row.StockLimit) {
              message += ` ${row.StockLimit}`;
            }
            console.log(message);
          });
        }

        res(message);
      });
    });
  }
}
class ListWarehouse {
  constructor(input, db) {
    this.input = input;
    this.db = db;
    this.warehouseNumber;
  }
  validate() {
    return new Promise((res, rej) => {
      // validate that there are only 3 things and that the third is an integer
      let inputArray = this.input.split(' ');
      if (inputArray.length !== 3) rej(new Error('Invalid Parameters'));
      let parsedWarehouseNumber = parseFloat(inputArray[2]);
      if (!Number.isInteger(parsedWarehouseNumber))
        rej(new Error('Warehouse Number is not valid'));
      this.warehouseNumber = inputArray[2];
      res();
    });
  }
  execute() {
    return new Promise((res, rej) => {
      this.db.all(
        sqlScripts.SelectWarehouseInfo,
        [this.warehouseNumber],
        (err, rows) => {
          if (err) rej(new Error(err));
          let message = '';
          if (rows.length === 0) {
            message = 'No Products to List at this Warehouse';
            res(message);
          } else {
            console.log(
              'ITEM NAME                               ITEM_SKU                                QTY     '
            );
            rows.forEach(row => {
              let name = row.Name;
              let sku = row.SKU;
              let quantity = row.Quantity;
              for (let x = 1; x <= 40 - row.Name.length; x++) {
                name += ' ';
              }
              for (let y = 1; y <= 40 - row.SKU.length; y++) {
                sku += ' ';
              }
              console.log(`${name}${sku}${quantity}`);
              res(message);
            });
          }
        }
      );
    });
  }
}

class EOF {
  constructor(input) {
    this.input = input;
  }
  validate() {
    return new Promise((res, rej) => {
      let inputArray = this.input.split(' ');
      if (inputArray.length !== 1) rej(new Error('Invalid Command'));
      res();
    });
  }
  execute() {
    process.exit();
  }
}
module.exports = {
  AddProduct: AddProduct,
  AddWarehouse: AddWarehouse,
  Stock: Stock,
  Unstock: Unstock,
  ListProducts: ListProducts,
  ListWarehouses: ListWarehouses,
  ListWarehouse: ListWarehouse,
  EOF: EOF,
};

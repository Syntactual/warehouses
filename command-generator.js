const commands = require('./commands');

module.exports = class CommandGenerator {
  constructor(input, db) {
    this.input = input;
    this.db = db;
    this.invalidCommand = new Error('Invalid Command');
    this.commandObj;
  }
  getCommand() {
    let inputArray = this.input.split(' ');
    return new Promise((res, rej) => {
      // create new command object
      switch (inputArray[0]) {
        case 'ADD':
          if (inputArray[1] === 'PRODUCT')
            this.commandObj = new commands.AddProduct(this.input, this.db);
          else if (inputArray[1] === 'WAREHOUSE')
            this.commandObj = new commands.AddWarehouse(this.input, this.db);
          else rej(this.invalidCommand);
          break;
        case 'STOCK':
          this.commandObj = new commands.Stock(this.input, this.db);
          break;
        case 'UNSTOCK':
          this.commandObj = new commands.Unstock(this.input, this.db);
          break;
        case 'LIST':
          if (inputArray[1] === 'PRODUCTS')
            this.commandObj = new commands.ListProducts(this.input, this.db);
          else if (inputArray[1] === 'WAREHOUSES')
            this.commandObj = new commands.ListWarehouses(this.input, this.db);
          else if (inputArray[1] === 'WAREHOUSE')
            this.commandObj = new commands.ListWarehouse(this.input, this.db);
          else rej(this.invalidCommand);
          break;
        case 'EOF':
          this.commandObj = new commands.EOF(this.input);
          break;
        default:
          rej(this.invalidCommand);
          break;
      }

      this.commandObj
        .validate()
        .then(good => res(this.commandObj))
        .catch(err => rej(err));
    });
  }
};

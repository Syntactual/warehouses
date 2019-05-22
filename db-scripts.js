module.exports = SQLScripts = {
  CreateProductTable: `CREATE Table Products 
  (
    ID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
    Name Varchar NOT NULL,
    SKU  Varchar(100) NOT NULL
  )`,
  CreateWarehouseTable: `CREATE Table Warehouses 
  (
    ID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
    WarehouseNumber INTEGER NOT NULL,  
    StockLimit INTEGER NULL
  )`,
  CreateStockTable: `CREATE Table Stocked 
  (
    ID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
    ProductSKU VarChar(100) NOT NULL,  
    WarehouseNumber INTEGER NOT NULL, 
    Quantity INTEGER NOT NULL
  )`,
  ClearProducts: `Delete from Products`,
  ClearWarehouses: `Delete from Warehouses`,
  ClearStocked: `Delete from Stocked`,
  InsertWarehouse: `Insert into Warehouses (WarehouseNumber, StockLimit) VALUES (?,?)`,
  SKU_DuplicateCheck: `Select * from Products where sku = ?`,
  InsertProduct: `Insert into Products (Name, sku) Values (?, ?)`,
  WarehouseDuplicateCheck: `Select * from Warehouses where WarehouseNumber = ?`,
  StockedDuplicateCheck: `Select p.SKU, w.WarehouseNumber, w.StockLimit from Products p, Warehouses w where p.sku = ? AND w.WarehouseNumber = ?`,
  GetStockedRecord: `Select * from Stocked where ProductSKU = ? AND WarehouseNumber = ?`,
  InsertStocked: `Insert into Stocked (ProductSKU, WarehouseNumber, Quantity) Values (?,?,?)`,
  UpdateStocked: `Update Stocked set Quantity = ? Where ProductSKU = ? AND WarehouseNumber = ?`,
  SelectProducts: `Select * from Products`,
  SelectWarehouses: `Select * from Warehouses`,
  SelectWarehouseInfo: `Select p.Name, p.SKU, s.Quantity from Products p Inner Join Stocked s on p.SKU = s.ProductSKU where s.WarehouseNumber = ?`,
};

/* =========================================================
   CHASHMA PLUS INVENTORY MANAGEMENT SYSTEM
   DATABASE SCHEMA
   ========================================================= */


/* =========================================================
   DATABASE
   ========================================================= */

CREATE DATABASE IF NOT EXISTS chashma_plus_inventory;

USE chashma_plus_inventory;


/* =========================================================
   1. USERS
   ========================================================= */

CREATE TABLE IF NOT EXISTS users (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(150) UNIQUE NOT NULL,
    Phone VARCHAR(20),
    PasswordHash VARCHAR(255) NOT NULL,
    Role ENUM('Admin', 'Manager', 'Staff') DEFAULT 'Staff',
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


/* =========================================================
   2. CUSTOMERS
   ========================================================= */

CREATE TABLE IF NOT EXISTS customers (
    CustomerID INT PRIMARY KEY AUTO_INCREMENT,
    CustomerCode VARCHAR(30) UNIQUE,
    FullName VARCHAR(100) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Email VARCHAR(150),
    Address TEXT,
    City VARCHAR(100),
    State VARCHAR(100),
    Pincode VARCHAR(10),
    GSTNumber VARCHAR(20),
    DateOfBirth DATE,
    Gender ENUM('Male', 'Female', 'Other'),
    Notes TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


/* =========================================================
   3. SUPPLIERS
   ========================================================= */

CREATE TABLE IF NOT EXISTS suppliers (
    SupplierID INT PRIMARY KEY AUTO_INCREMENT,
    SupplierCode VARCHAR(30) UNIQUE,
    SupplierName VARCHAR(150) NOT NULL,
    ContactPerson VARCHAR(100),
    Phone VARCHAR(20) NOT NULL,
    Email VARCHAR(150),
    Address TEXT,
    City VARCHAR(100),
    State VARCHAR(100),
    Pincode VARCHAR(10),
    GSTNumber VARCHAR(20),
    PaymentTerms VARCHAR(100),
    Notes TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


/* =========================================================
   4. PRODUCT CATEGORIES
   ========================================================= */

CREATE TABLE IF NOT EXISTS product_categories (
    CategoryID INT PRIMARY KEY AUTO_INCREMENT,
    CategoryName VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


/* =========================================================
   5. BRANDS
   ========================================================= */

CREATE TABLE IF NOT EXISTS brands (
    BrandID INT PRIMARY KEY AUTO_INCREMENT,
    BrandName VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


/* =========================================================
   6. PRODUCTS
   ========================================================= */

CREATE TABLE IF NOT EXISTS products (
    ProductID INT PRIMARY KEY AUTO_INCREMENT,

    ProductCode VARCHAR(50) UNIQUE NOT NULL,
    Barcode VARCHAR(100) UNIQUE,

    ProductName VARCHAR(150) NOT NULL,

    CategoryID INT NOT NULL,
    BrandID INT,

    ProductType ENUM(
        'Frame',
        'Lens',
        'Sunglasses',
        'Contact Lens',
        'Accessory',
        'Other'
    ) NOT NULL,

    Description TEXT,

    ModelNumber VARCHAR(100),
    Color VARCHAR(50),
    Size VARCHAR(50),

    CostPrice DECIMAL(10,2) DEFAULT 0,
    SellingPrice DECIMAL(10,2) DEFAULT 0,
    MRP DECIMAL(10,2) DEFAULT 0,

    GSTPercent DECIMAL(5,2) DEFAULT 18.00,

    ReorderLevel INT DEFAULT 5,

    Unit VARCHAR(20) DEFAULT 'Piece',

    ImageURL VARCHAR(500),

    IsActive BOOLEAN DEFAULT TRUE,

    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (CategoryID)
        REFERENCES product_categories(CategoryID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (BrandID)
        REFERENCES brands(BrandID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


/* =========================================================
   7. INVENTORY
   ========================================================= */

CREATE TABLE IF NOT EXISTS inventory (
    InventoryID INT PRIMARY KEY AUTO_INCREMENT,

    ProductID INT NOT NULL UNIQUE,

    Quantity INT DEFAULT 0,

    ReservedQuantity INT DEFAULT 0,

    AvailableQuantity INT
        GENERATED ALWAYS AS
        (Quantity - ReservedQuantity) STORED,

    LastPurchasePrice DECIMAL(10,2) DEFAULT 0,

    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (ProductID)
        REFERENCES products(ProductID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


/* =========================================================
   8. INVENTORY TRANSACTIONS
   ========================================================= */

CREATE TABLE IF NOT EXISTS inventory_transactions (
    TransactionID INT PRIMARY KEY AUTO_INCREMENT,

    ProductID INT NOT NULL,

    TransactionType ENUM(
        'Purchase',
        'Sale',
        'Return',
        'Adjustment',
        'Damage',
        'Repair'
    ) NOT NULL,

    Quantity INT NOT NULL,

    ReferenceID INT,

    ReferenceNumber VARCHAR(50),

    PreviousStock INT DEFAULT 0,

    NewStock INT DEFAULT 0,

    Remarks TEXT,

    CreatedBy INT,

    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ProductID)
        REFERENCES products(ProductID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (CreatedBy)
        REFERENCES users(UserID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


/* =========================================================
   9. PURCHASES
   ========================================================= */

CREATE TABLE IF NOT EXISTS purchases (
    PurchaseID INT PRIMARY KEY AUTO_INCREMENT,

    PurchaseNumber VARCHAR(50) UNIQUE NOT NULL,

    SupplierID INT NOT NULL,

    SupplierInvoiceNumber VARCHAR(100),

    PurchaseDate DATE NOT NULL,

    SubTotal DECIMAL(12,2) DEFAULT 0,

    Discount DECIMAL(12,2) DEFAULT 0,

    CGST DECIMAL(12,2) DEFAULT 0,

    SGST DECIMAL(12,2) DEFAULT 0,

    IGST DECIMAL(12,2) DEFAULT 0,

    GSTAmount DECIMAL(12,2) DEFAULT 0,

    GrandTotal DECIMAL(12,2) DEFAULT 0,

    PaymentStatus ENUM(
        'Pending',
        'Partial',
        'Paid'
    ) DEFAULT 'Pending',

    Notes TEXT,

    CreatedBy INT,

    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (SupplierID)
        REFERENCES suppliers(SupplierID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (CreatedBy)
        REFERENCES users(UserID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


/* =========================================================
   10. PURCHASE ITEMS
   ========================================================= */

CREATE TABLE IF NOT EXISTS purchase_items (
    PurchaseItemID INT PRIMARY KEY AUTO_INCREMENT,

    PurchaseID INT NOT NULL,

    ProductID INT NOT NULL,

    Quantity INT NOT NULL,

    UnitPrice DECIMAL(10,2) NOT NULL,

    GSTPercent DECIMAL(5,2) DEFAULT 18.00,

    GSTAmount DECIMAL(10,2) DEFAULT 0,

    TotalAmount DECIMAL(12,2) DEFAULT 0,

    FOREIGN KEY (PurchaseID)
        REFERENCES purchases(PurchaseID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (ProductID)
        REFERENCES products(ProductID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


/* =========================================================
   11. SALES
   ========================================================= */

CREATE TABLE IF NOT EXISTS sales (
    SaleID INT PRIMARY KEY AUTO_INCREMENT,

    InvoiceNumber VARCHAR(50) UNIQUE NOT NULL,

    CustomerID INT,

    SaleDate DATETIME DEFAULT CURRENT_TIMESTAMP,

    SubTotal DECIMAL(12,2) DEFAULT 0,

    Discount DECIMAL(12,2) DEFAULT 0,

    CGST DECIMAL(12,2) DEFAULT 0,

    SGST DECIMAL(12,2) DEFAULT 0,

    IGST DECIMAL(12,2) DEFAULT 0,

    GSTAmount DECIMAL(12,2) DEFAULT 0,

    RoundOff DECIMAL(10,2) DEFAULT 0,

    GrandTotal DECIMAL(12,2) DEFAULT 0,

    PaymentStatus ENUM(
        'Pending',
        'Partial',
        'Paid'
    ) DEFAULT 'Pending',

    SaleStatus ENUM(
        'Completed',
        'Cancelled',
        'Returned'
    ) DEFAULT 'Completed',

    Notes TEXT,

    CreatedBy INT,

    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES customers(CustomerID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (CreatedBy)
        REFERENCES users(UserID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


/* =========================================================
   12. SALE ITEMS
   ========================================================= */

CREATE TABLE IF NOT EXISTS sale_items (
    SaleItemID INT PRIMARY KEY AUTO_INCREMENT,

    SaleID INT NOT NULL,

    ProductID INT NOT NULL,

    Quantity INT NOT NULL,

    UnitPrice DECIMAL(10,2) NOT NULL,

    Discount DECIMAL(10,2) DEFAULT 0,

    GSTPercent DECIMAL(5,2) DEFAULT 18.00,

    GSTAmount DECIMAL(10,2) DEFAULT 0,

    TotalAmount DECIMAL(12,2) DEFAULT 0,

    FOREIGN KEY (SaleID)
        REFERENCES sales(SaleID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (ProductID)
        REFERENCES products(ProductID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


/* =========================================================
   13. INVOICES
   ========================================================= */

CREATE TABLE IF NOT EXISTS invoices (
    InvoiceID INT PRIMARY KEY AUTO_INCREMENT,

    SaleID INT NOT NULL UNIQUE,

    InvoiceNumber VARCHAR(50) UNIQUE NOT NULL,

    InvoiceDate DATETIME DEFAULT CURRENT_TIMESTAMP,

    CompanyName VARCHAR(150) DEFAULT 'Chashma Plus',

    CompanyAddress TEXT,

    CompanyPhone VARCHAR(20),

    CompanyEmail VARCHAR(150),

    CompanyGSTNumber VARCHAR(20),

    CustomerGSTNumber VARCHAR(20),

    BillingAddress TEXT,

    ShippingAddress TEXT,

    PlaceOfSupply VARCHAR(100),

    TotalTaxableAmount DECIMAL(12,2) DEFAULT 0,

    CGST DECIMAL(12,2) DEFAULT 0,

    SGST DECIMAL(12,2) DEFAULT 0,

    IGST DECIMAL(12,2) DEFAULT 0,

    TotalGST DECIMAL(12,2) DEFAULT 0,

    GrandTotal DECIMAL(12,2) DEFAULT 0,

    AmountInWords VARCHAR(500),

    PaymentMode ENUM(
        'Cash',
        'UPI',
        'Card',
        'Bank Transfer',
        'Credit',
        'Other'
    ),

    FOREIGN KEY (SaleID)
        REFERENCES sales(SaleID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


/* =========================================================
   14. PAYMENTS
   ========================================================= */

CREATE TABLE IF NOT EXISTS payments (
    PaymentID INT PRIMARY KEY AUTO_INCREMENT,

    SaleID INT,

    PurchaseID INT,

    CustomerID INT,

    SupplierID INT,

    PaymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,

    Amount DECIMAL(12,2) NOT NULL,

    PaymentMode ENUM(
        'Cash',
        'UPI',
        'Card',
        'Bank Transfer',
        'Credit',
        'Other'
    ) NOT NULL,

    TransactionReference VARCHAR(100),

    PaymentType ENUM(
        'Received',
        'Paid'
    ) NOT NULL,

    Notes TEXT,

    CreatedBy INT,

    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (SaleID)
        REFERENCES sales(SaleID)
        ON DELETE SET NULL,

    FOREIGN KEY (PurchaseID)
        REFERENCES purchases(PurchaseID)
        ON DELETE SET NULL,

    FOREIGN KEY (CustomerID)
        REFERENCES customers(CustomerID)
        ON DELETE SET NULL,

    FOREIGN KEY (SupplierID)
        REFERENCES suppliers(SupplierID)
        ON DELETE SET NULL,

    FOREIGN KEY (CreatedBy)
        REFERENCES users(UserID)
        ON DELETE SET NULL
);


/* =========================================================
   15. EYE TESTING
   ========================================================= */

CREATE TABLE IF NOT EXISTS eye_tests (
    EyeTestID INT PRIMARY KEY AUTO_INCREMENT,

    CustomerID INT NOT NULL,

    TestDate DATETIME DEFAULT CURRENT_TIMESTAMP,

    TestedBy INT,

    Complaint TEXT,

    Notes TEXT,

    NextCheckupDate DATE,

    FOREIGN KEY (CustomerID)
        REFERENCES customers(CustomerID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (TestedBy)
        REFERENCES users(UserID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


/* =========================================================
   16. PRESCRIPTIONS
   ========================================================= */

CREATE TABLE IF NOT EXISTS prescriptions (
    PrescriptionID INT PRIMARY KEY AUTO_INCREMENT,

    EyeTestID INT NOT NULL,

    CustomerID INT NOT NULL,

    RightEyeSphere DECIMAL(5,2) DEFAULT 0,
    RightEyeCylinder DECIMAL(5,2) DEFAULT 0,
    RightEyeAxis DECIMAL(5,2) DEFAULT 0,
    RightEyeAdd DECIMAL(5,2) DEFAULT 0,

    LeftEyeSphere DECIMAL(5,2) DEFAULT 0,
    LeftEyeCylinder DECIMAL(5,2) DEFAULT 0,
    LeftEyeAxis DECIMAL(5,2) DEFAULT 0,
    LeftEyeAdd DECIMAL(5,2) DEFAULT 0,

    PD DECIMAL(5,2),

    LensType VARCHAR(100),

    PrescriptionNotes TEXT,

    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (EyeTestID)
        REFERENCES eye_tests(EyeTestID)
        ON DELETE CASCADE,

    FOREIGN KEY (CustomerID)
        REFERENCES customers(CustomerID)
        ON DELETE CASCADE
);


/* =========================================================
   17. ORDERS
   ========================================================= */

CREATE TABLE IF NOT EXISTS orders (
    OrderID INT PRIMARY KEY AUTO_INCREMENT,

    OrderNumber VARCHAR(50) UNIQUE NOT NULL,

    CustomerID INT NOT NULL,

    PrescriptionID INT,

    OrderDate DATETIME DEFAULT CURRENT_TIMESTAMP,

    OrderType ENUM(
        'Frame Only',
        'Lens Only',
        'Complete Glasses',
        'Sunglasses',
        'Contact Lens',
        'Other'
    ) DEFAULT 'Complete Glasses',

    Status ENUM(
        'Pending',
        'Confirmed',
        'Processing',
        'Ready',
        'Delivered',
        'Cancelled'
    ) DEFAULT 'Pending',

    TotalAmount DECIMAL(12,2) DEFAULT 0,

    AdvanceAmount DECIMAL(12,2) DEFAULT 0,

    BalanceAmount DECIMAL(12,2) DEFAULT 0,

    ExpectedDeliveryDate DATE,

    Notes TEXT,

    CreatedBy INT,

    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES customers(CustomerID)
        ON DELETE RESTRICT,

    FOREIGN KEY (PrescriptionID)
        REFERENCES prescriptions(PrescriptionID)
        ON DELETE SET NULL,

    FOREIGN KEY (CreatedBy)
        REFERENCES users(UserID)
        ON DELETE SET NULL
);


/* =========================================================
   18. ORDER ITEMS
   ========================================================= */

CREATE TABLE IF NOT EXISTS order_items (
    OrderItemID INT PRIMARY KEY AUTO_INCREMENT,

    OrderID INT NOT NULL,

    ProductID INT NOT NULL,

    Quantity INT DEFAULT 1,

    UnitPrice DECIMAL(10,2) DEFAULT 0,

    TotalAmount DECIMAL(12,2) DEFAULT 0,

    FOREIGN KEY (OrderID)
        REFERENCES orders(OrderID)
        ON DELETE CASCADE,

    FOREIGN KEY (ProductID)
        REFERENCES products(ProductID)
        ON DELETE RESTRICT
);


/* =========================================================
   19. REPAIRS
   ========================================================= */

CREATE TABLE IF NOT EXISTS repairs (
    RepairID INT PRIMARY KEY AUTO_INCREMENT,

    RepairNumber VARCHAR(50) UNIQUE NOT NULL,

    CustomerID INT NOT NULL,

    ProductID INT,

    ReceivedDate DATETIME DEFAULT CURRENT_TIMESTAMP,

    ExpectedDate DATE,

    RepairType VARCHAR(150),

    ProblemDescription TEXT,

    RepairCost DECIMAL(10,2) DEFAULT 0,

    AdvanceAmount DECIMAL(10,2) DEFAULT 0,

    BalanceAmount DECIMAL(10,2) DEFAULT 0,

    Status ENUM(
        'Received',
        'In Progress',
        'Ready',
        'Delivered',
        'Cancelled'
    ) DEFAULT 'Received',

    Notes TEXT,

    CreatedBy INT,

    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES customers(CustomerID)
        ON DELETE RESTRICT,

    FOREIGN KEY (ProductID)
        REFERENCES products(ProductID)
        ON DELETE SET NULL,

    FOREIGN KEY (CreatedBy)
        REFERENCES users(UserID)
        ON DELETE SET NULL
);


/* =========================================================
   INDEXES
   ========================================================= */

CREATE INDEX idx_customers_phone
ON customers(Phone);

CREATE INDEX idx_products_category
ON products(CategoryID);

CREATE INDEX idx_products_brand
ON products(BrandID);

CREATE INDEX idx_products_type
ON products(ProductType);

CREATE INDEX idx_inventory_product
ON inventory(ProductID);

CREATE INDEX idx_sales_customer
ON sales(CustomerID);

CREATE INDEX idx_sales_date
ON sales(SaleDate);

CREATE INDEX idx_purchase_supplier
ON purchases(SupplierID);

CREATE INDEX idx_purchase_date
ON purchases(PurchaseDate);

CREATE INDEX idx_eye_tests_customer
ON eye_tests(CustomerID);

CREATE INDEX idx_orders_customer
ON orders(CustomerID);

CREATE INDEX idx_repairs_customer
ON repairs(CustomerID);


/* =========================================================
   COMPLETE
   ========================================================= */

SELECT 'CHASHMA PLUS DATABASE SCHEMA CREATED SUCCESSFULLY'
AS Message;
    USE chashma_plus_inventory;


    /* =========================================================
    1. PRODUCT CATEGORIES
    ========================================================= */

    INSERT INTO product_categories
        (CategoryName, Description)
    VALUES
        ('Optical Frames', 'Regular prescription spectacle frames'),
        ('Sunglasses', 'Fashion and UV protection sunglasses'),
        ('Prescription Lenses', 'Prescription spectacle lenses'),
        ('Contact Lenses', 'Soft and disposable contact lenses'),
        ('Accessories', 'Eyewear accessories'),
        ('Lens Care', 'Lens cleaning and maintenance products')
    ON DUPLICATE KEY UPDATE
        Description = VALUES(Description);


    /* =========================================================
    2. BRANDS
    ========================================================= */

    INSERT INTO brands
        (BrandName, Description)
    VALUES
        ('Titan', 'Titan eyewear products'),
        ('Ray-Ban', 'Premium eyewear brand'),
        ('Vogue', 'Fashion eyewear brand'),
        ('John Jacobs', 'Premium optical eyewear'),
        ('Fastrack', 'Youth and fashion eyewear'),
        ('Lenskart', 'Optical and eyewear products'),
        ('Generic', 'Non-branded products')
    ON DUPLICATE KEY UPDATE
        Description = VALUES(Description);


    /* =========================================================
    3. ADMIN USER
    ========================================================= */

    /*
    Password hash below is for:
    Password123
    */

    INSERT INTO users
        (
            FullName,
            Email,
            Phone,
            PasswordHash,
            Role,
            IsActive
        )
    VALUES
        (
            'System Administrator',
            'admin@chashmaplus.com',
            '9999999999',
            '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
            'Admin',
            TRUE
        )
    ON DUPLICATE KEY UPDATE
        FullName = VALUES(FullName),
        Role = VALUES(Role),
        IsActive = TRUE;


    /* =========================================================
    4. VERIFY SEED DATA
    ========================================================= */

    SELECT * FROM product_categories;

    SELECT * FROM brands;

    SELECT
        UserID,
        FullName,
        Email,
        Phone,
        Role,
        IsActive
    FROM users;


    /* =========================================================
    COMPLETE
    ========================================================= */

    SELECT
        'CHASHMA PLUS SEED DATA INSERTED SUCCESSFULLY'
        AS Message;
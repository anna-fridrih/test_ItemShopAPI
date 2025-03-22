CREATE TABLE IF NOT EXISTS products (
                                        id SERIAL PRIMARY KEY,
                                        name VARCHAR(255) NOT NULL,
                                        price DECIMAL(10,2) NOT NULL
    );
INSERT INTO products (name, price) VALUES
                                                    ('Magic Potion', 19.99),
                                                    ('Golden Key', 4.95),
                                                    ('Invisibility Cloak', 299.50);
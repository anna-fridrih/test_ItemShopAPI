CREATE TABLE IF NOT EXISTS users (
                                     id SERIAL PRIMARY KEY,
                                     username VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00
    );


CREATE TABLE IF NOT EXISTS products (
                                        id SERIAL PRIMARY KEY,
                                        name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL
    );

CREATE TABLE IF NOT EXISTS purchases (
                                         id SERIAL PRIMARY KEY,
                                         user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,  -- Добавлена колонка amount
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_product_id ON purchases(product_id);
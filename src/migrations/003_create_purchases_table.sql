CREATE TABLE purchases (
                           id SERIAL PRIMARY KEY,
                           user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                           product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                           amount DECIMAL(10,2) NOT NULL,
                           purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_product ON purchases(product_id);
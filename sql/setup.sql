CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  can_post_login boolean DEFAULT false,
  can_get_my_user boolean DEFAULT false,
  can_get_users boolean DEFAULT false,
  can_post_products boolean DEFAULT false,
  can_upload_images boolean DEFAULT false,
  can_get_bestsellers boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  token_version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


  ALTER TABLE roles ADD COLUMN IF NOT EXISTS can_post_products boolean DEFAULT false;
  ALTER TABLE roles ADD COLUMN IF NOT EXISTS can_upload_images boolean DEFAULT false;
  ALTER TABLE roles ADD COLUMN IF NOT EXISTS can_get_bestsellers boolean DEFAULT false;


  CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_id text UNIQUE NOT NULL,
    name text NOT NULL,
    price numeric(12,2) NOT NULL,
    sales_count integer DEFAULT 0,
    image_url text,
    created_by uuid REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );


  CREATE INDEX IF NOT EXISTS idx_products_shopify_id ON products(shopify_id);
  CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
  CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count DESC);


  CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


  CREATE TABLE IF NOT EXISTS api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    key_hash text NOT NULL,
    created_at timestamptz DEFAULT now()
  );


  CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
  CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);


  ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;

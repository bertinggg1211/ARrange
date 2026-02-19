-- Create admin user with email 'admin' and password 'admin'
-- Password hash for 'admin' generated with bcrypt (salt rounds: 10)

INSERT INTO users (
  email,
  password_hash,
  role,
  full_name,
  created_at,
  updated_at
) VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin',
  'Administrator',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

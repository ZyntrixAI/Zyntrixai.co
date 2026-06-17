-- Newsletter Signups Table
CREATE TABLE newsletter_signups (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Requests Table
CREATE TABLE audit_requests (
  id BIGSERIAL PRIMARY KEY,
  website_url VARCHAR(500) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments Table
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  preferred_date DATE,
  preferred_time TIME,
  service_type VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE newsletter_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Public Read/Insert policies (allow frontend to add data)
CREATE POLICY "Allow insert newsletter_signups" ON newsletter_signups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert audit_requests" ON audit_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert appointments" ON appointments
  FOR INSERT WITH CHECK (true);

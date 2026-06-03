const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

// Initialize Supabase client
if (process.env.SUPABASE_ENABLED === 'true' && supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✓ Supabase client initialized');
} else {
  console.log('⚠ Supabase not enabled or missing credentials');
}

// Save booking to Supabase
async function saveBooking(bookingData) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      first_name: bookingData.first_name,
      last_name: bookingData.last_name,
      email: bookingData.email,
      phone: bookingData.phone || null,
      business_name: bookingData.business_name,
      industry_niche: bookingData.industry_niche || null,
      services: bookingData.services, // JSON string or comma-separated
      website_url: bookingData.website_url || null,
      has_website: bookingData.has_website || false,
      current_problems: bookingData.current_problems || null,
      status: bookingData.status || 'new',
      notes: bookingData.notes || null,
      source: bookingData.source || 'website'
    }])
    .select();

  if (error) {
    throw new Error(`Failed to save booking: ${error.message}`);
  }

  return data[0];
}

// Get booking by ID
async function getBooking(bookingId) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error) {
    throw new Error(`Failed to get booking: ${error.message}`);
  }

  return data;
}

// Update booking status
async function updateBookingStatus(bookingId, status, notes = null) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const updateData = {
    status,
    updated_at: new Date().toISOString()
  };

  if (notes) {
    updateData.notes = notes;
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select();

  if (error) {
    throw new Error(`Failed to update booking: ${error.message}`);
  }

  return data[0];
}

// Get all bookings (with optional filters)
async function getAllBookings(filters = {}) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  let query = supabase.from('bookings').select('*');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.email) {
    query = query.eq('email', filters.email);
  }

  if (filters.industry) {
    query = query.eq('industry_niche', filters.industry);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get bookings: ${error.message}`);
  }

  return data;
}

module.exports = {
  saveBooking,
  getBooking,
  updateBookingStatus,
  getAllBookings,
  isSupabaseEnabled: process.env.SUPABASE_ENABLED === 'true'
};

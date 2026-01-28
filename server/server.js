
//616 check for supabase compatible code 
import express from 'express';
import cors from 'cors';
import sql from './db.js'; // your postgres connection file
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { 
  authMiddleware, 
  optionalAuthMiddleware, 
  requireRole, 
  requireAdmin 
} from './src/middleware/auth.js';
import { generateToken } from './src/services/jwtService.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", // React dev server
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
}));


const PORT = process.env.PORT || 3000;

// Handle port already in use
process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error('   Solutions:');
    console.error(`   1. Stop the other process using port ${PORT}`);
    console.error(`   2. Change PORT in .env file to a different port (e.g., 3001)`);
    console.error(`   3. Find and kill the process: netstat -ano | findstr :${PORT}\n`);
    process.exit(1);
  }
});


// ------------------------------
// Root endpoint to check database connection
// ------------------------------
app.get('/', async (req, res) => {
  try {
    // Test database connection with a simple query
    await sql`SELECT 1 AS connection_test`;
    res.status(200).send({
      status: 'success',
      message: 'Backend server is running and connected to the database!',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).send({
      status: 'error',
      message: 'Backend server is running but database connection failed',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ======================================================
// 🖼️ ASSET APIs
// ======================================================

// GET all assets
app.get('/api/assets', async (req, res) => {
  try {
    const assets = await sql`SELECT * FROM public.asset_master ORDER BY created_at DESC`;
    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching assets' });
  }
});

// GET single asset by ID
app.get('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const asset = await sql`SELECT * FROM public.assets_master WHERE id = ${id}`;
    if (!asset.length) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching asset' });
  }
});

// CREATE new asset (Protected - requires authentication)
app.post('/api/assets', authMiddleware, async (req, res) => {
  // const { asset_code, asset_name, machine_no, location, category, manufacturer, model, serial_number, install_date, status } = req.body;
  // const allowedStatus = ['ACTIVE','UNDER_AMC','INACTIVE','DISPOSED'];
  // if (!allowedStatus.includes(status)) return res.status(400).json({ error: 'Invalid status value' });
  const { asset_code, asset_name, asset_location, bu_name, asset_type, manufacturer, model_number, model_name, install_date, asset_status, warranty_expiry, qr_code } = req.body;
  
  // Validate asset_status enum
  const allowedStatus = ['active','under_amc','inactive','disposed'];
  if (asset_status && !allowedStatus.includes(asset_status.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid asset_status value. Must be one of: ' + allowedStatus.join(', ') });
  }
  
  // Validate asset_type enum
  const allowedTypes = ['machine','utility','auxiliary'];
  if (asset_type && !allowedTypes.includes(asset_type.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid asset_type value. Must be one of: ' + allowedTypes.join(', ') });
  }

  try {
    const result = await sql`
      INSERT INTO public.asset_master
      (asset_code, asset_name, asset_location, bu_name, asset_type, manufacturer, model_number, model_name, install_date, asset_status, warranty_expiry, qr_code, created_by)
      VALUES
      (${asset_code}, ${asset_name}, ${asset_location}, ${bu_name}, ${asset_type?.toLowerCase()}, ${manufacturer}, ${model_number}, ${model_name}, ${install_date}, ${asset_status?.toLowerCase() || 'active'}, ${warranty_expiry}, ${qr_code}, ${req.user?.id})
      RETURNING *;
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error creating asset', details: err.message });
  }
});

// UPDATE asset (Protected - requires authentication)
app.put('/api/assets/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { asset_code, asset_name, asset_location, bu_name, asset_type, manufacturer, model_number, model_name, install_date, asset_status, warranty_expiry, qr_code } = req.body;
  
  // Validate enums if provided
  if (asset_status) {
    const allowedStatus = ['active','under_amc','inactive','disposed'];
    if (!allowedStatus.includes(asset_status.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid asset_status value' });
    }
  }
  if (asset_type) {
    const allowedTypes = ['machine','utility','auxiliary'];
    if (!allowedTypes.includes(asset_type.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid asset_type value' });
    }
  }

  try {
    const updated = await sql`
      UPDATE public.asset_master
      SET
        asset_code = COALESCE(${asset_code}, asset_code),
        asset_name = COALESCE(${asset_name}, asset_name),
        asset_location = COALESCE(${asset_location}, asset_location),
        bu_name = COALESCE(${bu_name}, bu_name),
        asset_type = COALESCE(${asset_type?.toLowerCase()}, asset_type),
        manufacturer = COALESCE(${manufacturer}, manufacturer),
        model_number = COALESCE(${model_number}, model_number),
        model_name = COALESCE(${model_name}, model_name),
        install_date = COALESCE(${install_date}, install_date),
        asset_status = COALESCE(${asset_status?.toLowerCase()}, asset_status),
        warranty_expiry = COALESCE(${warranty_expiry}, warranty_expiry),
        qr_code = COALESCE(${qr_code}, qr_code),
        updated_at = now(),
        updated_by = ${req.user?.id}
      WHERE id = ${id}
      RETURNING *;
    `;
    if (!updated.length) return res.status(404).json({ error: 'Asset not found' });
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error updating asset', details: err.message });
  }
});

// DELETE asset (Protected - requires authentication, admin only)
app.delete('/api/assets/:id', authMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await sql`DELETE FROM public.asset_master WHERE id = ${id} RETURNING *;`;
    if (!deleted.length) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error deleting asset' });
  }
});


// ======================================================
// 🔧 BREAKDOWN APIs (Using bd_entry_operator and bd_entry_engineer tables)
// ======================================================

// GET all breakdowns using the breakdown_entry_view (includes operator + engineer data)
app.get('/api/breakdowns', async (req, res) => {
  const { date, status } = req.query;
  try {
    let breakdowns;
    if (date) {
      breakdowns = await sql`
        SELECT * FROM public.breakdown_entry_view 
        WHERE entry_date = ${date}::date 
        ORDER BY entry_date DESC, entry_time DESC
      `;
    } else if (status) {
      breakdowns = await sql`
        SELECT * FROM public.breakdown_entry_view 
        WHERE bd_status = ${status.toLowerCase()} 
        ORDER BY entry_date DESC, entry_time DESC
      `;
    } else {
      breakdowns = await sql`
        SELECT * FROM public.breakdown_entry_view 
        ORDER BY entry_date DESC, entry_time DESC
      `;
    }
    res.json(breakdowns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching breakdowns', details: err.message });
  }
});

// GET single breakdown by ID (using view)
app.get('/api/breakdowns/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const breakdown = await sql`SELECT * FROM public.breakdown_entry_view WHERE bd_id = ${id}`;
    if (!breakdown.length) return res.status(404).json({ error: 'Breakdown not found' });
    res.json(breakdown[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching breakdown' });
  }
});

// CREATE new breakdown entry (Operator entry) - Protected
app.post('/api/breakdowns', authMiddleware, async (req, res) => {
  const { 
    bd_code, shift_id, entry_date, entry_time, asset_id, 
    asset_location, bu_name, operator_name, key_issue, 
    nature_of_complaint, note 
  } = req.body;

  try {
    const result = await sql`
      INSERT INTO public.bd_entry_operator 
      (bd_code, shift_id, entry_date, entry_time, asset_id, asset_location, bu_name, operator_name, key_issue, nature_of_complaint, note, reported_by)
      VALUES 
      (${bd_code}, ${shift_id?.toUpperCase()}, ${entry_date || 'CURRENT_DATE'}, ${entry_time || 'CURRENT_TIME'}, ${asset_id}, ${asset_location}, ${bu_name}, ${operator_name}, ${key_issue}, ${nature_of_complaint}, ${note}, ${req.user?.id})
      RETURNING *;
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error creating breakdown entry', details: err.message });
  }
});

// UPDATE breakdown operator entry - Protected
app.put('/api/breakdowns/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { 
    shift_id, entry_date, entry_time, asset_id, bd_status,
    asset_location, bu_name, operator_name, key_issue, 
    nature_of_complaint, note 
  } = req.body;
  
  // Validate status enum
  if (bd_status) {
    const allowedStatus = ['open','ack','in_progress','resolved','closed'];
    if (!allowedStatus.includes(bd_status.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid bd_status value' });
    }
  }

  try {
    const updated = await sql`
      UPDATE public.bd_entry_operator
      SET
        shift_id = COALESCE(${shift_id?.toUpperCase()}, shift_id),
        entry_date = COALESCE(${entry_date}, entry_date),
        entry_time = COALESCE(${entry_time}, entry_time),
        asset_id = COALESCE(${asset_id}, asset_id),
        bd_status = COALESCE(${bd_status?.toLowerCase()}, bd_status),
        asset_location = COALESCE(${asset_location}, asset_location),
        bu_name = COALESCE(${bu_name}, bu_name),
        operator_name = COALESCE(${operator_name}, operator_name),
        key_issue = COALESCE(${key_issue}, key_issue),
        nature_of_complaint = COALESCE(${nature_of_complaint}, nature_of_complaint),
        note = COALESCE(${note}, note)
      WHERE id = ${id}
      RETURNING *;
    `;
    if (!updated.length) return res.status(404).json({ error: 'Breakdown not found' });
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error updating breakdown', details: err.message });
  }
});

// CREATE/UPDATE breakdown engineer entry - Protected
app.post('/api/breakdowns/:id/engineer', authMiddleware, async (req, res) => {
  const { id } = req.params; // bd_operator_id
  const { action_taken, engineer_findings, job_start, job_completion_date, responsible_person, spare_usage_id } = req.body;

  try {
    // Check if engineer entry already exists
    const existing = await sql`SELECT id FROM public.bd_entry_engineer WHERE bd_operator_id = ${id}`;
    
    let result;
    if (existing.length > 0) {
      // Update existing engineer entry
      result = await sql`
        UPDATE public.bd_entry_engineer
        SET
          action_taken = COALESCE(${action_taken}, action_taken),
          engineer_findings = COALESCE(${engineer_findings}, engineer_findings),
          job_start = COALESCE(${job_start}, job_start),
          job_completion_date = COALESCE(${job_completion_date}, job_completion_date),
          responsible_person = COALESCE(${responsible_person}, responsible_person),
          spare_usage_id = COALESCE(${spare_usage_id}, spare_usage_id)
        WHERE bd_operator_id = ${id}
        RETURNING *;
      `;
    } else {
      // Create new engineer entry
      result = await sql`
        INSERT INTO public.bd_entry_engineer 
        (bd_operator_id, action_taken, engineer_findings, job_start, job_completion_date, responsible_person, spare_usage_id)
        VALUES 
        (${id}, ${action_taken}, ${engineer_findings}, ${job_start}, ${job_completion_date}, ${responsible_person || req.user?.id}, ${spare_usage_id})
        RETURNING *;
      `;
    }
    
    res.status(201).json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error creating/updating engineer entry', details: err.message });
  }
});

// ======================================================
// ⚙️ SPARE PARTS INVENTORY APIs
// ======================================================

// GET all spare parts
app.get('/api/spares', async (req, res) => {
  try {
    const spares = await sql`SELECT * FROM public.spare_parts_inventory ORDER BY part_name ASC`;
    res.json(spares);
  } catch (err) {
    console.error('Error fetching spare parts:', err);
    res.status(500).json({ error: 'Database error fetching spare parts' });
  }
});

// GET single spare part by ID
app.get('/api/spares/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const spare = await sql`SELECT * FROM public.spare_parts_inventory WHERE id = ${id}`;
    if (!spare.length) return res.status(404).json({ error: 'Spare part not found' });
    res.json(spare[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching spare part' });
  }
});

// CREATE new spare part (Protected - requires authentication)
app.post('/api/spares', authMiddleware, async (req, res) => {
  const { part_code, part_name, part_no, min_level, reorder_level, current_stock, unit_cost, supplier, spare_location, bu_name } = req.body;
  try {
    const newPart = await sql`
      INSERT INTO public.spare_parts_inventory 
      (part_code, part_name, part_no, min_level, reorder_level, current_stock, unit_cost, supplier, spare_location, bu_name, last_updated_by)
      VALUES (${part_code}, ${part_name}, ${part_no}, ${min_level || 0}, ${reorder_level || 1}, ${current_stock || 0}, ${unit_cost || 0}, ${supplier}, ${spare_location}, ${bu_name}, ${req.user?.id})
      RETURNING *;
    `;
    res.status(201).json(newPart[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error creating spare part', details: err.message });
  }
});

// UPDATE spare part (Protected - requires authentication)
app.put('/api/spares/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { part_code, part_name, part_no, min_level, reorder_level, current_stock, unit_cost, supplier, spare_location, bu_name } = req.body;
    try {
        const updated = await sql`
            UPDATE public.spare_parts_inventory
            SET
                part_code = COALESCE(${part_code}, part_code),
                part_name = COALESCE(${part_name}, part_name),
                part_no = COALESCE(${part_no}, part_no),
                min_level = COALESCE(${min_level}, min_level),
                reorder_level = COALESCE(${reorder_level}, reorder_level),
                current_stock = COALESCE(${current_stock}, current_stock),
                unit_cost = COALESCE(${unit_cost}, unit_cost),
                supplier = COALESCE(${supplier}, supplier),
                spare_location = COALESCE(${spare_location}, spare_location),
                bu_name = COALESCE(${bu_name}, bu_name),
                last_updated = now(),
                last_updated_by = ${req.user?.id}
            WHERE id = ${id}
            RETURNING *;
        `;
        if (!updated.length) return res.status(404).json({ error: 'Spare part not found' });
        res.json(updated[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error updating spare part', details: err.message });
    }
});

// DELETE spare part (Protected - requires authentication, admin only)
app.delete('/api/spares/:id', authMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await sql`DELETE FROM public.spare_parts_inventory WHERE id = ${id} RETURNING *;`;
    if (!deleted.length) return res.status(404).json({ error: 'Spare part not found' });
    res.json({ message: 'Spare part deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error deleting spare part' });
  }
});

// POST a spare part transaction (Protected - requires authentication)
app.post('/api/spares/transaction', authMiddleware, async (req, res) => {
  const { part_id, quantity, direction, asset_id, pm_bd_id, pm_bd_type, purpose } = req.body;

  // Validate direction enum
  if (!['issue', 'return'].includes(direction?.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid transaction direction. Must be "issue" or "return"' });
  }

  // Validate pm_bd_type if pm_bd_id is provided
  if (pm_bd_id && pm_bd_type && !['pm', 'bd'].includes(pm_bd_type?.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid pm_bd_type. Must be "pm" or "bd"' });
  }

  try {
    const result = await sql.begin(async sql => {
      // 1. Get current stock and part code
      const part = await sql`SELECT current_stock, part_code FROM public.spare_parts_inventory WHERE id = ${part_id}`;
      if (!part.length) throw new Error('Spare part not found');

      // 2. Check for sufficient stock on ISSUE
      const currentStock = Number(part[0].current_stock);
      if (direction.toLowerCase() === 'issue' && currentStock < quantity) {
        throw new Error('Insufficient stock for issuance');
      }

      // 3. Calculate new stock balance
      const newStock = direction.toLowerCase() === 'issue' ? currentStock - quantity : currentStock + quantity;

      // 4. Insert the transaction
      const txn = await sql`
        INSERT INTO public.spare_transactions 
        (part_id, part_code, quantity, direction, asset_id, pm_bd_id, pm_bd_type, purpose, balance_after, created_by)
        VALUES 
        (${part_id}, ${part[0].part_code}, ${quantity}, ${direction.toLowerCase()}, ${asset_id}, ${pm_bd_id}, ${pm_bd_type?.toLowerCase()}, ${purpose}, ${newStock}, ${req.user?.id})
        RETURNING *;
      `;
// // 4. Update the inventory master table
// const newStock = direction === 'ISSUE' ? currentStock - qty : currentStock + qty;
      // 5. Update the inventory master table
      const updatedPart = await sql`
        UPDATE public.spare_parts_inventory
        SET current_stock = ${newStock}, last_updated = now(), last_updated_by = ${req.user?.id}
        WHERE id = ${part_id}
        RETURNING *;
      `;

      return { transaction: txn[0], inventory: updatedPart[0] };
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Database transaction error' });
  }
});


// ======================================================
// 📅 PREVENTIVE MAINTENANCE (PM) APIs
// ======================================================

// GET all PM schedules
app.get('/api/pm', async (req, res) => {
  try {
    const schedules = await sql`SELECT * FROM public.pm_schedule ORDER BY next_pm_date ASC`;
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching PM schedules' });
  }
});

// GET single PM schedule
app.get('/api/pm/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const schedule = await sql`SELECT * FROM public.pm_schedule WHERE id = ${id}`;
        if (!schedule.length) return res.status(404).json({ error: 'PM schedule not found' });
        res.json(schedule[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching PM schedule' });
    }
});

// CREATE new PM schedule (Protected - requires authentication)
app.post('/api/pm', authMiddleware, async (req, res) => {
  const { asset_id, pm_title, frequency_interval, pm_frequency_interval, last_pm_date, next_pm_date, checklist_ref, responsible_person, status } = req.body;
  
  // Validate status enum
  const allowedStatus = ['scheduled','completed','overdue'];
  if (status && !allowedStatus.includes(status.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid status value. Must be one of: ' + allowedStatus.join(', ') });
  }

  try {
    const newSchedule = await sql`
      INSERT INTO public.pm_schedule 
      (asset_id, pm_title, frequency_interval, pm_frequency_interval, last_pm_date, next_pm_date, checklist_ref, responsible_person, status)
      VALUES 
      (${asset_id}, ${pm_title}, ${frequency_interval}, ${pm_frequency_interval}::interval, ${last_pm_date}, ${next_pm_date}, ${checklist_ref}, ${responsible_person || req.user?.id}, ${status?.toLowerCase() || 'scheduled'})
      RETURNING *;
    `;
    res.status(201).json(newSchedule[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error creating PM schedule', details: err.message });
  }
});

// UPDATE PM schedule (Protected - requires authentication)
app.put('/api/pm/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { pm_title, frequency_interval, pm_frequency_interval, last_pm_date, next_pm_date, checklist_ref, status, responsible_person } = req.body;
  
  // Validate status enum if provided
  if (status) {
    const allowedStatus = ['scheduled','completed','overdue'];
    if (!allowedStatus.includes(status.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
  }

  try {
    const updated = await sql`
      UPDATE public.pm_schedule
      SET
        pm_title = COALESCE(${pm_title}, pm_title),
        frequency_interval = COALESCE(${frequency_interval}, frequency_interval),
        pm_frequency_interval = COALESCE(${pm_frequency_interval}::interval, pm_frequency_interval),
        last_pm_date = COALESCE(${last_pm_date}, last_pm_date),
        next_pm_date = COALESCE(${next_pm_date}, next_pm_date),
        checklist_ref = COALESCE(${checklist_ref}, checklist_ref),
        status = COALESCE(${status?.toLowerCase()}, status),
        responsible_person = COALESCE(${responsible_person}, responsible_person),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *;
    `;
    if (!updated.length) return res.status(404).json({ error: 'PM schedule not found' });
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error updating PM schedule', details: err.message });
  }
});

// DELETE PM schedule (Protected - requires authentication, admin only)
app.delete('/api/pm/:id', authMiddleware, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await sql`DELETE FROM public.pm_schedule WHERE id = ${id} RETURNING *;`;
        if (!deleted.length) return res.status(404).json({ error: 'PM Schedule not found' });
        res.json({ message: 'PM Schedule deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error deleting PM schedule' });
    }
});

// ======================================================
// 💡 UTILITIES MONITORING APIs
// ======================================================

// GET all utility logs
app.get('/api/utilities', async (req, res) => {
    try {
        const logs = await sql`SELECT * FROM public.utility_logs ORDER BY timestamp DESC`;
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching utility logs' });
    }
});

// CREATE a new utility log entry (Protected - requires authentication)
app.post('/api/utilities', authMiddleware, async (req, res) => {
    const { utility_type, meter_point, reading_unit, reading_value, timestamp, asset_id, business_unit_id, location_id, remarks } = req.body;
    
    // Validate utility_type enum
    const allowedTypes = ['Power','Water','Air','Gas'];
    if (!allowedTypes.includes(utility_type)) {
        return res.status(400).json({ error: 'Invalid utility type. Must be one of: ' + allowedTypes.join(', ') });
    }

    try {
        const newLog = await sql`
            INSERT INTO public.utility_logs 
            (utility_type, meter_point, reading_unit, reading_value, timestamp, asset_id, business_unit_id, location_id, recorded_by, remarks, created_by)
            VALUES 
            (${utility_type}, ${meter_point}, ${reading_unit}, ${reading_value}, ${timestamp || 'now()'}, ${asset_id}, ${business_unit_id}, ${location_id}, ${req.user?.id}, ${remarks}, ${req.user?.id})
            RETURNING *;
        `;
        res.status(201).json(newLog[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error creating utility log', details: err.message });
    }
});

// ======================================================
// 📱 QR CODE API
// ======================================================

// GET asset by QR code
app.get('/api/qr/:qr_code', async (req, res) => {
  const { qr_code } = req.params;
  try {
    const asset = await sql`
      SELECT * FROM public.asset_master WHERE qr_code = ${qr_code};
    `;
    if (!asset.length) return res.status(404).json({ error: 'No asset found for this QR code' });
    res.json(asset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching asset by QR code' });
  }
});


// ======================================================
// 📊 DASHBOARD & KPI APIs
// ======================================================
// GET stats for the main dashboard
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const [
            assetsCount,
            pmDueCount,
            urgentBreakdownsCount,
            spareInventoryCount,
            activeMetersCount
        ] = await Promise.all([
            sql`SELECT COUNT(*) FROM public.assets_master`,
            sql`SELECT COUNT(*) FROM public.pm_schedule WHERE status = 'overdue'`,
            sql`SELECT COUNT(*) FROM public.bd_entry_operator WHERE bd_status = 'open'`,
            sql`SELECT SUM(current_stock) as total_stock FROM public.spare_parts_inventory`,
            sql`SELECT COUNT(DISTINCT meter_point) FROM public.utility_logs`
        ]);

        res.json({
            assets: parseInt(assetsCount[0].count, 10),
            preventiveMaintenance: parseInt(pmDueCount[0].count, 10),
            breakdownMaintenance: parseInt(urgentBreakdownsCount[0].count, 10),
            spareInventory: parseFloat(spareInventoryCount[0].total_stock),
            utilitiesMonitoring: parseInt(activeMetersCount[0].count, 10),
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching dashboard stats' });
    }
});


// ======================================================
// 👤 USERS & AUTH APIs
// ======================================================

// GET all users (Protected - requires authentication, admin only)
app.get("/api/users", authMiddleware, requireAdmin, async (req, res) => {
  try {
    // Try profiles table first, fallback to users table
    let users;
    try {
      users = await sql`SELECT id, full_name, role, created_at FROM public.profiles ORDER BY created_at DESC`;
    } catch (err) {
      users = await sql`SELECT id, full_name, role, created_at FROM public.users ORDER BY created_at DESC`;
    }
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching users' });
  }
});

// LOGIN API (with bcrypt password verification and JWT token generation)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Fetch user from database
    const users = await sql`
      SELECT id, full_name, email, role, password 
      FROM public.profiles 
      WHERE email = ${email} 
      LIMIT 1
    `;
    
    if (!users.length) {
      // Don't reveal if email exists (security best practice)
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];
    
    // Verify password using bcrypt
    // Check if password is already hashed (starts with $2a$, $2b$, or $2y$)
    const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'));
    
    let passwordValid = false;
    
    if (isHashed) {
      // Password is hashed - use bcrypt compare
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Password is plain text (legacy support for existing users)
      // Migrate to hashed password on successful login
      passwordValid = user.password === password;
      
      if (passwordValid) {
        // Hash the password and update in database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await sql`
          UPDATE public.profiles 
          SET password = ${hashedPassword} 
          WHERE id = ${user.id}
        `;
        console.log(`[AUTH] Migrated password to bcrypt for user: ${user.email}`);
      }
    }

    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    console.log(`[AUTH] User logged in: ${user.email} (ID: ${user.id}, Role: ${user.role})`);

    res.json({
      message: "Login successful",

      token: token,
      user: { 
        id: user.id, 
        full_name: user.full_name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (err) {
    console.error('[AUTH ERROR] Login failed:', err);
    res.status(500).json({ error: "Database error during login" });
  }
});

// REGISTER API (with bcrypt password hashing and JWT token generation)
app.post("/api/register", async (req, res) => {
  const { email, password, role, full_name } = req.body;
  
  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email, password, and role are required" });
  }

  // Validate role (schema uses lowercase enum: 'admin','engineer','manager','operator')
  const allowedRoles = ['admin', 'engineer', 'manager', 'operator'];
  const roleLower = role.toLowerCase();
  if (!allowedRoles.includes(roleLower)) {
    return res.status(400).json({ 
      error: "Invalid role", 
      message: `Role must be one of: ${allowedRoles.join(', ')}` 
    });
  }

  // Validate password strength (minimum 6 characters)
  if (password.length < 6) {
    return res.status(400).json({ 
      error: "Weak password", 
      message: "Password must be at least 6 characters long" 
    });
  }

  try {
    const result = await sql.begin(async sql => {
      // Check if email already exists
      const existing = await sql`SELECT id FROM public.profiles WHERE email = ${email}`;
      if (existing.length) {
        const err = new Error("Email already registered");
        err.statusCode = 409;
        throw err;
      }

      // Hash password with bcrypt
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      console.log(`[AUTH] Registering new user: ${email} with role: ${role}`);


      // // Insert into users table (if it exists)
      // let userId;
      // try {
      //   const newUser = await sql`
      //     INSERT INTO public.users (email, full_name, role) 
      //     VALUES (${email}, ${full_name}, ${role}) 
      //     RETURNING id
      //   `;
      //   userId = newUser[0].id;
      // } catch (userTableError) {
      //   // If users table doesn't exist, generate ID from profiles table
      //   console.log('[AUTH] Users table not found, using profiles table directly');
      //   const maxId = await sql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM public.profiles`;
      //   userId = maxId[0].next_id;
      // }
      // Insert into users table (UUID primary key)
      const newUser = await sql`
        INSERT INTO public.users (email, full_name, role) 
        VALUES (${email}, ${full_name}, ${roleLower}::role_enum) 
        RETURNING id
      `;
      const userId = newUser[0].id;
      
      // Insert into profiles table with hashed password (if profiles table exists separately)
      // Note: If profiles table doesn't exist, you may need to add password column to users table
      let profile;
      try {
        profile = await sql`
          INSERT INTO public.profiles (id, full_name, email, password, role) 
          VALUES (${userId}, ${full_name}, ${email}, ${hashedPassword}, ${roleLower}) 
          RETURNING id, full_name, email, role
        `;
      } catch (profileError) {
        // If profiles table doesn't exist, return user data
        console.log('[AUTH] Profiles table not found, using users table');
        profile = [{ id: userId, full_name, email, role: roleLower }];
      }
      
      return profile[0];
    });

    // Generate JWT token for newly registered user
    const token = generateToken({
      id: result.id.toString(), // Convert UUID to string for JWT
      email: result.email,
      role: result.role
    });

    console.log(`[AUTH] User registered successfully: ${result.email} (ID: ${result.id})`);

    res.status(201).json({
      message: "User registered successfully",
      //token: "demo-token", // Replace with real JWT
      token: token,
      user: result
    });

  } catch (err) {
    console.error('[AUTH ERROR] Registration failed:', err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ 
      error: err.message || "Database error during registration" 
    });
  }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
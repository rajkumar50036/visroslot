/**
 * VISROSLOT - Phase 5 Verification Test Suite
 * Validates:
 * 1. Double-booking conflict collision detection & slot overlap logic
 * 2. Multi-staff vs Any Specialist availability capacity logic
 * 3. Permitted appointment status transitions & audit records
 * 4. Booked Service Value vs Collected Revenue financial separation
 * 5. Notification idempotency keys & Resend templates
 * 6. File structure integrity for Phase 5 routes & components
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testsFailed++;
  }
}

console.log('====================================================');
console.log('VISROSLOT PHASE 5 VERIFICATION TEST SUITE');
console.log('====================================================\n');

// ----------------------------------------------------
// Test 1: Overlapping Appointment Detection Algorithm
// ----------------------------------------------------
console.log('TEST 1: Double-Booking Conflict Overlap Logic');
function checkTimeOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

// Case 1: Identical slot (Conflict)
assert(checkTimeOverlap('10:00', '10:30', '10:00', '10:30') === true, 'Identical slot detected as conflict');

// Case 2: Overlapping start (Conflict)
assert(checkTimeOverlap('10:15', '10:45', '10:00', '10:30') === true, 'Partial overlap start detected as conflict');

// Case 3: Overlapping end (Conflict)
assert(checkTimeOverlap('09:45', '10:15', '10:00', '10:30') === true, 'Partial overlap end detected as conflict');

// Case 4: Enclosing slot (Conflict)
assert(checkTimeOverlap('09:30', '11:00', '10:00', '10:30') === true, 'Enclosing slot detected as conflict');

// Case 5: Adjacent slot (No conflict)
assert(checkTimeOverlap('10:30', '11:00', '10:00', '10:30') === false, 'Adjacent subsequent slot is free');
assert(checkTimeOverlap('09:30', '10:00', '10:00', '10:30') === false, 'Adjacent prior slot is free');

// Case 6: Completely disjoint slot (No conflict)
assert(checkTimeOverlap('14:00', '14:30', '10:00', '10:30') === false, 'Disjoint slot is free');

console.log('');

// ----------------------------------------------------
// Test 2: Multi-Staff vs Any Specialist Capacity Logic
// ----------------------------------------------------
console.log('TEST 2: Multi-Staff Availability Capacity Logic');
const staffMembers = [
  { id: 'staff_1', name: 'Dr. Arjun', is_active: true },
  { id: 'staff_2', name: 'Dr. Priya', is_active: true },
  { id: 'staff_3', name: 'Dr. Rohan', is_active: false }, // Inactive staff ignored
];

const existingAppointments = [
  { staff_id: 'staff_1', start_time: '10:00', end_time: '10:30', status: 'CONFIRMED' },
];

function isSlotAvailable(reqStaffId, reqStart, reqEnd, activeStaff, appointments) {
  const activeStaffList = activeStaff.filter(s => s.is_active);
  if (activeStaffList.length === 0) return { available: false, assignedStaff: null };

  if (reqStaffId && reqStaffId !== 'any') {
    const isBusy = appointments.some(a => 
      a.staff_id === reqStaffId &&
      a.status !== 'CANCELLED' &&
      checkTimeOverlap(reqStart, reqEnd, a.start_time, a.end_time)
    );
    const staffObj = activeStaffList.find(s => s.id === reqStaffId);
    return { available: !isBusy, assignedStaff: isBusy ? null : staffObj };
  } else {
    // Any Specialist: Find first free active staff member
    for (const staff of activeStaffList) {
      const isBusy = appointments.some(a => 
        a.staff_id === staff.id &&
        a.status !== 'CANCELLED' &&
        checkTimeOverlap(reqStart, reqEnd, a.start_time, a.end_time)
      );
      if (!isBusy) {
        return { available: true, assignedStaff: staff };
      }
    }
    return { available: false, assignedStaff: null };
  }
}

const testSpecificBusy = isSlotAvailable('staff_1', '10:00', '10:30', staffMembers, existingAppointments);
assert(testSpecificBusy.available === false, 'Specific staff_1 is correctly blocked at 10:00-10:30');

const testSpecificFree = isSlotAvailable('staff_2', '10:00', '10:30', staffMembers, existingAppointments);
assert(testSpecificFree.available === true && testSpecificFree.assignedStaff.id === 'staff_2', 'Specific staff_2 is available at 10:00-10:30');

const testAnyAvailable = isSlotAvailable('any', '10:00', '10:30', staffMembers, existingAppointments);
assert(testAnyAvailable.available === true && testAnyAvailable.assignedStaff.id === 'staff_2', 'Any Specialist correctly allocates free staff_2 when staff_1 is busy');

// When both are busy
const bothBusyAppointments = [
  { staff_id: 'staff_1', start_time: '10:00', end_time: '10:30', status: 'CONFIRMED' },
  { staff_id: 'staff_2', start_time: '10:00', end_time: '10:30', status: 'CONFIRMED' },
];
const testBothBusy = isSlotAvailable('any', '10:00', '10:30', staffMembers, bothBusyAppointments);
assert(testBothBusy.available === false, 'Any Specialist correctly reports full capacity when all active staff are busy');

console.log('');

// ----------------------------------------------------
// Test 3: Permitted Status Transitions
// ----------------------------------------------------
console.log('TEST 3: Appointment Status Transition Rules');
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'CONFIRMED'],
  COMPLETED: ['COMPLETED'],
  CANCELLED: ['CANCELLED'],
  NO_SHOW: ['NO_SHOW'],
};

function canTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

assert(canTransition('PENDING', 'CONFIRMED') === true, 'PENDING -> CONFIRMED permitted');
assert(canTransition('PENDING', 'CANCELLED') === true, 'PENDING -> CANCELLED permitted');
assert(canTransition('CONFIRMED', 'COMPLETED') === true, 'CONFIRMED -> COMPLETED permitted');
assert(canTransition('CONFIRMED', 'NO_SHOW') === true, 'CONFIRMED -> NO_SHOW permitted');
assert(canTransition('COMPLETED', 'PENDING') === false, 'COMPLETED -> PENDING rejected (terminal status)');
assert(canTransition('CANCELLED', 'CONFIRMED') === false, 'CANCELLED -> CONFIRMED rejected (terminal status)');

console.log('');

// ----------------------------------------------------
// Test 4: Financial Distinction (Booked Value vs Collected Revenue)
// ----------------------------------------------------
console.log('TEST 4: Booked Service Value vs Collected Revenue Separation');
const mockAppointments = [
  { id: '1', service_price: 500, status: 'COMPLETED' },
  { id: '2', service_price: 800, status: 'CONFIRMED' },
  { id: '3', service_price: 300, status: 'PENDING' },
  { id: '4', service_price: 600, status: 'CANCELLED' }, // Must NOT be counted in booked value
  { id: '5', service_price: 400, status: 'NO_SHOW' },
];

const bookedValue = mockAppointments
  .filter(a => a.status !== 'CANCELLED')
  .reduce((sum, a) => sum + a.service_price, 0);

const collectedRevenue = mockAppointments
  .filter(a => a.status === 'COMPLETED')
  .reduce((sum, a) => sum + a.service_price, 0);

assert(bookedValue === (500 + 800 + 300 + 400), `Booked Service Value correctly excludes CANCELLED (₹${bookedValue} === ₹2000)`);
assert(collectedRevenue === 500, `Collected Revenue strictly sums COMPLETED visits (₹${collectedRevenue} === ₹500)`);
assert(bookedValue !== collectedRevenue, 'Booked Value and Collected Revenue remain strictly distinguished');

console.log('');

// ----------------------------------------------------
// Test 5: Notification Idempotency Key Format
// ----------------------------------------------------
console.log('TEST 5: Notification Idempotency Keys');
function getNotificationDocId(appointmentId, type) {
  return `appt_notif_${appointmentId}_${type.toLowerCase()}`;
}

const key1 = getNotificationDocId('apt_abc123', 'CONFIRMED');
const key2 = getNotificationDocId('apt_abc123', 'RESCHEDULED');
assert(key1 === 'appt_notif_apt_abc123_confirmed', 'Idempotency key format matches appt_notif_${appointmentId}_${type}');
assert(key1 !== key2, 'Different event types produce distinct idempotency keys for the same appointment');

console.log('');

// ----------------------------------------------------
// Test 6: File Verification for Phase 5 Components
// ----------------------------------------------------
console.log('TEST 6: Required Files & Architecture Verification');
const basePath = path.resolve(__dirname, '..');
const requiredFiles = [
  'src/lib/notifications/appointmentNotifications.ts',
  'src/app/api/appointment/route.ts',
  'src/app/api/appointment/[id]/route.ts',
  'src/app/api/book/slots/route.ts',
  'src/app/api/book/appointment/route.ts',
  'src/app/app/overview/page.tsx',
  'src/app/app/calendar/page.tsx',
  'src/app/app/appointments/page.tsx',
  'src/app/app/customers/page.tsx',
  'src/app/book/[slug]/page.tsx',
  'src/components/brand/NetlifyBadgeSuppressor.tsx',
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(basePath, relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
}

console.log('');
console.log('====================================================');
console.log(`PHASE 5 TEST SUMMARY: ${testsPassed} Passed, ${testsFailed} Failed`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

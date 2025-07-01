import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only if no apps exist or this is the first initialization
let app;
let auth;

if (browser) {
  // Only initialize in browser environment
  const existingApps = getApps();

  if (existingApps.length === 0) {
    // No apps initialized yet, create new one
    app = initializeApp(firebaseConfig);
  } else {
    // Use existing app
    app = existingApps[0];
  }

  // Get auth instance
  auth = getAuth(app);

  // Enable persistent authentication
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error("Firebase persistence error:", error);
    });
} else {
  // Server-side: create minimal objects to prevent errors
  auth = null;
}

// Create stores for authentication state
export const isAuthenticated = writable(false);
export const userRole = writable(null);
export const userDepartment = writable(null);
export const authError = writable(null);
export const userName = writable(null);
export const userEmail = writable(null); // Tambahkan store userEmail

// Tambahkan store userName

// Role definitions moved to a constant
export const roleDefinitions = [
  { email: 'manager.it@eltama.com', role: 'user', department: 'IT' },
  { email: 'manager.hrd@eltama.com', role: 'user', department: 'HRD' },
  { email: 'manager.finance@eltama.com', role: 'user', department: 'Finance' },
  { email: 'manager.procurement@eltama.com', role: 'user', department: 'Procurement' },
  { email: 'manager.inventory@eltama.com', role: 'user', department: 'Inventory' },
  { email: 'manager.produksi@eltama.com', role: 'user', department: 'Produksi' },
  { email: 'manager.project@eltama.com', role: 'user', department: 'Project' },
  { email: 'manager.marketing@eltama.com', role: 'user', department: 'Marketing' },
  { email: 'manager.maintenance@eltama.com', role: 'user', department: 'Maintenance' },
  { email: 'general.manager@eltama.com', role: 'user', department: 'Management' },
  { email: 'plant.manager@eltama.com', role: 'user', department: 'Management' },

  { email: 'it@eltama.com', role: 'user', department: 'IT' },
  { email: 'hrd@eltama.com', role: 'user', department: 'HRD' },
  { email: 'finance@eltama.com', role: 'user', department: 'Finance' },
  { email: 'procurement@eltama.com', role: 'user', department: 'Procurement' },
  { email: 'inventory@eltama.com', role: 'user', department: 'Inventory' },
  { email: 'produksi@eltama.com', role: 'user', department: 'Produksi' },
  { email: 'project@eltama.com', role: 'user', department: 'Project' },
  { email: 'marketing@eltama.com', role: 'user', department: 'Marketing' },
  { email: 'maintenance@eltama.com', role: 'user', department: 'Maintenance' },
  { email: 'direktur@eltama.com', role: 'user', department: 'Direktur' },

  { email: 'tennov@eltama.com', role: 'admin', department: 'IT' },
  { email: 'adminexample@eltama.com', role: 'admin', department: 'HRD' },
  { email: 'hafizh@eltama.com', role: 'admin', department: 'IT' },
  { email: 'mickael@eltama.com', role: 'user', department: 'IT' },
  { email: 'brain@eltama.com', role: 'user', department: 'IT' },
  { email: 'samuel@eltama.com', role: 'user', department: 'IT' },
  { email: 'anwar@eltama.com', role: 'user', department: 'Project' },
  { email: 'ridho@eltama.com', role: 'user', department: 'Project' },
  { email: 'irfan@eltama.com', role: 'user', department: 'Project' },
  { email: 'ryo@eltama.com', role: 'user', department: 'Project' },
  { email: 'julianto@eltama.com', role: 'user', department: 'Project' },
  { email: 'panji@eltama.com', role: 'user', department: 'Project' },
  { email: 'irsyad@eltama.com', role: 'user', department: 'Project' },
  { email: 'taufik@eltama.com', role: 'user', department: 'Project' },
  { email: 'annga@eltama.com', role: 'user', department: 'Project' },
  { email: 'ciketing@eltama.com', role: 'user', department: 'Project' },
  { email: 'ineke@eltama.com', role: 'user', department: 'Project' },
  { email: 'surya@eltama.com', role: 'user', department: 'Marketing' },
  { email: 'alysa@eltama.com', role: 'user', department: 'Marketing' },
  { email: 'ikhsan@eltama.com', role: 'user', department: 'Marketing' },
  { email: 'datus@eltama.com', role: 'user', department: 'Marketing' },
  { email: 'marcel@eltama.com', role: 'user', department: 'Marketing' },
  { email: 'micky@eltama.com', role: 'user', department: 'Marketing' },
  { email: 'frida@eltama.com', role: 'user', department: 'Marketing' },
  { email: 'amel@eltama.com', role: 'user', department: 'Marketing' },
  { email: 'aqsa@eltama.com', role: 'user', department: 'HRD' },
  { email: 'prameta@eltama.com', role: 'user', department: 'HRD' },
  { email: 'shakila@eltama.com', role: 'user', department: 'HRD' },
  { email: 'yasinta@eltama.com', role: 'user', department: 'Inventory' },
  { email: 'rio@eltama.com', role: 'user', department: 'Inventory' },
  { email: 'niken@eltama.com', role: 'user', department: 'Finance' },
  { email: 'novi@eltama.com', role: 'user', department: 'Produksi' },
  { email: 'achmad@eltama.com', role: 'user', department: 'Maintenance' },
  { email: 'bayu@eltama.com', role: 'user', department: 'Maintenance' },
  { email: 'vionda@eltama.com', role: 'user', department: 'IT' },
  { email: 'adit@eltama.com', role: 'user', department: 'IT' },

  {
    email: "haryono@eltama.com",
    role: "multi_department.manager",
    department: "MAINTENANCE,INVENTORY,PRODUKSI",
    departments: ["MAINTENANCE", "INVENTORY", "PRODUKSI"]
  },
];
// Define approval flow stages and order
export const approvalStages = [
  'department_manager',
  'inventory',
  'procurement',
  'finance',
  'general_manager',
  'plant_manager',
  'direktur'
];

// Update authentication state observer - only in browser
if (browser && auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is signed in:", user.email);
      isAuthenticated.set(true);

      // Find user definition based on email
      const userDefinition = roleDefinitions.find(def => def.email.toLowerCase() === user.email.toLowerCase());

      // Set role, department, name, dan email berdasarkan definition
      const role = userDefinition ? userDefinition.role : null;
      const department = userDefinition ? userDefinition.department : null;
      const name = userDefinition ? userDefinition.name : null;
      const email = user.email || null;

      userRole.set(role);
      userDepartment.set(department);
      userName.set(name);
      userEmail.set(email); // Set userEmail di sini
    } else {
      console.log("User is signed out");
      isAuthenticated.set(false);
      userRole.set(null);
      userDepartment.set(null);
      userName.set(null);
      userEmail.set(null); // Reset userEmail saat logout
    }
  });
} else {
  // If not in browser or auth not available, set initial state
  console.log("Setting initial auth state to false (not in browser or auth unavailable)");
  isAuthenticated.set(false);
  userRole.set(null);
  userDepartment.set(null);
  userName.set(null);
  userEmail.set(null); // Reset userEmail
}

// Helper function to get department for a given role
export function getDepartmentForRole(role) {
  const definition = roleDefinitions.find(def => def.role === role);
  return definition ? definition.department : null;
}

// Helper function to check if a role is a manager role
export function isManagerRole(role) {
  return role && (role.endsWith('.manager') || role === 'general_manager' || role === 'plant_manager');
}

// Helper function to get approval field based on role
export function getApprovalFieldForRole(role) {
  // Map roles to their corresponding approval fields
  const approvalFieldMap = {
    // Manager roles (can only approve their department)
    'it.manager': 'department_manager_approved',
    'hrd.manager': 'department_manager_approved',
    'finance.manager': 'department_manager_approved',
    'procurement.manager': 'department_manager_approved',
    'inventory.manager': 'department_manager_approved',
    'produksi.manager': 'department_manager_approved',
    'project.manager': 'department_manager_approved',
    'marketing.manager': 'department_manager_approved',
    'maintenance.manager': 'department_manager_approved',

    // Global approval roles (can approve all department submissions)
    'inventory': 'inventory_approved',
    'procurement': 'procurement_approved',
    'finance': 'finance_approved',
    'general_manager': 'general_manager_approved',
    'plant_manager': 'plant_manager_approved',
    'direktur': 'direktur_approved',

    // Non-manager department roles (for reference)
    'it': null,
    'hrd': null,
    'project': null,
    'marketing': null,
    'maintenance': null,
    'produksi': null,
    'user': null
  };

  return approvalFieldMap[role] || null;
}

// Helper function to get the rejection field for a role
export function getRejectionFieldForRole(role) {
  const approvalField = getApprovalFieldForRole(role);
  return approvalField ? approvalField.replace('approved', 'rejected') : null;
}

// Helper function to get the current stage for a procurement
export function getCurrentApprovalStage(procurement) {
  if (!procurement) return null;

  // Check each stage in order
  for (const stage of approvalStages) {
    const approvedField = `${stage}_approved`;
    const rejectedField = `${stage}_rejected`;

    // If this stage is neither approved nor rejected, it's the current stage
    if (!procurement[approvedField] && !procurement[rejectedField]) {
      return stage;
    }

    // If this stage is rejected, the approval process is stopped
    if (procurement[rejectedField]) {
      return null;
    }
  }

  // If all stages are approved, return null (approval complete)
  return null;
}

// Helper function to determine if a user can approve a procurement
export function canUserApprove(userRole, userDepartment, procurement) {
  if (!userRole || !procurement) {
    console.log("Missing role or procurement in canUserApprove");
    return false;
  }

  // Special case for procurement@eltama.com (admin override)
  const currentEmail = auth && auth.currentUser ? auth.currentUser.email.toLowerCase() : null;
  if (currentEmail === "procurement@eltama.com") {
    console.log("Special user procurement@eltama.com granted approval access");
    return true;
  }

  // Get the current approval stage
  const currentStage = getCurrentApprovalStage(procurement);
  if (!currentStage) {
    console.log("No current approval stage found (completed or rejected)");
    return false;
  }

  console.log(`Checking approval access for stage: ${currentStage}, role: ${userRole}`);

  // For department manager stage
  if (currentStage === 'department_manager') {
    // Check if department should bypass department manager
    if (procurement.department &&
      ["maintenance", "inventory"].includes(procurement.department.toLowerCase())) {
      console.log(`Department ${procurement.department} bypasses department manager approval`);
      return false;
    }

    // Regular department manager check
    const isManager = userRole.endsWith('.manager') || userRole === 'multi_department.manager';
    const isDepartmentMatch = checkDepartmentAccess(userDepartment, procurement.department);

    console.log(`Department manager check: isManager=${isManager}, isDepartmentMatch=${isDepartmentMatch}`);
    return isManager && isDepartmentMatch;
  }

  // For other approval stages, use a mapping of stages to allowed roles
  const roleMatches = {
    'inventory': ['inventory', 'inventory.manager'],
    'procurement': ['procurement', 'procurement.manager'],
    'finance': ['finance', 'finance.manager'],
    'general_manager': ['general_manager'],
    'plant_manager': ['plant_manager'],
    'direktur': ['direktur']
  };

  const allowedRoles = roleMatches[currentStage] || [];
  const hasRole = allowedRoles.includes(userRole);

  console.log(`Stage ${currentStage} allows roles: ${allowedRoles.join(', ')}`);
  console.log(`User has role ${userRole}, approval granted: ${hasRole}`);

  return hasRole;
}

export function checkDepartmentAccess(userDepartment, procurementDepartment) {
  if (!userDepartment || !procurementDepartment) {
    console.log("Missing departments in access check");
    return false;
  }

  // Convert to uppercase for case-insensitive comparison
  const userDeptUpper = userDepartment.toUpperCase();
  const procDeptUpper = procurementDepartment.toUpperCase();

  console.log(`Checking department access: User=${userDeptUpper}, Procurement=${procDeptUpper}`);

  // Handle multiple departments (for users like haryono@eltama.com)
  if (userDeptUpper.includes(",")) {
    const departments = userDeptUpper.split(",").map(d => d.trim());
    const hasAccess = departments.includes(procDeptUpper);
    console.log(`Multi-department check: ${departments.join(", ")} includes ${procDeptUpper}? ${hasAccess}`);
    return hasAccess;
  }

  // Special case: multi_department.manager role has access to multiple departments
  const isMultiDeptManager = roleDefinitions.some(def =>
    def.email.toLowerCase() === (auth && auth.currentUser ? auth.currentUser.email.toLowerCase() : '') &&
    def.role === 'multi_department.manager'
  );

  if (isMultiDeptManager) {
    console.log("User has multi_department.manager role, granting access");
    return true;
  }

  // Regular single department check
  const hasAccess = userDeptUpper === procDeptUpper;
  console.log(`Regular department check: ${userDeptUpper} === ${procDeptUpper}? ${hasAccess}`);
  return hasAccess;
}

export const login = async (email, password) => {
  if (!browser || !auth) {
    throw new Error('Authentication not available on server side');
  }

  try {
    authError.set(null);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Additional role validation can be added here if needed
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    authError.set(error.message);
    throw error;
  }
};

export const logout = async () => {
  if (!browser || !auth) {
    console.warn('Logout called on server side or auth not available');
    return;
  }

  try {
    // Hapus token Directus jika ada
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('directus_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_department');
      localStorage.removeItem('user_name');
    }

    await signOut(auth);

    // Reset semua store agar sesi benar-benar berakhir
    isAuthenticated.set(false);
    userRole.set(null);
    userDepartment.set(null);
    userName.set(null);
    userEmail.set(null);
    authError.set(null);

    // Redirect ke halaman login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
    authError.set(error.message);

    // Tetap reset store meskipun error
    isAuthenticated.set(false);
    userRole.set(null);
    userDepartment.set(null);
    userName.set(null);
    userEmail.set(null);

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw error;
  }
};
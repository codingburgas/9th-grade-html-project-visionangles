import { auth, db } from '../data/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

const PAGE_CONFIG = {
  'admin-panel.html': {
    allowedRoles: ['admin'],
    redirectTo: '../index.html',
    message: 'Access denied. Admins only.'
  },
  
  'report-history.html': {
    allowedRoles: ['admin', 'firefighter'],
    redirectTo: '../index.html',
    message: 'Access denied. Authorized personnel only.'
  },
  
  'fire-report.html': {
    allowedRoles: ['citizen', 'firefighter', 'admin'],
    redirectTo: 'sign-in.html',
    message: 'Please sign in to report a fire.'
  },

  'map.html': {
    allowedRoles: ['citizen', 'firefighter', 'admin'],
    redirectTo: 'sign-in.html',
    message: 'Please sign in to view fires map.'
  }
};

function getCurrentPageName() {
  const path = window.location.pathname;
  const pageName = path.split('/').pop();
  return pageName || 'index.html';
}

function isRoleAllowed(userRole, allowedRoles) {
  if (allowedRoles.includes('public')) return true;
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

function checkUserRole() {
  const currentPage = getCurrentPageName();
  const pageConfig = PAGE_CONFIG[currentPage];
  
  if (!pageConfig) {
    console.log(`Page ${currentPage} not in config, treating as public`);
    return;
  }
  
  if (pageConfig.allowedRoles.includes('public')) {
    console.log(`Page ${currentPage} is public`);
    return;
  }
  
  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        if (pageConfig.redirectTo) {
          console.log('User not authenticated, redirecting...');
          if (pageConfig.message) {
            alert(pageConfig.message);
          }
          window.location.href = pageConfig.redirectTo;
        }
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        console.error('User document not found');
        alert('User profile not found. Please contact support.');
        window.location.href = 'sign-in.html';
        return;
      }

      const userData = userDoc.data();
      const userRole = userData.role || 'citizen';
      
      console.log(`Current user role: ${userRole}, Page: ${currentPage}`);
      
      if (!isRoleAllowed(userRole, pageConfig.allowedRoles)) {
        console.log(`Access denied for role: ${userRole}`);
        if (pageConfig.message) {
          alert(pageConfig.message);
        }
        window.location.href = pageConfig.redirectTo;
        return;
      }
      
    } catch (error) {
      console.error('Error checking user role:', error);
      alert('Error verifying user permissions. Please try again.');
      
      if (pageConfig.redirectTo) {
        window.location.href = pageConfig.redirectTo;
      }
    }
  });
}

function redirectBasedOnRole(redirectMap) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = redirectMap.notAuthenticated || 'sign-in.html';
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        window.location.href = redirectMap.noProfile || 'sign-in.html';
        return;
      }

      const userRole = userDoc.data().role || 'citizen';
      const redirectUrl = redirectMap[userRole] || redirectMap.default || '../index.html';
      
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('Error in role-based redirect:', error);
      window.location.href = redirectMap.error || '../index.html';
    }
  });
}

function getCurrentUserRole() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        resolve(null);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          resolve(null);
          return;
        }

        const userRole = userDoc.data().role || 'citizen';
        resolve(userRole);
        
      } catch (error) {
        reject(error);
      }
    });
  });
}

checkUserRole();
// Bag page specific functionality
document.addEventListener('DOMContentLoaded', () => {
  const checkoutBtn = document.getElementById('checkoutBtn');
  const subtotalEl = document.getElementById('bagSubtotal');
  const bagError = document.getElementById('bagError');
  const user = window.EC_USER || null;

  // Helper: read bag from localStorage
  function getBag() {
    try {
      return JSON.parse(localStorage.getItem('ec_bag') || '[]');
    } catch (e) {
      return [];
    }
  }

  // Helper: show error message
  function showBagError(message) {
    if (bagError) {
      bagError.textContent = message;
      bagError.style.display = 'block';
    }
  }

  // Helper: hide error message
  function hideBagError() {
    if (bagError) {
      bagError.textContent = '';
      bagError.style.display = 'none';
    }
  }

  // Helper: validate phone number format
  function isValidPhoneNumber(phone) {
    if (!phone) return false;
    // Philippine phone number formats:
    // +639xxxxxxxxx (with country code)
    // 09xxxxxxxxx (mobile)
    // Remove spaces and dashes for validation
    const cleaned = phone.replace(/[\s\-]/g, '');
    const mobilePattern = /^(09|\+639)\d{9}$/;
    return mobilePattern.test(cleaned);
  }

  // Update checkout button state based on bag contents
  function updateCheckoutButton() {
    const bag = getBag();
    const isEmpty = !bag || bag.length === 0;
    
    if (checkoutBtn) {
      if (isEmpty) {
        checkoutBtn.disabled = true;
        checkoutBtn.style.opacity = '0.5';
        checkoutBtn.style.cursor = 'not-allowed';
      } else {
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = '1';
        checkoutBtn.style.cursor = 'pointer';
      }
    }
    
    // Update subtotal display
    if (subtotalEl && bag.length > 0) {
      const subtotal = bag.reduce((sum, item) => {
        const price = Number(item.price || item.basePrice || 0);
        const qty = Number(item.quantity || 1);
        return sum + (price * qty);
      }, 0);
      subtotalEl.textContent = subtotal.toLocaleString();
    } else if (subtotalEl) {
      subtotalEl.textContent = '0';
    }
  }

  // Handle checkout button click with validation
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Hide any previous error messages
      hideBagError();
      
      const bag = getBag();
      
      // Check if bag is empty
      if (!bag || bag.length === 0) {
        showBagError('🛒 Your bag is empty. Add items before checking out.');
        return;
      }
      
      // Check if user is logged in
      if (!user || !user._id) {
        showBagError('🔐 Please log in to proceed to checkout.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }
      
      // Collect all missing requirements
      const missingItems = [];
      
      // Check if user email is verified
      if (!user.isVerified) {
        missingItems.push('✉️ Verify your email address');
      }
      
      // Check if user has a delivery address (same logic as checkout.js)
      // First check user.address (single/legacy), then user.addresses array
      let hasAddress = false;
      let addressToUse = null;
      
      if (user.address && user.address.street && user.address.city && user.address.province && user.address.barangay && user.address.postalCode) {
        hasAddress = true;
        addressToUse = user.address;
      } else if (user.addresses && user.addresses.length > 0) {
        // Check for a complete address in the addresses array
        const defaultAddr = user.addresses.find(a => a.isDefault);
        const firstAddr = user.addresses[0];
        addressToUse = defaultAddr || firstAddr;
        
        if (addressToUse && addressToUse.street && addressToUse.city && addressToUse.province && addressToUse.barangay && addressToUse.postalCode) {
          hasAddress = true;
        }
      }
      
      if (!hasAddress) {
        missingItems.push('📍 Add a delivery address (street, barangay, city, province, postal code)');
      }
      
      // Check if user has a valid phone number (from address or profile)
      const userPhone = addressToUse?.phone || user.phone;
      if (!userPhone || !isValidPhoneNumber(userPhone)) {
        missingItems.push('📞 Add a valid phone number');
      }
      
      // If there are missing requirements, show them all
      if (missingItems.length > 0) {
        const errorHtml = '<strong>Please complete your profile:</strong><br>' + missingItems.join('<br>');
        if (bagError) {
          bagError.innerHTML = errorHtml;
          bagError.style.display = 'block';
        }
        // Add a link to profile
        setTimeout(() => {
          if (bagError && bagError.style.display === 'block') {
            bagError.innerHTML += '<br><br><a href="/profile" style="color:#8B4513; text-decoration:underline;">Go to Profile →</a>';
          }
        }, 500);
        return;
      }
      
      // All validations passed, proceed to checkout
      window.location.href = '/checkout';
    });
  }

  // Initialize button state on page load
  updateCheckoutButton();
  
  // Watch for bag changes in localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === 'ec_bag') {
      updateCheckoutButton();
    }
  });
  
  // Also check periodically in case localStorage changes within same tab
  setInterval(updateCheckoutButton, 1000);
});

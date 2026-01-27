// Bag page specific functionality
document.addEventListener('DOMContentLoaded', () => {
  const checkoutBtn = document.getElementById('checkoutBtn');
  const subtotalEl = document.getElementById('bagSubtotal');
  const user = window.EC_USER || null;

  // Helper: read bag from localStorage
  function getBag() {
    try {
      return JSON.parse(localStorage.getItem('ec_bag') || '[]');
    } catch (e) {
      return [];
    }
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
      
      const bag = getBag();
      
      // Check if bag is empty
      if (!bag || bag.length === 0) {
        showToast('Your bag is empty. Add items before checking out.');
        return;
      }
      
      // Check if user is logged in
      if (!user || !user._id) {
        showToast('Please log in to proceed to checkout.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }
      
      // Check if user email is verified
      if (!user.isVerified) {
        showToast('Please verify your email address before checking out. Check your inbox for the verification link.');
        setTimeout(() => {
          window.location.href = '/profile';
        }, 3000);
        return;
      }
      
      // Check if user has a delivery address
      const hasAddress = user.address && 
                        user.address.street && 
                        user.address.city && 
                        user.address.province;
      
      if (!hasAddress) {
        showToast('Please add your delivery address in your profile before checking out.');
        setTimeout(() => {
          window.location.href = '/profile';
        }, 3000);
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

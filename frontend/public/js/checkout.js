// Checkout page interactions: dropdown, modals, address selection
document.addEventListener('DOMContentLoaded', () => {
  const bankDropdown = document.getElementById('bankDropdown');
  const bankSelected = document.getElementById('bankSelected');
  const bankOptions = document.getElementById('bankOptions');
  const paymentModal = document.getElementById('paymentModal');
  const paymentBackBtn = document.getElementById('paymentBackBtn');
  const addressModal = document.getElementById('addressModal');
  const changeAddressBtn = document.getElementById('changeAddressBtn');
  const addrCancel = document.getElementById('addrCancel');
  const receiptInput = document.getElementById('receiptInput');
  const uploadArea = document.getElementById('uploadArea');
  const completeBtn = document.getElementById('completeOrderBtn');

  // ========================================
  // VALIDATION HELPER FUNCTIONS
  // ========================================
  
  // Add CSS for validation highlighting if not present
  if (!document.querySelector('style[data-checkout-validation]')) {
    const style = document.createElement('style');
    style.setAttribute('data-checkout-validation', 'true');
    style.textContent = `
      .validation-error {
        border: 2px solid #dc2626 !important;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15) !important;
        animation: shake 0.4s ease-in-out;
      }
      .validation-error-text {
        color: #dc2626;
        font-size: 12px;
        margin-top: 4px;
        display: block;
        font-weight: 500;
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-8px); }
        75% { transform: translateX(8px); }
      }
      .field-valid {
        border: 2px solid #16a34a !important;
        box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15) !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Mark a field as having an error
  function setFieldError(element, message) {
    if (!element) return;
    element.classList.remove('field-valid');
    element.classList.add('validation-error');
    
    // Remove existing error message
    const existingError = element.parentElement?.querySelector('.validation-error-text');
    if (existingError) existingError.remove();
    
    // Add new error message
    if (message) {
      const errorEl = document.createElement('span');
      errorEl.className = 'validation-error-text';
      errorEl.textContent = message;
      element.parentElement?.appendChild(errorEl);
    }
  }
  
  // Clear field error
  function clearFieldError(element) {
    if (!element) return;
    element.classList.remove('validation-error');
    const existingError = element.parentElement?.querySelector('.validation-error-text');
    if (existingError) existingError.remove();
  }
  
  // Mark field as valid
  function setFieldValid(element) {
    if (!element) return;
    clearFieldError(element);
    element.classList.add('field-valid');
  }
  
  // Clear all validation states
  function clearAllValidation() {
    document.querySelectorAll('.validation-error').forEach(el => {
      el.classList.remove('validation-error');
    });
    document.querySelectorAll('.validation-error-text').forEach(el => {
      el.remove();
    });
    document.querySelectorAll('.field-valid').forEach(el => {
      el.classList.remove('field-valid');
    });
    const orderError = document.getElementById('orderError');
    if (orderError) {
      orderError.style.display = 'none';
      orderError.textContent = '';
    }
  }

  // Helper: read bag from localStorage
  function getBag() {
    try { return JSON.parse(localStorage.getItem('ec_bag') || '[]'); } catch (e) { return []; }
  }

  // Render bag items into checkout area
  function renderBagItems() {
    const bag = getBag();
    const container = document.querySelector('.items-box');
    const subtotalEl = document.querySelector('.subtotal-amount');
    if (!container) return;
    container.innerHTML = '';
    if (!bag || bag.length === 0) {
      container.innerHTML = '<div class="items-placeholder">*Items shown here</div>';
      if (subtotalEl) subtotalEl.textContent = '₱0.00';
      return;
    }

    let subtotal = 0;
    const list = document.createElement('div');
    list.className = 'checkout-items-list';
    bag.forEach(item => {
      const qty = item.quantity || 1;
      const price = Number(item.price || item.basePrice || 0);
      const total = price * qty;
      subtotal += total;

      const row = document.createElement('div');
      row.className = 'checkout-item-row';
      row.innerHTML = `
        <div class="ci-image"><img src="/images/${item.image || ''}" alt=""/></div>
        <div class="ci-info">
          <div class="ci-name">${item.name || item.label || 'Item'}</div>
          <div class="ci-meta">Qty: ${qty} · ₱${price.toLocaleString()}</div>
        </div>
        <div class="ci-total">₱${total.toLocaleString()}</div>
      `;
      list.appendChild(row);
    });
    container.appendChild(list);
    if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toLocaleString()}`;
    container.dataset.subtotal = subtotal;
  }

  renderBagItems();

  // Auto-fill delivery address from user profile on page load
  const user = window.EC_USER || null;
  if (user) {
    let addrToUse = null;
    let addrFullName = (user.firstName || '') + ' ' + (user.lastName || '');
    let addrPhone = user.phone || '';
    
    // First try user.address (single address) - require all fields
    if (user.address && user.address.street && user.address.city && user.address.province && user.address.barangay && user.address.postalCode) {
      addrToUse = user.address;
    }
    // Then try user.addresses array (multiple addresses) - use default or first
    else if (user.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find(a => a.isDefault);
      const firstAddr = user.addresses[0];
      const selected = defaultAddr || firstAddr;
      // Require all address fields: street, city, province, barangay, postalCode
      if (selected && selected.street && selected.city && selected.province && selected.barangay && selected.postalCode) {
        addrToUse = selected;
        // Use name/phone from the address entry if available
        if (selected.firstName && selected.lastName) {
          addrFullName = selected.firstName + ' ' + selected.lastName;
        }
        if (selected.phone) {
          addrPhone = selected.phone;
        }
      }
    }
    
    if (addrToUse) {
      const deliveryCard = document.getElementById('deliveryCard');
      const province = addrToUse.province || '';
      const city = addrToUse.city || '';
      const barangay = addrToUse.barangay || '';
      const postalCode = addrToUse.postalCode || '';
      const street = addrToUse.street || '';
      const addressText = `${street}${barangay ? ', ' + barangay : ''}${city ? ', ' + city : ''}${province ? ', ' + province : ''}${postalCode ? ', ' + postalCode : ''}`;
      
      if (deliveryCard) {
        deliveryCard.querySelector('.delivery-name').textContent = addrFullName;
        deliveryCard.querySelector('.delivery-phone').textContent = addrPhone;
        deliveryCard.querySelector('.delivery-address').textContent = addressText;
        // Store address components for order submission
        deliveryCard.dataset.province = province;
        deliveryCard.dataset.city = city;
        deliveryCard.dataset.barangay = barangay;
        deliveryCard.dataset.postalCode = postalCode;
        deliveryCard.dataset.street = street;
        
        // Update complete button state after auto-filling
        updateCompleteButtonState();
      }
    }
  }

  // Toggle bank dropdown
  bankSelected && bankSelected.addEventListener('click', () => {
    bankOptions.classList.toggle('open');
  });

  // Choose bank option
  document.querySelectorAll('.bank-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      const bank = e.target.textContent.trim();
      bankSelected.textContent = bank + ' ';
      const chev = document.createElement('span');
      chev.className = 'chev';
      chev.textContent = '▾';
      bankSelected.appendChild(chev);
      bankOptions.classList.remove('open');
      openPaymentModal(bank);
      // ensure complete button state recalculates after bank selection
      try { updateCompleteButtonState(); } catch (err) { /* noop */ }
    });
  });

  function openPaymentModal(bank) {
    const modal = paymentModal;
    if (!modal) return;
    // set image for bank card (payments/<bank>_card.svg)
    const img = modal.querySelector('.bank-card-img');
    // hide placeholder SVG/card image to avoid showing an unrelated placeholder
    if (img) img.style.display = 'none';
    // set QR image from /images/bank-details/<bank>-details-qr.jpg (mapping)
    const qr = modal.querySelector('.bank-qr-img');
    if (qr) {
      const bankKey = (bank || '').toUpperCase();
      const mapping = {
        'BPI': '/images/bank-details/bpi-details-qr.jpg',
        'BDO': '/images/bank-details/bdo-details-qr.jpg',
        'GCASH': '/images/bank-details/gcash-details-qr.jpg'
      };
      qr.src = mapping[bankKey] || `/images/bank-qr/${bank.toLowerCase()}.png`;
      qr.style.display = 'block';
      qr.style.maxWidth = '100%';
      qr.style.height = 'auto';
      qr.style.objectFit = 'contain';
    }

    // compute subtotal amounts
    const itemsContainer = document.querySelector('.items-box');
    const subtotal = itemsContainer && itemsContainer.dataset.subtotal ? Number(itemsContainer.dataset.subtotal) : 0;
    const fullAmount = subtotal;
    const partialAmount = Math.round((subtotal / 2) * 100) / 100;
    // update radio labels
    const container = modal.querySelector('.modal-right');
    if (container) {
      const fullLabel = container.querySelector('input[name="paymethod"][value="full"]')?.parentElement;
      const partialLabel = container.querySelector('input[name="paymethod"][value="partial"]')?.parentElement;
      if (fullLabel) fullLabel.innerHTML = `<input type="radio" name="paymethod" value="full" checked> Pay in Full — ₱${fullAmount.toLocaleString()}`;
      if (partialLabel) partialLabel.innerHTML = `<input type="radio" name="paymethod" value="partial"> Partial Payment (50%) — ₱${partialAmount.toLocaleString()}`;
    }

    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closePaymentModal() {
    if (!paymentModal) return;
    paymentModal.setAttribute('aria-hidden', 'true');
    paymentModal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  paymentBackBtn && paymentBackBtn.addEventListener('click', closePaymentModal);
  paymentModal && paymentModal.addEventListener('click', (e) => { if (e.target === paymentModal) closePaymentModal(); });
  
  // Address modal: load and display user's saved addresses
  changeAddressBtn && changeAddressBtn.addEventListener('click', async () => {
    const user = window.EC_USER || null;
    if (!user || !user._id) {
      showToast('Please log in to select an address');
      return;
    }
    
    try {
      // Load user's addresses
      const response = await fetch(`/api/users/${user._id}`);
      if (!response.ok) {
        throw new Error('Failed to load addresses');
      }
      
      const userData = await response.json();
      const addresses = userData.addresses || [];
      const addressesList = document.getElementById('addressesList');
      
      if (addresses.length === 0) {
        addressesList.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: #666;">
            <p style="margin-bottom: 15px;">No saved addresses found.</p>
            <p>Please add an address in your <a href="/profile" style="color: #620418; text-decoration: underline;">profile page</a>.</p>
          </div>
        `;
      } else {
        addressesList.innerHTML = addresses.map(addr => `
          <div class="address-card" style="background: white; padding: 15px; border-radius: 8px; border: 2px solid #ddd; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;" data-address-id="${addr._id}">
            ${addr.isDefault ? '<span style="background: #620418; color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block; margin-bottom: 8px;">DEFAULT</span>' : ''}
            <h4 style="margin: 0 0 8px 0; color: #620418; font-size: 16px;">${addr.firstName} ${addr.lastName}</h4>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Phone:</strong> ${addr.phone}</p>
            ${addr.social ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Social:</strong> ${addr.social}</p>` : ''}
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #666; line-height: 1.6;">
              ${[addr.street, addr.barangay, addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ')}
            </p>
          </div>
        `).join('');
        
        // Add click listeners to address cards
        document.querySelectorAll('#addressesList .address-card').forEach(card => {
          card.addEventListener('click', function() {
            const addressId = this.dataset.addressId;
            const address = addresses.find(a => a._id === addressId);
            if (address) {
              selectAddress(address);
            }
          });
          
          // Hover effect
          card.addEventListener('mouseenter', function() {
            this.style.borderColor = '#620418';
            this.style.backgroundColor = '#fef3f4';
          });
          
          card.addEventListener('mouseleave', function() {
            this.style.borderColor = '#ddd';
            this.style.backgroundColor = 'white';
          });
        });
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      const addressesList = document.getElementById('addressesList');
      addressesList.innerHTML = '<p class="error-text">Failed to load addresses. Please try again.</p>';
    }
    
    addressModal.setAttribute('aria-hidden', 'false');
    addressModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  
  // Function to select and apply an address
  function selectAddress(address) {
    const name = `${address.firstName} ${address.lastName}`;
    const phone = address.phone;
    const province = address.province;
    const city = address.city;
    const barangay = address.barangay;
    const postalCode = address.postalCode;
    const street = address.street;
    const addressText = `${street}, ${barangay}, ${city}, ${province}, ${postalCode}`;
    
    const delivery = document.getElementById('deliveryCard');
    if (delivery) {
      delivery.querySelector('.delivery-name').textContent = name;
      delivery.querySelector('.delivery-phone').textContent = phone;
      delivery.querySelector('.delivery-address').textContent = addressText;
      // Store address components for order submission
      delivery.dataset.province = province;
      delivery.dataset.city = city;
      delivery.dataset.barangay = barangay;
      delivery.dataset.postalCode = postalCode;
      delivery.dataset.street = street;
    }
    
    // Close modal
    addressModal.setAttribute('aria-hidden', 'true');
    addressModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    updateCompleteButtonState();
  }

  addrCancel && addrCancel.addEventListener('click', () => {
    addressModal.setAttribute('aria-hidden', 'true');
    addressModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    // Reset to list view
    const listView = document.getElementById('addressListView');
    const formView = document.getElementById('addressFormView');
    if (listView) listView.style.display = 'block';
    if (formView) formView.style.display = 'none';
  });

  addressModal && addressModal.addEventListener('click', (e) => { if (e.target === addressModal) addrCancel.click(); });

  // Show Add Address Form
  const showAddAddressBtn = document.getElementById('showAddAddressBtn');
  const backToAddressList = document.getElementById('backToAddressList');
  const checkoutAddressForm = document.getElementById('checkoutAddressForm');
  const addressListView = document.getElementById('addressListView');
  const addressFormView = document.getElementById('addressFormView');

  showAddAddressBtn && showAddAddressBtn.addEventListener('click', () => {
    if (addressListView) addressListView.style.display = 'none';
    if (addressFormView) addressFormView.style.display = 'block';
    // Pre-fill with user data if available
    const user = window.EC_USER || null;
    if (user && checkoutAddressForm) {
      checkoutAddressForm.querySelector('[name="firstName"]').value = user.firstName || '';
      checkoutAddressForm.querySelector('[name="lastName"]').value = user.lastName || '';
      checkoutAddressForm.querySelector('[name="phone"]').value = user.phone || '';
    }
  });

  backToAddressList && backToAddressList.addEventListener('click', () => {
    if (addressListView) addressListView.style.display = 'block';
    if (addressFormView) addressFormView.style.display = 'none';
  });

  // Handle Add Address Form Submit
  checkoutAddressForm && checkoutAddressForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = window.EC_USER || null;
    if (!user || !user._id) {
      showToast('Please log in to add an address');
      return;
    }

    const formData = new FormData(checkoutAddressForm);
    const addressData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      province: formData.get('province'),
      city: formData.get('city'),
      barangay: formData.get('barangay'),
      postalCode: formData.get('postalCode'),
      street: formData.get('street'),
      phone: formData.get('phone'),
      social: formData.get('social') || '',
      isDefault: formData.get('isDefault') === 'on'
    };

    // Validate required fields
    const required = ['firstName', 'lastName', 'province', 'city', 'barangay', 'postalCode', 'street', 'phone'];
    const missing = required.filter(field => !addressData[field]);
    const errorEl = document.getElementById('addressFormError');
    
    if (missing.length > 0) {
      if (errorEl) {
        errorEl.textContent = 'Please fill in all required fields';
        errorEl.style.display = 'block';
      }
      return;
    }

    try {
      const response = await fetch(`/api/users/${user._id}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addressData)
      });

      if (response.ok) {
        const result = await response.json();
        // Use the newly added address
        selectAddress(addressData);
        // Reset form
        checkoutAddressForm.reset();
        if (errorEl) errorEl.style.display = 'none';
        showToast('Address added successfully');
      } else {
        const err = await response.json();
        if (errorEl) {
          errorEl.textContent = err.message || 'Failed to add address';
          errorEl.style.display = 'block';
        }
      }
    } catch (err) {
      console.error('Error adding address:', err);
      if (errorEl) {
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.style.display = 'block';
      }
    }
  });

  // clicking the delivery address placeholder opens the address modal
  const deliveryAddressEl = document.getElementById('deliveryAddress');
  if (deliveryAddressEl) {
    deliveryAddressEl.addEventListener('click', () => {
      changeAddressBtn && changeAddressBtn.click();
    });
  }

  // File upload preview (store base64)
  if (receiptInput) {
    receiptInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        const img = document.createElement('img');
        img.style.maxWidth = '100%';
        img.style.maxHeight = '160px';
        img.src = ev.target.result;
        uploadArea.innerHTML = '';
        uploadArea.appendChild(img);
        uploadArea.dataset.receipt = ev.target.result;
        // enable complete button when receipt present
        updateCompleteButtonState();
      };
      reader.readAsDataURL(file);
    });
    // clicking the upload area should open file picker
    if (uploadArea) {
      uploadArea.addEventListener('click', () => {
        receiptInput.click();
      });
    }
  }
  function updateCompleteButtonState() {
    const orderError = document.getElementById('orderError');
    if (!completeBtn) {
      console.error('Complete button not found!');
      return;
    }
    
    const user = window.EC_USER || null;
    const hasReceipt = !!(uploadArea && uploadArea.dataset && uploadArea.dataset.receipt);
    const addressEl = document.getElementById('deliveryAddress');
    const hasAddress = addressEl && addressEl.textContent && addressEl.textContent.trim() !== '' && addressEl.textContent.indexOf('Please input your delivery address') === -1;
    // Ensure a bank has been chosen (strip the chevron symbol if present)
    const bankText = (document.getElementById('bankSelected')?.textContent || '').replace('▾','').trim();
    const hasBank = !!bankText && bankText.toLowerCase() !== 'select' && bankText.length > 0;
    
    // Check if user is verified
    const isVerified = user && user.isVerified === true;
    
    // Debug logging
    console.log('Button State Check:', { hasReceipt, hasAddress, hasBank, isVerified, user: user ? user.email : 'none' });
    
    // Button is enabled only if ALL conditions are met - but keep it clickable for validation display
    const allConditionsMet = hasReceipt && hasAddress && hasBank && isVerified;
    
    // Visual feedback only - don't disable the button
    if (allConditionsMet) {
      completeBtn.style.opacity = '1';
      completeBtn.style.cursor = 'pointer';
    } else {
      completeBtn.style.opacity = '0.8';
      completeBtn.style.cursor = 'pointer';
    }
    
    if (orderError) {
      orderError.style.display = 'none';
      orderError.innerHTML = '';
    }
  }

  // initialize complete button state
  updateCompleteButtonState();
  // Complete order: assemble payload, send POST, redirect to confirmation page
  if (completeBtn) {
    console.log('Complete button found, adding click listener');
    completeBtn.addEventListener('click', async (ev) => {
      console.log('Complete Order button clicked!');
      ev.preventDefault();
      
      const bag = getBag();
      const user = window.EC_USER || null;
      const orderError = document.getElementById('orderError');
      
      // Clear all previous validation errors
      clearAllValidation();
      
      // Track validation errors
      let hasErrors = false;
      let firstErrorElement = null;
      
      // ========================================
      // STRICT VALIDATION - All fields required
      // ========================================
      
      // 1. Check if bag has items
      if (!bag || bag.length === 0) {
        const itemsBox = document.querySelector('.items-box');
        if (itemsBox) setFieldError(itemsBox, 'Your shopping bag is empty');
        if (orderError) {
          orderError.innerHTML = '<strong>⚠️ Empty Cart</strong><br>Your shopping bag is empty. Please add items before checking out.';
          orderError.style.display = 'block';
        }
        showToast('Your bag is empty');
        return;
      }
      
      // 2. Check user is logged in
      if (!user || !user._id) {
        if (orderError) {
          orderError.innerHTML = '<strong>⚠️ Login Required</strong><br>Please log in to complete your order.';
          orderError.style.display = 'block';
        }
        showToast('Please log in to complete your order');
        setTimeout(() => window.location.href = '/login', 1500);
        return;
      }
      
      // 3. Check if user email is verified
      if (!user.isVerified) {
        if (orderError) {
          orderError.innerHTML = '<strong>⚠️ Email Verification Required</strong><br>Please verify your email address before completing your order. Check your inbox for the verification link or resend from your profile.';
          orderError.style.display = 'block';
        }
        showToast('Please verify your email address before completing your order.');
        return;
      }
      
      // 4. Check delivery address
      const deliveryCard = document.getElementById('deliveryCard');
      const addressEl = document.getElementById('deliveryAddress');
      const addressText = addressEl?.textContent?.trim() || '';
      const hasAddress = addressText !== '' && !addressText.includes('Please input your delivery address');
      
      if (!hasAddress) {
        setFieldError(deliveryCard, 'Delivery address is required');
        if (!firstErrorElement) firstErrorElement = deliveryCard;
        hasErrors = true;
      } else {
        setFieldValid(deliveryCard);
      }
      
      // 5. Check bank/payment method selection
      const bankNameText = (document.getElementById('bankSelected')?.textContent || '').replace('▾','').trim();
      const hasBank = bankNameText && bankNameText.toLowerCase() !== 'select' && bankNameText.length > 0;
      
      if (!hasBank) {
        setFieldError(bankDropdown, 'Please select a payment method');
        if (!firstErrorElement) firstErrorElement = bankDropdown;
        hasErrors = true;
      } else {
        setFieldValid(bankDropdown);
      }
      
      // 6. Check receipt upload
      const receipt = uploadArea?.dataset?.receipt || null;
      
      if (!receipt) {
        setFieldError(uploadArea, 'Payment receipt is required');
        if (!firstErrorElement) firstErrorElement = uploadArea;
        hasErrors = true;
      } else {
        setFieldValid(uploadArea);
      }
      
      // If any validation errors, show summary and scroll to first error
      if (hasErrors) {
        if (orderError) {
          const errorMessages = [];
          if (!hasAddress) errorMessages.push('📍 Add your delivery address');
          if (!hasBank) errorMessages.push('🏦 Select a payment method');
          if (!receipt) errorMessages.push('📷 Upload your payment receipt');
          
          orderError.innerHTML = '<strong>Please complete the following:</strong><br>' + errorMessages.join('<br>');
          orderError.style.display = 'block';
        }
        
        // Scroll to first error field
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      
      // ========================================
      // ALL VALIDATIONS PASSED - Submit Order
      // ========================================
      
      // Disable button and show loading state
      const originalBtnText = completeBtn.textContent;
      completeBtn.disabled = true;
      completeBtn.textContent = 'Processing...';
      completeBtn.style.opacity = '0.7';
      
      try {
        // Prepare order items
        const items = bag.map(i => ({
          productId: i.productId || null,
          name: i.name || i.label || 'Item',
          price: Number(i.price || i.basePrice || 0),
          quantity: Number(i.quantity || 1),
          image: i.image || ''
        }));
        
        // Get address details
        const fullName = document.querySelector('.delivery-name')?.textContent || `${user.firstName} ${user.lastName}`;
        const phone = document.querySelector('.delivery-phone')?.textContent || user.phone || '';
        const province = deliveryCard?.dataset?.province || user?.address?.province || '';
        const city = deliveryCard?.dataset?.city || user?.address?.city || '';
        const barangay = deliveryCard?.dataset?.barangay || user?.address?.barangay || '';
        const postalCode = deliveryCard?.dataset?.postalCode || user?.address?.postalCode || '';
        const street = deliveryCard?.dataset?.street || user?.address?.street || '';
        
        const shippingAddress = {
          fullName,
          province,
          city,
          barangay,
          postalCode,
          street,
          address: addressText,
          country: 'Philippines',
          phone
        };
        
        // Get payment info
        const payMethodRadio = document.querySelector('input[name="paymethod"]:checked');
        const paymentMethod = bankNameText + ' - ' + (payMethodRadio ? payMethodRadio.value : 'full');
        const subtotal = Number(document.querySelector('.items-box')?.dataset.subtotal || items.reduce((s, it) => s + it.price * it.quantity, 0));
        
        const payload = {
          userId: user._id,
          items,
          shippingAddress,
          paymentInfo: {
            method: paymentMethod,
            status: 'pending',
            receipt: receipt
          },
          subtotal,
          total: subtotal
        };
        
        console.log('Submitting order payload:', { ...payload, paymentInfo: { ...payload.paymentInfo, receipt: '(base64 image)' } });
        
        // Submit order to backend
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        
        console.log('Order API response status:', response.status);
        const data = await response.json();
        console.log('Order API response data:', data);
        
        if (response.ok && data._id) {
          // Order created successfully - verify it has an order number
          const orderNumber = data.orderNumber || data._id;
          
          // Clear the bag from localStorage
          localStorage.removeItem('ec_bag');
          
          // Clear the bag from database
          try {
            await fetch('/api/bag', {
              method: 'DELETE',
              credentials: 'include'
            });
          } catch (bagErr) {
            console.error('Failed to clear bag from database:', bagErr);
          }
          
          // Store order info for confirmation page
          sessionStorage.setItem('ec_last_order', JSON.stringify({
            orderId: data._id,
            orderNumber: orderNumber,
            total: data.total || subtotal,
            createdAt: data.createdAt || new Date().toISOString()
          }));
          
          // Redirect to order confirmation page
          window.location.href = '/order-confirmation?order=' + orderNumber;
        } else {
          // Order creation failed
          const errorMsg = data.message || 'Failed to create order. Please try again.';
          if (orderError) {
            orderError.innerHTML = `<strong>⚠️ Order Failed</strong><br>${errorMsg}`;
            orderError.style.display = 'block';
          }
          showToast(errorMsg);
          
          // Re-enable button
          completeBtn.disabled = false;
          completeBtn.textContent = originalBtnText;
          completeBtn.style.opacity = '1';
        }
      } catch (err) {
        console.error('Order submission error:', err);
        if (orderError) {
          orderError.innerHTML = '<strong>⚠️ Network Error</strong><br>Could not connect to server. Please check your connection and try again.';
          orderError.style.display = 'block';
        }
        showToast('Network error. Please try again.');
        
        // Re-enable button
        completeBtn.disabled = false;
        completeBtn.textContent = originalBtnText;
        completeBtn.style.opacity = '1';
      }
    });
  }

  // Close bank options when clicking outside
  document.addEventListener('click', (e) => { if (!bankDropdown.contains(e.target)) bankOptions.classList.remove('open'); });
});

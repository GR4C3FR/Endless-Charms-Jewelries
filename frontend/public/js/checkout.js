// Checkout page interactions: dropdown, modals, address form
document.addEventListener('DOMContentLoaded', () => {
  const bankDropdown = document.getElementById('bankDropdown');
  const bankSelected = document.getElementById('bankSelected');
  const bankOptions = document.getElementById('bankOptions');
  const paymentModal = document.getElementById('paymentModal');
  const paymentBackBtn = document.getElementById('paymentBackBtn');
  const addressModal = document.getElementById('addressModal');
  const changeAddressBtn = document.getElementById('changeAddressBtn');
  const addrCancel = document.getElementById('addrCancel');
  const addressForm = document.getElementById('addressForm');
  const receiptInput = document.getElementById('receiptInput');
  const uploadArea = document.getElementById('uploadArea');
  const completeBtn = document.getElementById('completeOrderBtn');

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
  if (user && user.address) {
    const addr = user.address;
    // Only auto-fill if user has complete address information
    if (addr.street && addr.city && addr.province) {
      const deliveryCard = document.getElementById('deliveryCard');
      const fullName = (user.firstName || '') + ' ' + (user.lastName || '');
      const phone = user.phone || '';
      const province = addr.province || '';
      const city = addr.city || '';
      const barangay = addr.barangay || '';
      const postalCode = addr.postalCode || '';
      const street = addr.street || '';
      const addressText = `${street}${barangay ? ', ' + barangay : ''}${city ? ', ' + city : ''}${province ? ', ' + province : ''}${postalCode ? ', ' + postalCode : ''}`;
      
      if (deliveryCard) {
        deliveryCard.querySelector('.delivery-name').textContent = fullName;
        deliveryCard.querySelector('.delivery-phone').textContent = phone;
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
  // Address modal: prefill with user profile if available
  changeAddressBtn && changeAddressBtn.addEventListener('click', () => {
    // prefill
    const user = window.EC_USER || null;
    if (user) {
      const f = addressForm;
      if (f) {
        f.elements['firstName'].value = user.firstName || '';
        f.elements['lastName'].value = user.lastName || '';
        const addr = user.address || {};
        f.elements['province'].value = addr.province || '';
        f.elements['city'].value = addr.city || '';
        f.elements['barangay'].value = addr.barangay || '';
        f.elements['postalCode'].value = addr.postalCode || '';
        f.elements['street'].value = addr.street || '';
        f.elements['phone'].value = user.phone || '';
        f.elements['social'].value = user.social || '';
      }
    }
    addressModal.setAttribute('aria-hidden', 'false');
    addressModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  addrCancel && addrCancel.addEventListener('click', () => {
    addressModal.setAttribute('aria-hidden', 'true');
    addressModal.classList.remove('active');
    document.body.style.overflow = 'auto';
  });

  addressModal && addressModal.addEventListener('click', (e) => { if (e.target === addressModal) addrCancel.click(); });
  addressForm && addressForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(addressForm);
    const name = data.get('firstName') + ' ' + data.get('lastName');
    const phone = data.get('phone');
    const province = data.get('province');
    const city = data.get('city');
    const barangay = data.get('barangay');
    const postalCode = data.get('postalCode');
    const street = data.get('street');
    const address = `${street}, ${barangay}, ${city}, ${province}, ${postalCode}`;
    
    const delivery = document.getElementById('deliveryCard');
    if (delivery) {
      delivery.querySelector('.delivery-name').textContent = name;
      delivery.querySelector('.delivery-phone').textContent = phone;
      delivery.querySelector('.delivery-address').textContent = address;
      // Store address components for order submission
      delivery.dataset.province = province;
      delivery.dataset.city = city;
      delivery.dataset.barangay = barangay;
      delivery.dataset.postalCode = postalCode;
      delivery.dataset.street = street;
    }
    addrCancel.click();
    updateCompleteButtonState();
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
    if (!completeBtn) return;
    
    const user = window.EC_USER || null;
    const hasReceipt = !!(uploadArea && uploadArea.dataset && uploadArea.dataset.receipt);
    const addressEl = document.getElementById('deliveryAddress');
    const hasAddress = addressEl && addressEl.textContent && addressEl.textContent.trim() !== '' && addressEl.textContent.indexOf('Please input your delivery address') === -1;
    // Ensure a bank has been chosen (strip the chevron symbol if present)
    const bankText = (document.getElementById('bankSelected')?.textContent || '').replace('▾','').trim();
    const hasBank = !!bankText && bankText.toLowerCase() !== 'select' && bankText.length > 0;
    
    // Check if user is verified
    const isVerified = user && user.isVerified === true;
    
    // Button is enabled only if ALL conditions are met
    const allConditionsMet = hasReceipt && hasAddress && hasBank && isVerified;
    completeBtn.disabled = !allConditionsMet;
    
    if (orderError) {
      orderError.style.display = 'none';
      orderError.textContent = '';
    }
  }

  // initialize complete button state
  updateCompleteButtonState();
  // Complete order: assemble payload, send POST, redirect to profile orders
  if (completeBtn) {
    completeBtn.addEventListener('click', async (ev) => {
      const bag = getBag();
      const user = window.EC_USER || null;
      const orderError = document.getElementById('orderError');
      
      // Validation checks with specific error messages
      if (!bag || bag.length === 0) {
        showToast('Your bag is empty');
        return;
      }
      
      // require login
      if (!user || !user._id) {
        if (orderError) {
          orderError.textContent = 'Please log in to complete your order.';
          orderError.style.display = 'block';
        } else {
          showToast('Please log in to complete your order');
        }
        setTimeout(() => window.location.href = '/login', 1500);
        return;
      }
      
      // Check if user is verified
      if (!user.isVerified) {
        if (orderError) {
          orderError.textContent = '⚠️ Email Verification Required: Please verify your email address before completing your order. Check your inbox for the verification link or resend from your profile.';
          orderError.style.display = 'block';
        } else {
          showToast('Please verify your email address before completing your order.');
        }
        return;
      }
      
      // Check delivery address
      const addressEl = document.getElementById('deliveryAddress');
      const hasAddress = addressEl && addressEl.textContent && addressEl.textContent.trim() !== '' && addressEl.textContent.indexOf('Please input your delivery address') === -1;
      if (!hasAddress) {
        if (orderError) {
          orderError.textContent = '📍 Delivery Address Required: Please add your delivery address by clicking the "Change / Add" button above.';
          orderError.style.display = 'block';
        } else {
          showToast('Please add your delivery address.');
        }
        return;
      }
      
      // require bank selection
      const bankNameText = (document.getElementById('bankSelected')?.textContent || '').replace('▾','').trim();
      if (!bankNameText || bankNameText.toLowerCase() === 'select' || bankNameText.length === 0) {
        if (orderError) {
          orderError.textContent = '🏦 Bank Selection Required: Please select a payment method from the Bank Choice dropdown above.';
          orderError.style.display = 'block';
        } else {
          showToast('Please select a bank from the Bank Choice dropdown.');
        }
        return;
      }
      
      // require receipt before submitting
      const receipt = uploadArea?.dataset?.receipt || null;
      if (!receipt) {
        if (orderError) {
          orderError.textContent = '📷 Receipt Upload Required: Please upload your payment receipt by selecting a bank and uploading your receipt image.';
          orderError.style.display = 'block';
        } else {
          showToast('Please upload your receipt before completing the order.');
        }
        return;
      }
      
      // All validations passed - proceed with order creation
      const items = bag.map(i => ({ productId: i.productId || null, name: i.name || i.label || 'Item', price: Number(i.price || i.basePrice || 0), quantity: Number(i.quantity || 1), image: i.image || '' }));
      const deliveryCard = document.getElementById('deliveryCard');
      const fullName = document.querySelector('.delivery-name')?.textContent || (user ? (user.firstName + ' ' + user.lastName) : '');
      const phone = document.querySelector('.delivery-phone')?.textContent || (user && user.phone ? user.phone : '');
      
      // Get address components from delivery card dataset or user profile
      const province = deliveryCard?.dataset?.province || (user?.address?.province || '');
      const city = deliveryCard?.dataset?.city || (user?.address?.city || '');
      const barangay = deliveryCard?.dataset?.barangay || (user?.address?.barangay || '');
      const postalCode = deliveryCard?.dataset?.postalCode || (user?.address?.postalCode || '');
      const street = deliveryCard?.dataset?.street || (user?.address?.street || '');
      const addressText = document.querySelector('.delivery-address')?.textContent || '';
      
      const shippingAddress = {
        fullName: fullName,
        province: province,
        city: city,
        barangay: barangay,
        postalCode: postalCode,
        street: street,
        address: addressText,
        country: 'Philippines',
        phone: phone
      };
      const payMethodRadio = document.querySelector('input[name="paymethod"]:checked');
      const bankName = bankNameText;
      const subtotal = Number(document.querySelector('.items-box')?.dataset.subtotal || items.reduce((s,it)=>s+it.price*it.quantity,0));
      const total = subtotal;

      const payload = { userId: user._id, items, shippingAddress, paymentInfo: { method: bankName + ' - ' + (payMethodRadio ? payMethodRadio.value : 'full'), status: 'pending', receipt: receipt || undefined }, subtotal, total };

      try {
        const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
          localStorage.removeItem('ec_bag');
          window.location.href = '/profile?tab=orders';
        } else {
          const err = await res.json();
          showToast(err.message || 'Failed to create order');
        }
      } catch (err) { console.error(err); showToast('Network error'); }
    });
  }

  // Close bank options when clicking outside
  document.addEventListener('click', (e) => { if (!bankDropdown.contains(e.target)) bankOptions.classList.remove('open'); });
});

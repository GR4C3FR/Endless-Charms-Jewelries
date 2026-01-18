// Toast notification function
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #8a0621;
    color: #fff;
    padding: 14px 20px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 3000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add CSS animations if not present
if (!document.querySelector('style[data-toast-animations]')) {
  const style = document.createElement('style');
  style.setAttribute('data-toast-animations', 'true');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Review carousel functionality with smooth infinite scroll
let isAnimating = false;
// Carousel functionality
let carouselPosition = 0;

function scrollCarousel(direction) {
  const content = document.getElementById('carouselContent');
  if (!content) return;
  
  const cardWidth = 240;
  const visibleCards = 4;
  const totalCards = content.children.length;
  const maxScroll = (totalCards - visibleCards) * cardWidth;
  
  let newPos = carouselPosition + (direction * cardWidth);
  
  // Clamp between 0 and max
  if (newPos > 0) newPos = 0;
  if (newPos < -maxScroll) newPos = -maxScroll;
  
  carouselPosition = newPos;
  content.style.transform = `translateX(${carouselPosition}px)`;
}

function openImageModal(imagePath) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  
  modal.classList.add('active');
  modalImg.src = '/images/' + imagePath;
  document.body.style.overflow = 'hidden';
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Toggle products display
function toggleProducts() {
  const hiddenProducts = document.querySelectorAll('.hidden-product');
  const btn = document.getElementById('viewMoreBtn');
  const isHidden = hiddenProducts[0].style.display === 'none';
  
  hiddenProducts.forEach(product => {
    product.style.display = isHidden ? 'block' : 'none';
  });
  
  btn.textContent = isHidden ? 'Show Less' : 'View More';
}

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});

// Carousel functionality for About page
let currentSlide = 1;
const totalSlides = 4;

function changeSlide(direction) {
  // Calculate new slide number
  currentSlide += direction;
  
  // Wrap around
  if (currentSlide > totalSlides) {
    currentSlide = 1;
  } else if (currentSlide < 1) {
    currentSlide = totalSlides;
  }
  
  // Update slides
  updateSlides();
}

function updateSlides() {
  // Hide all slides
  const slides = document.querySelectorAll('.carousel-slide');
  slides.forEach(slide => slide.classList.remove('active'));
  
  // Show current slide
  const currentSlideElement = document.querySelector(`.carousel-slide[data-slide="${currentSlide}"]`);
  if (currentSlideElement) {
    currentSlideElement.classList.add('active');
  }
}

// script.js - Quantity and Bag Logic

function updateBagTotals() {
    const rows = document.querySelectorAll('.bag-item');
    let newSubtotal = 0;

    rows.forEach(row => {
        const priceText = row.querySelector('.item-price').textContent;
        const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
        const quantity = parseInt(row.querySelector('.item-qty-input').value);
        
        const total = price * quantity;
        newSubtotal += total;

        // Update the row total
        // align with new class name `row-price`
        const priceEl = row.querySelector('.row-price');
        if (priceEl) priceEl.textContent = `₱${total.toLocaleString()}`;
    });

    // Update the subtotal display
    const subtotalDisplay = document.querySelector('.subtotal-text');
    if (subtotalDisplay) {
        subtotalDisplay.textContent = `Subtotal: ${newSubtotal.toLocaleString()}`;
    }
}

function initQuantityButtons() {
    const bagContainer = document.querySelector('.bag-items-list');
    if (!bagContainer) return;

    bagContainer.addEventListener('click', (e) => {
        const btn = e.target;
        const row = btn.closest('.bag-item');
        if (!row) return;

        // Remove item
        if (btn.classList.contains('remove-btn')) {
          const id = btn.dataset.id || row.dataset.id;
          if (!id) return;
          let bag = getBag();
          bag = bag.filter(i => i.id !== id);
          saveBag(bag);
          updateBadge();
          renderBagPage();
          return;
        }

        // Edit item
        if (btn.classList.contains('edit-btn')) {
          const id = btn.dataset.id || row.dataset.id;
          if (!id) return;
          const bag = getBag();
          const item = bag.find(i => i.id === id);
          if (item) {
            // open customization with existing item to edit
            openCustomizationModal({ id: item.productId || String(item.id).split('::')[0], name: item.name, image: item.image }, null, item);
          }
          return;
        }

        // Quantity buttons
        if (!btn.classList.contains('qty-btn')) return;

        const input = row.querySelector('.item-qty-input');
        let currentQty = parseInt(input.value);

        if (btn.textContent === '+') {
            currentQty++;
        } else if (btn.textContent === '—' && currentQty > 1) {
            currentQty--;
        }

        input.value = currentQty;
        // persist quantity change back to localStorage
        const id = row.dataset.id;
        if (id) {
          const bag = getBag();
          const found = bag.find(i => i.id === id);
          if (found) {
            found.quantity = currentQty;
            saveBag(bag);
            updateBadge();
          }
        }

        // update totals display
        updateBagTotals();
    });
}

// Add to your existing DOMContentLoaded listener
window.addEventListener('DOMContentLoaded', () => {
    initQuantityButtons(); // Initialize the bag functionality
});
// Bag persistence and badge handling (localStorage)
function getBag() {
  try {
    return JSON.parse(localStorage.getItem('ec_bag') || '[]');
  } catch (e) {
    return [];
  }
}

async function saveBag(bag) {
  localStorage.setItem('ec_bag', JSON.stringify(bag));
  
  // If user is logged in, sync with database
  if (isUserLoggedIn()) {
    try {
      console.log('Syncing bag to database...', bag.length, 'items');
      const response = await fetch('/api/bag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bag: bag })
      });
      
      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to sync bag with database:', data.message);
      } else {
        console.log('Bag synced successfully:', data);
      }
    } catch (error) {
      console.error('Error syncing bag:', error);
    }
  }
}

async function loadBagFromDatabase() {
  if (!isUserLoggedIn()) {
    return;
  }
  
  try {
    const response = await fetch('/api/bag');
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.bag)) {
        localStorage.setItem('ec_bag', JSON.stringify(data.bag));
        updateBadge();
        renderBagPage();
      }
    }
  } catch (error) {
    console.error('Error loading bag from database:', error);
  }
}

function addToBag(item) {
  const bag = getBag();
  const existing = bag.find(i => i.id === item.id);
  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    bag.push(Object.assign({ quantity: 1 }, item));
  }
  saveBag(bag);
  updateBadge();
}

function getTotalCount() {
  return getBag().reduce((acc, i) => acc + (i.quantity || 0), 0);
}

function updateBadge() {
  const count = getTotalCount();
  document.querySelectorAll('.bag-badge').forEach(b => {
    if (count === 0) {
      b.style.display = 'none';
    } else {
      b.style.display = 'flex';
      b.textContent = count;
    }
  });
}

function renderBagPage() {
  const container = document.querySelector('.bag-items-list');
  if (!container) return;

  const bag = getBag();
  if (bag.length === 0) {
    container.innerHTML = '<p>Your bag is empty.</p>';
    const subtotalDisplay = document.querySelector('.subtotal-text');
    if (subtotalDisplay) subtotalDisplay.textContent = 'Subtotal: 0';
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;

  bag.forEach(item => {
    const total = (item.price || 0) * (item.quantity || 1);
    subtotal += total;

    const div = document.createElement('div');
    div.className = 'bag-item';
    div.dataset.id = item.id;
    div.innerHTML = `
      <div class="item-details-col">
        <div class="item-image-box">
          <img src="/images/${item.image}" alt="${item.name}">
        </div>
        <div class="item-info">
          <h3>${item.name}</h3>
          <p class="item-price">₱${(item.price).toLocaleString()}</p>
          <div class="item-specs">
            ${(() => {
              const isAccessory = item.productId && String(item.productId).startsWith('accessory-');
              const isBand = item.productId && String(item.productId).startsWith('band-');
              const opts = item.options || {};
              const lines = [];
              if (opts.metal || item.metal) lines.push(`Metal Type: ${opts.metal || item.metal || ''}`);
              if (opts.stone || item.stone) lines.push(`Stone: ${opts.stone || item.stone || ''}`);
              if (isBand) {
                if (opts.bandCarat || item.bandCarat) lines.push(`Carat Size: ${opts.bandCarat || item.bandCarat || ''} ct`);
                if (opts.femaleSize || item.femaleSize) lines.push(`Female Ring Size: ${opts.femaleSize || item.femaleSize || ''}`);
                if (opts.maleSize || item.maleSize) lines.push(`Male Ring Size: ${opts.maleSize || item.maleSize || ''}`);
              } else {
                if (opts.carat || item.carat) lines.push(`Carat Size: ${opts.carat || item.carat || ''}`);
                // only show ring size for non-accessories
                if (!isAccessory && (opts.size || item.size)) lines.push(`Ring Size: ${opts.size || item.size || ''}`);
              }
              return lines.map(l => `<div>${l}</div>`).join('');
            })()}
          </div>
        </div>
      </div>
      <div class="item-qty-col">
        <div class="qty-selector">
          <button class="qty-btn" type="button">—</button>
          <input type="text" class="item-qty-input" value="${item.quantity}" readonly>
          <button class="qty-btn" type="button">+</button>
        </div>
      </div>
      <div class="item-total-col">
        <div class="total-actions">
          <p class="row-price">₱${total.toLocaleString()}</p>
          <div class="item-actions">
            <button class="edit-btn" data-id="${item.id}" style="background:none;border:none;color:#620418;cursor:pointer;padding:6px;margin-left:10px;">Edit</button>
            <button class="remove-btn" data-id="${item.id}" style="background:none;border:none;color:#8a0621;cursor:pointer;padding:6px;margin-left:6px;">Remove</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(div);
  });

  const subtotalDisplay = document.querySelector('.subtotal-text');
  if (subtotalDisplay) subtotalDisplay.textContent = `Subtotal: ${subtotal.toLocaleString()}`;

  // Re-initialize quantity buttons so they operate on the generated markup
  initQuantityButtons();
}

// Initialize bag badge and render bag page on load
window.addEventListener('DOMContentLoaded', () => {
  // Load bag from database if user is logged in
  loadBagFromDatabase();
  updateBadge();
  renderBagPage();
});

// Delegate add-to-bag button clicks
// Create and open customization modal
function openCustomizationModal(baseItem, originBtn, existingItem) {
  try {
    // build overlay
  const overlay = document.createElement('div');
  overlay.className = 'ec-modal-overlay';
  overlay.innerHTML = `
    <div class="ec-modal">
      <div class="ec-modal-left"><img id="modal-product-image" src="" alt="product"></div>
      <div class="ec-modal-right">
        <h2 id="modal-product-name"></h2>
        <p id="modal-product-price"></p>

        <div class="ec-opt-group">
          <div class="ec-opt-label">Metal Type</div>
          <div id="opt-metal" class="ec-opt-list"></div>
        </div>

        <div class="ec-opt-group">
          <div class="ec-opt-label">Stones</div>
          <div id="opt-stone" class="ec-opt-list"></div>
        </div>

        <div class="ec-opt-group">
          <div class="ec-opt-label">Carat Size</div>
          <select id="opt-carat" class="ec-select"></select>
        </div>

        <div class="ec-opt-group">
          <div class="ec-opt-label">Ring Size</div>
          <select id="opt-size" class="ec-select"></select>
        </div>

        <div class="ec-opt-group" id="band-type-group" style="display:none;">
          <div class="ec-opt-label">Band Style</div>
          <div id="opt-band-type" class="ec-opt-list"></div>
        </div>

        <div class="ec-opt-group" id="female-size-group" style="display:none;">
          <div class="ec-opt-label">Female Ring Size</div>
          <select id="opt-female-size" class="ec-select"></select>
        </div>

        <div class="ec-opt-group" id="male-size-group" style="display:none;">
          <div class="ec-opt-label">Male Ring Size</div>
          <select id="opt-male-size" class="ec-select"></select>
        </div>

        <div id="pair-notice" style="display:none;margin:10px 0;padding:8px;background:#f5f5f5;border-radius:6px;font-size:13px;color:#620418;">
          Price covers a complete set of two rings.
        </div>

        <div class="ec-qty-row">
          <div class="ec-qty-controls">
            <button id="modal-qty-dec" class="modal-qty-btn">—</button>
            <input id="modal-qty" class="modal-qty-input" value="1" />
            <button id="modal-qty-inc" class="modal-qty-btn">+</button>
          </div>
          <div class="ec-actions">
            <button id="modal-cancel" class="modal-action-btn modal-cancel">Cancel</button>
            <button id="modal-add" class="modal-action-btn modal-add">Add to bag</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // populate basic fields
  const img = overlay.querySelector('#modal-product-image');
  const nameEl = overlay.querySelector('#modal-product-name');
  const priceEl = overlay.querySelector('#modal-product-price');
  img.src = baseItem.image ? `/images/${baseItem.image}` : '';
  nameEl.textContent = baseItem.name || 'Item';
  if (priceEl) {
    priceEl.style.fontSize = '18px';
    priceEl.textContent = `₱${(baseItem.price || 0).toLocaleString()}`;
  }

  // Pricing table for engagement rings (1ct base) and upsize rules + wedding band pricing
  const priceTable = {
    'Signity': {
      '1': { '14k': 19000, '18k': 21000 },
      '2': { '14k': 24000, '18k': 26000 },
      '3': { '14k': 29000, '18k': 32000 }
    },
    'Moissanite': {
      '1': { '14k': 34000, '18k': 37000 },
      '2': { '14k': 44000, '18k': 47000 },
      '3': { '14k': 49000, '18k': 53000 }
    },
    'Lab-Grown Diamond': {
      '1': { '14k': 69000, '18k': 72000 },
      '2': { '14k': 85000, '18k': 88000 },
      '3': { '14k': 114000, '18k': 117000 }
    },
    'Natural Diamond': {
      '1': { '14k': 385000, '18k': 389000 },
      '2': { '14k': 805000, '18k': 809000 },
      '3': { '14k': 1550000, '18k': 1559000 }
    },
    // Wedding bands pricing
    'WeddingBands': {
      'plain': { '14k': 50000, '18k': 58000 },
      'half-0.30': { '14k': 75000, '18k': 85000, 'signity_adjust': -10000, 'lab_adjust': 65000, 'natural_adjust': 165000 },
      'half-0.01-a': { '14k': 65000, '18k': 75000, 'signity_adjust': -4000, 'lab_adjust': 10000, 'natural_adjust': 20000 },
      'half-0.01-b': { '14k': 55000, '18k': 65000, 'signity_adjust': -4000, 'lab_adjust': 10000, 'natural_adjust': 20000 },
      'half-0.01-c': { '14k': 69000, '18k': 79000, 'signity_adjust': -4000, 'lab_adjust': 10000, 'natural_adjust': 20000 },
      'half-0.01-d': { '14k': 69000, '18k': 79000, 'signity_adjust': -7000, 'lab_adjust': 20000, 'natural_adjust': 30000 }
    }
  };

  // Accessory pricing tables
  const accessoryPriceTable = {
    'StudEarrings': {
      'Moissanite': { '1': { '14k': 26000, '18k': 28000 }, '2': { '14k': 37000, '18k': 40000 }, '3': { '14k': 56000, '18k': 60000 } },
      'Signity': { '1': { '14k': 11000, '18k': 13000 }, '2': { '14k': 16000, '18k': 18000 }, '3': { '14k': 38000, '18k': 42000 } },
      'Lab-Grown Diamond': { '1': { '14k': 94500, '18k': 97000 }, '2': { '14k': 139000, '18k': 142000 }, '3': { '14k': 189000, '18k': 194000 } },
      'Natural Diamond': { '1': { '14k': 1550000, '18k': 1600000 }, '2': { '14k': 2300000, '18k': 2400000 }, '3': { '14k': 3100000, '18k': 3150000 } }
    },
    'TennisNecklace': {
      'Moissanite': { '14': 189000, '16': 199000, '18': 219000 },
      'Lab-Grown Diamond': { '14': 449000, '16': 479000, '18': 499000 }
    },
    'TennisBracelet': {
      'Moissanite': { '4-6': 139000, '7': 149000, '8': 159000 },
      'Lab-Grown Diamond': { '4-6': 229000, '7': 249000, '8': 269000 }
    }
  };

  // populate option lists
  const metalList = overlay.querySelector('#opt-metal');
  ['14k yellow gold','14k white gold','18k yellow gold','18k white gold'].forEach(m => {
    const b = document.createElement('button'); b.type = 'button';
    b.className = 'ec-opt-btn'; b.textContent = m; b.dataset.value = m;
    metalList.appendChild(b);
  });

  const stoneList = overlay.querySelector('#opt-stone');
  ['Signity','Moissanite','Lab-Grown Diamond','Natural Diamond'].forEach(s => {
    const b = document.createElement('button'); b.type = 'button';
    b.className = 'ec-opt-btn'; b.textContent = s; b.dataset.value = s;
    stoneList.appendChild(b);
  });

  const caratSel = overlay.querySelector('#opt-carat');
  ['0.25','0.5','0.75','1','1.5','2','3','4','5'].forEach(c => {
    const o = document.createElement('option'); o.value = c; o.textContent = c + ' ct';
    caratSel.appendChild(o);
  });

  const sizeSel = overlay.querySelector('#opt-size');
  // Limited ring sizes (3.0 through 7.0 in 0.5 increments)
  for (let s = 3.0; s <= 7.0; s += 0.5) {
    const o = document.createElement('option');
    const display = Number.isInteger(s) ? String(s) : s.toFixed(1);
    o.value = display;
    o.textContent = display;
    sizeSel.appendChild(o);
  }

  // Add female/male size selectors for bands
  const femaleSizeSel = overlay.querySelector('#opt-female-size');
  const maleSizeSel = overlay.querySelector('#opt-male-size');
  for (let s = 3.0; s <= 7.0; s += 0.5) {
    const display = Number.isInteger(s) ? String(s) : s.toFixed(1);
    const o1 = document.createElement('option'); o1.value = display; o1.textContent = display; femaleSizeSel.appendChild(o1);
    const o2 = document.createElement('option'); o2.value = display; o2.textContent = display; maleSizeSel.appendChild(o2);
  }

  // Detect source types
  const isRingSource = baseItem && String(baseItem.id).startsWith('ring-');
  const isBandSource = baseItem && String(baseItem.id).startsWith('band-');
  const isAccessorySource = baseItem && String(baseItem.id).startsWith('accessory-');
  
  // default selections - must be declared before using them
  let selectedMetal = '14k yellow gold';
  let selectedStone = 'Signity';
  let selectedCarat = '1';
  let selectedBandCarat = '0';  // For wedding bands: '0', '0.30', or '0.01'
  let selectedFemaleSize = '3';
  let selectedMaleSize = '3';
  let selectedFemaleCarat = '1';  // Female carat size for bands (default to 1 ct)
  let selectedMaleCarat = '1';    // Male carat size for bands (default to 1 ct)
  let editing = false;
  
  // Determine accessory type early
  if (isAccessorySource) {
    const productName = (baseItem.name || '').toLowerCase();
    if (productName.includes('stud') || productName.includes('earring')) {
      baseItem.accessoryType = 'studs';
    } else if (productName.includes('necklace')) {
      baseItem.accessoryType = 'tennis-necklace';
    } else if (productName.includes('bracelet')) {
      baseItem.accessoryType = 'tennis-bracelet';
    }
  }
  
  // For wedding bands, setup band-specific UI
  if (isBandSource) {
    // Check if this is a plain band
    const isPlainBand = (baseItem && baseItem.name && baseItem.name.toLowerCase && baseItem.name.toLowerCase().includes('plain')) || (baseItem && baseItem.isPlain);
    
    if (isPlainBand) {
      // For plain bands, set stone to null
      selectedStone = null;
      baseItem.isPlainBand = true;  // Store flag for later use
      // Hide all customization for plain bands except metal and female/male sizes
      const caratGroup = caratSel && caratSel.parentElement; if (caratGroup) caratGroup.style.display = 'none';
      const stoneGroup = overlay.querySelector('.ec-opt-group:nth-of-type(2)'); if (stoneGroup) stoneGroup.style.display = 'none';
      const sizeGroup = sizeSel && sizeSel.parentElement; if (sizeGroup) sizeGroup.style.display = 'none';
      const bandTypeGroup = overlay.querySelector('#band-type-group'); if (bandTypeGroup) bandTypeGroup.style.display = 'none';
      
      // Show female/male sizes
      const femaleGroup = overlay.querySelector('#female-size-group'); if (femaleGroup) femaleGroup.style.display = 'block';
      const maleGroup = overlay.querySelector('#male-size-group'); if (maleGroup) maleGroup.style.display = 'block';
      
      // Show pair notice
      const pairNotice = overlay.querySelector('#pair-notice'); if (pairNotice) pairNotice.style.display = 'block';
      
      // Add size restriction note for bands
      const noteWrap = document.createElement('div');
      noteWrap.className = 'ec-contact-note';
      noteWrap.style.marginTop = '10px';
      noteWrap.innerHTML = `
        <p style="margin:0 0 8px 0;color:#8a0621;font-size:13px;">
          Sizes above 7 require custom pricing. Please contact us for a quote.
        </p>
      `;
      const pairNoticeEl = overlay.querySelector('#pair-notice');
      if (pairNoticeEl && pairNoticeEl.parentElement) pairNoticeEl.parentElement.insertBefore(noteWrap, pairNoticeEl.nextSibling);
      
      selectedBandCarat = '0';  // Always plain
      baseItem.isPlainBand = true;  // Store flag for later use
    } else {
      // Hide carat selector for bands (will use dropdown instead)
      const caratGroup = caratSel && caratSel.parentElement; if (caratGroup) caratGroup.style.display = 'none';
      // Hide ring size (single); show female/male sizes
      const sizeGroup = sizeSel && sizeSel.parentElement; if (sizeGroup) sizeGroup.style.display = 'none';
      const femaleGroup = overlay.querySelector('#female-size-group'); if (femaleGroup) femaleGroup.style.display = 'block';
      const maleGroup = overlay.querySelector('#male-size-group'); if (maleGroup) maleGroup.style.display = 'block';
      
      // Add female/male carat size selectors for non-plain bands
      const femaleCaratGroup = document.createElement('div');
      femaleCaratGroup.className = 'ec-opt-group';
      femaleCaratGroup.innerHTML = `
        <div class="ec-opt-label">Female Carat Size</div>
        <select id="opt-female-carat" class="ec-select">
          <option value="1">1 ct</option>
          <option value="2">2 ct</option>
          <option value="3">3 ct</option>
        </select>
      `;
      
      const maleCaratGroup = document.createElement('div');
      maleCaratGroup.className = 'ec-opt-group';
      maleCaratGroup.innerHTML = `
        <div class="ec-opt-label">Male Carat Size</div>
        <select id="opt-male-carat" class="ec-select">
          <option value="0">0 ct (plain bands)</option>
          <option value="1">1 ct</option>
          <option value="2">2 ct</option>
          <option value="3">3 ct</option>
        </select>
      `;
      
      try {
        if (femaleGroup && femaleGroup.parentElement) {
          femaleGroup.parentElement.insertBefore(femaleCaratGroup, femaleGroup.nextSibling);
        }
        if (maleGroup && maleGroup.parentElement) {
          maleGroup.parentElement.insertBefore(maleCaratGroup, maleGroup.nextSibling);
        }
      } catch(err) {
        console.warn('Error inserting carat groups:', err);
      }
      
      // Show pair notice
      const pairNotice = overlay.querySelector('#pair-notice'); if (pairNotice) pairNotice.style.display = 'block';
      
      // Add size restriction note for bands
      const noteWrap = document.createElement('div');
      noteWrap.className = 'ec-contact-note';
      noteWrap.style.marginTop = '10px';
      noteWrap.innerHTML = `
        <p style="margin:0 0 8px 0;color:#8a0621;font-size:13px;">
          Sizes above 7 require custom pricing. Please contact us for a quote.
        </p>
      `;
      const pairNoticeEl = overlay.querySelector('#pair-notice');
      if (pairNoticeEl && pairNoticeEl.parentElement) pairNoticeEl.parentElement.insertBefore(noteWrap, pairNoticeEl.nextSibling);
    }
  }
  // For engagement rings restrict carat to 1,2,3 only
  else if (isRingSource) {
    while (caratSel.firstChild) caratSel.removeChild(caratSel.firstChild);
    ['1','2','3'].forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c + ' ct'; caratSel.appendChild(o); });
    // add contact note below ring size and price; include contact-page button
    const sizeGroup = sizeSel && sizeSel.parentElement;
    const noteWrap = document.createElement('div');
    noteWrap.className = 'ec-contact-note';
    noteWrap.style.marginTop = '10px';
    noteWrap.innerHTML = `
      <p style="margin:0 0 8px 0;color:#8a0621;font-size:13px;">
        For carats 4+, or ring sizes outside 3–7, please contact us for a custom quote.
      </p>
      <button id="contact-page-btn" style="background:#620418;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Go to Contact Page</button>
    `;
    if (sizeGroup) sizeGroup.parentElement.insertBefore(noteWrap, sizeGroup.nextSibling);
    const contactBtn = noteWrap.querySelector('#contact-page-btn');
    if (contactBtn) contactBtn.addEventListener('click', ()=> { window.location.href = '/contact'; });
  }

  // If this customization is for an existing bag item, prefill selections
  if (existingItem) {
    editing = true;
    const opts = existingItem.options || {};
    if (opts.metal) {
      if (opts.metal === '14k') selectedMetal = '14k yellow gold';
      else if (opts.metal === '18k') selectedMetal = '18k yellow gold';
      else selectedMetal = opts.metal;
    }
    if (opts.stone) {
      if (opts.stone === 'Lab-Grown Dia') selectedStone = 'Lab-Grown Diamond';
      else if (opts.stone === 'Natural Dia') selectedStone = 'Natural Diamond';
      else selectedStone = opts.stone;
    }
    if (opts.carat) selectedCarat = opts.carat;
    if (opts.bandCarat) selectedBandCarat = opts.bandCarat;
    if (opts.femaleSize) selectedFemaleSize = opts.femaleSize;
    if (opts.maleSize) selectedMaleSize = opts.maleSize;
    if (opts.femaleCarat) selectedFemaleCarat = opts.femaleCarat;
    if (opts.maleCarat) selectedMaleCarat = opts.maleCarat;
    overlay.querySelector('#modal-qty').value = existingItem.quantity || 1;
    if (opts.size) sizeSel.value = opts.size;
  }

  // hide ring-size selector for accessories
  if (isAccessorySource) {
    const sizeGroup = sizeSel && sizeSel.parentElement;
    if (sizeGroup) sizeGroup.style.display = 'none';
  }

  // Setup UI for accessories
  if (isAccessorySource) {
    const accessoryType = baseItem.accessoryType;
    if (accessoryType === 'studs') {
      // For stud earrings: show carat size selector
      const caratGroup = caratSel && caratSel.parentElement;
      if (caratGroup) {
        caratGroup.style.display = 'block';
        const label = caratGroup.querySelector('.ec-opt-label');
        if (label) label.textContent = 'Carat Size (each stone)';
      }
      // Clear and populate with stud sizes only
      while (caratSel.firstChild) caratSel.removeChild(caratSel.firstChild);
      ['1','2','3'].forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c + ' ct'; caratSel.appendChild(o); });
    } else if (accessoryType === 'tennis-necklace') {
      // For tennis necklace: show length selector (stored as carat for reuse)
      const caratGroup = caratSel && caratSel.parentElement;
      if (caratGroup) {
        caratGroup.style.display = 'block';
        const label = caratGroup.querySelector('.ec-opt-label');
        if (label) label.textContent = 'Necklace Length';
      }
      // Clear and populate with lengths
      while (caratSel.firstChild) caratSel.removeChild(caratSel.firstChild);
      ['14', '16', '18'].forEach(len => { const o = document.createElement('option'); o.value = len; o.textContent = len + '"'; caratSel.appendChild(o); });
      selectedCarat = '14';  // Default to 14"
      caratSel.value = '14';
      // Hide metal selector - tennis items are 14k only
      const metalGroup = overlay.querySelector('.ec-opt-group:nth-of-type(1)');
      if (metalGroup) metalGroup.style.display = 'none';
      // Show only Moissanite and Lab-Grown Diamond for tennis necklace
      const stoneList = overlay.querySelector('#opt-stone');
      stoneList.innerHTML = '';
      let isFirstStone = true;
      ['Moissanite', 'Lab-Grown Diamond'].forEach(s => {
        const b = document.createElement('button'); b.type = 'button';
        b.className = 'ec-opt-btn'; b.textContent = s; b.dataset.value = s;
        if (isFirstStone) { b.classList.add('selected'); selectedStone = s; isFirstStone = false; }
        b.addEventListener('click', () => { selectedStone = s; computePrice(); });
        stoneList.appendChild(b);
      });
      // Compute and display price after setting defaults
      setTimeout(() => computePrice(), 50);
    } else if (accessoryType === 'tennis-bracelet') {
      // For tennis bracelet: show size selector (stored as carat for reuse)
      const caratGroup = caratSel && caratSel.parentElement;
      if (caratGroup) {
        caratGroup.style.display = 'block';
        const label = caratGroup.querySelector('.ec-opt-label');
        if (label) label.textContent = 'Bracelet Size';
      }
      // Clear and populate with sizes
      while (caratSel.firstChild) caratSel.removeChild(caratSel.firstChild);
      ['4-6', '7', '8'].forEach(size => { const o = document.createElement('option'); o.value = size; o.textContent = size + '"'; caratSel.appendChild(o); });
      selectedCarat = '4-6';  // Default to 4-6"
      caratSel.value = '4-6';
      // Hide metal selector - tennis items are 14k only
      const metalGroup = overlay.querySelector('.ec-opt-group:nth-of-type(1)');
      if (metalGroup) metalGroup.style.display = 'none';
      // Show only Moissanite and Lab-Grown Diamond for tennis bracelet
      const stoneList = overlay.querySelector('#opt-stone');
      stoneList.innerHTML = '';
      let isFirstStone2 = true;
      ['Moissanite', 'Lab-Grown Diamond'].forEach(s => {
        const b = document.createElement('button'); b.type = 'button';
        b.className = 'ec-opt-btn'; b.textContent = s; b.dataset.value = s;
        if (isFirstStone2) { b.classList.add('selected'); selectedStone = s; isFirstStone2 = false; }
        b.addEventListener('click', () => { selectedStone = s; computePrice(); });
        stoneList.appendChild(b);
      });
      // Compute and display price after setting defaults
      setTimeout(() => computePrice(), 50);
    }
  }

  // helper to compute price
  function computePrice() {
    const carat = isAccessorySource ? selectedCarat : parseFloat(selectedCarat);
    const stone = selectedStone;
    const metal = (selectedMetal && selectedMetal.indexOf('14k') === 0) ? '14k' : '18k';

    let perUnit = 0;

    // BAND PRICING LOGIC
    if (isBandSource) {
      const bandPricingMap = {
        '0': {      // Plain Band
          '14k': 50000,
          '18k': 58000,
          adjustments: {}  // No adjustments for plain band
        },
        '0.30': {   // Half Eternity 0.30ct
          '14k': 75000,
          '18k': 85000,
          adjustments: {
            'Signity': -10000,
            'Lab-Grown Diamond': 65000,
            'Natural Diamond': 165000
          }
        },
        '0.01': {   // Half Eternity 0.01ct
          '14k': 65000,  // Average of the variants (55k, 65k, 69k, 69k)
          '18k': 75000,  // Average of the variants (65k, 75k, 79k, 79k)
          adjustments: {
            'Signity': -4000,
            'Lab-Grown Diamond': 10000,
            'Natural Diamond': 20000
          }
        }
      };
      
      const bandConfig = bandPricingMap[selectedBandCarat] || bandPricingMap['0'];
      if (bandConfig && bandConfig[metal]) {
        perUnit = bandConfig[metal];
        // Apply stone adjustments (base is Moissanite)
        const adj = bandConfig.adjustments[selectedStone];
        if (adj !== undefined) {
          perUnit += adj;
        }
      }
    }
    // ACCESSORY PRICING LOGIC
    else if (isAccessorySource) {
      const accessoryType = baseItem.accessoryType;
      if (accessoryType === 'studs') {
        const studsTable = accessoryPriceTable['StudEarrings'][stone];
        if (studsTable && studsTable[carat]) {
          perUnit = studsTable[carat][metal];
        }
      } else if (accessoryType === 'tennis-necklace') {
        const necklaceTable = accessoryPriceTable['TennisNecklace'][stone];
        if (necklaceTable) {
          perUnit = necklaceTable[carat];  // carat stores length
        }
      } else if (accessoryType === 'tennis-bracelet') {
        const braceletTable = accessoryPriceTable['TennisBracelet'][stone];
        if (braceletTable) {
          perUnit = braceletTable[carat];  // carat stores size
        }
      }
    }
    // RING PRICING LOGIC
    else {
      const table = priceTable[stone];
      if (table) {
        const key = String(Math.round(carat * 100) / 100);
        if (table[key] && table[key][metal]) {
          perUnit = table[key][metal];
        } else if (table['1'] && table['1'][metal]) {
          perUnit = Math.round(table['1'][metal] * carat);
        }
      }
    }

    perUnit = Math.max(0, Math.round(perUnit));
    const qty = parseInt(overlay.querySelector('#modal-qty').value || '1');
    priceEl.textContent = `₱${(perUnit * qty).toLocaleString()}`;

    // show contact note when carat >= 4 (rings only)
    if (isRingSource) {
      const existingNote = overlay.querySelector('.ec-carat-note');
      if (carat >= 4) {
        if (!existingNote) {
          const note = document.createElement('div');
          note.className = 'ec-carat-note';
          note.style.color = '#8a0621';
          note.style.marginTop = '8px';
          note.textContent = 'For pieces above 4 ct please contact us for a custom quotation.';
          overlay.querySelector('.ec-modal-right').appendChild(note);
        }
        const btn = overlay.querySelector('#modal-add'); if (btn) btn.disabled = true;
      } else {
        if (existingNote) existingNote.remove();
        const btn = overlay.querySelector('#modal-add'); if (btn) btn.disabled = false;
      }
    }

    return perUnit;
  }

  // listeners for option buttons and qty
  overlay.querySelectorAll('#opt-metal .ec-opt-btn').forEach(b => b.addEventListener('click', (ev) => {
    overlay.querySelectorAll('#opt-metal .ec-opt-btn').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected'); selectedMetal = b.dataset.value; computePrice();
  }));
  overlay.querySelectorAll('#opt-stone .ec-opt-btn').forEach(b => b.addEventListener('click', (ev) => {
    overlay.querySelectorAll('#opt-stone .ec-opt-btn').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected'); selectedStone = b.dataset.value; computePrice();
  }));

  // Band carat dropdown listener
  if (isBandSource) {
    const bandCaratDropdown = overlay.querySelector('#band-carat-dropdown');
    if (bandCaratDropdown) {
      bandCaratDropdown.addEventListener('change', (ev) => {
        selectedBandCarat = ev.target.value;
        computePrice();
      });
    }
    
    // Female and Male carat listeners for bands
    const femaleCaratSel = overlay.querySelector('#opt-female-carat');
    const maleCaratSel = overlay.querySelector('#opt-male-carat');
    if (femaleCaratSel) {
      femaleCaratSel.addEventListener('change', (ev) => {
        selectedFemaleCarat = ev.target.value;
        computePrice();
      });
    }
    if (maleCaratSel) {
      maleCaratSel.addEventListener('change', (ev) => {
        selectedMaleCarat = ev.target.value;
        computePrice();
      });
    }
  }

  // Size validation function for wedding bands
  function validateBandSizes() {
    if (isBandSource) {
      const fSize = parseFloat(selectedFemaleSize);
      const mSize = parseFloat(selectedMaleSize);
      const addBtn = overlay.querySelector('#modal-add');
      if (fSize > 7 || mSize > 7) {
        if (addBtn) {
          addBtn.disabled = true;
          addBtn.style.opacity = '0.5';
          addBtn.style.cursor = 'not-allowed';
        }
        return false;
      } else {
        if (addBtn) {
          addBtn.disabled = false;
          addBtn.style.opacity = '1';
          addBtn.style.cursor = 'pointer';
        }
      }
    }
    return true;
  }

  // Female/Male size listeners with validation
  if (femaleSizeSel) femaleSizeSel.addEventListener('change', (ev) => { 
    selectedFemaleSize = ev.target.value;
    const isValid = validateBandSizes();
    if (!isValid) {
      showToast('Sizes above 7 require custom pricing. Please contact us for a quote.');
    }
    computePrice();
  });
  if (maleSizeSel) maleSizeSel.addEventListener('change', (ev) => { 
    selectedMaleSize = ev.target.value;
    const isValid = validateBandSizes();
    if (!isValid) {
      showToast('Sizes above 7 require custom pricing. Please contact us for a quote.');
    }
    computePrice();
  });

  // If editing, select buttons accordingly
  setTimeout(()=>{
    overlay.querySelectorAll('#opt-metal .ec-opt-btn').forEach(b=>{ if (b.dataset.value===selectedMetal) b.classList.add('selected'); });
    overlay.querySelectorAll('#opt-stone .ec-opt-btn').forEach(b=>{ if (b.dataset.value===selectedStone) b.classList.add('selected'); });
    if (isBandSource) {
      const bandCaratDropdown = overlay.querySelector('#band-carat-dropdown');
      if (bandCaratDropdown) bandCaratDropdown.value = selectedBandCarat;
      const femaleCaratSel = overlay.querySelector('#opt-female-carat');
      const maleCaratSel = overlay.querySelector('#opt-male-carat');
      if (femaleCaratSel) femaleCaratSel.value = selectedFemaleCarat;
      if (maleCaratSel) maleCaratSel.value = selectedMaleCarat;
      if (femaleSizeSel) femaleSizeSel.value = selectedFemaleSize;
      if (maleSizeSel) maleSizeSel.value = selectedMaleSize;
    }
    caratSel.value = selectedCarat;
    computePrice();
  },40);
  caratSel.addEventListener('change', (ev)=>{ selectedCarat = caratSel.value; computePrice(); });
  sizeSel.addEventListener('change', ()=>{});

  const qtyInput = overlay.querySelector('#modal-qty');
  overlay.querySelector('#modal-qty-dec').addEventListener('click', ()=>{
    let v = Math.max(1, parseInt(qtyInput.value||'1')-1); qtyInput.value = v; computePrice();
  });
  overlay.querySelector('#modal-qty-inc').addEventListener('click', ()=>{
    let v = Math.max(1, parseInt(qtyInput.value||'1')+1); qtyInput.value = v; computePrice();
  });
  qtyInput.addEventListener('input', ()=>{ if (!qtyInput.value || isNaN(parseInt(qtyInput.value))) qtyInput.value='1'; computePrice(); });

  // cancel
  overlay.querySelector('#modal-cancel').addEventListener('click', ()=>{ overlay.remove(); });

  // add / save changes
  const addBtn = overlay.querySelector('#modal-add');
  if (editing) addBtn.textContent = 'Save changes';
  addBtn.addEventListener('click', ()=>{
    // Validate sizes for wedding bands
    if (isBandSource && !validateBandSizes()) {
      showToast('Sizes above 7 require custom pricing. Please contact us for a quote.');
      return;
    }
    
    const perUnit = computePrice();
    const qty = parseInt(qtyInput.value||'1');
    // Build options object based on product type
    let opts = { metal:selectedMetal, stone:selectedStone, carat:selectedCarat };
    if (isBandSource) {
      opts.bandCarat = selectedBandCarat;
      opts.femaleSize = selectedFemaleSize;
      opts.maleSize = selectedMaleSize;
      opts.femaleCarat = selectedFemaleCarat;
      opts.maleCarat = selectedMaleCarat;
      // For plain bands, don't include stone in options
      if (baseItem.isPlainBand) {
        delete opts.stone;
        delete opts.carat;
      }
    } else {
      opts.size = sizeSel.value;
    }

    if (editing && existingItem) {
      // update existing bag item by id
      const bag = getBag();
      const idx = bag.findIndex(i => i.id === existingItem.id);
      if (idx !== -1) {
        bag[idx].price = perUnit;
        bag[idx].quantity = qty;
        bag[idx].options = opts;
        saveBag(bag);
        updateBadge();
        renderBagPage();
        overlay.remove();
        return;
      }
    }

    // otherwise create new bag item
    const bagItem = {
      id: `${baseItem.id}::${Date.now()}`,
      productId: baseItem.id,
      name: baseItem.name,
      image: baseItem.image,
      price: perUnit,
      quantity: qty,
      options: opts
    };
    const bag = getBag();
    bag.push(bagItem);
    saveBag(bag);
    updateBadge();
    renderBagPage();
    overlay.remove();

    // small visual feedback on origin button
    if (originBtn) {
      const origText = originBtn.textContent;
      originBtn.textContent = 'Added!'; originBtn.style.backgroundColor = '#8a0621';
      setTimeout(()=>{ originBtn.textContent = origText; originBtn.style.backgroundColor=''; }, 1100);
    }
  });

  // initial compute
  computePrice();
  // Initial validation for wedding bands
  if (isBandSource) {
    validateBandSizes();
  }
  } catch(err) {
    console.error('Error in openCustomizationModal:', err);
    overlay.remove();
  }
}

// Delegate add-to-bag button clicks -> open modal
window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    // allow either the original button or the whole card to act as trigger
    const trigger = e.target.closest('.add-to-bag-btn, .add-to-bag-card');
    if (!trigger) return;
    e.preventDefault();

    // Check if user is logged in
    if (!isUserLoggedIn()) {
      showLoginModal('Please log in first to add items to your bag.');
      return;
    }

    const item = {
      id: trigger.dataset.id || trigger.getAttribute('data-id'),
      name: trigger.dataset.name || trigger.getAttribute('data-name') || 'Item',
      price: parseFloat(trigger.dataset.price || trigger.getAttribute('data-price') || '0'),
      image: trigger.dataset.image || trigger.getAttribute('data-image') || ''
    };

    // only pass an origin button for the small visual feedback when the actual button was clicked
    const originBtn = trigger.classList.contains('add-to-bag-btn') ? trigger : null;

    openCustomizationModal(item, originBtn);
  });
});

// --- Checkout page helpers ---
function getProfile() {
  try { return JSON.parse(localStorage.getItem('ec_profile') || 'null'); } catch(e) { return null; }
}
function saveProfile(p) { localStorage.setItem('ec_profile', JSON.stringify(p)); }

function renderCheckoutItems() {
  const container = document.getElementById('checkout-items');
  if (!container) return;
  const bag = getBag();
  if (!bag || bag.length === 0) {
    container.innerHTML = '<div>Your Bag is empty.</div>';
    const summaryEl = document.getElementById('checkout-summary'); if (summaryEl) summaryEl.innerHTML = '';
    document.getElementById('complete-order').disabled = true;
    return;
  }

  let html = '';
  let subtotal = 0;
  bag.forEach(it => {
    const rowTotal = (it.price||0) * (it.quantity||1);
    subtotal += rowTotal;
    html += `<div class="checkout-item-row">
      <img src="/images/${it.image}" />
      <div style="flex:1;color:#620418;font-size:14px;">${it.name}<br><small style="color:#666;">${it.options? (it.options.metal+', '+it.options.stone+', '+it.options.carat+', size:'+it.options.size) : ''}</small></div>
      <div style="text-align:right;color:#620418;font-weight:600;">₱${rowTotal.toLocaleString()}</div>
    </div>`;
  });
  container.innerHTML = html;

  // render subtotal and item count outside the items box
  const summaryEl = document.getElementById('checkout-summary');
  if (summaryEl) {
    const itemCount = bag.reduce((acc,i)=>acc + (i.quantity||0),0);
    summaryEl.innerHTML = `<div id="checkout-summary-inner" style="margin-top:10px;padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(98,4,24,0.08);background:#fff;"><div style="color:#620418;font-weight:600">Items: ${itemCount}</div><div style="color:#620418;font-weight:700">Subtotal: ₱${subtotal.toLocaleString()}</div></div>`;
  }

  // enable complete only if profile exists and has payment
  const profile = getProfile();
  const completeBtn = document.getElementById('complete-order');
  if (completeBtn) {
    if (profile && profile.address && profile.firstName && profile.payment) {
      completeBtn.disabled = false;
    } else {
      completeBtn.disabled = true;
    }
  }
}

// Wire up checkout page when present
window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  // prefill if profile exists
  const profile = getProfile();
  if (profile) {
    document.getElementById('country').value = profile.country || '';
    document.getElementById('firstName').value = profile.firstName || '';
    document.getElementById('lastName').value = profile.lastName || '';
    document.getElementById('address').value = profile.address || '';
    document.getElementById('postal').value = profile.postal || '';
    document.getElementById('province').value = profile.province || '';
    document.getElementById('social').value = profile.social || '';
    document.getElementById('phone').value = profile.phone || '';
  }

  // render payment details if a payment option is selected (or from saved profile)
  function renderPaymentDetailsFromProfile() {
    const prof = getProfile();
    if (prof && prof.payment) {
      const radio = document.querySelector(`input[name="payment"][value="${prof.payment}"]`);
      if (radio) radio.checked = true;
      renderPaymentDetails(prof.payment, prof);
    }
  }

  renderPaymentDetailsFromProfile();

  // Listen for payment radio changes
  document.querySelectorAll('input[name="payment"]').forEach(r => r.addEventListener('change', (e)=>{
    renderPaymentDetails(e.target.value);
  }));

  renderCheckoutItems();

  document.getElementById('save-profile').addEventListener('click', ()=>{
    console.log('save-profile clicked');
    const p = {
      country: document.getElementById('country').value.trim(),
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      address: document.getElementById('address').value.trim(),
      postal: document.getElementById('postal').value.trim(),
      province: document.getElementById('province').value.trim(),
      social: document.getElementById('social').value.trim(),
      phone: document.getElementById('phone').value.trim()
    };
    // require payment selection
    const paymentSel = document.querySelector('input[name="payment"]:checked');
    console.log('payment selection:', paymentSel);
    if (!paymentSel) {
      alert('Please select a payment method before continuing.');
      return;
    }
    p.payment = paymentSel.value;

    // gather extra payment details depending on method
    if (p.payment === 'bank-transfer') {
      const senderBank = (document.getElementById('sender-bank')||{}).value || '';
      const senderName = (document.getElementById('sender-name')||{}).value || '';
      const senderAccount = (document.getElementById('sender-account')||{}).value || '';
      const transferRef = (document.getElementById('transfer-ref')||{}).value || '';
      p.transfer = { senderBank, senderName, senderAccount, transferRef };
    }
    if (p.payment === 'qr-code') {
      // if QR image was uploaded and preview stored on element
      const preview = document.getElementById('qr-preview');
      if (preview && preview.dataset && preview.dataset.dataurl) {
        p.qr = preview.dataset.dataurl;
      } else {
        alert('Please upload a QR code image for payment.');
        return;
      }
    }

    if (!p.firstName || !p.address) {
      alert('Please enter your name and address to continue.');
      return;
    }
    saveProfile(p);
    console.log('profile saved', p);
    renderCheckoutItems();
    // hide the form and show the delivery summary (match screenshot)
    if (form) form.style.display = 'none';
    renderDeliverySummary(p);
    // ensure Complete Order enabled now that profile + payment exist
    const completeBtnNow = document.getElementById('complete-order'); if (completeBtnNow) completeBtnNow.disabled = false;
    alert('Profile saved. Delivery summary updated.');
  });

  // Renders payment-specific fields into #payment-details. If profile passed, prefill.
  function renderPaymentDetails(method, profileObj) {
    const container = document.getElementById('payment-details');
    if (!container) return;
    container.innerHTML = '';
    if (!method) return;
    // bank account to display for both bank-deposit and bank-transfer
    const bankAccountHTML = `<div class="bank-account-box" style="margin-bottom:8px;padding:10px;border:1px solid rgba(98,4,24,0.08);border-radius:8px;background:#fff;color:#620418;">Bank Account: <strong>0123-4567-890</strong><br><small>Acct Name: Endless Charms</small></div>`;
    if (method === 'bank-deposit') {
      container.innerHTML = bankAccountHTML + `<div style="font-size:13px;color:#8a1b1b;">Please deposit to the account above and keep the receipt. Click <em>Save & Continue</em> when done.</div>`;
    } else if (method === 'bank-transfer') {
      container.innerHTML = bankAccountHTML + `
        <div class="bank-transfer-form" style="display:flex;flex-direction:column;gap:8px;">
          <input id="sender-bank" placeholder="Your Bank Name" class="form-input" />
          <input id="sender-name" placeholder="Account Holder Name" class="form-input" />
          <input id="sender-account" placeholder="Your Account Number" class="form-input" />
          <input id="transfer-ref" placeholder="Transaction Reference / Remarks" class="form-input" />
          <div style="font-size:12px;color:#8a1b1b;">After transfer, save to preserve your details.</div>
        </div>`;
      // prefill if profileObj provided
      if (profileObj && profileObj.transfer) {
        setTimeout(()=>{
          const t = profileObj.transfer;
          if (t.senderBank) (document.getElementById('sender-bank')||{}).value = t.senderBank;
          if (t.senderName) (document.getElementById('sender-name')||{}).value = t.senderName;
          if (t.senderAccount) (document.getElementById('sender-account')||{}).value = t.senderAccount;
          if (t.transferRef) (document.getElementById('transfer-ref')||{}).value = t.transferRef;
        },50);
      }
    } else if (method === 'qr-code') {
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:8px;">
          <label style="font-size:13px;color:#8a1b1b;">Upload QR code receipt (jpg, png)</label>
          <input type="file" id="qr-file" accept="image/*" />
          <div id="qr-preview" style="max-width:180px;max-height:120px;border:1px solid rgba(98,4,24,0.06);padding:6px;border-radius:6px;" data-dataurl=""></div>
        </div>`;
      const fileInp = document.getElementById('qr-file');
      const preview = document.getElementById('qr-preview');
      fileInp.addEventListener('change', (ev)=>{
        const f = ev.target.files && ev.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = function(e){
          preview.innerHTML = `<img src="${e.target.result}" style="max-width:100%;height:auto;display:block;"/>`;
          preview.dataset.dataurl = e.target.result;
        };
        reader.readAsDataURL(f);
      });
      // prefill preview if profile has qr
      if (profileObj && profileObj.qr) {
        const previewEl = document.getElementById('qr-preview');
        if (previewEl) { previewEl.innerHTML = `<img src="${profileObj.qr}" style="max-width:100%;height:auto;display:block;"/>`; previewEl.dataset.dataurl = profileObj.qr; }
      }
    }
  }

  // Clear Form button (explicit clear of inputs and profile)
  const clearFormBtn = document.getElementById('clear-form-btn');
  if (clearFormBtn) {
    clearFormBtn.addEventListener('click', ()=>{
      // clear inputs
      ['country','firstName','lastName','address','postal','province','social','phone'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
      // remove saved profile
      localStorage.removeItem('ec_profile');
      // hide delivery summary if present
      const deliveryContainer = document.getElementById('delivery-summary');
      if (deliveryContainer) deliveryContainer.style.display = 'none';
      // re-render items and summary
      renderCheckoutItems();
      alert('Form cleared. Please re-enter your delivery information.');
    });
  }

  document.getElementById('complete-order').addEventListener('click', ()=>{
    const bag = getBag();
    if (!bag || bag.length === 0) { alert('Your Bag is empty.'); return; }
    const profile = getProfile();
    if (!profile || !profile.address) { alert('Please add your delivery address first.'); return; }
    if (!profile.payment) { alert('Please select a payment method before completing order.'); return; }

    // Save a simple last-order record and clear bag
    const order = { id: 'ORD-' + Date.now(), profile, items: bag, created: new Date().toISOString() };
    localStorage.setItem('ec_last_order', JSON.stringify(order));
    localStorage.removeItem('ec_bag');
    updateBadge();
    // Redirect to a simple confirmation page
    window.location.href = '/order-confirmation';
  });
});

function renderDeliverySummary(profile) {
  const container = document.getElementById('delivery-summary');
  const form = document.getElementById('checkout-form');
  if (!container) return;
  if (!profile) { container.style.display='none'; if (form) form.style.display='block'; return; }

  const phoneLine = profile.phone ? `<div class="user-meta">(+63) ${profile.phone}</div>` : '';
  const nameLine = `${profile.firstName} ${profile.lastName || ''}`.trim();
  const addressLine = `${profile.address}${profile.province? ', ' + profile.province : ''}${profile.postal? ', ' + profile.postal : ''}`;

  // render a full-width delivery summary that mimics the provided design
  container.innerHTML = `
    <div class="delivery-summary-box">
      <div class="delivery-left">
        <div class="delivery-pin">📍</div>
        <div class="delivery-user">
          <div class="user-name">${nameLine}</div>
          ${phoneLine}
        </div>
      </div>
      <div class="delivery-middle">
        <div class="delivery-address-line">${addressLine}</div>
      </div>
      <div class="delivery-right">
        <button id="delivery-change-btn" type="button" class="change-btn">Change</button>
        <button id="delivery-clear-btn" type="button" class="clear-small">Clear</button>
      </div>
    </div>
  `;
  container.style.display = 'block';

  const changeBtn = document.getElementById('delivery-change-btn');
  if (changeBtn) {
    changeBtn.addEventListener('click', (ev)=>{
      ev.preventDefault();
      // show form for editing and hide the delivery summary
      if (form) {
        form.style.display = 'block';
        form.scrollIntoView({behavior:'smooth'});
        const first = document.getElementById('firstName'); if (first) first.focus();
      }
      if (container) {
        container.style.display = 'none';
        console.log('Hide delivery summary, showing form for edit');
      }
    });
  }

  const clearBtn = document.getElementById('delivery-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', ()=>{
      localStorage.removeItem('ec_profile');
      container.style.display = 'none';
      if (form) {
        form.style.display = 'block';
        // clear inputs
        ['country','firstName','lastName','address','postal','province','social','phone'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
      }
      renderCheckoutItems();
    });
  }
}

// On page load, if profile exists show delivery summary
window.addEventListener('DOMContentLoaded', ()=>{
  const profile = getProfile();
  if (profile && profile.address) {
    // show delivery summary and hide the form (match saved state)
    renderDeliverySummary(profile);
    const form = document.getElementById('checkout-form'); if (form) form.style.display = 'none';
  }
});

// Authentication Check Functions
function isUserLoggedIn() {
  // Check if user is logged in (you can modify this to check session/token)
  const user = localStorage.getItem('ec_user_logged_in');
  return user === 'true';
}

function showLoginModal(message = 'Please log in to continue.') {
  const modal = document.getElementById('loginRequiredModal');
  const messageElement = document.getElementById('loginModalMessage');
  
  if (modal) {
    if (messageElement) {
      messageElement.textContent = message;
    }
    // Use inline styles to ensure visibility
    modal.style.cssText = 'display: flex !important; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); align-items: center; justify-content: center; z-index: 3000;';
  } else {
    // Fallback to direct redirect if modal doesn't exist
    window.location.href = '/login';
  }
}

function closeLoginModal() {
  const modal = document.getElementById('loginRequiredModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Handle Profile Icon Click
function handleProfileClick() {
  if (!isUserLoggedIn()) {
    showLoginModal('Please log in first to view your profile.');
    return;
  }
  window.location.href = '/profile';
}

// Handle Bag Icon Click
function handleBagClick() {
  if (!isUserLoggedIn()) {
    showLoginModal('Please log in first to view your bag.');
    return;
  }
  window.location.href = '/bag';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  const modal = document.getElementById('loginRequiredModal');
  if (e.target === modal) {
    closeLoginModal();
  }
});

function initializeProductSearch() {
  const btn = document.getElementById('headerSearchBtn');
  const dropdown = document.getElementById('searchDropdown');
  const closeBtn = document.getElementById('headerSearchClose');
  const input = document.getElementById('headerSearchInput');
  const resultsGrid = document.getElementById('searchResults');
  const header = document.querySelector('.main-header');

  // Determine current page from URL or data attribute
  const currentPage = detectCurrentPage();
  
  if (!btn || !dropdown || !input || !resultsGrid) {
    return; // Search elements not found on this page
  }

  // Position dropdown under header
  function positionDropdown() {
    if (!dropdown || !header) return;
    const headerH = header.offsetHeight || 72;
    dropdown.style.top = headerH + 'px';
    dropdown.style.height = (window.innerHeight - headerH) + 'px';
  }

  // Display random items in search results (max 5)
  function displayRandomItems() {
    const allCards = document.querySelectorAll('.weddingband-styles-grid .add-to-bag-card');
    const cardsArray = Array.from(allCards);
    
    // Shuffle and get max 5 random items
    const shuffled = cardsArray.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    resultsGrid.innerHTML = '';
    
    shuffled.forEach(card => {
      const resultCard = document.createElement('div');
      resultCard.className = 'weddingband-style-card add-to-bag-card';
      resultCard.setAttribute('data-id', card.getAttribute('data-id'));
      resultCard.setAttribute('data-name', card.getAttribute('data-name'));
      resultCard.setAttribute('data-price', card.getAttribute('data-price'));
      resultCard.setAttribute('data-image', card.getAttribute('data-image'));
      resultCard.setAttribute('data-page', card.getAttribute('data-page') || currentPage);
      resultCard.style.cursor = 'pointer';

      const imgPath = card.getAttribute('data-image');
      resultCard.innerHTML = `
        <div class="weddingband-style-image">
          <img src="/images/${imgPath}" alt="${card.getAttribute('data-name')}" style="width: 100%; height: auto;">
        </div>
        <div class="weddingband-style-info">
          <p class="weddingband-style-label">${card.getAttribute('data-name')}</p>
        </div>
      `;
      resultsGrid.appendChild(resultCard);
    });
  }

  // Perform real-time search on current page products
  function performSearch(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const allCards = document.querySelectorAll('.weddingband-styles-grid .add-to-bag-card');
    resultsGrid.innerHTML = '';

    // If search is empty, show random items instead
    if (!term) {
      displayRandomItems();
      return;
    }

    const addedIds = new Set();
    let resultCount = 0;

    allCards.forEach(card => {
      const name = card.getAttribute('data-name')?.toLowerCase() || '';
      const id = card.getAttribute('data-id');
      
      if (name.includes(term) && !addedIds.has(id)) {
        addedIds.add(id);
        resultCount++;
        
        const resultCard = document.createElement('div');
        resultCard.className = 'weddingband-style-card add-to-bag-card';
        resultCard.setAttribute('data-id', id);
        resultCard.setAttribute('data-name', card.getAttribute('data-name'));
        resultCard.setAttribute('data-price', card.getAttribute('data-price'));
        resultCard.setAttribute('data-image', card.getAttribute('data-image'));
        resultCard.setAttribute('data-page', card.getAttribute('data-page') || currentPage);
        resultCard.style.cursor = 'pointer';

        const imgPath = card.getAttribute('data-image');
        resultCard.innerHTML = `
          <div class="weddingband-style-image">
            <img src="/images/${imgPath}" alt="${card.getAttribute('data-name')}" style="width: 100%; height: auto;">
          </div>
          <div class="weddingband-style-info">
            <p class="weddingband-style-label">${card.getAttribute('data-name')}</p>
          </div>
        `;
        resultsGrid.appendChild(resultCard);
      }
    });

    // Show "No Results Found" message if no matches
    if (resultCount === 0) {
      const noResultsMsg = document.createElement('div');
      noResultsMsg.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px 20px;
        font-size: 18px;
        color: #999;
        font-weight: 500;
      `;
      noResultsMsg.textContent = 'No Results Found';
      resultsGrid.appendChild(noResultsMsg);
    }
  }

  // Position dropdown on load and resize
  positionDropdown();
  window.addEventListener('resize', positionDropdown);

  // Search input listener for real-time filtering
  input.addEventListener('input', (e) => {
    performSearch(e.target.value);
  });

  // Toggle search dropdown visibility
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = dropdown.style.display !== 'block';
    if (isVisible) {
      positionDropdown();
      dropdown.style.display = 'block';
      input.focus();
      // Display random items on dropdown open
      displayRandomItems();
    } else {
      dropdown.style.display = 'none';
    }
  });

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = 'none';
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== btn && dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    }
  });

  // Prevent dropdown from closing when clicking inside it
  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Handle result card clicks with cross-page redirect
  resultsGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.add-to-bag-card');
    if (card) {
      const productPage = card.getAttribute('data-page') || currentPage;
      const productId = card.getAttribute('data-id');
      
      if (productPage === currentPage) {
        // Same page: open modal directly
        const baseItem = {
          id: productId,
          name: card.getAttribute('data-name'),
          basePrice: parseFloat(card.getAttribute('data-price')),
          image: card.getAttribute('data-image')
        };
        dropdown.style.display = 'none';
        input.value = '';
        openCustomizationModal(baseItem);
      } else {
        // Different page: redirect and store product ID for auto-open
        sessionStorage.setItem('autoOpenProductId', productId);
        const pageUrls = {
          'engagement-rings': '/engagement-rings',
          'wedding-bands': '/wedding-bands',
          'accessories': '/accessories'
        };
        window.location.href = pageUrls[productPage];
      }
    }
  });

  // Check for auto-open on page load (after redirect)
  window.addEventListener('load', () => {
    const autoOpenId = sessionStorage.getItem('autoOpenProductId');
    if (autoOpenId) {
      sessionStorage.removeItem('autoOpenProductId');
      setTimeout(() => {
        const card = document.querySelector(`.add-to-bag-card[data-id="${autoOpenId}"]`);
        if (card) {
          const baseItem = {
            id: card.getAttribute('data-id'),
            name: card.getAttribute('data-name'),
            basePrice: parseFloat(card.getAttribute('data-price')),
            image: card.getAttribute('data-image')
          };
          openCustomizationModal(baseItem);
        }
      }, 100);
    }
  });
}

// Detect current page from URL
function detectCurrentPage() {
  const pathname = window.location.pathname;
  if (pathname.includes('engagement-rings')) return 'engagement-rings';
  if (pathname.includes('wedding-bands')) return 'wedding-bands';
  if (pathname.includes('accessories')) return 'accessories';
  return 'unknown';
}

// Initialize search when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  initializeProductSearch();
});

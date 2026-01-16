const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['rings', 'bands', 'earrings', 'bracelets', 'necklaces']
  },
  subcategory: {
    type: String,
    enum: ['engagement', 'wedding-bands', 'accessories']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  label: {
    type: String,
    trim: true
  },
  src: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },  // Pricing based on specifications
  pricing: {
    // Combination-based pricing (exact prices for specific combinations)
    combinations: [{
      stone: String,      // e.g., 'Signity', 'Moissanite', 'Lab-Grown Diamond', 'Natural Diamond'
      metal: String,      // e.g., '14k White Gold', '18k Yellow Gold', '18k White Gold'
      carat: String,      // e.g., '1ct', '2ct', '3ct'
      length: String,     // e.g., '14"', '16"', '18"' (for necklaces/bracelets)
      size: String,       // e.g., '3', '4', '5' (for rings)
      price: Number       // Exact price for this combination
    }],
    // Fallback: Price variations with modifiers (for simple pricing)
    metal: [{
      type: { type: String }, // e.g., '14k White Gold', '18k Yellow Gold', 'Platinum'
      priceModifier: { type: Number, default: 0 } // Additional cost for this metal
    }],
    stone: [{
      type: { type: String }, // e.g., 'Diamond', 'Moissanite', 'Lab Diamond'
      priceModifier: { type: Number, default: 0 } // Additional cost for this stone
    }],
    carat: [{
      size: { type: String }, // e.g., '0.5ct', '1ct', '2ct'
      priceModifier: { type: Number, default: 0 } // Additional cost for this carat size
    }]
  },  // Available options for customization
  availableOptions: {
    metals: [String],   // ['14k White Gold', '14k Yellow Gold', '18k White Gold', 'Platinum']
    stones: [String],   // ['Signity', 'Moissanite', 'Lab-Grown Diamond', 'Natural Diamond']
    carats: [String],   // ['0.5ct', '1ct', '1.5ct', '2ct']
    sizes: [String],    // ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8']
    lengths: [String]   // ['14"', '16"', '18"'] for necklaces, ['4-6"', '7"', '8"'] for bracelets
  },
  specifications: {
    cut: String, // 'Round', 'Princess', 'Cushion', etc.
    bandCarat: String
  }
}, {
  timestamps: true
});

// Method to calculate final price based on specifications
productSchema.methods.calculatePrice = function(specifications) {
  // If pricing has combinations (for products with complex pricing like engagement rings, earrings, etc.)
  if (this.pricing && this.pricing.combinations && this.pricing.combinations.length > 0) {
    const match = this.pricing.combinations.find(combo => {
      // Match all provided specifications
      return Object.keys(specifications).every(key => {
        if (combo[key]) {
          return combo[key] === specifications[key];
        }
        return true;
      });
    });
    
    if (match && match.price) {
      return match.price;
    }
  }
  
  // Fallback to modifier-based pricing (old system)
  let finalPrice = this.basePrice;
  
  // Add metal price modifier
  if (specifications.metal && this.pricing && this.pricing.metal) {
    const metalOption = this.pricing.metal.find(m => m.type === specifications.metal);
    if (metalOption) {
      finalPrice += metalOption.priceModifier;
    }
  }
  
  // Add stone price modifier
  if (specifications.stone && this.pricing && this.pricing.stone) {
    const stoneOption = this.pricing.stone.find(s => s.type === specifications.stone);
    if (stoneOption) {
      finalPrice += stoneOption.priceModifier;
    }
  }
  
  // Add carat price modifier
  if (specifications.carat && this.pricing && this.pricing.carat) {
    const caratOption = this.pricing.carat.find(c => c.size === specifications.carat);
    if (caratOption) {
      finalPrice += caratOption.priceModifier;
    }
  }
  
  return finalPrice;
};

// Virtual property to get starting price display
productSchema.virtual('startingPrice').get(function() {
  return `Starting at ₱${this.basePrice.toLocaleString()}`;
});

// Index for faster queries
productSchema.index({ category: 1, inStock: 1 });
productSchema.index({ subcategory: 1 });

module.exports = mongoose.model('Product', productSchema);

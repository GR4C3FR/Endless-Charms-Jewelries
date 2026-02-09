const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: function() {
      return !this.googleId; // lastName required only if not using Google OAuth
    },
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not using Google OAuth
    }
  },
  phone: {
    type: String,
    trim: true
  },  address: {
    province: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    barangay: {
      type: String,
      trim: true
    },
    street: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  addresses: [{
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    province: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    barangay: {
      type: String,
      required: true,
      trim: true
    },
    street: {
      type: String,
      required: true,
      trim: true
    },
    postalCode: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    social: {
      type: String,
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  avatar: {
    type: String,
    default: '/images/profile-icon.png'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  // Email verification fields
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false // Don't include in queries by default
  },
  verificationTokenExpires: {
    type: Date,
    select: false // Don't include in queries by default
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

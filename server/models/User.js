import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export const USER_ROLES = ['user', 'admin']
export const USER_STATUSES = ['pending', 'approved', 'blocked']

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // no two accounts with the same email
      lowercase: true,
      trim: true,
    },
    // select: false -> the password hash is NOT returned by queries unless we ask for it
    password: { type: String, required: [true, 'Password is required'], minlength: [8, 'Password must be at least 8 characters'], select: false },
    // The two roles of the system. New sign-ups are always "user".
    role: { type: String, enum: USER_ROLES, default: 'user' },
    // A new staff member is "pending" until an admin approves them. An admin can also block someone.
    status: { type: String, enum: USER_STATUSES, default: 'pending' },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
)

// Runs before every save: scramble (hash) the password if it was just set or changed
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

// user.matchPassword('typed password') -> true or false
userSchema.methods.matchPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password)
}

const User = mongoose.models.User || mongoose.model('User', userSchema)
export default User

import mongoose from 'mongoose';

export const usersLoginSchema = new mongoose.Schema(
  {
    // _id: mongoose.Schema.Types.ObjectId,
    email: String,
    password: String,
    user_id: String,
  },
  { timestamps: true },
);
// console.log(mongoose.connections);

export interface UsersLogin {
  email: string;
  password: string;
  user_id: string;
}

import mongoose from 'mongoose';

export const usersSchema = new mongoose.Schema(
  {
    // _id: mongoose.Schema.Types.ObjectId,
    artist_name: String,
    email_id: String,
    user_id: String,
  },
  { timestamps: true },
);
// console.log(mongoose.connections);

export interface Users {
  artist_name: string;
  email_id: string;
  user_id: string;
}

import mongoose from 'mongoose';

export const artPostsScherma = new mongoose.Schema(
  {
    // _id: mongoose.Schema.Types.ObjectId,
    description: String,
    upvotes: mongoose.Schema.Types.Number,
    downvotes: mongoose.Schema.Types.Number,
    user_id: String,
    file_name: String,
  },
  { timestamps: true },
);

// console.log(mongoose.connections);

export interface ArtPosts {
  description: string;
  upvotes: number;
  downvotes: number;
  user_id: string;
  file_name: string;
}

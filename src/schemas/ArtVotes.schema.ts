import mongoose from 'mongoose';

export const artVotesSchema = new mongoose.Schema(
  {
    // _id: mongoose.Schema.Types.ObjectId,
    user_id: String,
    post_id: String,
    type: String,
  },
  { timestamps: true },
);
// console.log(mongoose.connections);

export interface ArtVotes {
  user_id: string;
  post_id: string;
  type: string;
}

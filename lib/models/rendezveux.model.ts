import mongoose from "mongoose";

const rendezveuxSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  parentId: {
    type: String,
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rendezveux",
    },
  ],
});

const Rendezveux = mongoose.models.Rendezveux|| mongoose.model("Rendezveux", rendezveuxSchema);

export default Rendezveux;

import mongoose from "mongoose";

const roadmapSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		role: String,
		targetPackage: String,
		useResume: Boolean,
		resume: mongoose.Schema.Types.Mixed,
		roadmap: mongoose.Schema.Types.Mixed,
	},
	{ timestamps: true }
);

const Roadmap = mongoose.model("Roadmap", roadmapSchema);

export default Roadmap;

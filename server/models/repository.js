
const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
    },
    visibility: {
        type: String,
        enum: ["public", "private"],
        default: "public"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

repositorySchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Repository", repositorySchema);

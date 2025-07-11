import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'system'], 
        default: 'text'
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    deleted: {
        type: Boolean,
        default: false
    },
    reactions: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        emoji: String,
        createdAt: { 
            type: Date, 
            default: Date.now 
        }
    }],
    deliveredTo: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        deliveredAt: { type: Date, default: Date.now }
    }],
    readBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }],
    attachments: [{
        filename: String,
        url: String,
        size: Number,
        mimeType: String
    }]
}, { timestamps: true });

messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, room: 1 });
messageSchema.index({ deleted: 1, room: 1 });

export default mongoose.model('Message', messageSchema);
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    description: {
        type: String, 
        trim: true, 
        maxlength: 200 
    },
    type: {
        type: String, 
        enum: ['public', 'private', 'direct'], 
        default: 'public' 
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    avatar: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isPublic: {
        type: Boolean,
        default: function() { return this.type === 'public'; }
    },
    maxParticipants: {
        type: Number,
        default: function() { return this.type === 'direct' ? 2 : 1000; }
    },
    settings: {
        allowInvites: { type: Boolean, default: true },
        requireApproval: { type: Boolean, default: false },
        allowFileUploads: { type: Boolean, default: true },
        messageRetention: { type: Number, default: 365 }
    }
}, {
    timestamps: true
});

roomSchema.index({ type: 1, isActive: 1 });
roomSchema.index({ participants: 1, type: 1 });
roomSchema.index({ type: 1, isPublic: 1 });

roomSchema.pre('save', function(next) {
    if (this.type === 'direct' && this.participants.length > 2) {
        return next(new Error('Direct rooms can only have 2 participants'));
    }
    
    this.isPublic = this.type === 'public';
    
    if (this.type === 'direct') {
        this.maxParticipants = 2;
    }
    
    next();
});

roomSchema.virtual('otherParticipant').get(function() {
    if (this.type === 'direct' && this.participants.length === 2) {
        return this.participants.find(p => p.toString() !== this.currentUserId);
    }
    return null;
});

export default mongoose.model('Room', roomSchema);
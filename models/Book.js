const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    isbn: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['available', 'checked-out'],
        default: 'available'
    },
    checkedOutBy: {
        type: String, 
        default: null
    },
    checkedOutByUsername: {
        type: String,
        default: null
    },
    checkedOutDate: {
        type: String,
        default: null
    },
    isFavorite: {
        type: Boolean,
        default: false
    },
    borrowHistory: [{
        borrower: String,
        borrowerId: { type: String, default: null },
        checkoutDate: String,
        returnDate: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Book', bookSchema);
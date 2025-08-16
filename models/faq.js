import mongoose from "mongoose";

const faqSchema = mongoose.Schema({
    faqId: {
        type: String,
        require: true,
        unique : true
    },
    question: {
        type: String,
        require: true,
    },
    answer: {
        type: String,
        require: true,
    },
 


});

const Faq = mongoose.model("faqs", faqSchema);

export default Faq;

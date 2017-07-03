var mongoose = require('mongoose');
 
module.exports = mongoose.model('Config',{
    groupName:String,
    webhookUrl: String,
    textChoice: String
}); 

"use strict";
var mongoose   = require('mongoose')
  , ObjectId   = mongoose.Schema.Types.ObjectId
  , utils      = require('../lib/utils');

function OrganizationSchema() {
  mongoose.Schema.apply(this, arguments);
  this.add({
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    liaisons: [{ref:'Person', type: ObjectId}]
  });
}

utils.inherit(OrganizationSchema, mongoose.Schema);

var schema = new OrganizationSchema();
var model = mongoose.model('Organization', schema);

module.exports = {'model': model, schema: OrganizationSchema};
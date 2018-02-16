import mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

export default function(Organization, OrganizationSchema) {
  //School extends Organization,
  //adding the following properties
  const schema = new OrganizationSchema({
    isCollege: {
      type: Boolean
    },
    principal: { ref: "Person", type: ObjectId },
  });

  return Organization.discriminator("School", schema);
}

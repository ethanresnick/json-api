require! [\mocha, \sinon \chai, \../../lib/types/Resource]
expect = chai.expect
it2 = it # a hack for livescript

/* TEST CASES
0 resources | toOne or toMany relationship, included or referenced by href
  - { type:[] }
  
1 resource | toOne relationship | referenced by href
  - {
    type: {
      "attrName": "val", 
      "links": {
        propName: {
          "type": "type2", 
          "id": "id2",  //not strictly necessary, but nice to include
          "href": "url"
        } 
      }
    }
  }

1 resource | toMany relationship | referenced by href
  - {
    type: {
      "attrName": "val", 
      "links": {
        propName: {
          "type": "type2",
          "ids": ["id2", "id3"]  //not strictly necessary, but nice to include
          "href": "url"
        } 
      }
    }
  }

1 resource | toOne relationship | included.
  - {
      type: {
        "attrName": "val", 
        "links": {
          "propName": {
            "type": "type2", 
            id: "id2"
          } 
        }
      },
      linked: {
        type2: [{
          //full resource, sans type + href but with id.
        }]
      }
    }

1 resource | toMany relationship | included
  - {
    type: {
      "attrName": "val", 
      "links": {
        propName: {
          "type": "type2", 
          "ids": ["id2", "id3"]
        }
      }
    },
    linked: {
      //same as above
    }
  }


[1, n] resources | toOne relationship | referenced by href
  - {
      //identical to the included case below, sans the linked key
      links: {
        "type.propName": {
          type: "type2",
          href: "/type2/{id}"
        }
      },
      type: [
        {
          "attrName": "val", 
          "links": {
            "propName": "id2" 
          }
        },
        ...
      ]
    }

[1, n] resources | toMany relationship | referenced by href
  - {
      //identical to the included case below, sans the linked key
      links: {
        "type.propName": {
          type: "type2",
          href: "/type2/id"
        }
      },
      type: [
        {
          "attrName": "val", 
          "links": {
            "propName": ["id2", "id3"]
          }
        },
        ...
      ]
    }

[1, n] resources | toOne relationship | included
  - {
      //add links so you dont have to specify type at each resource-level
      //links key. Has some overhead--most notably having to include the
      //url template, which isn't actually used--but pays off if the 
      //response has more than a handful of resources.
      links: {
        "type.propName": {
          type: "type2",
          href: "/type2/id"
        }
      },
      type: [
        {
          "attrName": "val", 
          "links": {
            "propName": "id2" 
          }
        },
        ...
      ],
      linked: {
        type2: [{
          //full resource, sans type + href but with id.
        }]
      }
    }

[1, n] resources | toMany relationship | included
  - {
      //add links so you dont have to specify type at each resource-level
      //links key. Has some overhead--most notably having to include the
      //url template, which isn't actually used--but pays off if the 
      //response has more than a handful of resources.
      links: {
        "type.propName": {
          type: "type2",
          href: "/type2/id"
        }
      },
      type: [
        {
          "attrName": "val", 
          "links": {
            "propName": ["id2", "id3"] 
          }
        },
        ...
      ],
      linked: {
        type2: [{
          //full resource, sans type + href but with id.
        }]
      }
    }
*/

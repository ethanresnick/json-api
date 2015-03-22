export default class Linkage {
  /**
   * Linkage can be either: null, an empty array,
   * an object of the form {type, id}, or [{type, id}].
   */
  constructor(value) {
    this.set(value);
  }

  set(value) {
    if(value === null) {
      this.value = value;
    }

    else if(!Array.isArray(value)) {
      if(isValidLinkageObject(value)) {
        this.value = value;
      }
      else {
        throw new InvalidLinkageError(value);
      }
    }
    else {
      this.value = [];
      value.forEach(this.add.bind(this));
    }
  }

  add(newValue) {
    if(Array.isArray(this.value)) {
      if(isValidLinkageObject(newValue)) {
        this.value.push(newValue);
      }
      else {
        throw new InvalidLinkageError(newValue);
      }
    }
    else {
      throw new Error(
        "You can only add values to Linkage objects for to-many relationships."
      );
    }
  }

  empty() {
    this.value = Array.isArray(this.value) ? [] : null;
  }
}

function InvalidLinkageError(value) {
  return new Error("Invalid linkage value: " + JSON.stringify(value));
}

function isValidLinkageObject(it) {
  return typeof it.type === "string" && typeof it.id === "string";
}

class response {
  /**
   * api response.
   * @param {number} id 
   * @param {Object} msg 
   */
  constructor(id, msg) {
    this.id = id;
    this.msg = msg;
  }

  json(){
    return {
      id: this.id,
      msg: this.msg
    }
  }
}

module.exports = response;

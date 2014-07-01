/*jslint node: true */
"use strict";

var beanAPI = require('ble-bean');
var scan = require('./scan');


function Plugin(messenger, options){
  this.messenger = messenger;
  this.options = options;

  var self = this;

  var peripherals = [];
  scan.scan(3000, beanAPI.UUID, peripherals, function(peripherals){

    peripherals.forEach(function(peripheral){
      if(peripheral.uuid === self.options.uuid){
        self.peripheral = peripheral;
        self.peripheral.connect(function(){
          self.peripheral.discoverServices([beanAPI.UUID], function(err, services){
            if (err) throw err;
            self.connectedBean = new beanAPI.Bean(services[0]);
          });
        });
      }
    });

  });


  return this;
}

Plugin.prototype._connect = function(){

};

var optionsSchema = {
  type: 'object',
  properties: {
    uuid: {
      type: 'string',
      required: true
    }
  }
};

//{setColor: {r: 0, g: 255, b: 128}}

var messageSchema = {
  type: 'object',
  properties: {
    setColor: {
      type: 'object',
      required: true,
      properties: {
        r: {
          type: 'int',
          required: true
        },
        g: {
          type: 'int',
          required: true
        },
        b: {
          type: 'int',
          required: true
        }
      }
    }
  }
};



function getDefaultOptions(callback){
    //do some querying of the hardware...

    var peripherals = [];
    scan.scan(5000, beanAPI.UUID, peripherals, function(peripherals){

      if(peripherals.length){
        callback(null,peripherals[0].uuid);
      }
      else{
        callback("None found");
      }

    });
}

Plugin.prototype.onMessage = function(message, fn){
  var data = message.payload;
  console.log(this.options.uuid + ', ' + message.fromUuid);

  if(this.connectedBean){
    if(data.setColor){
      this.connectedBean.setColor(new Buffer([data.setColor.r, data.setColor.g, data.setColor.b]));
    }
  }
  // var resp = {greeting: this.options.greetingPrefix + ' back atcha: ' + data.text};

  // if(message.fromUuid && fn){
  //   resp.withCallback = true;
  //   fn(resp);
  // }else if(message.fromUuid){
  //   this.messenger.send({devices: message.fromUuid, payload: resp});
  // }

};

Plugin.prototype.destroy = function(){
  //clean up
  console.log('destroying.', this.options);
};


module.exports = {
  Plugin: Plugin,
  optionsSchema: optionsSchema,
  messageSchema: messageSchema,
  getDefaultOptions: getDefaultOptions
};

/*jslint node: true */
"use strict";

var beanAPI = require('ble-bean');
var scan = require('./scan');



function Plugin(messenger, options){
  this.messenger = messenger;
  this.options = options;


  this.peripherals = [];
  console.log('scan starting');

  this._connect();

  return this;
}

Plugin.prototype._connect = function(beanUuid){
  var self = this;

  scan(5000, beanAPI.UUID, self.peripherals, function(peripherals){

    peripherals.forEach(function(peripheral){
      console.log('periphera found', peripheral);
      if(peripheral.uuid === beanUuid || self.options.uuid){
        self.peripheral = peripheral;
        console.log('matching bean', self.peripheral);
        self.peripheral.connect(function(){
          console.log('connect bean', self.peripheral);
          self.peripheral.discoverServices([beanAPI.UUID], function(err, services){
            console.log('services disovered', services, err);
            if (err) throw err;
            self.connectedBean = new beanAPI.Bean(services[0]);
          });
        });
      }
    });

  });
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
      required: false,
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
    },
    connect: {
      type: 'object',
      required: false,
      properties: {
        uuid: {
          type: 'string',
          required: false
        }
      }
    },
    getConnectedBean: {
      type: 'object',
      required: false,
      properties: {
      }
    },
    getAccelerometer: {
      type: 'object',
      required: false,
      properties: {
      }
    }
  }
};



function getDefaultOptions(callback){
    //do some querying of the hardware...

    var peripherals = [];
    scan(5000, beanAPI.UUID, peripherals, function(peripherals){

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
  console.log(this.options.uuid + ', from:' + message.fromUuid);

  if(this.connectedBean){
    if(data.setColor){
      this.connectedBean.setColor(new Buffer([data.setColor.r, data.setColor.g, data.setColor.b]));
    }
    else if(data.getConnectedBean && fn){
      fn(this.connectedBean);
    }
    else if(data.getAccelerometer && fn){
      this.connectedBean.requestAccell(function(data){
        fn(data);
      });
    }
  }

  if(data.connect){
    this._connect(data.connect.uuid);
  }


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

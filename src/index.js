"use strict";
const EventEmitter = require('events');

let Rltm = require('rltm');
let me = false;

let plugins = [];

function addChild(ob, childName, childOb) {
   ob[childName] = childOb;
   childOb.parent = ob;
}

function loadClassPlugins(obj) {

    let className = obj.constructor.name;

    for(let i in plugins) {
        // do plugin error checking here

        if(plugins[i].extends && plugins[i].extends[className]) {
            addChild(obj, plugins[i].namespace, plugins[i].extends[className]);   
        }

    }

}

class Chat {

    constructor(me, users) {

        loadClassPlugins(this);

        this.me = me;
        this.users = users;

        let userIds = [];
        for(var i in this.users) {
            userIds.push(this.users[i].id); 
        };
        userIds.push(this.me.id);

        this.channels = [userIds.sort().join(':')];

        // use star channels ian:*
        this.emitter = new EventEmitter();

        this.rltm = new Rltm({
            publishKey: 'pub-c-72832def-4ca3-4802-971d-68112db1b30a',
            subscribeKey: 'sub-c-28e05466-8c18-11e6-a68c-0619f8945a4f'
        });
            
        this.rltm.addListener({
            status: (statusEvent) => {
                
                if (statusEvent.category === "PNConnectedCategory") {
                    this.emitter.emit('ready');
                }

            },
            message: (m) => {

                var payload = m.message;
                payload.chat = this;

                for(let i in plugins) {
                    if(plugins[i].middleware && plugins[i].middleware.subscribe) {
                        plugins[i].middleware.subscribe(payload, function(){});
                    }
                }

                this.emitter.emit(payload.event, payload.data);

            },
            presence: (presenceEvent) => {
                this.emitter.emit('presence', presenceEvent);
            }
        })
         
        this.rltm.subscribe({ 
            channels: this.channels
        });

    }

    publish(event, data) {

        var payload = {
            chat: this,
            event: event,
            data: data
        };

        for(let i in plugins) {
            if(plugins[i].middleware && plugins[i].middleware.publish) {
                plugins[i].middleware.publish(payload, function(){});
            }
        }

        delete payload.chat; // will be rebuilt on subscribe

        this.rltm.publish({
            message: payload,
            channel: this.channels[0]
        });

    }

};

class User {

    constructor(id, data) {
    
        loadClassPlugins(this);
        
        this.id = id;
        this.data = data;
    }

    createChat(users) {
        return new Chat(this, users);
    };

};

module.exports = class {
    constructor(config, plugs) {

        plugins = plugs;

        let classes = {Chat, User};

        return classes;

    }
    config(params) {
        // do some config
    }
};

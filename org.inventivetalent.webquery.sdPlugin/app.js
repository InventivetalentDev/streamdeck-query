/* global $CC, Utils, $SD */

/**
 * Here are a couple of wrappers we created to help you quickly setup
 * your plugin and subscribe to events sent by Stream Deck to your plugin.
 */

/**
 * The 'connected' event is sent to your plugin, after the plugin's instance
 * is registered with Stream Deck software. It carries the current websocket
 * and other information about the current environmet in a JSON object
 * You can use it to subscribe to events you want to use in your plugin.
 */

$SD.on('connected', (jsonObj) => connected(jsonObj));

function connected(jsn) {
    // Subscribe to the willAppear and other events
    $SD.on('org.inventivetalent.webquery.action.willAppear', (jsonObj) => action.onWillAppear(jsonObj));
    $SD.on('org.inventivetalent.webquery.action.willDisappear', (jsonObj) => action.onWillDisappear(jsonObj));
    $SD.on('org.inventivetalent.webquery.action.keyUp', (jsonObj) => action.onKeyUp(jsonObj));
    $SD.on('org.inventivetalent.webquery.action.sendToPlugin', (jsonObj) => action.onSendToPlugin(jsonObj));
    $SD.on('org.inventivetalent.webquery.action.didReceiveSettings', (jsonObj) => action.onDidReceiveSettings(jsonObj));
    $SD.on('org.inventivetalent.webquery.action.propertyInspectorDidAppear', (jsonObj) => {
        console.log('%c%s', 'color: white; background: black; font-size: 13px;', '[app.js]propertyInspectorDidAppear:');
    });
    $SD.on('org.inventivetalent.webquery.action.propertyInspectorDidDisappear', (jsonObj) => {
        console.log('%c%s', 'color: white; background: red; font-size: 13px;', '[app.js]propertyInspectorDidDisappear:');
    });
};

// ACTIONS

const action = {
    context: undefined,
    settings: {},
    latestValue: '',
    interval: 0,
    onDidReceiveSettings: function (jsn) {
        console.log('%c%s', 'color: white; background: red; font-size: 15px;', '[app.js]onDidReceiveSettings:');

        this.settings = Utils.getProp(jsn, 'payload.settings', {});
        this.doSomeThing(this.settings, 'onDidReceiveSettings', 'orange');

        // /**
        //  * In this example we put a HTML-input element with id='mynameinput'
        //  * into the Property Inspector's DOM. If you enter some data into that
        //  * input-field it get's saved to Stream Deck persistently and the plugin
        //  * will receive the updated 'didReceiveSettings' event.
        //  * Here we look for this setting and use it to change the title of
        //  * the key.
        //  */
        //
        // this.setTitle(jsn);
    },

    /**
     * The 'willAppear' event is the first event a key will receive, right before it gets
     * shown on your Stream Deck and/or in Stream Deck software.
     * This event is a good place to setup your plugin and look at current settings (if any),
     * which are embedded in the events payload.
     */

    onWillAppear: function (jsn) {
        console.log('%c%s', 'color: white; background: red; font-size: 15px;', '[app.js]onWillAppear:');
        console.log("You can cache your settings in 'onWillAppear'", jsn.payload.settings);
        /**
         * The willAppear event carries your saved settings (if any). You can use these settings
         * to setup your plugin or save the settings for later use.
         * If you want to request settings at a later time, you can do so using the
         * 'getSettings' event, which will tell Stream Deck to send your data
         * (in the 'didReceiveSettings above)
         *
         * $SD.api.getSettings(jsn.context);
         */
        this.context = jsn.context;
        this.settings = jsn.payload.settings;
        //
        // // Nothing in the settings pre-fill, just something for demonstration purposes
        // if (!this.settings || Object.keys(this.settings).length === 0) {
        //     this.settings.mynameinput = 'TEMPLATE';
        // }
        // this.setTitle(jsn);

        if (this.settings.interval) {
            this.settings.interval = Number(this.settings.interval);
            if (this.settings.interval > 0) {
                console.log("starting refresh timer", this.settings.interval)
                clearInterval(this.interval);
                this.interval = setInterval(() => this.refresh(), this.settings.interval * 1000);
            }
        }
    },
    onWillDisappear: function (jsn) {
        console.log('%c%s', 'color: white; background: red; font-size: 15px;', '[app.js]onWillDisappear:');
        clearInterval(this.interval)
    },

    onKeyUp: function (jsn) {
        this.doSomeThing(jsn, 'onKeyUp', 'green');
    },

    onSendToPlugin: function (jsn) {
        /**
         * This is a message sent directly from the Property Inspector
         * (e.g. some value, which is not saved to settings)
         * You can send this event from Property Inspector (see there for an example)
         */

        const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});
        if (sdpi_collection.value && sdpi_collection.value !== undefined) {
            this.doSomeThing({[sdpi_collection.key]: sdpi_collection.value}, 'onSendToPlugin', 'fuchsia');
        }
    },

    /**
     * This snippet shows how you could save settings persistantly to Stream Deck software.
     * It is not used in this example plugin.
     */

    saveSettings: function (jsn, sdpi_collection) {
        console.log('saveSettings:', jsn);
        if (sdpi_collection.hasOwnProperty('key') && sdpi_collection.key != '') {
            if (sdpi_collection.value && sdpi_collection.value !== undefined) {
                this.settings[sdpi_collection.key] = sdpi_collection.value;
                console.log('setSettings....', this.settings);
                $SD.api.setSettings(jsn.context, this.settings);
            }
        }
    },

    /**
     * Here's a quick demo-wrapper to show how you could change a key's title based on what you
     * stored in settings.
     * If you enter something into Property Inspector's name field (in this demo),
     * it will get the title of your key.
     *
     *
     */

    setTitle: function (title) {
        $SD.api.setTitle(this.context, title)
    },

    /**
     * Finally here's a method which gets called from various events above.
     * This is just an idea on how you can act on receiving some interesting message
     * from Stream Deck.
     */

    doSomeThing: function (jsn, caller, tagColor) {
        console.log('%c%s', `color: white; background: ${ tagColor || 'grey' }; font-size: 15px;`, `[app.js]doSomeThing from: ${ caller }`);

        this.refresh()
    },

    refresh: function () {
        this.setTitle("");

        let init = {};
        if (this.settings.method) {
            init.method = this.settings.method;
        }
        if (this.settings.headers) {
            init.headers = this.settings.headers.split("\n").map(line => line.split(":").map(s => s.trim()));
        }
        let url = this.settings.url || 'http://localhost';
        fetch(url, init)
            .then(response => {
                if (response.status !== 200) { //TODO: allow redirects etc.
                    this.latestValue = "" + response.status;
                    this.drawAndUpdateImage();
                    $SD.api.showAlert(this.context);
                    return;
                }


                response.json()
                    .then(body => {
                        this.latestValue = Utils.getProp(body, this.settings.path, '?');
                        console.log(this.latestValue);
                        // this.setTitle("" + this.latestValue);
                        this.drawAndUpdateImage();
                    })
            });
    },

    drawAndUpdateImage: function () {
        let canvas = document.createElement('canvas');
        canvas.width = 72;
        canvas.height = 72;

        let ctx = canvas.getContext('2d');
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = '20px Arial'
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('' + this.latestValue, canvas.width / 2, canvas.height / 2, canvas.width);


        $SD.api.setImage(this.context, canvas.toDataURL('image/png'));
    },


};


/*
 * Copyright IBM Corp. 2016
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";
/**
 * @author Steven Atkin
 */
var nls = require('vscode-nls');
var path = require('path');
var vscode_1 = require('vscode');
var localize = nls.config({ locale: vscode_1.env.language })(path.join(__dirname, 'data'));
// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
function activate(context) {
    console.log('Globalization Pipeline plugin is now active!');
    // start the Globalization Pipeline plugin
    var g11n = new GlobalizationPipeline();
    var createBundle = vscode_1.commands.registerCommand('extension.g11n.createBundle', function () {
        g11n.createBundle();
    });
    var uploadBundle = vscode_1.commands.registerCommand('extension.g11n.uploadBundle', function () {
        g11n.uploadBundle();
    });
    var downloadBundle = vscode_1.commands.registerCommand('extension.g11n.downloadBundle', function () {
        g11n.downloadBundle();
    });
    var deleteBundle = vscode_1.commands.registerCommand('extension.g11n.deleteBundle', function () {
        g11n.deleteBundle();
    });
    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(g11n);
    context.subscriptions.push(createBundle);
    context.subscriptions.push(uploadBundle);
    context.subscriptions.push(downloadBundle);
}
exports.activate = activate;
function getConfigurationSettings() {
    var settings = vscode_1.workspace.getConfiguration('g11n');
    var userSettings = new Settings(settings['userId'], settings['password'], settings['instanceId'], settings['url'], settings['targetLanguages'], settings['sourceLanguage']);
    return userSettings;
}
var Settings = (function () {
    function Settings(username, password, instance, url, target, source) {
        this._userId = username;
        this._password = password;
        this._instanceId = instance;
        this._url = url;
        this._targetLanguages = target;
        this._sourceLanguage = source;
    }
    Object.defineProperty(Settings.prototype, "userId", {
        get: function () {
            return this._userId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Settings.prototype, "password", {
        get: function () {
            return this._password;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Settings.prototype, "instanceId", {
        get: function () {
            return this._instanceId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Settings.prototype, "url", {
        get: function () {
            return this._url;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Settings.prototype, "targetLanguages", {
        get: function () {
            return this._targetLanguages;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Settings.prototype, "sourceLanguage", {
        get: function () {
            return this._sourceLanguage;
        },
        enumerable: true,
        configurable: true
    });
    return Settings;
}());
var GlobalizationPipeline = (function () {
    function GlobalizationPipeline() {
        this.fs = require('fs');
        this._userSettings = getConfigurationSettings();
        var credentials = {
            credentials: {
                url: this._userSettings.url,
                userId: this._userSettings.userId,
                password: this._userSettings.password,
                instanceId: this._userSettings.instanceId
            }
        };
        this.g11n = require("g11n-pipeline").getClient(credentials);
    }
    GlobalizationPipeline.prototype.parseContent = function () {
        var parsed = {};
        // Get the current text editor
        var editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            return parsed;
        }
        var doc = editor.document;
        // make sure we have a named document
        if (!doc.isUntitled) {
            var docContent = doc.getText();
            var languageType = doc.languageId;
            // JSON resource bundle
            if (languageType == "json") {
                try {
                    parsed = JSON.parse(docContent);
                }
                catch (e) {
                    parsed = {};
                }
            }
            else if (languageType == "ini") {
                var props = require("properties-parser");
                try {
                    parsed = props.parse(docContent);
                }
                catch (e) {
                    parsed = {};
                }
            }
            else if (languageType == 'javascript') {
                try {
                    var esprima = require('esprima');
                    // get the abstract syntax tree for the AMD resource
                    var ast = esprima.parse(docContent, {
                        range: true,
                        raw: true
                    });
                    // grab the define function
                    var defines = ast.body.filter(function (node) {
                        return node.expression.callee.name === 'define';
                    })[0];
                    // grab the resource bundle argument to the define
                    var args = defines.expression['arguments'];
                    // Grab the root object of the bundle
                    var bundle = args.filter(function (arg) {
                        return arg.type === 'ObjectExpression';
                    })[0];
                    // Grab the array of key value pairs
                    var items = bundle.properties[0].value.properties;
                    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                        var item = items_1[_i];
                        // add the key value pair to the json object
                        parsed[item.key.name] = item.value.value;
                    }
                }
                catch (e) {
                    parsed = {};
                }
            }
        }
        return parsed;
    };
    GlobalizationPipeline.prototype.deleteBundle = function () {
        // We need to do this so we can access the object from the lambda functions
        var _this = this;
        this.g11n.bundles({}, function (err, bundles) {
            if (err) {
                vscode_1.window.showErrorMessage(localize(0, null));
                return;
            }
            else {
                var bundleList = Object.keys(bundles);
                vscode_1.window.setStatusBarMessage(localize(2, null), 2000);
                vscode_1.window.showQuickPick(bundleList, {
                    placeHolder: localize(2, null)
                }).then(function (bundleName) {
                    if (typeof bundleName !== "string") {
                        return;
                    }
                    else {
                        _this.g11n.bundle(bundleName).delete({}, function (err, results) {
                            if (err) {
                                vscode_1.window.showErrorMessage(localize(3, null) + bundleName);
                            }
                            else if (results.status == "SUCCESS") {
                                vscode_1.window.showInformationMessage(localize(4, null) + bundleName);
                            }
                        });
                    }
                });
            }
        });
    };
    GlobalizationPipeline.prototype.downloadBundle = function () {
        // We need to do this so we can access the object from the lambda functions
        var _this = this;
        // Display the list of bundles
        this.g11n.bundles({}, function (err, bundles) {
            if (err) {
                vscode_1.window.showErrorMessage(localize(0, null));
                return;
            }
            else {
                var bundleList = Object.keys(bundles);
                vscode_1.window.setStatusBarMessage(localize(1, null), 2000);
                vscode_1.window.showQuickPick(bundleList, {
                    placeHolder: localize(14, null)
                }).then(function (bundleName) {
                    if (typeof bundleName !== "string") {
                        // a bundle was not selected
                        return;
                    }
                    else {
                        // get the list of target languages for the selected bundle
                        _this.g11n.bundle(bundleName).getInfo({ fields: "targetLanguages" }, function (err, langs) {
                            if (err || langs.targetLanguages.length == 0) {
                                vscode_1.window.showErrorMessage(localize(16, null));
                                return;
                            }
                            else {
                                vscode_1.window.showQuickPick(langs.targetLanguages, {
                                    placeHolder: localize(15, null)
                                }).then(function (language) {
                                    // Get the content for the selected bundle and language
                                    if (typeof language !== "string") {
                                        // a language was not selected
                                        return;
                                    }
                                    else {
                                        _this.g11n.bundle(bundleName).getStrings({ languageId: language }, function (err, results) {
                                            if (err) {
                                                vscode_1.window.showErrorMessage(localize(16, null));
                                                return;
                                            }
                                            else {
                                                try {
                                                    // Do the file write as synchronous
                                                    // Create the file
                                                    var fileName = bundleName + '_' + language + '.json';
                                                    _this.fs.writeFileSync(fileName, JSON.stringify(results.resourceStrings));
                                                    // Get the full path to the file
                                                    var fullPath = _this.fs.realpathSync(fileName, []);
                                                    // Open the file in a new edit window
                                                    var uri = vscode_1.Uri.parse('file://' + fullPath);
                                                    vscode_1.commands.executeCommand('vscode.open', uri);
                                                }
                                                catch (e) {
                                                    vscode_1.window.showErrorMessage(localize(17, null));
                                                    return;
                                                }
                                            }
                                        }); // block end for getting the bundle strings
                                    }
                                }); // block end for showing the list of available languages
                            }
                        }); // block end for getting the list of translations for the bundle
                    }
                }); // block end for showing the list of available bundles
            }
        }); // block end for getting the list of available bundles from the service
    };
    GlobalizationPipeline.prototype.uploadBundle = function () {
        // We need to do this so we can access the object from the lambda functions
        var _this = this;
        this.g11n.bundles({}, function (err, bundles) {
            if (err) {
                vscode_1.window.showErrorMessage(localize(0, null));
                return;
            }
            else {
                var bundleList = Object.keys(bundles);
                vscode_1.window.setStatusBarMessage(localize(1, null), 2000);
                vscode_1.window.showQuickPick(bundleList, {
                    placeHolder: localize(5, null)
                }).then(function (bundleName) {
                    if (typeof bundleName !== "string") {
                        return;
                    }
                    else {
                        var parsed = _this.parseContent();
                        var length = Object.keys(parsed).length;
                        // we have a set of key value pairs to upload
                        if (length > 0) {
                            _this.g11n.bundle(bundleName).uploadStrings({
                                languageId: _this._userSettings.sourceLanguage,
                                strings: parsed
                            }, function (err, results) {
                                if (err) {
                                    vscode_1.window.showErrorMessage(localize(6, null) + bundleName);
                                }
                                else if (results.status == "SUCCESS") {
                                    vscode_1.window.showInformationMessage(localize(7, null) + bundleName);
                                }
                            });
                        }
                        else {
                            vscode_1.window.showErrorMessage(localize(8, null) + bundleName);
                            return;
                        }
                    }
                });
            }
        });
    };
    GlobalizationPipeline.prototype.createBundle = function () {
        var _this = this;
        // Ask for the name of the bundle to create
        vscode_1.window.showInputBox({
            prompt: localize(13, null),
            validateInput: function (text) {
                //let regex = /\s/g;
                var regex = /[a-zA-Z0-9][a-zA-Z0-9_.\\-]+/;
                return regex.test(text) ? '' : localize(9, null);
            }
        }).then(function (bundleName) {
            // make sure we have a valid bundle name
            if (typeof bundleName !== "string") {
                return;
            }
            else {
                // Create the bundle
                vscode_1.window.showInformationMessage(localize(10, null) + bundleName);
                // Call the pipeline service on Bluemix
                _this.g11n.bundle(bundleName).create({
                    sourceLanguage: _this._userSettings.sourceLanguage,
                    targetLanguages: _this._userSettings.targetLanguages
                }, function (err, results) {
                    if (err) {
                        vscode_1.window.showErrorMessage(localize(11, null) + bundleName);
                    }
                    else if (results.status == 'SUCCESS') {
                        vscode_1.window.showInformationMessage(localize(12, null) + bundleName);
                    }
                });
            }
        });
    };
    GlobalizationPipeline.prototype.dispose = function () {
    };
    return GlobalizationPipeline;
}());
//# sourceMappingURL=extension.js.map
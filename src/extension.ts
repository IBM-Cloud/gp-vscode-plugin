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

/**
 * @author Steven Atkin
 */

import * as nls from 'vscode-nls';
import * as path from 'path';
import {
    window,
    workspace,
    commands,
    Disposable,
    ExtensionContext,
    StatusBarAlignment,
    StatusBarItem,
    TextDocument,
    env
} from 'vscode';
let localize: any = nls.config({locale: env.language})(path.join(__dirname, 'data'));


// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: ExtensionContext) {
    console.log('Globalization Pipeline plugin is now active!');

    // start the Globalization Pipeline plugin
    let g11n = new GlobalizationPipeline();

    var createBundle = commands.registerCommand('extension.g11n.createBundle', () => {
        g11n.createBundle();
    });

    var uploadBundle = commands.registerCommand('extension.g11n.uploadBundle', () => {
        g11n.uploadBundle();
    });

    var deleteBundle = commands.registerCommand('extension.g11n.deleteBundle', () => {
        g11n.deleteBundle();
    });

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(g11n);
    context.subscriptions.push(createBundle);
    context.subscriptions.push(uploadBundle);
}

function getConfigurationSettings(): Settings {
    let settings = workspace.getConfiguration('g11n');

    let userSettings = new Settings(
        settings['userId'],
        settings['password'],
        settings['instanceId'],
        settings['url'],
        settings['targetLanguages'],
        settings['sourceLanguage']);
    return userSettings;
}


class Settings {
    private _userId: string;
    private _password: string;
    private _instanceId: string;
    private _url: string;
    private _targetLanguages: string[];
    private _sourceLanguage: string;

    constructor(username: string,
        password: string,
        instance: string,
        url: string,
        target: string[],
        source: string) {
        this._userId = username;
        this._password = password;
        this._instanceId = instance;
        this._url = url;
        this._targetLanguages = target;
        this._sourceLanguage = source;
    }

    get userId(): string {
        return this._userId;
    }

    get password(): string {
        return this._password;
    }

    get instanceId(): string {
        return this._instanceId;
    }

    get url(): string {
        return this._url;
    }

    get targetLanguages(): string[] {
        return this._targetLanguages;
    }

    get sourceLanguage(): string {
        return this._sourceLanguage;
    }
}

class GlobalizationPipeline {
    private g11n;
    private _userSettings: Settings;

    constructor() {
        this._userSettings = getConfigurationSettings();
        let credentials = {
            credentials: {
                url: this._userSettings.url,
                userId: this._userSettings.userId,
                password: this._userSettings.password,
                instanceId: this._userSettings.instanceId
            }
        };
        this.g11n = require("g11n-pipeline").getClient(credentials);
    }

    private parseContent() {
        var parsed = {};
        // Get the current text editor
        let editor = window.activeTextEditor;
        if (!editor) {
            return parsed;
        }

        let doc = editor.document;

        // make sure we have a named document
        if (!doc.isUntitled) {
            let docContent = doc.getText();
            let languageType = doc.languageId;
            // JSON resource bundle
            if (languageType == "json") {
                try {
                    parsed = JSON.parse(docContent);
                } catch (e) {
                    parsed = {};
                }
            }
            // Java properties bundle
            else if (languageType == "ini") {
                let props = require("properties-parser");
                try {
                    parsed = props.parse(docContent);
                } catch (e) {
                    parsed = {};
                }
            } else if (languageType == 'javascript') {
                try {
                    let esprima = require('esprima');

                    // get the abstract syntax tree for the AMD resource
                    let ast = esprima.parse(docContent, {
                        range: true,
                        raw: true
                    });

                    // grab the define function
                    let defines = ast.body.filter(function(node) {
                        return node.expression.callee.name === 'define';
                    })[0];

                    // grab the resource bundle argument to the define
                    let args = defines.expression['arguments'];

                    // Grab the root object of the bundle
                    let bundle = args.filter(function(arg) {
                        return arg.type === 'ObjectExpression';
                    })[0];

                    // Grab the array of key value pairs
                    let items = bundle.properties[0].value.properties;
                    for (let item of items) {
                        // add the key value pair to the json object
                        parsed[item.key.name] = item.value.value;
                    }
                } catch (e) {
                    parsed = {};
                }
            }

        }
        return parsed;
    }

    public deleteBundle() {
        // We need to do this so we can access the object from the lambda functions
        var _this = this;

        this.g11n.bundles({}, function(err, bundles) {
            if (err) {
                window.showErrorMessage(localize(0, null));
                return;
            } else {
                var bundleList = Object.keys(bundles);

                window.setStatusBarMessage(localize(2, null), 2000);

                window.showQuickPick(bundleList, {
                    placeHolder: localize(2, null)
                }).then(bundleName => {
                    if (typeof bundleName !== "string") {
                        return;
                    } else {
                        _this.g11n.bundle(bundleName).delete({},
                            function(err, results) {
                                if (err) {
                                    window.showErrorMessage(localize(3, null) + bundleName);
                                } else if (results.status == "SUCCESS") {
                                    window.showInformationMessage(localize(4, null) + bundleName);
                                }
                            });
                    }
                });
            }
        });
    }

    public uploadBundle() {
        // We need to do this so we can access the object from the lambda functions
        var _this = this;

        this.g11n.bundles({}, function(err, bundles) {
            if (err) {
                window.showErrorMessage(localize(0, null));
                return;
            } else {
                var bundleList = Object.keys(bundles);

                window.setStatusBarMessage(localize(1, null), 2000);

                window.showQuickPick(bundleList, {
                    placeHolder: localize(5, null)
                }).then(bundleName => {
                    if (typeof bundleName !== "string") {
                        return;
                    } else {
                        let parsed = _this.parseContent();
                        let length = Object.keys(parsed).length;

                        // we have a set of key value pairs to upload
                        if (length > 0) {
                            _this.g11n.bundle(bundleName).uploadStrings({
                                languageId: _this._userSettings.sourceLanguage,
                                strings: parsed
                            }, function(err, results) {
                                if (err) {
                                    window.showErrorMessage(localize(6, null) + bundleName);
                                } else if (results.status == "SUCCESS") {
                                    window.showInformationMessage(localize(7, null) + bundleName);
                                }
                            });
                        }
                        // no key value pairs to upload
                        else {
                            window.showErrorMessage(localize(8, null) + bundleName);
                            return;
                        }
                    }
                });
            }
        });
    }


    public createBundle() {
        // Ask for the name of the bundle to create
        window.showInputBox({
            prompt: localize(13, null),
            validateInput: text => {
                //let regex = /\s/g;
                let regex = /[a-zA-Z0-9][a-zA-Z0-9_.\\-]+/;
                return regex.test(text) ? '' : localize(9, null);
            }
        }).then(bundleName => {
            // make sure we have a valid bundle name
            if (typeof bundleName !== "string") {
                return;
            } else {
                // Create the bundle
                window.showInformationMessage(localize(10, null) + bundleName);
                // Call the pipeline service on Bluemix
                this.g11n.bundle(bundleName).create({
                    sourceLanguage: this._userSettings.sourceLanguage,
                    targetLanguages: this._userSettings.targetLanguages
                }, function(err, results) {
                    if (err) {
                        window.showErrorMessage(localize(11, null) + bundleName);
                    } else if (results.status == 'SUCCESS') {
                        window.showInformationMessage(localize(12, null) + bundleName);
                    }
                });
            }
        });
    }


    dispose() {

    }
}
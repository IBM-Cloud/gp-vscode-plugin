# Globalization Pipeline Extension README

This extension enables you to quickly create, upload, download, and delete translation bundles in the Globalization Pipeline service on IBM Bluemix.
If you are unfamiliar with IBM Bluemix and the Globalization Pipeline service checkout these links:

+ [Bluemix](https://bluemix.net)
- [Globalization Pipeline](https://console.ng.bluemix.net/docs/services/GlobalizationPipeline/index.html)

## Features

You can create a new bundle right from the editor without having to use the Globalization Pipeline service's dashboard.

![create bundle](images/create_bundle.png)

You can upload your content from the editor and the extension will automatically get all your available bundles.

![upload bundle](images/upload_bundle.png) 

You can download your bundles from the editor and then select the language that you want.

![download bundle](images/download_bundle.png)

## Install

You can install the Globalization Pipeline extension by directly downloading the .vsix package from [releases](https://github.ibm.com/gp/gp-vscode-plugin/releases) and then from the command line do one of the following:

+ If you are using Bluemix Code, then run **bluemix-code g11n-0.0.3.vsix** 
- If you are using Visual Studio Code, then run **code g11n-0.0.3.vsix**

## Requirements

You must first create an instance of the Globalization Pipeline service on Bluemix before you can use this extension to work with translation bundles.

## Extension Settings

To use the extension copy over your VCAP credential settings for the Globalization Pipeline service and fill in the appropriate fields.

This extension contributes the following settings:

* `g11n.userId`: The Globalization Pipeleine service userId
* `g11n.password`: The Globalization Piepeline service password
* `g11n.instanceId`: The Globalization Pipeline service instanceId
* `g11n.url`: The Globalization Pipeline service url end point
* `g11n.sourceLanguage`: The source language of the content that you will upload to the service, e.g. *en*, must be a valid BCP 47 language code. By default this value is set to *en*
* `g11n.targetLanguages`: An array of target lanaguges that your bundle will be translated into, e.g., *['es', 'fr']*, must be valid BCP 47 language codes

## Usage

In the command palette `(F1)` type Globalization Pipeline you should see the following commands:

+ Globalization Pipeline - Create Bundle
+ Globalization Pipeline - Delete Bundle
+ Globalization Pipeline - Download Bundle
+ Globalization Pipeline - Upload Source Bundle

When you use these commands a connection will automatically be made to the Globalization Pipeline service on IBM Bluemix to complete your requested action.
When you upload your source bundle content the extension will automatically detect the file format and will perform any necessary transformation for you. 
Currently only Java properties, JSON, and i18n AMD resource bundles are supported. To upload bundle content make sure the content is being displayed in the active
edit screen and then invoke the extension.

## Accessing bundles

The best way to access the bundles from your application is to use one of the Globalization Pipeline's programming language SDKs. 
Many programming languages such as: Java, Node.js, Angular, and Python are supported. You can find a complete list of the SDKs [here](https://github.com/IBM-Bluemix/gp-common)
You can also download a bundle in json format.

## Release Notes

No additional release notes at this time.

### 0.0.1

Initial release of Globalization Pipeleine extension

### 0.0.2

Added downloading of bundles

### 0.0.3

Added pretty layout of resource bundle content

## License

Apache 2.0. See [LICENSE.txt](LICENSE.txt)

> Licensed under the Apache License, Version 2.0 (the "License");
> you may not use this file except in compliance with the License.
> You may obtain a copy of the License at
> 
> http://www.apache.org/licenses/LICENSE-2.0
> 
> Unless required by applicable law or agreed to in writing, software
> distributed under the License is distributed on an "AS IS" BASIS,
> WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
> See the License for the specific language governing permissions and
> limitations under the License.

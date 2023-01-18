# Yaaiis!

![](https://nevysha.art/wp-content/uploads/2023/01/nevy-icon-1-256-round.png)

A workspace integrating an image sorter, browser and the Automatic1111 web-ui. 

I use SD a lot and my output folder are packed. In my workflow, I often need to browse my previous generation and read generation parameters from them (or just found the file itself). That's why I started to work on this project.

The goal of this app is to make image browsing more fluid while generating them, and generation parameter easy to find. 

**Note** : 
*This is not a fork, Automatic1111 web-ui is not included and should be installed and run independently. This app only include a view of the webpage, and an interface to send data to it.*

## 🔥 WARNING 🔥
This is a very alpha version of the app. If you are not used to development processes, it is very likely that you will not be able to run the application.
The current version is full of bug and clunky. Some features are broken. 

Installation process require you to manually write your output folder path in a config file.

## Features
 - The app will crawl through your output folder, calc the sha256 hash of every generated image to manage duplicate, and gather metadata.
 - Automatic1111 webui is integrated in the app
 - You can open multiple image via a tab system.
 - You can pin tab. By default, it will replace unpinned tab each time you select an image in the browser.
 - Metadata relative to generation are parsed and easy to read
 - When a new image is created in your output folder, it will be added to the browser and opened in a new tab (or the current if unpinned)
 - Search by model, sampler
 - In data panel, click on model or sampler to apply filter.
 - Drag and drop an image from browser into img2img in Automatic1111 webui

## Installation
**WINDOWS ONLY ATM**

1. Go to the release page and download the zip. Extract it somewhere.
2. Start Automatic1111 webui (should be on default port)
3. Inside the folder, open "preferences.js" and edit it to add your output folder path.
4. run "start"
5. it will open a console (which will prompt a lot of text) and a client. You'll have to wait for the scrapping to end, then close the console and the client
6. run "start" again. 🙃

## Known issues
 - parsing of prompt value are not really usable.
 - txt2txt, txt2img,extras does nothing
 - Search box (the one on the left) is broken
 - Everything

## Contribution
Not open atm. I want to stabilize the base of the app first. Feel free to reach me on [Twitter](https://twitter.com/NevyshaHime) or [Reddit](https://www.reddit.com/user/Nevysha/)

## TODO feature
> build linux version

> Tag image system

> Send generation parameter to Automatic1111 ui

> Manage output folder directly from the app

> Is there a way to easily compare two images and/or display fullscreen image and go to the previous/next with a single key press ?
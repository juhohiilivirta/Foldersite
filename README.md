# Your folders become your website with Foldersite.

![Foldersite preview](https://github.com/juhohiilivirta/Foldersite/blob/main/Your%20name/preview.png)

A lightweight portfolio website that reads text and image content directly from folders. No CMS, database, build process, or manual publishing step is required.

## What this project does

Organize your portfolio by folders, and Foldersite automatically turns them into a website.

The structure is intentionally simple:

* `Your name` folder contains introduction, branding, and footer information
* `Project` folder contains individual project folders
* each project folder contains one `.txt` file and any number of image files
* project names are generated from folder names
* image order follows file names on disk

Content is refreshed on each request, so changes appear without a build or publishing step.

Supported image formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.

## Local run

```sh
node server.js
```

Then open http://localhost:3000.

## Requirements for the host

Foldersite is a Node.js application that reads its content directly from folders on the server.

Your hosting provider must support:

* **Node.js applications**
* **Running `node server.js`**
* **Reading files and folders from the server**

Foldersite does not require a database, CMS, framework, or build process.

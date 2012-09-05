A blog posting tool. Creates static HTML and ATOM feeds from Markdown posts.

## Requirements

Uses [NodeJS](http://nodejs.org) to run.

## Installing

* Clone this repository, or a fork of it.
* cd delposto
* npm link

You may need to run `sudo npm link` for it to work.

Now you can type `delposto` to see a list of commands. Right now the command
help is not really useful.

## Commands

## create

    delposto create foo

This will create a new directory called `foo` with the templates and metadata
for the blog. It will ask you a few questions to set up the blog.

## draft

    delposto draft bar

Creates a `drafts/bar.md` file for a new draft. Fill in the title, tags, and
any comment link above the `~` separator, with the contents of the post going
after the '~'.

Anything above the `~` is treated as YAML, so it should be formatted
appropriately.

Typing this:

    delposto draft bar/

will create a `drafts/bar` directory, with a `drafts/bar/index.md` for the
post's contents. This directory creation allows you to put any images or other
assets for the post along with the post's contents.

## preview

    delposto preview drafts/bar.md

This will preview the post in `published/preview/month/day/slugged-title/`, and
it will watch `drafts/bar.md` for changes and regenerate the preview as the
draft changes. You will need to manually reload the preview in the browser
though.

If you used `delposto draft bar/` to create a directory-based draft, then type

    delposto preview drafts/bar

## publish

    delposto publish drafts/bar.md

Publishes the `drafts/bar.md` file. Puts the post in a YYY/MM/DD directory, and
uses the `title` inside bar.md to generate a slugged title directory to hold
the output.

If you used `delposto draft bar/` to create a directory-based draft, then type

    delposto publish drafts/bar

If you want to change the templates in the `templates` directory and the reapply
them to the `published` directory, then just type:

    delposto publish

Now, you can push the `published` directory to your static file host of your
choice. If you want to push it to GitHubPages, then
[volo-ghdeploy](https://github.com/volojs/volo-ghdeploy) can be useful if you
have [volo](http://volojs.org/) installed.

## Dev Notes

### Updating Prism

[Prism](http://prismjs.com/) is used for the HTML/CSS/JS code snippet syntax highlighting.

* Copy prism.css into templates/css/index.css, after START PRISM and before END PRISM
* Remove all the `class*="language-"` selector parts in prism.css
* Remove any `text-shadow` use in prism.css
* Copy prism.js into templates/js/index.js
# 🥝 Kiwi-CLI - ALPHA (WIP)

CLI helper that allows expanding on other CLI-tools by adding a custom scripting layer for an improved workflow. Redirects all unhandled input to the specified 3rd party CLI.

This is usefull for automated logic that is too complex for that CLIs native functions to handle, for example a series of `git` commands that need to dynamically react on output of the previous execution, or are too many for a simple alias declaration.

## Installation

```bash
# install as global npm package
npm i -g @kiwi-js/cli
```

## Usage

The CLI will be available as `kiwi` in the terminal.

By default, command mappings for `git` and `ng` are included allowing the use of both through the kiwi interface.\
More documentation will be added during the development and before the first major release.

## Disclaimer

This is a very early build and still not reliably tested. No real action has been added yet, so it is effectively an alias combining `git` and `ng` into one cli.\
The `ROADMAP.md` on the GitHub page outlines current state of development and planned features.

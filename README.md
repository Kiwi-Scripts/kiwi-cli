# 🥝 Kiwi-CLI

CLI helper that allows expanding on other CLI-tools by adding a custom scripting layer for an improved workflow. Redirects all unhandled input to the specified 3rd party CLI.

This is usefull for automated logic that is too complex for that CLIs native functions to handle, for example a series of `git` commands that need to dynamically react on output of the previous execution, or are too many for a simple alias declaration.

## Installation

While not published as an npm package, the installation looks like this:

```bash
# clone the project repo
git clone git@github.com:Kiwi-Scripts/kiwi-cli.git

# build the project
cd kiwi-cli
npm run build

# install as global npm package
npm i -g .
```

This will build the project, compiling the source files into JS in the `dist/` dir. By executing `npm i -g .` the current package gets added as global dependency.

The CLI will now be available as `kiwi` in any terminal. (Existing terminal instance may need to be restarted)

# Pull request previews for GitHub

The `pushpreview-action` is a GitHub Action designed to automate the creation of previews for web projects or applications using the [PushPreview](https://pushpreview.com) platform. 

## Installation

To start using the `pushpreview-action`, follow the steps outlined in our [Quickstart](https://docs.pushpreview.com/).

## Example usage

Below is an example of how to use the `push-preview-action` in a workflow:

```yaml
 name: PushPreview

 on:
   pull_request_target:
     types:
       - labeled

 jobs:
   preview:
     runs-on: ubuntu-latest
     if: github.event.label.name == 'preview'
     steps:
       - uses: actions/checkout@v3
       - name: Comment
         run: |
           gh pr comment ${{ github.event.pull_request.number }} --repo ${{ github.repository }} --body "⚙️ Hang tight! PushPreview is currently building your preview. We'll share the URL as soon as it's ready."
         env:
           GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

       - uses: actions/setup-node@v3
         with:
           node-version: 18

       - name: Set BASE_URL
         run: echo "BASE_URL=/github/${{ github.repository }}/${{ github.event.number }}/" >> $GITHUB_ENV
       
       # Replace with your docs build commands
       - name: Build site
         run: |
           cd docs
           yarn install --frozen-lockfile
           yarn build

       - name: Generate preview
         uses: PushLabsHQ/pushpreview-action@1.0.6
         with:
           # Replace with your docs output directory
           source-directory: ./docs/build
           github-token: ${{ secrets.GITHUB_TOKEN }}
           pushpreview-token: ${{ secrets.PUSHPREVIEW_TOKEN }}
```

For more information, refer to the [Installation ](https://docs.pushpreview.com/category/installation) section for CMS-specific guides.

## Action reference

### Inputs

This action requires the following inputs:

1. **source-directory**
   - **Description**: The directory to compress and send.
   - **Required**: Yes

2. **github-token**
   - **Description**: The secret token of GitHub.
   - **Required**: Yes

3. **pushpreview-token**
   - **Description**: The secret token for the PushPreview API.
   - **Required**: Yes

### Outputs

The action provides the following output:

- **comment**
  - **Description**: PushPreview comment with links for every change edited and the URL of the preview.

### Secrets

The action uses the following secrets:

- `GITHUB_TOKEN`: This is a GitHub secret used to authenticate and interact with GitHub APIs.
- `PUSHPREVIEW_TOKEN`: This is a secret token for the PushPreview API, necessary for authentication and authorization.

## Support

Need assistance? Contact our [support team](https://docs.pushpreview.com/support) for help.
